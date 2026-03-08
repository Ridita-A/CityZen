import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Image, Alert, Modal, FlatList } from 'react-native';
import Navigation from '../components/Navigation';
import BottomNav from '../components/BottomNav';
import { useComplaint } from '../context/ComplaintContext';
import { complaintAPI } from '../services/api';
import { getOfflineReports } from '../utils/offlineStorage';

import { Camera, Image as ImageIcon, Sparkles, MapPin, Trash2, ChevronDown, ChevronUp, RefreshCw, Clock, CheckCircle, X } from 'lucide-react-native';
import * as ImagePicker from "expo-image-picker";
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { auth } from '../config/firebase';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const OPENROUTER_API_URL = process.env.EXPO_PUBLIC_OPENROUTER_API_URL;

const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Radius of the Earth in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};


export default function SubmitComplaintDetailsScreen({ navigation, onLogout, darkMode, toggleDarkMode, route }) {

    const [aiLoading, setAiLoading] = useState(false);
    const [showOfflineGallery, setShowOfflineGallery] = useState(false);
    const [offlineReports, setOfflineReports] = useState([]);
    const [tempSelectedReports, setTempSelectedReports] = useState([]);

    const {
        images,
        setImages,
        location,
        setLocation,
        locationTime,
        setLocationTime,
        selectedCategory,
        setSelectedCategory,
        aiResult,
        setAiResult,
        setTitle,
        setDescription,
        unknownCategoryLabel,
        setUnknownCategoryLabel,
        unknownCategoryDescription,
        setUnknownCategoryDescription,
        isDraftMode,
        setIsDraftMode,
    } = useComplaint();

    const CONFIDENCE_THRESHOLD = 75;
    const aiDetected = aiResult?.label?.toLowerCase().includes("pothole");
    const aiConfidence = aiResult?.confidence ?? 0;
    const aiApproved = aiDetected && aiConfidence >= CONFIDENCE_THRESHOLD;


    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/complaints/categories`, {
                    timeout: 30000, // 30-second timeout
                    headers: {
                        'bypass-tunnel-reminder': 'true'
                    }
                });
                setCategories(response.data);
            } catch (error) {
                console.error('Error fetching categories:', error);
                Alert.alert('Error', 'Failed to load categories.');
            }
        };
        fetchCategories();
    }, []);

    // Dropdown State
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // System State
    const [locating, setLocating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const lastGenerationKeyRef = React.useRef(null);
    const activeDetections = React.useRef(0);
    const detectionCacheRef = React.useRef({}); // Cache AI detection results by image URI
    const imageToLabelsMapRef = React.useRef({}); // Maps image index -> array of detected labels
    const imageDetectionMapRef = useRef({}); // Maps image index -> array of all detections

    const generationKey = aiResult && location
        ? JSON.stringify({
            label: aiResult.label,
            confidence: Math.floor(aiResult.confidence), // avoid tiny float changes
            lat: Number(location.latitude?.toFixed(5)),
            lng: Number(location.longitude?.toFixed(5)),
        })
        : null;


    useEffect(() => {
        const runAllDetections = async () => {
            if (images.length === 0) return;

            // Collect ALL detections above 60% from all images
            const detectionsByLabel = {};
            const imageToDetections = {}; // Track which detections are in each image
            
            // Also build the maps we'll need for filtering later
            const imageLabelMap = {}; // image index -> array of labels
            const imageDetectionMap = {}; // image index -> array of detections

            // First pass: collect all detections
            for (let i = 0; i < images.length; i++) {
                // Check cache first to avoid re-running AI on same image
                let result = detectionCacheRef.current[images[i]];
                
                if (!result) {
                    result = await runAiDetection(images[i]);
                    // Only cache successful results
                    if (result) {
                        detectionCacheRef.current[images[i]] = result;
                    }
                }

                if (!result) continue;

                const detectionsArray = result.detections ?? [result];
                imageToDetections[i] = [];
                
                // Track ALL detections above 60% for this image
                const qualifiedDetections = detectionsArray.filter(det => det.confidence >= 60);
                imageLabelMap[i] = [];
                imageDetectionMap[i] = qualifiedDetections.sort((a, b) => b.confidence - a.confidence);

                for (const det of detectionsArray) {
                    if (det.confidence >= 60) {
                        const label = det.label?.toLowerCase() || 'unknown';
                        
                        // Track label for this image
                        if (!imageLabelMap[i].includes(label)) {
                            imageLabelMap[i].push(label);
                        }
                        
                        if (!detectionsByLabel[label]) {
                            detectionsByLabel[label] = [];
                        }

                        // Check if this exact detection is already in the list
                        const existingEntry = detectionsByLabel[label].find(
                            entry => entry.detectionObj.confidence === det.confidence &&
                                     entry.detectionObj.label === det.label
                        );

                        if (existingEntry) {
                            // Add this image index if not already there
                            if (!existingEntry.imageIndices.includes(i)) {
                                existingEntry.imageIndices.push(i);
                            }
                        } else {
                            // New detection
                            detectionsByLabel[label].push({
                                detectionObj: det,
                                imageIndices: [i],
                            });
                        }

                        imageToDetections[i].push(det);
                    }
                }
            }

            // Store the maps for use in handleIssueSelection
            imageToLabelsMapRef.current = imageLabelMap;
            imageDetectionMapRef.current = imageDetectionMap;

            // Check if any image has multiple different issues detected
            let multipleIssuesInSingleImage = false;
            let imageWithMultipleIssues = null;

            for (const [imageIndex, detections] of Object.entries(imageToDetections)) {
                const uniqueLabels = new Set(detections.map(d => d.label?.toLowerCase()));
                if (uniqueLabels.size > 1) {
                    multipleIssuesInSingleImage = true;
                    imageWithMultipleIssues = parseInt(imageIndex);
                    break;
                }
            }

            // Get all unique detections sorted by confidence
            const allQualifiedDetections = Object.values(detectionsByLabel)
                .flat()
                .map(entry => ({
                    ...entry.detectionObj,
                    imageIndices: entry.imageIndices,
                }))
                .sort((a, b) => b.confidence - a.confidence);

            const uniqueDetections = [];
            const seenLabels = new Set();

            for (const det of allQualifiedDetections) {
                const label = det.label?.toLowerCase();
                if (!seenLabels.has(label)) {
                    uniqueDetections.push(det);
                    seenLabels.add(label);
                }
            }

            if (uniqueDetections.length === 0) {
                setAiResult(null);
            } else if (uniqueDetections.length === 1 && !multipleIssuesInSingleImage) {
                // Only one issue type detected across all images, and no image has multiple issues
                setAiResult(uniqueDetections[0]);
            } else {
                // Multiple different issues detected OR a single image has multiple issues
                // Show selection prompt
                showDetectionSelectionAlert(uniqueDetections, multipleIssuesInSingleImage, imageWithMultipleIssues);
            }
        };

        runAllDetections();
    }, [images]);

    /**
     * Shows an alert when multiple different issues are detected.
     * Handles both:
     * 1. Multiple issues across different images
     * 2. Multiple issues within the same image
     * 
     * When user selects one issue, images containing that issue are kept.
     */
    const showDetectionSelectionAlert = (detections, multipleIssuesInSingleImage, imageWithMultipleIssues) => {
        let alertMessage = 'The images contain multiple issues. Please select which one to report:';
        
        if (multipleIssuesInSingleImage) {
            alertMessage = `Image ${imageWithMultipleIssues + 1} contains multiple issues. Please select which one you want to report.\n\nAll selected issues and images will be kept as both were detected in the same image:`;
        }

        const detectionOptions = detections
            .sort((a, b) => b.confidence - a.confidence)
            .map((det) => ({
                text: `${det.label} (${det.confidence}%)`,
                onPress: () => {
                    // When user selects an issue, filter images to keep only those with the selected issue
                    handleIssueSelection(det);
                },
            }));

        detectionOptions.push({
            text: 'Cancel',
            onPress: () => {
                setAiResult(null);
                // Optional: Clear images on cancel if you want strict issue categorization
                // setImages([]);
            },
            style: 'cancel',
        });

        Alert.alert(
            'Multiple Issues Detected',
            alertMessage,
            detectionOptions
        );
    };

    /**
     * After user selects an issue type, this function:
     * 1. Sets the selected detection as the AI result
     * 2. Filters images to keep only those containing the selected issue
     * 3. Images are kept even if they have multiple detected issues (if one matches the selection)
     */
    const handleIssueSelection = async (selectedDetection) => {
        setAiResult(selectedDetection);

        // Filter images based on whether they contain the selected issue
        const selectedLabel = selectedDetection.label?.toLowerCase();
        const imagesToKeep = [];
        
        for (let i = 0; i < images.length; i++) {
            const detectedLabels = imageToLabelsMapRef.current[i];
            
            // Keep image if it contains the selected issue label
            if (detectedLabels && detectedLabels.includes(selectedLabel)) {
                imagesToKeep.push(i);
            }
        }

        // Filter images to keep only those matching the selected issue
        const filteredImages = images.filter((_, index) => imagesToKeep.includes(index));

        // If no images match the selected issue, keep all images but warn the user
        if (filteredImages.length === 0) {
            Alert.alert(
                'No matching images',
                `No images have "${selectedDetection.label}" detected. Keeping all images.`
            );
            return;
        }

        // Update images list to contain only images with the selected issue
        setImages(filteredImages);
    };

    useEffect(() => {
        //If location is not already set, fetch it.
        if (!location) {
            handleGPSDetect();
        }
    }, []);

    useEffect(() => {
        if (images.length === 0) {
            setAiResult(null);
            lastGenerationKeyRef.current = null;
            return;
        }
    }, [images]);

    // Re-inserting the useEffect for generateComplaintText
    useEffect(() => {
        if (!aiResult) return;
        if (aiResult.confidence < CONFIDENCE_THRESHOLD) return;
        if (!location?.latitude || !location?.longitude) return;
        if (!generationKey) return;

        // Prevent unnecessary regeneration
        if (lastGenerationKeyRef.current === generationKey) {
            return;
        }

        // Mark this input set as processed
        lastGenerationKeyRef.current = generationKey;

        const generateComplaintText = async () => {
            try {
                const response = await axios.post(
                    `${OPENROUTER_API_URL}/generate_complaint_text`,
                    {
                        category: aiResult.label,
                        confidence: aiResult.confidence,
                        latitude: location.latitude,
                        longitude: location.longitude,
                        location_string: location.fullAddress,
                    }
                );

                if (response.data.title) setTitle(response.data.title);
                if (response.data.description) setDescription(response.data.description);
            } catch (error) {
                console.error("Error generating complaint text:", error);
                Alert.alert(
                    "Generation Failed",
                    "Could not generate complaint details. Please try again."
                );
            }
        };

        generateComplaintText();
    }, [generationKey]);


    const hasDuplicateAlertBeenShown = useRef(false);

    useEffect(() => {
        console.log("Duplicate complaint check useEffect triggered.");
        const checkDuplicate = async () => {
            if (location && selectedCategory) {
                try {
                    const result = await complaintAPI.checkDuplicate(location.latitude, location.longitude, selectedCategory.id);
                    if (result.isDuplicate) {
                        if (hasDuplicateAlertBeenShown.current) return; // Use .current for ref

                        console.log("Duplicate complaint found, showing alert.");
                        const { searchRadius, searchIntervalDays } = result;
                        Alert.alert(
                            "Duplicate Complaint Found",
                            `A similar complaint has already been reported in this area. Would you like to view it?`,
                            [
                                { text: "Cancel", style: "cancel" },
                                { text: "Show", onPress: () => navigation.navigate('SimilarComplaints', { similarComplaints: result.complaints }) }
                            ]
                        );
                        hasDuplicateAlertBeenShown.current = true; // Use .current for ref
                    }
                } catch (error) {
                    console.error("Error checking for duplicate complaints:", error);
                }
            }
        };
        checkDuplicate();
    }, [location, selectedCategory]);

    useEffect(() => {
        if (!aiResult) return;
        if (aiResult.confidence < CONFIDENCE_THRESHOLD) return;
        if (categories.length === 0) return;

        // Check local DB categories first for a label that already exists in the DB 
        const matchedCategory =
            categories.find(cat => cat.id === aiResult.id) ||
            categories.find(cat => cat.name?.toLowerCase() === aiResult.label?.toLowerCase());

        if (matchedCategory) {
            // Found in DB — this is a known category, never treat it as draft
            setSelectedCategory(matchedCategory);
            setIsDraftMode(false);
            setUnknownCategoryLabel(null);
            setUnknownCategoryDescription(null);
            return;
        }

        // Not in DB — now trust the LLM's is_new_category flag
        if (aiResult.is_new_category === true || (aiResult.label && aiResult.label !== 'No Issue')) {
            setUnknownCategoryLabel(aiResult.label);
            setUnknownCategoryDescription(aiResult.category_description || '');
            setIsDraftMode(true);
            setSelectedCategory(null);
        }
    }, [aiResult, categories]);


    //Permissions
    const requestLocationPermission = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log("Location permission status:", status);
        return status === 'granted';
    };

    const requestCameraPermission = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        console.log("Camera permission status:", status);
        if (status !== 'granted') {
            Alert.alert('Permission to access camera is required!');
            return false;
        }
        return true;
    };

    const requestLibraryPermission = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log("Media Library permission status:", status);
        if (status !== 'granted') {
            Alert.alert('Permission to access media library is required!');
            return false;
        }
        return true;
    };

    //Location
    // Convert DMS array to decimal degrees
    const convertDMSToDecimal = (dms, ref) => {
        if (!dms) return null;
        const [deg, min, sec] = dms;
        let dec = deg + min / 60 + sec / 3600;

        if (ref === 'S' || ref === 'W') dec = -dec;
        return dec;
    };

    const extractLocationFromExif = (exif) => {
        if (!exif) return null;

        const latitude = exif.GPSLatitude
            ? Array.isArray(exif.GPSLatitude)
                ? convertDMSToDecimal(exif.GPSLatitude, exif.GPSLatitudeRef)
                : exif.GPSLatitudeRef === 'S' ? -exif.GPSLatitude : exif.GPSLatitude
            : null;

        const longitude = exif.GPSLongitude
            ? Array.isArray(exif.GPSLongitude)
                ? convertDMSToDecimal(exif.GPSLongitude, exif.GPSLongitudeRef)
                : exif.GPSLongitudeRef === 'W' ? -exif.GPSLongitude : exif.GPSLongitude
            : null;

        if (latitude !== null && longitude !== null) return { latitude, longitude };
        return null;
    };

    const updateLocationWithAddress = async (latitude, longitude) => {
        setLocating(true);

        try {
            const [addr] = await Location.reverseGeocodeAsync({ latitude, longitude });

            const areaName = addr.name || addr.street || addr.subregion || addr.city || 'Unknown area';
            const district = addr.district || addr.city || '';
            const region = addr.region || '';

            setLocation({
                latitude,
                longitude,
                areaName,
                district,
                region,
                fullAddress: `${areaName}, ${district}, ${region}`,
            });

            setLocationTime(new Date().toLocaleString());
        } catch (err) {
            console.warn('Reverse geocode failed', err);
            setLocation({
                latitude,
                longitude,
                fullAddress: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            });
            setLocationTime(new Date().toLocaleString());
        } finally {
            setLocating(false);
        }
    };

    const runAiDetection = async (imageUri) => {
        activeDetections.current++;
        setAiLoading(true);

        const formData = new FormData();
        formData.append("image", {
            uri: imageUri,
            name: "photo.jpg",
            type: "image/jpeg",
        });

        try {
            // Note: The backend route is now responsible for fetching categories and forwarding to OpenRouter
            const res = await fetch(`${API_URL}/api/ai/detect-with-openrouter`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                throw new Error("AI service error");
            }

            const data = await res.json();
            return data;
        } catch (err) {
            Alert.alert("AI Error", "Failed to analyze image");
            return null;
        } finally {
            activeDetections.current--;
            if (activeDetections.current === 0) {
                setAiLoading(false);
            }
        }
    };

    const handleOfflineGalleryOpen = async () => {
        const reports = await getOfflineReports();
        setOfflineReports(reports);
        setTempSelectedReports([]); // Reset selection when opening
        setShowOfflineGallery(true);
    };

    const handleToggleOfflineReport = (report) => {
        const alreadyInGallery = images.includes(report.imageUri);
        if (alreadyInGallery) return;

        // Distance check relative to first confirmed image (anchor)
        if (images.length > 0 && location) {
            const distance = getDistance(location.latitude, location.longitude, report.latitude, report.longitude);
            if (distance > 50) {
                Alert.alert("Too Far", `This image is ${distance.toFixed(1)}m from the first image (max 50m).`);
                return;
            }
        } else if (tempSelectedReports.length > 0) {
            // If no confirmed images yet, check against the first item in the current selection batch
            const firstAnchor = tempSelectedReports[0];
            const distance = getDistance(firstAnchor.latitude, firstAnchor.longitude, report.latitude, report.longitude);
            if (distance > 50) {
                Alert.alert("Too Far", "Photos in one report must be within 50m of the first selected photo.");
                return;
            }
        }

        setTempSelectedReports(prev => {
            const exists = prev.find(r => r.id === report.id);
            if (exists) {
                return prev.filter(r => r.id !== report.id);
            } else {
                return [...prev, report];
            }
        });
    };

    const handleConfirmOfflineSelection = async () => {
        if (tempSelectedReports.length === 0) {
            setShowOfflineGallery(false);
            return;
        }

        const newUris = tempSelectedReports.map(r => r.imageUri);
        
        // If this is the first batch, the first item sets the anchor location
        if (images.length === 0) {
            const firstReport = tempSelectedReports[0];
            await updateLocationWithAddress(firstReport.latitude, firstReport.longitude);
            setLocationTime(new Date(firstReport.createdAt).toLocaleString());
        }

        setImages(prev => [...prev, ...newUris]);
        setShowOfflineGallery(false);
    };

    const handleImagePick = async () => {
        console.log("handleImagePick called");
        const hasPermission = await requestCameraPermission();
        const locPerm = await requestLocationPermission();
        if (!locPerm || !hasPermission) {
            console.log("Permissions denied for ImagePick");
            return;
        }
        console.log("Permissions granted for ImagePick, launching camera...");
        let result;
        try {
            result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                allowsEditing: false,
                quality: 1,
                exif: true,
            });
            console.log("ImagePicker.launchCameraAsync result:", result);
        } catch (error) {
            console.error("Error launching camera:", error);
            Alert.alert("Camera Error", `Failed to launch camera: ${error.message}`);
            return;
        }


        if (result.assets?.length > 0) {
            const asset = result.assets[0];
            const exifLocation = extractLocationFromExif(asset.exif);
            
            let currentLat, currentLon;
            if (exifLocation) {
                currentLat = exifLocation.latitude;
                currentLon = exifLocation.longitude;
            } else {
                const gps = await Location.getCurrentPositionAsync({});
                currentLat = gps.coords.latitude;
                currentLon = gps.coords.longitude;
            }

            // Always check against anchor location if images already exist
            if (images.length > 0 && location) {
                const distance = getDistance(location.latitude, location.longitude, currentLat, currentLon);
                if (distance > 50) {
                    Alert.alert("Too Far", `This image is ${distance.toFixed(1)}m from the first image (max 50m).`);
                    return;
                }
            }

            // If it's the first image, it sets the anchor (overriding auto-GPS)
            if (images.length === 0) {
                await updateLocationWithAddress(currentLat, currentLon);
            }

            setImages(prev => [...prev, asset.uri]);
        }
    };

    const handleLibraryPick = async () => {
        handleOfflineGalleryOpen();
    };

    const handleGPSDetect = async () => {
        setLocating(true);
        try {
            const hasLocationPerm = await requestLocationPermission();
            if (!hasLocationPerm) throw new Error('Location permission denied');

            const gps = await Location.getCurrentPositionAsync({});
            // Only auto-update if no images selected yet
            if (images.length === 0) {
                await updateLocationWithAddress(gps.coords.latitude, gps.coords.longitude);
            }
        } catch (err) {
            Alert.alert('Error', 'Unable to detect location.');
        } finally {
            setLocating(false);
        }
    };


    const handleNext = () => {
        const newErrors = {};
        if (images.length === 0) newErrors.image = 'Evidence photos are mandatory.';
        if (!location?.latitude || !location?.longitude) newErrors.location = 'GPS location is required.';

        // In draft mode, skip category requirement — navigate to draft submit screen
        if (isDraftMode) {
            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                Alert.alert('Missing Info', 'Please fill in all required fields.');
                return;
            }
            navigation.navigate('DraftComplaintSubmit');
            return;
        }

        if (!selectedCategory) newErrors.category = 'Category is required.';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            Alert.alert('Missing Info', 'Please fill in all required fields.');
            return;
        }

        navigation.navigate('SubmitComplaint');
    };

    const handleBack = () => {
        navigation.goBack();
    };


    return (
        <View style={[styles.container, darkMode && styles.darkContainer]}>
            <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} navigation={navigation} />

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                <Text style={[styles.heading, darkMode && styles.textWhite]}>Complaint Details</Text>

                <View style={[styles.card, darkMode && styles.cardDark]}>

                    {aiResult && (
                        <View style={{
                            backgroundColor: "#EFF6FF",
                            padding: 10,
                            borderRadius: 8,
                            marginBottom: 12,
                            flexDirection: "row",
                            alignItems: "center"
                        }}>
                            <Sparkles size={16} color="#1E88E5" />
                            <Text style={{ marginLeft: 8, color: "#1E88E5", fontSize: 12 }}>
                                AI auto-filled this report. Please review before submitting.
                            </Text>
                        </View>
                    )}

                    {/* Unknown category amber banner */}
                    {isDraftMode && unknownCategoryLabel && (
                        <View style={{
                            backgroundColor: "#FFFBEB",
                            borderWidth: 1,
                            borderColor: "#FCD34D",
                            padding: 12,
                            borderRadius: 8,
                            marginBottom: 12,
                            flexDirection: "row",
                            alignItems: "flex-start",
                        }}>
                            <Sparkles size={16} color="#D97706" style={{ marginTop: 1 }} />
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <Text style={{ color: "#92400E", fontWeight: "700", fontSize: 12, marginBottom: 2 }}>
                                    New Issue Type Detected
                                </Text>
                                <Text style={{ color: "#78350F", fontSize: 12, lineHeight: 18 }}>
                                    AI identified "{unknownCategoryLabel}" — not yet in our system. Your complaint will be saved as a draft for admin review.
                                </Text>
                            </View>
                        </View>
                    )}


                    <Text style={[styles.label, darkMode && styles.textWhite]}>Evidence Photos <Text style={styles.req}>*</Text></Text>
                    {images.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                            {images.map((uri, index) => (
                                <View key={index} style={styles.previewContainer}>
                                    <Image source={{ uri }} style={styles.previewImage} resizeMode="cover" />

                                    <TouchableOpacity onPress={() => setImages(images.filter((_, i) => i !== index))} style={styles.removeImgBtn}>
                                        <Trash2 size={16} color="white" />
                                        <Text style={styles.removeImgText}>Remove</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    )}

                    <View style={styles.uploadRow}>
                        <TouchableOpacity onPress={handleImagePick} style={[styles.uploadBtn, images.length > 0 ? styles.uploadBtnSmall : null, errors.image && styles.errorBorder]}>
                            <Camera size={images.length > 0 ? 18 : 24} color="#1E88E5" />
                            <Text style={images.length > 0 ? styles.uploadTextSmall : styles.uploadText}>Camera</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleLibraryPick} style={[styles.uploadBtn, images.length > 0 ? styles.uploadBtnSmall : null, errors.image && styles.errorBorder]}>
                            <ImageIcon size={images.length > 0 ? 18 : 24} color="#1E88E5" />
                            <Text style={images.length > 0 ? styles.uploadTextSmall : styles.uploadText}>Offline Gallery</Text>
                        </TouchableOpacity>
                    </View>
                    {errors.image && <Text style={styles.errorText}>{errors.image}</Text>}

                    {aiLoading && (
                        <Text style={{ color: "#6B7280", marginBottom: 8 }}>
                            Analyzing image with AI...
                        </Text>
                    )}

                    {aiResult && (
                        <View
                            style={[
                                styles.aiBox,
                                {
                                    backgroundColor: aiApproved ? "#ECFDF5" : "#FEF2F2",
                                },
                            ]}
                        >
                            <Sparkles
                                size={16}
                                color={aiApproved ? "#059669" : "#DC2626"}
                            />
                            <Text
                                style={[
                                    styles.aiText,
                                    { color: aiApproved ? "#059669" : "#DC2626" },
                                ]}
                            >
                                AI detected: "{aiResult.label}" — Confidence: {aiConfidence}%
                            </Text>
                        </View>
                    )}

                    <Text style={[styles.label, darkMode && styles.textWhite]}>Category <Text style={styles.req}>*</Text></Text>
                    <TouchableOpacity
                        onPress={() => !isDraftMode && setIsDropdownOpen(!isDropdownOpen)}
                        disabled={isDraftMode}
                        style={[styles.dropdownHeader, darkMode && styles.inputDark, errors.category && styles.errorBorder, isDraftMode && { backgroundColor: darkMode ? '#374151' : '#F3F4F6', borderColor: darkMode ? '#4B5563' : '#E5E7EB' }]}
                    >
                        <Text style={[styles.dropdownText, (!selectedCategory && !isDraftMode) && styles.placeholderText, darkMode && styles.textWhite, isDraftMode && { color: darkMode ? '#9CA3AF' : '#6B7280' }]}>
                            {isDraftMode ? unknownCategoryLabel : (selectedCategory ? selectedCategory.name : "Select a Category")}
                        </Text>
                        {isDraftMode ? null : (isDropdownOpen ? <ChevronUp size={20} color="#6B7280" /> : <ChevronDown size={20} color="#6B7280" />)}
                    </TouchableOpacity>

                    {isDropdownOpen && (
                        <View style={[styles.dropdownList, darkMode && styles.cardDark]}>
                            {categories.map((cat, index) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[styles.dropdownItem, darkMode && styles.dropdownItemDark]}
                                    onPress={() => { setSelectedCategory(cat); setIsDropdownOpen(false); }}
                                >
                                    <Text style={[styles.dropdownItemText, darkMode && styles.textWhite]}>{cat.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <View style={styles.locationSection}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
                            <Text style={[styles.label, darkMode && styles.textWhite, { marginBottom: 0 }]}>
                                Location Details <Text style={styles.req}>*</Text>
                            </Text>

                            <TouchableOpacity onPress={handleGPSDetect} style={styles.refreshBtn}>
                                <RefreshCw size={14} color="#1E88E5" />
                                <Text style={styles.refreshText}>Refresh GPS</Text>
                            </TouchableOpacity>
                        </View>
                        <>
                            <View style={[styles.readOnlyBox, darkMode && styles.readOnlyBoxDark]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                    <MapPin size={16} color="#1E88E5" />
                                    <Text style={[styles.readOnlyLabel, darkMode && styles.textGray]}>
                                        Detected Coordinates
                                    </Text>
                                </View>

                                <Text style={[styles.readOnlyValue, darkMode && styles.textWhite]}>
                                    {location?.fullAddress
                                        ? location.fullAddress
                                        : location?.latitude && location?.longitude
                                            ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
                                            : 'No location detected'}
                                </Text>

                            </View>

                            <View style={[styles.readOnlyBox, darkMode && styles.readOnlyBoxDark, { marginTop: 8 }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                    <Clock size={16} color="#1E88E5" />
                                    <Text style={[styles.readOnlyLabel, darkMode && styles.textGray]}>
                                        Timestamp
                                    </Text>
                                </View>

                                <Text style={[styles.readOnlyValue, darkMode && styles.textWhite]}>
                                    {locationTime || '—'}
                                </Text>
                            </View>
                        </>
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                            <Text style={styles.backButtonText}>Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
                            <Text style={styles.nextButtonText}>Next</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </ScrollView>

            {/* Offline Gallery Modal */}
            <Modal
                visible={showOfflineGallery}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowOfflineGallery(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, darkMode && styles.cardDark]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, darkMode && styles.textWhite]}>Offline Gallery</Text>
                            <TouchableOpacity onPress={() => setShowOfflineGallery(false)}>
                                <X size={24} color={darkMode ? "white" : "black"} />
                            </TouchableOpacity>
                        </View>
                        
                        {offlineReports.length === 0 ? (
                            <View style={styles.emptyOffline}>
                                <ImageIcon size={48} color="#9CA3AF" />
                                <Text style={[styles.emptyOfflineText, darkMode && styles.textGray]}>No offline reports found.</Text>
                            </View>
                        ) : (
                            <>
                                <FlatList
                                    data={offlineReports}
                                    keyExtractor={(item) => item.id}
                                    renderItem={({ item }) => {
                                        const alreadySelected = images.includes(item.imageUri);
                                        const isSelectedInBatch = !!tempSelectedReports.find(r => r.id === item.id);
                                        
                                        let isTooFar = false;
                                        if (images.length > 0 && location) {
                                            isTooFar = getDistance(location.latitude, location.longitude, item.latitude, item.longitude) > 50;
                                        } else if (tempSelectedReports.length > 0) {
                                            const anchor = tempSelectedReports[0];
                                            isTooFar = getDistance(anchor.latitude, anchor.longitude, item.latitude, item.longitude) > 50;
                                        }

                                        const isSelectable = !alreadySelected && !isTooFar;

                                        return (
                                            <TouchableOpacity 
                                                onPress={() => isSelectable && handleToggleOfflineReport(item)}
                                                style={[
                                                    styles.offlineItem, 
                                                    alreadySelected && styles.offlineItemDisabled,
                                                    !isSelectable && !alreadySelected && styles.offlineItemDisabled,
                                                    isSelectedInBatch && styles.offlineItemActive,
                                                    darkMode && styles.dropdownItemDark
                                                ]}
                                                disabled={!isSelectable}
                                            >
                                                <Image source={{ uri: item.imageUri }} style={[styles.offlineThumb, alreadySelected && { opacity: 0.5 }, isTooFar && !alreadySelected && { opacity: 0.5 }]} />
                                                <View style={styles.offlineInfo}>
                                                    <Text style={[styles.offlineDate, darkMode && styles.textWhite, !isSelectable && { color: '#9CA3AF' }]}>
                                                        {new Date(item.createdAt).toLocaleString()}
                                                    </Text>
                                                    <Text style={[styles.offlineCoords, !isSelectable && { color: '#9CA3AF' }]}>
                                                        {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                                                    </Text>
                                                    {alreadySelected && (
                                                        <Text style={styles.statusLabelText}>Already selected</Text>
                                                    )}
                                                    {!alreadySelected && isTooFar && (
                                                        <Text style={styles.statusLabelText}>Too far</Text>
                                                    )}
                                                </View>
                                                {alreadySelected || isSelectedInBatch ? (
                                                    <CheckCircle size={20} color={alreadySelected ? "#9CA3AF" : "#1E88E5"} />
                                                ) : (
                                                    <View style={styles.checkCirclePlaceholder} />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    }}
                                />
                                <TouchableOpacity 
                                    onPress={handleConfirmOfflineSelection}
                                    style={[styles.confirmBatchBtn, tempSelectedReports.length === 0 && styles.confirmBatchBtnDisabled]}
                                    disabled={tempSelectedReports.length === 0}
                                >
                                    <Text style={styles.confirmBatchText}>
                                        Add {tempSelectedReports.length} Selected Photos
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            <BottomNav navigation={navigation} darkMode={darkMode} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    darkContainer: { backgroundColor: '#111827' },
    heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1F2937' },
    textWhite: { color: 'white' },
    textGray: { color: '#9CA3AF' },
    req: { color: '#EF4444' },
    card: { backgroundColor: 'white', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    cardDark: { backgroundColor: '#1F2937', borderColor: '#374151' },
    label: { marginBottom: 8, fontWeight: '600', color: '#374151', fontSize: 14 },

    // Image
    uploadRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
    uploadBtn: { flex: 1, height: 80, borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed', borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
    uploadText: { color: '#1E88E5', marginTop: 4, fontSize: 12, fontWeight: '600' },
    previewContainer: { width: 270, height: 180, borderRadius: 12, overflow: 'hidden', marginRight: 12, position: 'relative' },
    previewImage: { width: '100%', height: '100%' },
    uploadBtnSmall: { flex: 1, height: 40, borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed', borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
    uploadTextSmall: { color: '#1E88E5', marginTop: 4, fontSize: 10, fontWeight: '600' },

    removeImgBtn: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row', padding: 6, borderRadius: 8, alignItems: 'center' },
    removeImgText: { color: 'white', fontSize: 12, marginLeft: 4 },

    aiBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: '#F3E8FF', padding: 10, borderRadius: 8 },
    aiText: { fontSize: 12, color: '#9333EA', marginLeft: 8, fontWeight: '500' },

    input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16, color: '#1F2937' },
    inputDark: { borderColor: '#374151', color: 'white', backgroundColor: '#374151' },
    errorBorder: { borderColor: '#EF4444', borderWidth: 1 },
    errorText: { color: '#EF4444', fontSize: 12, marginBottom: 12, marginTop: -8 },

    // Dropdown
    dropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 4 },
    dropdownText: { fontSize: 16, color: '#1F2937' },
    placeholderText: { color: '#9CA3AF' },
    dropdownList: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, marginBottom: 16, overflow: 'hidden' },
    dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#F9FAFB' },
    dropdownItemDark: { backgroundColor: '#374151', borderBottomColor: '#4B5563' },
    dropdownItemText: { color: '#374151' },

    // Location Read-Only
    locationSection: { marginBottom: 16, marginTop: 4 },
    readOnlyBox: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
    readOnlyBoxDark: { backgroundColor: '#374151', borderColor: '#4B5563' },
    readOnlyLabel: { fontSize: 12, color: '#6B7280', marginLeft: 6 },
    readOnlyValue: { fontSize: 15, fontWeight: '600', color: '#1F2937', marginLeft: 22 },
    refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    refreshText: { color: '#1E88E5', fontSize: 12, fontWeight: 'bold' },

    submitBtn: { backgroundColor: '#1E88E5', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
    btnDisabled: { backgroundColor: '#93C5FD' },
    submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 16 },
    backButton: {
        backgroundColor: '#E5E7EB',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        flex: 1,
    },
    backButtonText: {
        color: '#1F2937',
        fontWeight: 'bold',
        fontSize: 16,
    },
    nextButton: {
        backgroundColor: '#1E88E5',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        flex: 1,
    },
    nextButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '80%',
        padding: 20
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold'
    },
    emptyOffline: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyOfflineText: {
        marginTop: 10,
        color: '#6B7280'
    },
    offlineItem: {
        flexDirection: 'row',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        alignItems: 'center'
    },
    offlineItemDisabled: {
        backgroundColor: '#F3F4F6',
        opacity: 0.7
    },
    offlineItemActive: {
        backgroundColor: '#EFF6FF',
        borderLeftWidth: 4,
        borderLeftColor: '#1E88E5'
    },
    offlineThumb: {
        width: 60,
        height: 60,
        borderRadius: 8
    },
    offlineInfo: {
        flex: 1,
        marginLeft: 12
    },
    offlineDate: {
        fontSize: 14,
        fontWeight: '600'
    },
    offlineCoords: {
        fontSize: 12,
        color: '#6B7280'
    },
    statusLabelText: {
        fontSize: 10,
        color: '#EF4444',
        fontWeight: 'bold',
        marginTop: 2
    },
    checkCirclePlaceholder: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#D1D5DB'
    },
    confirmBatchBtn: {
        backgroundColor: '#1E88E5',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16
    },
    confirmBatchBtnDisabled: {
        backgroundColor: '#9CA3AF'
    },
    confirmBatchText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16
    }
});

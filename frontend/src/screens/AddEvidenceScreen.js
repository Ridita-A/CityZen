import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Camera, Image as GalleryIcon, ChevronLeft, X, Sparkles, ShieldCheck, ShieldAlert, ShieldQuestion, RefreshCcw, ArrowRight } from 'lucide-react-native';
import axios from 'axios';
import * as Location from 'expo-location';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const GPS_DISTANCE_THRESHOLD_METERS = 50; // Max allowed distance from complaint location

// Haversine distance formula (meters)
const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};


export default function AddEvidenceScreen({ navigation, route }) {
    const { complaintId, selectedOfflineImage } = route.params || {};
    const [selectedImages, setSelectedImages] = useState([]); // Array of URIs for displaying preview
    const [capturedAssets, setCapturedAssets] = useState([]); // Array of asset objects
    const [isUploading, setIsUploading] = useState(false); // To manage loading state during upload
    const [isVerifying, setIsVerifying] = useState(false); // AI verification loading state
    const [verificationResults, setVerificationResults] = useState({}); // Maps URI -> verdict result

    // Camera state
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [complaintData, setComplaintData] = useState(null);

    // Fetch complaint data for GPS comparison
    useEffect(() => {
        const fetchComplaint = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/complaints/${complaintId}`);
                setComplaintData(res.data);
            } catch (err) {
                console.warn('Failed to fetch complaint data for GPS check:', err.message);
            }
        };
        if (complaintId) fetchComplaint();
    }, [complaintId]);

    // Centralized GPS distance check
    const checkLocationDistance = (imageLat, imageLon) => {
        if (!complaintData?.latitude || !complaintData?.longitude) return true; // Can't check, allow
        const distance = getDistanceInMeters(
            imageLat, imageLon,
            parseFloat(complaintData.latitude), parseFloat(complaintData.longitude)
        );
        if (distance > GPS_DISTANCE_THRESHOLD_METERS) {
            Alert.alert(
                '\ud83d\udccd Location Mismatch',
                `This image was captured ${Math.round(distance)}m away from the complaint location (max ${GPS_DISTANCE_THRESHOLD_METERS}m allowed).\n\nPlease capture evidence at the complaint site.`,
                [{ text: 'OK' }]
            );
            return false;
        }
        return true;
    };

    // Handle returning from Offline Gallery — check stored GPS
    useEffect(() => {
        if (selectedOfflineImage) {
            const uri = selectedOfflineImage.imageUri;
            if (!selectedImages.includes(uri)) {
                // Check stored GPS from offline image against complaint location
                if (selectedOfflineImage.latitude && selectedOfflineImage.longitude && complaintData) {
                    const isNearby = checkLocationDistance(
                        selectedOfflineImage.latitude,
                        selectedOfflineImage.longitude
                    );
                    if (!isNearby) {
                        return; // Block — image was taken too far from complaint
                    }
                }

                setSelectedImages(prev => [...prev, uri]);
                setCapturedAssets(prev => [...prev, {
                    uri: uri,
                    fileName: `offline-evidence-${selectedOfflineImage.id}.jpg`,
                    mimeType: 'image/jpeg'
                }]);
            }
        }
    }, [selectedOfflineImage, complaintData]);

    const removeImage = (uriToRemove) => {
        setSelectedImages(prev => prev.filter(uri => uri !== uriToRemove));
        setCapturedAssets(prev => prev.filter(asset => asset.uri !== uriToRemove));
        // Also remove verification result for this image
        setVerificationResults(prev => {
            const updated = { ...prev };
            delete updated[uriToRemove];
            return updated;
        });
    };

    //Camera Capture
    const takePicture = async () => {
        if (!cameraRef.current || isCapturing) return;

        setIsCapturing(true);
        try {
            // Mandatory GPS location check
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Location Required', 'Location permission is needed to verify evidence is from the complaint site.');
                setIsCapturing(false);
                return;
            }

            const gps = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const isNearby = checkLocationDistance(gps.coords.latitude, gps.coords.longitude);
            if (!isNearby) {
                setIsCapturing(false);
                return;
            }

            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.7,
                skipProcessing: true
            });

            if (photo) {
                setSelectedImages(prev => [...prev, photo.uri]);
                setCapturedAssets(prev => [...prev, {
                    uri: photo.uri,
                    fileName: `evidence-${Date.now()}.jpg`,
                    mimeType: 'image/jpeg'
                }]);
            }
        } catch (error) {
            console.error("Capture error:", error);
            Alert.alert("Error", "Failed to take photo. Please try again.");
        } finally {
            setIsCapturing(false);
        }
    };

    const handleLibraryPick = () => {
        navigation.navigate('OfflineGallery', {
            mode: 'selection',
            returnTo: 'AddEvidence',
            complaintId: complaintId
        });
    };

    // AI Evidence Verification
    const verifyEvidenceImage = async (asset) => {
        const formData = new FormData();
        formData.append('image', {
            uri: asset.uri,
            name: asset.fileName || 'evidence.jpg',
            type: asset.mimeType || 'image/jpeg',
        });
        formData.append('complaintId', complaintId);
        formData.append('evidenceType', 'citizen_evidence');

        try {
            const res = await fetch(`${API_URL}/api/ai/verify-evidence`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                throw new Error('AI verification service error');
            }

            return await res.json();
        } catch (err) {
            console.error('Evidence verification failed:', err);
            return null; // Return null on failure — will be treated as skip
        }
    };

    const verifyAllImages = async () => {
        setIsVerifying(true);
        const results = {};
        let hasRejection = false;
        let rejectionReasons = [];

        for (const asset of capturedAssets) {
            // Skip already verified images
            if (verificationResults[asset.uri]) {
                results[asset.uri] = verificationResults[asset.uri];
                if (results[asset.uri].verdict === 'suspicious') {
                    hasRejection = true;
                    rejectionReasons.push(results[asset.uri].reasoning);
                }
                continue;
            }

            const result = await verifyEvidenceImage(asset);
            if (result) {
                results[asset.uri] = result;
                if (result.verdict === 'suspicious') {
                    hasRejection = true;
                    rejectionReasons.push(result.reasoning);
                }
            }
            // If result is null (API failure), we allow it through — don't block on AI errors
        }

        setVerificationResults(prev => ({ ...prev, ...results }));
        setIsVerifying(false);

        if (hasRejection) {
            Alert.alert(
                '⚠️ Evidence Rejected by AI',
                `One or more images were flagged as not relevant to this complaint:\n\n${rejectionReasons.join('\n\n')}\n\nPlease remove the flagged images and upload relevant evidence.`,
                [{ text: 'OK' }]
            );
            return false;
        }

        return true;
    };

    const uploadEvidence = async () => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('complaintId', complaintId);

        capturedAssets.forEach((asset, index) => {
            const filename = asset.fileName || `image-${index}.jpg`;
            formData.append('images', {
                uri: asset.uri,
                name: filename,
                type: asset.mimeType || 'image/jpeg',
            });
        });

        try {
            await axios.post(`${API_URL}/api/complaints/${complaintId}/evidence`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            Alert.alert("Success", "Evidence uploaded successfully!");
            return true; // Indicate success
        } catch (error) {
            console.error("Error uploading evidence:", error.response?.data || error.message);
            Alert.alert("Error", "Failed to upload evidence.");
            return false; // Indicate failure
        } finally {
            setIsUploading(false);
        }
    };

    const handleAddEvidence = async () => { // Make async
        if (selectedImages.length === 0) {
            Alert.alert("No Evidence", "Please take or select a photo to add as evidence.");
            return;
        }

        // Step 1: Verify all images with AI
        const verified = await verifyAllImages();
        if (!verified) return; // Blocked by AI — user needs to fix images

        // Step 2: Upload evidence
        const success = await uploadEvidence();
        if (success) {
            navigation.navigate('ComplaintDetails', {
                id: complaintId,
                newEvidenceImages: selectedImages,
            });
        }
    };

    // Get verdict badge info
    const getVerdictStyle = (verdict) => {
        switch (verdict) {
            case 'genuine':
                return { bg: '#D1FAE5', color: '#065F46', icon: ShieldCheck, label: 'Verified' };
            case 'inconclusive':
                return { bg: '#FEF3C7', color: '#92400E', icon: ShieldQuestion, label: 'Inconclusive' };
            case 'suspicious':
                return { bg: '#FEE2E2', color: '#991B1B', icon: ShieldAlert, label: 'Rejected' };
            default:
                return null;
        }
    };

    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ChevronLeft size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerText}>Add Evidence</Text>
                </View>
                <View style={styles.permissionContainer}>
                    <Text style={styles.message}>We need your permission to show the camera</Text>
                    <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
                        <Text style={styles.permissionButtonText}>Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const previewUri = selectedImages.length > 0 ? selectedImages[selectedImages.length - 1] : null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Add Evidence</Text>
            </View>

            <View style={styles.cameraContainer}>
                {previewUri ? (
                    <View style={styles.mainImagePreviewWrapper}>
                        <Image source={{ uri: previewUri }} style={styles.mainPreviewImage} />

                        {/* AI Verdict badge on main image */}
                        {verificationResults[previewUri] && (() => {
                            const v = getVerdictStyle(verificationResults[previewUri].verdict);
                            if (!v) return null;
                            const IconComp = v.icon;
                            return (
                                <View style={[styles.verdictBadge, { backgroundColor: v.bg }]}>
                                    <IconComp size={14} color={v.color} />
                                    <Text style={[styles.verdictText, { color: v.color }]}>
                                        AI: {v.label} ({verificationResults[previewUri].confidence}%)
                                    </Text>
                                </View>
                            );
                        })()}

                        {/* Display thumbnail strip if more than one image */}
                        {selectedImages.length > 1 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailStrip}>
                                {selectedImages.map((uri, index) => (
                                    <TouchableOpacity key={index} onPress={() => { /* Option to make this the main image */ }}>
                                        <View>
                                            <Image source={{ uri }} style={[
                                                styles.thumbnailImage,
                                                verificationResults[uri]?.verdict === 'suspicious' && { borderColor: '#EF4444', borderWidth: 2 },
                                                verificationResults[uri]?.verdict === 'genuine' && { borderColor: '#10B981', borderWidth: 2 },
                                            ]} />
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                ) : (
                    <CameraView
                        style={styles.camera}
                        ref={cameraRef}
                        facing="back"
                    >
                        {isCapturing && (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="large" color="white" />
                                <Text style={styles.loadingText}>Capturing...</Text>
                            </View>
                        )}
                        {selectedImages.length > 0 && !isCapturing && (
                            <View style={styles.badgeContainer}>
                                <Text style={styles.badgeText}>{selectedImages.length} Captured</Text>
                            </View>
                        )}
                    </CameraView>
                )}
            </View>

            {/* AI Verification Status Banner */}
            {isVerifying && (
                <View style={styles.verifyingBanner}>
                    <ActivityIndicator size="small" color="#1E88E5" />
                    <Sparkles size={16} color="#1E88E5" style={{ marginLeft: 8 }} />
                    <Text style={styles.verifyingText}>AI is verifying your evidence...</Text>
                </View>
            )}

            {/* Show rejection reason if any image was flagged */}
            {Object.values(verificationResults).some(r => r.verdict === 'suspicious') && (
                <View style={styles.rejectionBanner}>
                    <ShieldAlert size={16} color="#991B1B" />
                    <Text style={styles.rejectionText}>
                        Some images were flagged as not relevant. Remove them and upload appropriate evidence.
                    </Text>
                </View>
            )}

            <View style={styles.footer}>
                {!previewUri ? (
                    <>
                        <View style={styles.sideButtonContainer} />

                        <View style={styles.cameraButtonContainer}>
                            <TouchableOpacity
                                onPress={takePicture}
                                style={[styles.cameraButton, (isVerifying || isUploading || isCapturing) && styles.disabledButton]}
                                disabled={isVerifying || isUploading || isCapturing}
                            >
                                <View style={styles.innerCameraButton} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.sideButtonContainer}>
                            <TouchableOpacity
                                onPress={handleLibraryPick}
                                style={styles.sideButton}
                                disabled={isVerifying || isUploading || isCapturing}
                            >
                                <GalleryIcon size={30} color="white" />
                                <Text style={styles.sideButtonText}>Offline Gallery</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <View style={styles.actionButtonContainer}>
                        <TouchableOpacity
                            onPress={() => removeImage(previewUri)}
                            style={styles.actionButton}
                            disabled={isVerifying || isUploading}
                        >
                            <RefreshCcw size={30} color="white" />
                            <Text style={styles.sideButtonText}>Retake</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setSelectedImages(prev => prev.slice(0, -1))} // Just hide preview to show camera
                            style={styles.actionButton}
                            disabled={isVerifying || isUploading}
                        >
                            <Camera size={30} color="white" />
                            <Text style={styles.sideButtonText}>Add More</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleAddEvidence}
                            style={styles.actionButton}
                            disabled={isVerifying || isUploading}
                        >
                            {isUploading || isVerifying ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <ArrowRight size={30} color="white" />
                            )}
                            <Text style={styles.sideButtonText}>Submit</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        height: 100,
        backgroundColor: '#1E88E5',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 40,
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        left: 20,
        top: 55,
        zIndex: 1,
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    cameraContainer: {
        flex: 1,
        backgroundColor: '#000',
        overflow: 'hidden',
    },
    camera: {
        flex: 1,
    },
    mainImagePreviewWrapper: {
        flex: 1,
        width: '100%',
        position: 'relative',
    },
    mainPreviewImage: {
        flex: 1,
        resizeMode: 'contain',
    },
    thumbnailStrip: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    thumbnailImage: {
        width: 60,
        height: 60,
        borderRadius: 5,
        marginHorizontal: 5,
        resizeMode: 'cover',
        borderWidth: 1,
        borderColor: 'white',
    },
    verdictBadge: {
        position: 'absolute',
        top: 20,
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        zIndex: 1,
    },
    verdictText: {
        fontSize: 11,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    verifyingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EFF6FF',
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    verifyingText: {
        color: '#1E88E5',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 8,
    },
    rejectionBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    rejectionText: {
        color: '#991B1B',
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 8,
        flex: 1,
    },
    footer: {
        height: 120,
        backgroundColor: '#1E88E5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 20,
    },
    sideButtonContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraButtonContainer: {
        width: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    actionButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 5,
        borderColor: 'rgba(255,255,255,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    innerCameraButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'white',
    },
    sideButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    sideButtonText: {
        color: 'white',
        fontSize: 12,
        marginTop: 4,
    },
    disabledButton: {
        opacity: 0.5,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    message: {
        textAlign: 'center',
        paddingBottom: 20,
        color: 'white',
        fontSize: 16,
    },
    permissionButton: {
        backgroundColor: '#1E88E5',
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'white',
    },
    permissionButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: 'white',
        marginTop: 10,
        fontSize: 16,
    },
    badgeContainer: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    badgeText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    }
});
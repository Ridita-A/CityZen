import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Camera, Image as GalleryIcon, Library, RefreshCcw, ArrowRight } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import NetInfo from '@react-native-community/netinfo';
import { useComplaint } from '../context/ComplaintContext';
import { saveOfflineReport, deleteReport, initStorage } from '../utils/offlineStorage';

export default function CameraScreen({ navigation }) {
    const {
        images,
        setImages,
        setLocation,
        setLocationTime,
        resetState,
    } = useComplaint();

    const [permission, requestPermission] = useCameraPermissions();
    const [locationPermission, setLocationPermission] = useState(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const cameraRef = useRef(null);
    const [previewUri, setPreviewUri] = useState(null);
    const [capturedLocation, setCapturedLocation] = useState(null);
    const [currentReportId, setCurrentReportId] = useState(null);
    const [isConnected, setIsConnected] = useState(true);

    useEffect(() => {
        resetState();
        initStorage(); // Trigger cleanup and ensure directory exists
        
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsConnected(state.isConnected);
        });

        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setLocationPermission(status === 'granted');
        })();

        return () => unsubscribe();
    }, []);

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>We need your permission to show the camera</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
                    <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const takePicture = async () => {
        if (!cameraRef.current || isCapturing) {
            console.log("Camera not ready or already capturing");
            return;
        }

        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
            Alert.alert("Location Disabled", "Please enable location services (GPS) in your device settings.");
            return;
        }

        if (!locationPermission) {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission Denied", "Location permission is required to capture GPS data for the report.");
                return;
            }
            setLocationPermission(true);
        }

        setIsCapturing(true);
        let photo = null;
        
        try {
            // 1. Capture Photo First
            try {
                photo = await cameraRef.current.takePictureAsync({ 
                    quality: 0.7,
                    skipProcessing: true // Faster capture
                });
            } catch (cameraErr) {
                console.error("Camera Capture Error:", cameraErr);
                throw new Error("PHOTO_FAIL");
            }
            
            // 2. Capture GPS
            let location = null;
            try {
                location = await Location.getCurrentPositionAsync({ 
                    accuracy: Location.Accuracy.Highest,
                    timeout: 45000 
                });
            } catch (locationErr) {
                console.error("Location Capture Error:", locationErr);
                // Try fallback to last known if current fails
                location = await Location.getLastKnownPositionAsync();
                if (!location) throw new Error("GPS_FAIL");
            }
            
            if (!location || (location.coords.accuracy > 100)) { // Relaxed to 100m for difficult fixes
                if (!location) {
                  Alert.alert("Location Error", "Could not get GPS coordinates. Please ensure you have a clear view of the sky.");
                } else {
                  Alert.alert("Poor Accuracy", `GPS accuracy is too low (${Math.round(location.coords.accuracy)}m). Please move outdoors for a better fix.`);
                }
                setIsCapturing(false);
                return;
            }

            // 3. Save Offline
            const report = await saveOfflineReport(photo.uri, location);
            setPreviewUri(report.imageUri);
            setCapturedLocation(location);
            setCurrentReportId(report.id);
            
        } catch (error) {
            console.error("Global Capture error:", error);
            if (error.message === "PHOTO_FAIL") {
                Alert.alert("Camera Error", "Failed to take the photo. Please try again.");
            } else if (error.message === "GPS_FAIL") {
                Alert.alert("GPS Error", "Failed to get a location fix. Pure GPS (no internet) can take up to 2 minutes. Try again in an open area.");
            } else {
                Alert.alert("Capture Error", "An unexpected error occurred during capture.");
            }
        } finally {
            setIsCapturing(false);
        }
    };

    const handleRetake = async () => {
        if (currentReportId) {
            try {
                await deleteReport(currentReportId);
            } catch (err) {
                console.warn("Failed to delete retaken report:", err);
            }
        }
        setPreviewUri(null);
        setCurrentReportId(null);
        setCapturedLocation(null);
    };

    const saveCurrentToContext = async (uri, loc) => {
        if (images.length === 0) {
            let locationData = {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                fullAddress: `${loc.coords.latitude.toFixed(6)}, ${loc.coords.longitude.toFixed(6)}`
            };

            try {
                const [addr] = await Location.reverseGeocodeAsync({ 
                    latitude: loc.coords.latitude, 
                    longitude: loc.coords.longitude 
                });
                if (addr) {
                    const areaName = addr.name || addr.street || addr.subregion || addr.city || 'Unknown area';
                    const district = addr.district || addr.city || '';
                    const region = addr.region || '';
                    locationData.fullAddress = `${areaName}, ${district}, ${region}`;
                    locationData.areaName = areaName;
                    locationData.district = district;
                    locationData.region = region;
                }
            } catch (err) {
                console.warn('Reverse geocode failed', err);
            }
            setLocation(locationData);
            setLocationTime(new Date(loc.timestamp).toLocaleString());
        }
        setImages(prev => [...prev, uri]);
    };

    const handleAddMore = async () => {
        if (previewUri && capturedLocation) {
            await saveCurrentToContext(previewUri, capturedLocation);
            setPreviewUri(null);
            setCapturedLocation(null);
            setCurrentReportId(null);
        }
    };

    const handleProceed = async () => {
        if (!isConnected) {
            Alert.alert("Offline", "You need internet to proceed with the submission flow.");
            return;
        }

        if (previewUri && capturedLocation) {
            await saveCurrentToContext(previewUri, capturedLocation);
            navigation.navigate('SubmitComplaintDetails');
        } else if (images.length > 0) {
            navigation.navigate('SubmitComplaintDetails');
        }
    };

    const handleLibraryPick = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission to access media library is required!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 1,
            exif: true,
        });

        if (result.assets?.length > 0) {
            const asset = result.assets[0];
            setImages([asset.uri]);
            setPreviewUri(asset.uri);
            navigation.navigate('SubmitComplaintDetails');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>Capture Community Issues</Text>
            </View>

            <View style={styles.cameraContainer}>
                {!previewUri ? (
                    <CameraView 
                        style={styles.camera} 
                        ref={cameraRef}
                        facing="back"
                    >
                        {isCapturing && (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="large" color="white" />
                                <Text style={styles.loadingText}>Capturing GPS & Image...</Text>
                            </View>
                        )}
                        {images.length > 0 && !isCapturing && (
                            <View style={styles.badgeContainer}>
                                <Text style={styles.badgeText}>{images.length} Captured</Text>
                            </View>
                        )}
                    </CameraView>
                ) : (
                    <View style={styles.previewContainer}>
                        <Image source={{ uri: previewUri }} style={styles.previewImage} />
                    </View>
                )}
            </View>

            <View style={styles.footer}>
                {!previewUri ? (
                    <>
                        <View style={styles.sideButtonContainer}>
                            <TouchableOpacity onPress={handleLibraryPick} style={styles.sideButton}>
                                <Library size={30} color="white" />
                                <Text style={styles.sideButtonText}>Library</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.cameraButtonContainer}>
                            <TouchableOpacity 
                                onPress={takePicture} 
                                style={[styles.cameraButton, isCapturing && styles.disabledButton]}
                                disabled={isCapturing}
                            >
                                <View style={styles.innerCameraButton} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.sideButtonContainer}>
                            <TouchableOpacity 
                                onPress={() => navigation.navigate('OfflineGallery')} 
                                style={styles.sideButton}
                            >
                                <GalleryIcon size={30} color="white" />
                                <Text style={styles.sideButtonText}>Offline Gallery</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <View style={styles.actionButtonContainer}>
                        <TouchableOpacity onPress={handleRetake} style={styles.actionButton}>
                            <RefreshCcw size={30} color="white" />
                            <Text style={styles.sideButtonText}>Retake</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity onPress={handleAddMore} style={styles.actionButton}>
                            <Camera size={30} color="white" />
                            <Text style={styles.sideButtonText}>Add More</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleProceed} style={styles.actionButton}>
                            <ArrowRight size={30} color="white" />
                            <Text style={styles.sideButtonText}>Proceed</Text>
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
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    cameraContainer: {
        flex: 1,
        overflow: 'hidden',
    },
    camera: {
        flex: 1,
    },
    previewContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    previewImage: {
        flex: 1,
        resizeMode: 'contain',
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
    message: {
        textAlign: 'center',
        paddingBottom: 10,
        color: 'white',
        marginTop: 100,
    },
    permissionButton: {
        backgroundColor: '#1E88E5',
        padding: 15,
        borderRadius: 10,
        alignSelf: 'center',
    },
    permissionButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    disabledButton: {
        opacity: 0.5,
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

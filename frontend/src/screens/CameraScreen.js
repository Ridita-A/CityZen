import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Camera, Image as GalleryIcon, Library, RefreshCcw } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useComplaint } from '../context/ComplaintContext';
import { saveOfflineReport } from '../utils/offlineStorage';

export default function CameraScreen({ navigation }) {
    const {
        setImages,
        resetState,
    } = useComplaint();

    const [permission, requestPermission] = useCameraPermissions();
    const [locationPermission, setLocationPermission] = useState(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const cameraRef = useRef(null);
    const [previewUri, setPreviewUri] = useState(null);

    useEffect(() => {
        resetState();
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setLocationPermission(status === 'granted');
        })();
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
            await saveOfflineReport(photo.uri, location);
            setPreviewUri(photo.uri);
            Alert.alert("Saved Successfully", "Image and Location saved. You can submit it from the Offline Gallery when you are back online.");
            
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
                    </CameraView>
                ) : (
                    <View style={styles.previewContainer}>
                        <Image source={{ uri: previewUri }} style={styles.previewImage} />
                        <TouchableOpacity 
                            style={styles.retakeButton} 
                            onPress={() => setPreviewUri(null)}
                        >
                            <RefreshCcw size={24} color="white" />
                            <Text style={styles.retakeText}>Retake</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <View style={styles.footer}>
                <TouchableOpacity onPress={handleLibraryPick} style={styles.sideButton}>
                    <Library size={30} color="white" />
                    <Text style={styles.sideButtonText}>Library</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    onPress={takePicture} 
                    style={[styles.cameraButton, isCapturing && styles.disabledButton]}
                    disabled={isCapturing}
                >
                    <View style={styles.innerCameraButton} />
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={() => navigation.navigate('OfflineGallery')} 
                    style={styles.sideButton}
                >
                    <GalleryIcon size={30} color="white" />
                    <Text style={styles.sideButtonText}>Offline Reports</Text>
                </TouchableOpacity>
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
        justifyContent: 'space-around',
        paddingBottom: 20,
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
    retakeButton: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        alignItems: 'center',
    },
    retakeText: {
        color: 'white',
        marginLeft: 10,
        fontWeight: 'bold',
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
    }
});

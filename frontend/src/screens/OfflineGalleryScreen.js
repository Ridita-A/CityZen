import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { getOfflineReports, deleteReport, updateReportStatus } from '../utils/offlineStorage';
import { useComplaint } from '../context/ComplaintContext';
import { Trash2, Upload, Wifi, WifiOff, ChevronRight, CheckCircle, Clock } from 'lucide-react-native';
import * as Location from 'expo-location';

export default function OfflineGalleryScreen({ navigation }) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const { setImages, setLocation, setLocationTime, resetState } = useComplaint();

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsConnected(state.isConnected);
        });

        loadReports();

        return () => unsubscribe();
    }, []);

    const loadReports = async () => {
        setLoading(true);
        const savedReports = await getOfflineReports();
        setReports(savedReports);
        setLoading(false);
    };

    const handleDelete = async (id) => {
        Alert.alert(
            "Delete Report",
            "Are you sure you want to delete this offline report?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: async () => {
                        await deleteReport(id);
                        loadReports();
                    } 
                }
            ]
        );
    };

    const handleSelectReport = async (report) => {
        if (!isConnected && !report.uploaded) {
            Alert.alert("Offline", "You need internet to proceed with the submission flow.");
            return;
        }

        resetState();
        setImages([report.imageUri]);
        
        // Reverse geocode if possible (since we only saved lat/lon offline)
        let locationData = {
            latitude: report.latitude,
            longitude: report.longitude,
            fullAddress: `${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}`
        };

        if (isConnected) {
            try {
                const [addr] = await Location.reverseGeocodeAsync({ 
                    latitude: report.latitude, 
                    longitude: report.longitude 
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
        }

        setLocation(locationData);
        setLocationTime(new Date(report.createdAt).toLocaleString());
        
        // Navigate to details screen
        navigation.navigate('SubmitComplaintDetails');
    };

    const renderItem = ({ item }) => (
        <View style={styles.reportCard}>
            <Image source={{ uri: item.imageUri }} style={styles.thumbnail} />
            <View style={styles.reportInfo}>
                <Text style={styles.reportDate}>{new Date(item.createdAt).toLocaleString()}</Text>
                <Text style={styles.reportCoords}>Lat: {item.latitude.toFixed(4)}, Lon: {item.longitude.toFixed(4)}</Text>
                <View style={styles.statusBadge}>
                    {item.uploaded ? (
                        <View style={styles.uploadedBadge}>
                            <CheckCircle size={14} color="#059669" />
                            <Text style={styles.uploadedText}>Submitted</Text>
                        </View>
                    ) : (
                        <View style={styles.pendingBadge}>
                            <Clock size={14} color="#D97706" />
                            <Text style={styles.pendingText}>Pending Upload</Text>
                        </View>
                    )}
                </View>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleSelectReport(item)} style={styles.actionButton}>
                    <ChevronRight size={24} color="#1E88E5" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                    <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Offline Reports</Text>
                <View style={styles.connectionStatus}>
                    {isConnected ? (
                        <View style={styles.onlineStatus}>
                            <Wifi size={16} color="#059669" />
                            <Text style={styles.onlineText}>Online</Text>
                        </View>
                    ) : (
                        <View style={styles.offlineStatus}>
                            <WifiOff size={16} color="#EF4444" />
                            <Text style={styles.offlineText}>Offline</Text>
                        </View>
                    )}
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#1E88E5" style={styles.loader} />
            ) : reports.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Upload size={64} color="#D1D5DB" />
                    <Text style={styles.emptyText}>No offline reports found.</Text>
                    <TouchableOpacity 
                        style={styles.captureButton}
                        onPress={() => navigation.navigate('Camera')}
                    >
                        <Text style={styles.captureButtonText}>Capture Now</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={reports}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    onRefresh={loadReports}
                    refreshing={loading}
                />
            )}
            
            {!isConnected && reports.length > 0 && (
                <View style={styles.offlineWarning}>
                    <WifiOff size={20} color="white" />
                    <Text style={styles.warningText}>You'll be able to upload these once you're back online.</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        backgroundColor: '#1E88E5',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    connectionStatus: {
        backgroundColor: 'white',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    onlineStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    offlineStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    onlineText: {
        color: '#059669',
        fontSize: 12,
        fontWeight: 'bold',
    },
    offlineText: {
        color: '#EF4444',
        fontSize: 12,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 16,
    },
    reportCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    thumbnail: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#E5E7EB',
    },
    reportInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    reportDate: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    reportCoords: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
    statusBadge: {
        marginTop: 8,
    },
    uploadedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    uploadedText: {
        color: '#059669',
        fontSize: 12,
        fontWeight: '600',
    },
    pendingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    pendingText: {
        color: '#D97706',
        fontSize: 12,
        fontWeight: '600',
    },
    actions: {
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingLeft: 10,
    },
    actionButton: {
        padding: 5,
    },
    deleteButton: {
        padding: 5,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        marginTop: 20,
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
    },
    captureButton: {
        marginTop: 20,
        backgroundColor: '#1E88E5',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    captureButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    loader: {
        flex: 1,
    },
    offlineWarning: {
        backgroundColor: '#1E88E5',
        flexDirection: 'row',
        padding: 15,
        alignItems: 'center',
        gap: 10,
    },
    warningText: {
        color: 'white',
        fontSize: 13,
        flex: 1,
    }
});

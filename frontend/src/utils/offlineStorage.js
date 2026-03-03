import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REPORTS_DIR = `${FileSystem.documentDirectory}reports/`;
const METADATA_KEY = '@cityzen_offline_reports';

export const initStorage = async () => {
  const dirInfo = await FileSystem.getInfoAsync(REPORTS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(REPORTS_DIR, { intermediates: true });
  }
};

export const saveOfflineReport = async (imageUri, location) => {
  await initStorage();
  
  const reportId = `report-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const savedImagePath = `${REPORTS_DIR}${reportId}.jpg`;
  
  // Move image to permanent storage
  await FileSystem.copyAsync({
    from: imageUri,
    to: savedImagePath
  });
  
  const report = {
    id: reportId,
    imageUri: savedImagePath,
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy,
    createdAt: Date.now(),
    status: "pending",
    uploaded: false
  };
  
  // Save metadata
  const existingMetadata = await getOfflineReports();
  const updatedMetadata = [...existingMetadata, report];
  await AsyncStorage.setItem(METADATA_KEY, JSON.stringify(updatedMetadata));
  
  return report;
};

export const getOfflineReports = async () => {
  const metadata = await AsyncStorage.getItem(METADATA_KEY);
  return metadata ? JSON.parse(metadata) : [];
};

export const setReportUploaded = async (imageUri) => {
  const existingMetadata = await getOfflineReports();
  const updatedMetadata = existingMetadata.map(report => 
    report.imageUri === imageUri ? { ...report, uploaded: true, status: "submitted" } : report
  );
  await AsyncStorage.setItem(METADATA_KEY, JSON.stringify(updatedMetadata));
};

export const updateReportStatus = async (reportId, uploaded = true) => {
  const existingMetadata = await getOfflineReports();
  const updatedMetadata = existingMetadata.map(report => 
    report.id === reportId ? { ...report, uploaded, status: uploaded ? "submitted" : "pending" } : report
  );
  await AsyncStorage.setItem(METADATA_KEY, JSON.stringify(updatedMetadata));
};

export const deleteReport = async (reportId) => {
  const existingMetadata = await getOfflineReports();
  const reportToDelete = existingMetadata.find(r => r.id === reportId);
  
  if (reportToDelete) {
    // Delete file
    try {
        await FileSystem.deleteAsync(reportToDelete.imageUri, { idempotent: true });
    } catch (e) {
        console.warn("Failed to delete local file", e);
    }
  }
  
  const updatedMetadata = existingMetadata.filter(report => report.id !== reportId);
  await AsyncStorage.setItem(METADATA_KEY, JSON.stringify(updatedMetadata));
};

export const clearAllReports = async () => {
    const existingMetadata = await getOfflineReports();
    for (const report of existingMetadata) {
        try {
            await FileSystem.deleteAsync(report.imageUri, { idempotent: true });
        } catch (e) {}
    }
    await AsyncStorage.removeItem(METADATA_KEY);
};

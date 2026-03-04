import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, Image
} from 'react-native';
import Navigation from '../components/Navigation';
import BottomNav from '../components/BottomNav';
import { useComplaint } from '../context/ComplaintContext';
import { AlertCircle, FileText, MapPin, Image as ImageIcon, Send } from 'lucide-react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function DraftComplaintSubmitScreen({ navigation, onLogout, darkMode, toggleDarkMode }) {
  const {
    images,
    location,
    title,
    setTitle,
    description,
    setDescription,
    unknownCategoryLabel,
    unknownCategoryDescription,
    setAssignedAuthorities,
    resetState,
  } = useComplaint();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async () => {
    const newErrors = {};
    if (!title?.trim()) newErrors.title = 'Title is required.';
    if (!location?.latitude || !location?.longitude) newErrors.location = 'GPS location is required.';
    if (images.length === 0) newErrors.images = 'At least one photo is required.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Alert.alert('Missing Info', Object.values(newErrors).join('\n'));
      return;
    }

    setIsSubmitting(true);

    let uid = auth.currentUser?.uid;
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        uid = userData.uid || userData.id || userData.firebaseUid || uid;
      }
    } catch (e) {
      console.error('Failed to get userData from storage', e);
    }

    if (!uid) {
      Alert.alert('Error', 'Could not identify user. Please log in again.');
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description || '');
    formData.append('latitude', location.latitude);
    formData.append('longitude', location.longitude);
    formData.append('citizenUid', uid);
    formData.append('categoryLabel', unknownCategoryLabel);
    formData.append('categoryDescription', unknownCategoryDescription || '');

    images.forEach((imageUri) => {
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      formData.append('images', { uri: imageUri, name: filename, type });
    });

    try {
      const response = await axios.post(`${API_URL}/api/category-requests/draft`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'bypass-tunnel-reminder': 'true' },
      });

      if (response.status === 201) {
        setAssignedAuthorities([]);
        navigation.navigate('DraftSubmitted', {
          categoryLabel: unknownCategoryLabel,
          draftComplaintId: response.data.draftComplaintId,
        });
      }
    } catch (error) {
      const data = error.response?.data;
      const status = error.response?.status;

      if (status === 400 && data?.isImageReused) {
        Alert.alert('Invalid Image', data.message);
      } else if (status === 429) {
        Alert.alert('Too Many Requests', data?.message || 'Please try again later.');
      } else if (status === 403) {
        Alert.alert('Account Banned', data?.message || 'Your account has been banned.');
      } else {
        Alert.alert('Submission Failed', data?.message || 'An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} navigation={navigation} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text style={[styles.heading, darkMode && styles.textWhite]}>Submit as Draft</Text>

        {/* Draft Notice Banner */}
        <View style={styles.draftBanner}>
          <AlertCircle size={18} color="#D97706" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.draftBannerTitle}>New Issue Type Detected</Text>
            <Text style={styles.draftBannerBody}>
              The AI identified this as <Text style={{ fontWeight: '700' }}>"{unknownCategoryLabel}"</Text>, which is not yet in our system.
              Your complaint will be saved as a draft and submitted once an admin approves the new category.
            </Text>
          </View>
        </View>

        <View style={[styles.card, darkMode && styles.cardDark]}>

          {/* Image previews */}
          {images.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <ImageIcon size={14} color="#6B7280" />
                <Text style={[styles.label, { marginBottom: 0, marginLeft: 6 }, darkMode && styles.textWhite]}>
                  {images.length} Photo{images.length > 1 ? 's' : ''} attached
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {images.map((uri, i) => (
                  <Image key={i} source={{ uri }} style={styles.thumb} resizeMode="cover" />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Location */}
          {location && (
            <View style={[styles.locationBox, darkMode && styles.locationBoxDark]}>
              <MapPin size={14} color="#1E88E5" />
              <Text style={[styles.locationText, darkMode && styles.textGray]} numberOfLines={2}>
                {location.fullAddress || `${location.latitude?.toFixed(5)}, ${location.longitude?.toFixed(5)}`}
              </Text>
            </View>
          )}

          {/* Title */}
          <Text style={[styles.label, darkMode && styles.textWhite]}>
            Title <Text style={styles.req}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, darkMode && styles.inputDark, errors.title && styles.errorBorder]}
            placeholder="Brief title for this issue"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

          {/* Description */}
          <Text style={[styles.label, darkMode && styles.textWhite, { marginTop: 8 }]}>Description</Text>
          <TextInput
            style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }, darkMode && styles.inputDark]}
            placeholder="Any additional details (optional)"
            placeholderTextColor="#9CA3AF"
            multiline
            value={description}
            onChangeText={setDescription}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[styles.submitBtn, isSubmitting && styles.btnDisabled]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Send size={16} color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>Save as Draft</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <BottomNav navigation={navigation} darkMode={darkMode} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  darkContainer: { backgroundColor: '#111827' },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#1F2937' },
  textWhite: { color: 'white' },
  textGray: { color: '#9CA3AF' },
  req: { color: '#EF4444' },

  draftBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  draftBannerTitle: { fontWeight: '700', color: '#92400E', fontSize: 13, marginBottom: 4 },
  draftBannerBody: { color: '#78350F', fontSize: 12, lineHeight: 18 },

  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardDark: { backgroundColor: '#1F2937', borderColor: '#374151' },

  thumb: { width: 80, height: 80, borderRadius: 8, marginRight: 8, backgroundColor: '#E5E7EB' },

  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    gap: 8,
  },
  locationBoxDark: { backgroundColor: '#374151' },
  locationText: { color: '#374151', fontSize: 12, flex: 1 },

  label: { marginBottom: 8, fontWeight: '600', color: '#374151', fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    fontSize: 15,
    color: '#1F2937',
  },
  inputDark: { borderColor: '#374151', color: 'white', backgroundColor: '#374151' },
  errorBorder: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 12, marginBottom: 8 },

  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  backBtn: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  backBtnText: { color: '#1F2937', fontWeight: 'bold', fontSize: 15 },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#D97706',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { backgroundColor: '#FCD34D' },
  submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
});

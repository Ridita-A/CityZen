import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Navigation from '../components/Navigation';
import BottomNav from '../components/BottomNav';
import { useComplaint } from '../context/ComplaintContext';
import { useNotification } from '../context/NotificationContext';
import { complaintAPI } from '../services/api';
import axios from 'axios';
import { auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setReportUploaded } from '../utils/offlineStorage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const OPENROUTER_API_URL = process.env.EXPO_PUBLIC_OPENROUTER_API_URL;


export default function SubmitComplaintScreen({ navigation, onLogout, darkMode, toggleDarkMode }) {
  const {
    images,
    setImages,
    location,
    setLocation,
    title,
    setTitle,
    description,
    setDescription,
    selectedCategory,
    setSelectedCategory,
    setAssignedAuthorities,
    resetState, // Destructure setAssignedAuthorities
  } = useComplaint();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [recommendedAuthorities, setRecommendedAuthorities] = useState([]);
  const [chosenAuthorities, setChosenAuthorities] = useState([]);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);

  const getAuthenticatedCitizenUid = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      if (!userDataStr) return null;

      const userData = JSON.parse(userDataStr);
      const role = String(userData?.role || '').toLowerCase();
      const uid = userData?.firebaseUid || userData?.uid || userData?.id || null;

      if (!uid || role !== 'citizen') {
        return null;
      }

      return uid;
    } catch (error) {
      console.error('Failed to resolve authenticated citizen:', error);
      return null;
    }
  };

  const handleChooseAuthority = (authorityId) => {
    setChosenAuthorities(prev => {
      if (prev.includes(authorityId)) {
        return prev.filter(id => id !== authorityId); // Deselect
      } else {
        return [...prev, authorityId]; // Select
      }
    });
  };

  const locationKey = location?.latitude && location?.longitude
    ? `${location.latitude.toFixed(5)},${location.longitude.toFixed(5)}`
    : null;


  useEffect(() => {
    setChosenAuthorities([]);
  }, [selectedCategory?.id, locationKey]);


  useEffect(() => {
    if (!selectedCategory || !locationKey) return;

    const fetchRecommendedAuthority = async () => {
      setLoadingRecommendation(true);
      try {
        const response = await axios.get(
          `${API_URL}/api/complaints/recommend-authorities`,
          {
            params: {
              categoryId: selectedCategory.id,
              latitude: location.latitude,
              longitude: location.longitude,
            },
            headers: { 'bypass-tunnel-reminder': 'true' }
          }
        );
        setRecommendedAuthorities(response.data);
      } catch (error) {
        console.error('Error fetching recommended authority:', error);
      } finally {
        setLoadingRecommendation(false);
      }
    };

    const handler = setTimeout(fetchRecommendedAuthority, 800);
    return () => clearTimeout(handler);
  }, [selectedCategory?.id, locationKey]);


  const handleSubmit = async () => {
    const newErrors = {};
    if (!title) newErrors.title = 'Title is required.';
    // if (images.length === 0) newErrors.image = 'Evidence photos are mandatory.'; // Already validated in previous screen but good to keep
    if (!selectedCategory) newErrors.category = 'Category is required.';
    if (!location?.latitude || !location?.longitude) newErrors.location = 'GPS location is required.';
    // chosenAuthorities validation if needed

    if (Object.keys(newErrors).length > 0) {
      const errorMessages = Object.values(newErrors).join('\n');
      Alert.alert('Missing Info', errorMessages);
      setErrors(newErrors);
      return;
    }

    // Accept submission only for fully authenticated citizen sessions.
    const uid = await getAuthenticatedCitizenUid();

    if (!uid) {
      // Save all form data before redirecting to auth
      try {
        const pendingSubmission = {
          images,
          location,
          title,
          description,
          selectedCategory,
          chosenAuthorities,
          autoSubmitOnAuth: true,
          timestamp: Date.now()
        };
        await AsyncStorage.setItem('pendingComplaintSubmission', JSON.stringify(pendingSubmission));
        
        Alert.alert(
          'Login Required',
          'Please log in or create an account to submit your complaint. Your progress will be saved and submission will complete automatically after login.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Log In', 
              onPress: () => navigation.navigate('Login', { resumeComplaintSubmission: true })
            },
            { 
              text: 'Sign Up', 
              onPress: () => navigation.navigate('Signup', { resumeComplaintSubmission: true })
            }
          ]
        );
      } catch (error) {
        console.error('Error saving pending submission:', error);
        Alert.alert('Error', 'Failed to save form data. Please try again.');
      }
      return;
    }

    // Proceed with actual submission
    await performSubmission(uid);
  };

  const performSubmission = async (uid) => {
    setIsSubmitting(true);
    setErrors({});

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('latitude', location.latitude);
    formData.append('longitude', location.longitude);

    formData.append('citizenUid', uid);
    formData.append('categoryId', selectedCategory.id);
    formData.append('chosenAuthorities', JSON.stringify(chosenAuthorities.map(Number)));

    images.forEach((imageUri, index) => {
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;
      formData.append('images', {
        uri: imageUri,
        name: filename,
        type: type,
      });
    });

    try {
      const response = await axios.post(`${API_URL}/api/complaints`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'bypass-tunnel-reminder': 'true'
        }
      });

      if (response.status === 201) {
        // Mark offline reports as uploaded if they exist in our local reports store
        for (const imageUri of images) {
          if (imageUri.includes('reports/')) {
            await setReportUploaded(imageUri);
          }
        }

        // Clear pending submission data on success
        await AsyncStorage.removeItem('pendingComplaintSubmission');
        
        Alert.alert("Success", "Complaint Submitted Successfully!");
        const assignedAuthorityNames = chosenAuthorities.map(chosenId => {
          const authority = recommendedAuthorities.find(rec => rec.id === chosenId);
          return authority ? authority.name : 'Unknown Authority';
        });
        setAssignedAuthorities(assignedAuthorityNames);
        navigation.navigate('SubmittedComplaint');
      }
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 409 && data?.isDuplicate) {
        if (data.canBump && data.existingComplaintId) {
          // Trigger Bump UI
          Alert.alert(
            "Still waiting for a fix? 🚀",
            data.message,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Bump to Top",
                onPress: () => handleBump(data.existingComplaintId)
              }
            ]
          );
        } else if (data.existingComplaint) {
          // Standard Duplicate Block with View Option
          Alert.alert(
            "Good News! 📋",
            "You have already reported this issue. We are tracking it for you. Would you like to see the current status?",
            [
              { text: "Not Now", style: "cancel" },
              {
                text: "View Status",
                onPress: () => navigation.navigate('ComplaintDetails', { complaintId: data.existingComplaint.id })
              }
            ]
          );
        } else {
          Alert.alert("Submission Blocked", data.message);
        }
      } else if (status === 400 && data?.isImageReused) {
        Alert.alert("Invalid Image", data.message);
      } else if (status === 429) {
        Alert.alert("Too Many Requests", data.message);
        // TODO: Implement Captcha Trigger here
      } else {
        console.error('Submit Complaint Error:', error.response?.data || error.message);
        let errorMessage = 'An unexpected error occurred.';
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Network timeout. Please check your connection and try again.';
        } else if (error.message === 'Network Error') {
          errorMessage = 'Network Error. Could not connect to the server.';
        } else {
          errorMessage = data?.message || 'An unexpected error occurred.';
        }
        Alert.alert('Submission Failed', errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check for pending submission on component mount
  useEffect(() => {
    const checkPendingSubmission = async () => {
      try {
        const pendingStr = await AsyncStorage.getItem('pendingComplaintSubmission');
        if (!pendingStr) return;

        const pending = JSON.parse(pendingStr);
        
        // Check if user is now authenticated as a citizen
        const uid = await getAuthenticatedCitizenUid();
        if (!uid) return;

        // Restore form data from pending submission
        if (Array.isArray(pending.images)) {
          setImages(pending.images);
        }
        if (pending.location?.latitude && pending.location?.longitude) {
          setLocation(pending.location);
        }
        if (pending.selectedCategory?.id) {
          setSelectedCategory(pending.selectedCategory);
        }
        setTitle(pending.title || '');
        setDescription(pending.description || '');
        setChosenAuthorities(pending.chosenAuthorities || []);

        if (!pending.autoSubmitOnAuth) return;

        // Auto-submit after a brief delay
        setTimeout(async () => {
          Alert.alert(
            'Resuming Submission',
            'Completing your complaint submission...',
            [{ text: 'OK' }]
          );
          await performSubmission(uid);
        }, 500);
      } catch (error) {
        console.error('Error checking pending submission:', error);
      }
    };

    checkPendingSubmission();
  }, []);

  const handleBump = async (complaintId) => {
    try {
      setIsSubmitting(true);
      const userDataStr = await AsyncStorage.getItem('userData');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      const citizenUid = userData?.firebaseUid || userData?.uid || userData?.id;

      if (!citizenUid) {
        throw new Error('Missing citizen identity for bump request.');
      }

      const response = await axios.post(`${API_URL}/api/complaints/${complaintId}/bump`, { citizenUid }, {
        headers: { 'bypass-tunnel-reminder': 'true' }
      });

      if (response.status === 200) {
        Alert.alert("Success", "Complaint Bumped to Top of Queue! 🚀");
        navigation.navigate('UserComplaintList'); // Or dashboard
      }
    } catch (error) {
      console.error("Bump Error:", error);
      Alert.alert("Error", error.response?.data?.message || "Failed to bump complaint.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} navigation={navigation} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text style={[styles.heading, darkMode && styles.textWhite]}>Select Authority</Text>

        <View style={[styles.card, darkMode && styles.cardDark]}>
          <Text style={[styles.label, darkMode && styles.textWhite]}>Title <Text style={styles.req}>*</Text></Text>
          <TextInput
            style={[styles.input, darkMode && styles.inputDark, errors.title && styles.errorBorder]}
            placeholder="e.g. Large Pothole on Main St"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={[styles.label, darkMode && styles.textWhite, { marginTop: 12 }]}>Description</Text>
          <TextInput
            style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }, darkMode && styles.inputDark]}
            placeholder="Add any additional details (optional)"
            placeholderTextColor="#9CA3AF"
            multiline
            value={description}
            onChangeText={setDescription}
          />

          {/* Recommended Authorities */}
          {loadingRecommendation && <ActivityIndicator style={{ marginVertical: 16 }} color="#1E88E5" />}
          {recommendedAuthorities.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={[styles.label, darkMode && styles.textWhite]}>Recommended Authorities</Text>
              {recommendedAuthorities.map((authority) => (
                <TouchableOpacity
                  key={authority.id}
                  onPress={() => handleChooseAuthority(authority.id)}
                  style={[
                    styles.card,
                    darkMode && styles.cardDark,
                    { padding: 16, marginBottom: 12 },
                    chosenAuthorities.includes(authority.id) && styles.selectedCard
                  ]}
                >
                  <Text style={[styles.dropdownText, darkMode && styles.textWhite, { fontWeight: 'bold' }]}>
                    {authority.name}
                  </Text>
                  <Text style={[styles.readOnlyLabel, darkMode && styles.textGray, { marginTop: 4 }]}>
                    {authority.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {!loadingRecommendation && recommendedAuthorities.length === 0 && (
            <Text style={[styles.readOnlyLabel, darkMode && styles.textGray]}>
              No authority recommendations found for this location.
              Please select manually or try adjusting the category.
            </Text>
          )}


          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[styles.submitBtn, isSubmitting && styles.btnDisabled]}
            >
              {isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>Submit</Text>}
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
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1F2937' },
  textWhite: { color: 'white' },
  req: { color: '#EF4444' },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  selectedCard: {
    borderColor: '#1E88E5',
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
  },
  cardDark: { backgroundColor: '#1F2937', borderColor: '#374151' },
  label: { marginBottom: 8, fontWeight: '600', color: '#374151', fontSize: 14 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16, color: '#1F2937' },
  inputDark: { borderColor: '#374151', color: 'white', backgroundColor: '#374151' },
  errorBorder: { borderColor: '#EF4444' },
  submitBtn: {
    backgroundColor: '#1E88E5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1, // Make it take equal space
  },
  btnDisabled: { backgroundColor: '#93C5FD' },
  submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 16 },
  backButton: {
    backgroundColor: '#E5E7EB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1, // Make it take equal space
  },
  backButtonText: {
    color: '#1F2937',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center'
  },
});

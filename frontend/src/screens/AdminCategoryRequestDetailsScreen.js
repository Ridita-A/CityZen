import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
import { Tag, Clock, AlertTriangle, CheckCircle, Building2, XCircle, CheckSquare, Square } from 'lucide-react-native';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function AdminCategoryRequestDetailsScreen({ route, navigation }) {
  const { item, departments, darkMode } = route.params;
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleDepartment = (deptId) => {
    if (selectedDepartments.includes(deptId)) {
      setSelectedDepartments(prev => prev.filter(id => id !== deptId));
    } else {
      setSelectedDepartments(prev => [...prev, deptId]);
    }
  };

  const handleApprove = async () => {
    if (selectedDepartments.length === 0) {
      Alert.alert('Error', 'Please select at least one department to handle this category.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.patch(
        `${API_URL}/api/category-requests/${item.id}/approve`,
        { categoryName: item.categoryLabel, authorityIds: selectedDepartments },
        { headers: { 'bypass-tunnel-reminder': 'true' } }
      );
      const { activatedComplaints = 0, rejectedComplaints = 0 } = response.data;
      const totalDrafts = activatedComplaints + rejectedComplaints;
      let summary = `"${item.categoryLabel}" has been added as a new category.\n\n`;
      if (activatedComplaints > 0) {
        summary += `✅ ${activatedComplaints} complaint(s) are now pending and assigned to local authorities.\n`;
      }
      if (rejectedComplaints > 0) {
        summary += `\n⚠️ ${rejectedComplaints} complaint(s) were rejected because their location is not within any assigned department's service area. Those citizens have been notified.`;
      }
      Alert.alert('Category Approved', summary, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      const status = error.response?.status;
      const msg = error.response?.data?.message;
      if (status === 422) {
        Alert.alert(
          'No Valid Authority',
          'None of the selected authority IDs exist. The category request and all linked draft complaints have been automatically rejected.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', msg || 'Failed to approve request.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = () => {
    Alert.alert(
      'Reject Category Request',
      `Reject "${item.categoryLabel}"? All ${item.draftCount} linked draft complaint(s) will be marked as rejected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await axios.patch(
                `${API_URL}/api/category-requests/${item.id}/reject`,
                { adminRemarks: 'Category not recognized or no suitable authority available.' },
                { headers: { 'bypass-tunnel-reminder': 'true' } }
              );
              Alert.alert('Rejected', `Category request "${item.categoryLabel}" rejected.`, [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to reject request.');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <View style={[styles.header, darkMode && styles.darkHeader]}>
        <Text style={[styles.headerTitle, darkMode && styles.textWhite]}>Review Category</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <XCircle size={24} color={darkMode ? "#E5E7EB" : "#374151"} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Request Details */}
        <View style={[styles.card, darkMode && styles.cardDark]}>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Tag size={18} color="#D97706" />
              <View>
                 <Text style={[styles.mainText, { color: '#D97706', marginBottom: 2, fontSize: 18 }]}>{item.categoryLabel}</Text>
                 {item.categoryDescription && (
                   <Text style={[styles.subText, { color: darkMode ? '#9CA3AF' : '#6B7280', fontSize: 14 }]} numberOfLines={3}>
                     {item.categoryDescription}
                   </Text>
                 )}
              </View>
            </View>
          </View>
          <Text style={[styles.time, { marginTop: 12 }]}><Clock size={12} color="#9CA3AF" /> Requested: {formatTime(item.createdAt)}</Text>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 16 }}>
            <View style={[styles.reasonBadge, { backgroundColor: '#FFFBEB', borderColor: '#FCD34D', borderWidth: 1 }]}>
              <AlertTriangle size={12} color="#D97706" />
              <Text style={[styles.reasonText, { color: '#D97706', fontSize: 13 }]}>New Category</Text>
            </View>
            <View style={[styles.reasonBadge, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', borderWidth: 1 }]}>
              <CheckCircle size={12} color="#059669" />
              <Text style={[styles.reasonText, { color: '#059669', fontSize: 13 }]}>{item.draftCount} Draft Request{item.draftCount !== 1 ? 's' : ''}</Text>
            </View>
          </View>

          {item.sampleImage && (
            <Image source={{ uri: item.sampleImage }} style={{ width: '100%', height: 200, borderRadius: 8, marginBottom: 10 }} resizeMode="cover" />
          )}
        </View>

        {/* Department Selection */}
        <View style={[styles.card, darkMode && styles.cardDark]}>
          <Text style={[styles.sectionTitle, darkMode && styles.textWhite, { marginBottom: 6 }]}>Assign Departments</Text>
          <Text style={[styles.sectionDesc, darkMode && styles.textGray]}>
            Select departments responsible for this category. Only complaints within a selected department's service area will be activated — others will be rejected with a location notice.
          </Text>
          
          <View style={styles.departmentsGrid}>
            {departments.map((dept) => {
              const isSelected = selectedDepartments.includes(dept.id);
              return (
                <TouchableOpacity
                  key={dept.id}
                  style={[
                    styles.pillLarge,
                    isSelected ? styles.pillSelected : (darkMode ? styles.pillUnselectedDark : styles.pillUnselected),
                  ]}
                  onPress={() => toggleDepartment(dept.id)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 }}>
                    <Building2 size={16} color={isSelected ? 'white' : '#1E88E5'} style={{ flexShrink: 0 }} />
                    <Text style={[
                      styles.pillText,
                      isSelected ? styles.pillTextSelected : styles.pillTextUnselected,
                      { flex: 1, flexWrap: 'wrap' }
                    ]}>
                      {dept.name}
                    </Text>
                  </View>
                  {isSelected ? <CheckSquare size={18} color="white" style={{ flexShrink: 0 }} /> : <Square size={18} color={darkMode ? '#4B5563' : '#9CA3AF'} style={{ flexShrink: 0 }} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Action Footer */}
      <View style={[styles.footer, darkMode && styles.darkFooter]}>
        <TouchableOpacity style={[styles.btnReject, isSubmitting && styles.btnDisabled]} onPress={handleReject} disabled={isSubmitting}>
          <Text style={styles.btnRejectText}>Reject</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.btnApprove, (selectedDepartments.length === 0 || isSubmitting) && styles.btnDisabled]} 
          onPress={handleApprove}
          disabled={selectedDepartments.length === 0 || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.btnApproveText}>Approve Category</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  darkContainer: { backgroundColor: '#111827' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    position: 'relative'
  },
  darkHeader: { backgroundColor: '#1F2937', borderBottomColor: '#374151' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  closeBtn: { position: 'absolute', right: 16, top: 48, padding: 4 },
  textWhite: { color: 'white' },
  textGray: { color: '#9CA3AF' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  card: { backgroundColor: 'white', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 24 },
  cardDark: { backgroundColor: '#1F2937', borderColor: '#374151' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  mainText: { fontWeight: '700', color: '#1F2937' },
  subText: { color: '#6B7280', fontSize: 13, marginTop: 4 },
  time: { fontSize: 12, color: '#9CA3AF', marginBottom: 6 },
  
  reasonBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, gap: 4 },
  reasonText: { fontSize: 11, fontWeight: '600' },
  
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 6 },
  sectionDesc: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  
  departmentsGrid: { gap: 10 },
  pillLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  pillUnselected: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  pillUnselectedDark: { backgroundColor: '#374151', borderColor: '#4B5563' },
  pillSelected: { backgroundColor: '#1E88E5', borderColor: '#1E88E5' },
  
  pillText: { fontWeight: '600', fontSize: 14 },
  pillTextUnselected: { color: '#1E88E5' },
  pillTextSelected: { color: 'white' },
  
  footer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12
  },
  darkFooter: { backgroundColor: '#1F2937', borderTopColor: '#374151' },
  
  btnReject: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F87171'
  },
  btnRejectText: { color: '#B91C1C', fontWeight: 'bold', fontSize: 15 },
  
  btnApprove: {
    flex: 2,
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnApproveText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  btnDisabled: { opacity: 0.5 }
});

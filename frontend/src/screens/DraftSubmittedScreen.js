import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CheckCircle, Clock, ArrowRight } from 'lucide-react-native';
import { useComplaint } from '../context/ComplaintContext';

export default function DraftSubmittedScreen({ navigation, route, darkMode }) {
  const { resetState } = useComplaint();
  const categoryLabel = route?.params?.categoryLabel || 'Unknown Issue';

  const handleGoHome = () => {
    resetState();
    navigation.reset({ index: 0, routes: [{ name: 'HomeScreen' }] });
  };

  const handleViewComplaints = () => {
    resetState();
    navigation.navigate('UserComplaintList');
  };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>

      {/* Icon cluster */}
      <View style={styles.iconCluster}>
        <View style={styles.outerRing}>
          <View style={styles.innerRing}>
            <CheckCircle size={40} color="#D97706" />
          </View>
        </View>
      </View>

      <Text style={[styles.heading, darkMode && styles.textWhite]}>Draft Saved!</Text>

      <Text style={[styles.subtitle, darkMode && styles.textGray]}>
        Your complaint about{' '}
        <Text style={styles.labelHighlight}>"{categoryLabel}"</Text>{' '}
        has been saved as a draft.
      </Text>

      {/* Info card */}
      <View style={[styles.infoCard, darkMode && styles.infoCardDark]}>
        <View style={styles.infoRow}>
          <Clock size={16} color="#D97706" />
          <Text style={[styles.infoText, darkMode && styles.textGray]}>
            An admin will review the new category and map it to the appropriate authority.
          </Text>
        </View>
        <View style={[styles.divider, darkMode && styles.dividerDark]} />
        <View style={styles.infoRow}>
          <CheckCircle size={16} color="#059669" />
          <Text style={[styles.infoText, darkMode && styles.textGray]}>
            Once approved, your complaint will be automatically submitted. The submission date will be today's date.
          </Text>
        </View>
        <View style={[styles.divider, darkMode && styles.dividerDark]} />
        <View style={styles.infoRow}>
          <ArrowRight size={16} color="#6B7280" />
          <Text style={[styles.infoText, darkMode && styles.textGray]}>
            If the category is rejected, you will be notified and your draft will be discarded.
          </Text>
        </View>
      </View>

      {/* Actions */}
      <TouchableOpacity style={styles.primaryBtn} onPress={handleViewComplaints}>
        <Text style={styles.primaryBtnText}>View My Complaints</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.secondaryBtn, darkMode && styles.secondaryBtnDark]} onPress={handleGoHome}>
        <Text style={[styles.secondaryBtnText, darkMode && styles.textGray]}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkContainer: { backgroundColor: '#111827' },
  textWhite: { color: 'white' },
  textGray: { color: '#9CA3AF' },

  iconCluster: { marginBottom: 24 },
  outerRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  labelHighlight: { color: '#D97706', fontWeight: '700' },

  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 28,
  },
  infoCardDark: { backgroundColor: '#1F2937', borderColor: '#374151' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10 },
  infoText: { flex: 1, fontSize: 13, color: '#4B5563', lineHeight: 19 },
  divider: { height: 1, backgroundColor: '#F3F4F6' },
  dividerDark: { backgroundColor: '#374151' },

  primaryBtn: {
    backgroundColor: '#1E88E5',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },

  secondaryBtn: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  secondaryBtnDark: { backgroundColor: '#374151' },
  secondaryBtnText: { color: '#374151', fontWeight: '600', fontSize: 15 },
});

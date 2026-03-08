
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions, Modal, Alert } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import MapView, { Heatmap, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import api from '../services/api';

const screenWidth = Dimensions.get('window').width;

export default function AdminAnalyticsScreen({ navigation, darkMode }) {
  const [loading, setLoading] = useState(true);
  const [deptStats, setDeptStats] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const deptRes = await api.get('/departments/performance');
      setDeptStats(deptRes.data || []);
      const catRes = await api.get('/categories/stats');
      setCategoryStats(catRes.data || []);
      const complaintsRes = await api.get('/complaints?limit=1000');
      setComplaints(complaintsRes.data || []);
    } catch (e) {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const safeComplaints = Array.isArray(complaints) ? complaints : [];
    let total = safeComplaints.length;
    let resolved = 0, pending = 0, appealed = 0, accepted = 0, inProgress = 0;
    let resolutionTimes = [];
    let ratings = [];
    for (const c of safeComplaints) {
      const status = c.currentStatus ? c.currentStatus.toLowerCase() : '';
      if (["resolved", "closed", "completed"].includes(status)) {
        resolved++;
        if (c.createdAt && c.updatedAt) {
          const created = new Date(c.createdAt).getTime();
          const updated = new Date(c.updatedAt).getTime();
          if (updated > created) resolutionTimes.push(updated - created);
        }
      } else if (status === 'pending') pending++;
      else if (status === 'appealed') appealed++;
      else if (status === 'accepted') accepted++;
      else if (["in_progress", "assigned"].includes(status)) inProgress++;
      if (c.rating != null) ratings.push(c.rating);
    }
    const avgResolution = resolutionTimes.length > 0 ? parseFloat((resolutionTimes.reduce((sum, ms) => sum + ms, 0) / resolutionTimes.length / 1000 / 60 / 60).toFixed(1)) : 0;
    const avgRating = ratings.length > 0 ? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)) : 0;
    return { total, resolved, pending, appealed, accepted, inProgress, avgResolution, avgRating };
  }, [complaints]);

  // Chart data
  const chartData = {
    labels: ['Pending', 'Accepted', 'In Progress', 'Resolved', 'Appealed'],
    datasets: [{
      data: [metrics.pending, metrics.accepted, metrics.inProgress, metrics.resolved, metrics.appealed]
    }]
  };

  // Heatmap points (by complaint location)
  const heatmapPoints = useMemo(() => {
    return complaints
      .filter(c => c.latitude && c.longitude)
      .map(c => ({ latitude: Number(c.latitude), longitude: Number(c.longitude), weight: 1 }));
  }, [complaints]);

  // PDF Generation
  const generatePDF = async () => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Admin Analytics Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1E88E5; padding-bottom: 20px; }
            .header h1 { color: #1E88E5; margin: 0 0 10px 0; font-size: 32px; }
            .header p { margin: 5px 0; color: #6B7280; font-size: 14px; }
            .section-title { font-size: 20px; font-weight: bold; color: #1F2937; margin: 30px 0 15px 0; border-bottom: 2px solid #E5E7EB; padding-bottom: 8px; }
            .metrics { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 30px; }
            .metric-box { flex: 1; min-width: 180px; background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); padding: 20px; border-radius: 12px; border: 1px solid #E5E7EB; }
            .metric-label { font-size: 11px; color: #6B7280; margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
            .metric-value { font-size: 28px; font-weight: bold; color: #1F2937; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background-color: #1E88E5; color: white; padding: 12px; text-align: left; font-weight: bold; font-size: 13px; }
            td { padding: 10px 12px; border-bottom: 1px solid #E5E7EB; font-size: 13px; }
            tr:nth-child(even) { background-color: #F9FAFB; }
            .footer { margin-top: 40px; text-align: center; color: #9CA3AF; font-size: 12px; border-top: 1px solid #E5E7EB; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CityZen Admin Analytics Report</h1>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <div class="section-title">Key Performance Indicators</div>
          <div class="metrics">
            <div class="metric-box"><div class="metric-label">Total Cases</div><div class="metric-value">${metrics.total}</div></div>
            <div class="metric-box"><div class="metric-label">Resolved</div><div class="metric-value">${metrics.resolved}</div></div>
            <div class="metric-box"><div class="metric-label">Pending</div><div class="metric-value">${metrics.pending}</div></div>
            <div class="metric-box"><div class="metric-label">In Progress</div><div class="metric-value">${metrics.inProgress}</div></div>
            <div class="metric-box"><div class="metric-label">Accepted</div><div class="metric-value">${metrics.accepted}</div></div>
            <div class="metric-box"><div class="metric-label">Appeals</div><div class="metric-value">${metrics.appealed}</div></div>
            <div class="metric-box"><div class="metric-label">Avg. Resolution Time</div><div class="metric-value">${metrics.avgResolution} hrs</div></div>
            <div class="metric-box"><div class="metric-label">Avg. User Rating</div><div class="metric-value">${metrics.avgRating} / 5 ★</div></div>
          </div>
          <div class="section-title">Department Performance</div>
          <table>
            <thead><tr><th>Department</th><th>Active</th><th>Resolved</th><th>Performance</th></tr></thead>
            <tbody>
              ${(deptStats || []).map(dept => `
                <tr><td>${dept.name}</td><td>${dept.active}</td><td>${dept.resolved}</td><td>${dept.perf}</td></tr>
              `).join('')}
            </tbody>
          </table>
          <div class="section-title">Category Trends</div>
          <table>
            <thead><tr><th>Category</th><th>Total Complaints</th></tr></thead>
            <tbody>
              ${(categoryStats || []).map(cat => `
                <tr><td>${cat.name}</td><td>${cat.complaintCount}</td></tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p><strong>CityZen Admin Analytics System</strong></p>
            <p>This is an automatically generated report</p>
          </div>
        </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: 'Admin Analytics Report'
        });
      }
      setShowExportModal(false);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      Alert.alert('Error', 'Failed to generate PDF.');
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;
  if (error) return <Text style={{ color: 'red', margin: 20 }}>{error}</Text>;

  return (
    <ScrollView style={[styles.container, darkMode && styles.darkBg]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={{ marginRight: 12, padding: 4 }}>
          <Text style={{ fontSize: 24, color: darkMode ? 'white' : '#1E88E5' }}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={[styles.header, darkMode && styles.textWhite, { marginBottom: 0 }]}>Admin Analytics</Text>
      </View>
      {/* Metrics Section */}
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}><Text style={styles.metricLabel}>Total</Text><Text style={styles.metricValue}>{metrics.total}</Text></View>
        <View style={styles.metricBox}><Text style={styles.metricLabel}>Resolved</Text><Text style={styles.metricValue}>{metrics.resolved}</Text></View>
        <View style={styles.metricBox}><Text style={styles.metricLabel}>Pending</Text><Text style={styles.metricValue}>{metrics.pending}</Text></View>
        <View style={styles.metricBox}><Text style={styles.metricLabel}>In Progress</Text><Text style={styles.metricValue}>{metrics.inProgress}</Text></View>
        <View style={styles.metricBox}><Text style={styles.metricLabel}>Accepted</Text><Text style={styles.metricValue}>{metrics.accepted}</Text></View>
        <View style={styles.metricBox}><Text style={styles.metricLabel}>Appeals</Text><Text style={styles.metricValue}>{metrics.appealed}</Text></View>
        <View style={styles.metricBox}><Text style={styles.metricLabel}>Avg. Resolution (hrs)</Text><Text style={styles.metricValue}>{metrics.avgResolution}</Text></View>
        <View style={styles.metricBox}><Text style={styles.metricLabel}>Avg. Rating</Text><Text style={styles.metricValue}>{metrics.avgRating} / 5 ★</Text></View>
      </View>

      {/* Trends Chart */}
      <Text style={[styles.header, darkMode && styles.textWhite, { marginTop: 24 }]}>Complaint Status Trends</Text>
      <BarChart
        data={chartData}
        width={screenWidth - 32}
        height={220}
        yAxisLabel={''}
        chartConfig={{
          backgroundColor: '#fff',
          backgroundGradientFrom: '#f3f4f6',
          backgroundGradientTo: '#e5e7eb',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(30, 136, 229, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(31, 41, 55, ${opacity})`,
          style: { borderRadius: 16 },
          propsForDots: { r: '6', strokeWidth: '2', stroke: '#1E88E5' },
        }}
        style={{ marginVertical: 8, borderRadius: 16 }}
      />

      {/* Department Table */}
      <Text style={[styles.header, darkMode && styles.textWhite, { marginTop: 24 }]}>Department Performance</Text>
      {(Array.isArray(deptStats) ? deptStats : []).map(dept => (
        <View key={dept.id} style={[styles.card, darkMode && styles.cardDark]}>
          <Text style={[styles.deptName, darkMode && styles.textWhite]}>{dept.name}</Text>
          <Text style={styles.stat}>Active: {dept.active}</Text>
          <Text style={styles.stat}>Resolved: {dept.resolved}</Text>
          <Text style={styles.stat}>Performance: {dept.perf}</Text>
        </View>
      ))}

      {/* Category Table */}
      <Text style={[styles.header, darkMode && styles.textWhite, { marginTop: 24 }]}>Category Trends</Text>
      {(Array.isArray(categoryStats) ? categoryStats : []).map(cat => (
        <View key={cat.id} style={[styles.card, darkMode && styles.cardDark]}>
          <Text style={[styles.deptName, darkMode && styles.textWhite]}>{cat.name}</Text>
          <Text style={styles.stat}>Total Complaints: {cat.complaintCount}</Text>
        </View>
      ))}

      {/* Heatmap Section */}
      <Text style={[styles.header, darkMode && styles.textWhite, { marginTop: 24 }]}>Complaint Heatmap</Text>
      <View style={{ height: 300, borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
        <MapView
          style={{ flex: 1 }}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: 23.8103,
            longitude: 90.4125,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
        >
          {heatmapPoints.length > 0 && (
            <Heatmap points={heatmapPoints} radius={40} opacity={0.7} />
          )}
        </MapView>
      </View>

      {/* PDF Export Button */}
      <TouchableOpacity style={styles.exportButton} onPress={generatePDF}>
        <Text style={styles.exportButtonText}>Export PDF Report</Text>
      </TouchableOpacity>

      {/* Export Modal (optional) */}
      <Modal visible={showExportModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text>Generating PDF...</Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  darkBg: { backgroundColor: '#111827' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, color: '#1F2937' },
  textWhite: { color: 'white' },
  card: { backgroundColor: '#F3F4F6', borderRadius: 8, padding: 16, marginBottom: 12 },
  cardDark: { backgroundColor: '#1F2937' },
  deptName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  stat: { fontSize: 15, color: '#374151' },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  metricBox: { backgroundColor: '#E5E7EB', borderRadius: 8, padding: 12, margin: 4, minWidth: 110, alignItems: 'center' },
  metricLabel: { fontSize: 12, color: '#6B7280', fontWeight: 'bold', marginBottom: 4 },
  metricValue: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  exportButton: { backgroundColor: '#1E88E5', borderRadius: 8, padding: 16, alignItems: 'center', marginVertical: 24 },
  exportButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', padding: 24, borderRadius: 12 },
});

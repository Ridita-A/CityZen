import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Dimensions,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import {
    Building2,
    MapPin,
    ArrowRight,
    TrendingUp,
    CheckCircle,
    PlusCircle,
    Eye,
} from 'lucide-react-native';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const { height, width } = Dimensions.get('window');

export default function LandingScreen({ navigation, darkMode }) {
    const [recentComplaints, setRecentComplaints] = useState([]);
    const [loadingFeed, setLoadingFeed] = useState(false);

    useEffect(() => {
        fetchRecentComplaints();
    }, []);

    const fetchRecentComplaints = async () => {
        setLoadingFeed(true);
        try {
            const response = await axios.get(`${API_URL}/api/complaints?limit=6`, {
                headers: { 'bypass-tunnel-reminder': 'true' }
            });
            setRecentComplaints(response.data.complaints?.slice(0, 3) || []);
        } catch (error) {
            console.error('Error fetching recent complaints:', error);
        } finally {
            setLoadingFeed(false);
        }
    };

    const handleSubmitComplaint = () => {
        navigation.navigate('Camera');
    };

    const ComplaintPreview = ({ complaint }) => (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
                if (complaint?.id) {
                    navigation.navigate('ComplaintDetails', { complaintId: complaint.id });
                }
            }}
            style={[styles.complaintCard, darkMode && styles.cardDark]}
        >
            <View style={styles.complaintHeader}>
                <Text style={[styles.complaintTitle, darkMode && styles.textWhite]} numberOfLines={2}>
                    {complaint?.title || 'Untitled'}
                </Text>
            </View>
            <View style={styles.complaintMeta}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MapPin size={14} color="#6B7280" />
                    <Text style={styles.metaText}>
                        {complaint?.latitude && complaint?.longitude && !isNaN(complaint.latitude) && !isNaN(complaint.longitude)
                            ? `${parseFloat(complaint.latitude).toFixed(3)}, ${parseFloat(complaint.longitude).toFixed(3)}`
                            : 'Location unknown'}
                    </Text>
                </View>
            </View>
            <View style={styles.complaintStats}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <TrendingUp size={14} color="#1E88E5" />
                    <Text style={{ color: '#1E88E5', fontSize: 12, fontWeight: '600' }}>
                        {complaint?.upvotes || 0} upvotes
                    </Text>
                </View>
                <View style={[
                    styles.statusBadge,
                    {
                        backgroundColor: complaint?.currentStatus === 'resolved' ? '#D1FAE5' : '#FEF3C7'
                    }
                ]}>
                    <Text style={[
                        styles.statusText,
                        {
                            color: complaint?.currentStatus === 'resolved' ? '#065F46' : '#92400E'
                        }
                    ]}>
                        {complaint?.currentStatus?.replace('_', ' ').toUpperCase() || 'PENDING'}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, darkMode && styles.darkContainer]}>
            <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />

            <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.logoBadge}>
                        <Building2 size={52} color="white" />
                    </View>
                    <Text style={[styles.heroTitle, { color: '#1E88E5' }]}>
                        CityZen
                    </Text>
                    <Text style={[styles.heroSubtitle, darkMode && styles.textGray]}>
                        Better City, Better Life
                    </Text>

                    <Text style={[styles.tagline, darkMode && styles.textGray]}>
                        Find out what your community is doing. Report issues. Track progress. Make change.
                    </Text>
                </View>

                {/* Primary Action Button */}
                <View style={styles.topActionSection}>
                    <TouchableOpacity
                        style={styles.submitBtn}
                        onPress={handleSubmitComplaint}
                    >
                        <PlusCircle size={22} color="white" />
                        <Text style={styles.submitBtnText}>Submit Complaint</Text>
                    </TouchableOpacity>
                </View>

                {/* Feed Preview Section */}
                <View style={styles.feedPreviewSection}>
                    <View style={styles.feedHeader}>
                        <Text style={[styles.feedTitle, darkMode && styles.textWhite]}>
                            What's Happening Now
                        </Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Feed')}
                            style={styles.viewAllBtn}
                        >
                            <Text style={styles.viewAllText}>View All</Text>
                            <ArrowRight size={16} color="#1E88E5" />
                        </TouchableOpacity>
                    </View>

                    {loadingFeed ? (
                        <ActivityIndicator
                            size="large"
                            color="#1E88E5"
                            style={{ marginVertical: 40 }}
                        />
                    ) : recentComplaints.length > 0 ? (
                        <View style={styles.complaintsList}>
                            {recentComplaints.map((complaint) => (
                                <ComplaintPreview
                                    key={complaint.id}
                                    complaint={complaint}
                                />
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Eye size={40} color="#9CA3AF" />
                            <Text style={[styles.emptyText, darkMode && styles.textGray]}>
                                No complaints yet.
                            </Text>
                            <Text style={styles.emptySubText}>
                                Be the first to report an issue!
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        onPress={() => navigation.navigate('Feed')}
                        style={[styles.browseFeedBtn, darkMode && styles.browseFeedBtnDark]}
                    >
                        <Text style={styles.browseFeedText}>Browse Full Feed</Text>
                        <ArrowRight size={18} color="#1E88E5" />
                    </TouchableOpacity>
                </View>

                {/* How It Works */}
                <View style={styles.howitWorksSection}>
                    <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>How It Works</Text>
                    <View style={styles.stepsContainer}>
                        <Step icon={PlusCircle} title="Report" desc="Submit a photo & location" color="#1E88E5" />
                        <View style={styles.stepDivider} />
                        <Step icon={TrendingUp} title="Upvote" desc="Community engagement" color="#9333EA" />
                        <View style={styles.stepDivider} />
                        <Step icon={CheckCircle} title="Resolve" desc="Issues get fixed" color="#16A34A" />
                    </View>
                </View>

                {/* Auth Buttons */}
                <View style={styles.authSection}>
                    <TouchableOpacity
                        style={styles.signInBtn}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.signInBtnText}>Sign In</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.signUpBtn, darkMode && styles.signUpBtnDark]}
                        onPress={() => navigation.navigate('Signup')}
                    >
                        <Text style={[styles.signUpBtnText, darkMode && styles.signUpBtnTextDark]}>
                            Create Account
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Text style={styles.copyright}>© 2026 Team CityZen</Text>
        </SafeAreaView>
    );
}

const Step = ({ icon: Icon, title, desc, color }) => (
    <View style={styles.step}>
        <View style={[styles.stepIcon, { backgroundColor: color + '20' }]}>
            <Icon size={24} color={color} />
        </View>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDesc}>{desc}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    darkContainer: {
        backgroundColor: '#111827',
    },
    textWhite: { color: 'white' },
    textGray: { color: '#9CA3AF' },
    cardDark: { backgroundColor: '#1F2937', borderColor: '#374151' },

    // Hero Section
    heroSection: {
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 40,
        paddingTop: 20,
    },
    logoBadge: {
        width: 80,
        height: 80,
        backgroundColor: '#1E88E5',
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: '#1E88E5',
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
    },
    heroTitle: {
        fontSize: 40,
        fontWeight: 'bold',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    heroSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '600',
        marginBottom: 16,
    },
    tagline: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '500',
    },

    // Top Action Section
    topActionSection: {
        paddingHorizontal: 16,
        marginBottom: 32,
    },
    submitBtn: {
        backgroundColor: '#1E88E5',
        flexDirection: 'row',
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        elevation: 4,
        shadowColor: '#1E88E5',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
    submitBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },

    // Feed Preview Section
    feedPreviewSection: {
        paddingHorizontal: 16,
        marginBottom: 32,
    },
    feedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    feedTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    viewAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    viewAllText: {
        color: '#1E88E5',
        fontSize: 14,
        fontWeight: '600',
    },

    // Complaint Card
    complaintsList: {
        gap: 12,
        marginBottom: 16,
    },
    complaintCard: {
        backgroundColor: 'white',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    complaintHeader: {
        marginBottom: 10,
    },
    complaintTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        lineHeight: 22,
    },
    complaintMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    metaText: {
        fontSize: 12,
        color: '#6B7280',
    },
    complaintStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 12,
    },
    emptySubText: {
        fontSize: 13,
        color: '#9CA3AF',
        marginTop: 6,
    },

    // Browse Feed Button
    browseFeedBtn: {
        backgroundColor: '#F3F4F6',
        flexDirection: 'row',
        height: 50,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    browseFeedBtnDark: {
        backgroundColor: '#1F2937',
        borderColor: '#374151',
    },
    browseFeedText: {
        color: '#1E88E5',
        fontSize: 16,
        fontWeight: '600',
    },

    // How It Works
    howitWorksSection: {
        paddingHorizontal: 16,
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
        textAlign: 'center',
    },
    stepsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    step: {
        flex: 1,
        alignItems: 'center',
    },
    stepIcon: {
        width: 56,
        height: 56,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    stepTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    stepDesc: {
        fontSize: 11,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 16,
    },
    stepDivider: {
        width: 2,
        height: 40,
        backgroundColor: '#E5E7EB',
    },

    // Auth Section
    authSection: {
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 32,
    },
    signInBtn: {
        backgroundColor: '#F3F4F6',
        height: 50,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    signInBtnText: {
        color: '#1F2937',
        fontSize: 16,
        fontWeight: '600',
    },
    signUpBtn: {
        backgroundColor: '#FFFFFF',
        height: 50,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#1E88E5',
    },
    signUpBtnDark: {
        backgroundColor: '#1F2937',
        borderColor: '#1E88E5',
    },
    signUpBtnText: {
        color: '#1E88E5',
        fontSize: 16,
        fontWeight: '600',
    },
    signUpBtnTextDark: {
        color: '#1E88E5',
    },

    // Copyright
    copyright: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
        paddingBottom: 16,
        fontWeight: '400',
    }
});

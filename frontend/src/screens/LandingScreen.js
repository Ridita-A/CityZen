import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Building2, ArrowRight, PlusCircle, MapPin, Shield, Zap } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function FeaturePill({ icon, label, darkMode, delay }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.featurePill,
        darkMode && styles.featurePillDark,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.featurePillIcon}>{icon}</View>
      <Text style={[styles.featurePillLabel, darkMode && styles.featurePillLabelDark]}>{label}</Text>
    </Animated.View>
  );
}

export default function LandingScreen({ navigation, darkMode }) {
  const insets = useSafeAreaInsets();

  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoLift = useRef(new Animated.Value(0)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(16)).current;
  const actionsOpacity = useRef(new Animated.Value(0)).current;
  const actionsSlide = useRef(new Animated.Value(20)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        delay: 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 560,
        delay: 80,
        easing: Easing.out(Easing.back(1.6)),
        useNativeDriver: true,
      }),
    ]).start();

    // Hero text entrance
    Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 420,
        delay: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(heroSlide, {
        toValue: 0,
        duration: 420,
        delay: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // Actions entrance
    Animated.parallel([
      Animated.timing(actionsOpacity, {
        toValue: 1,
        duration: 420,
        delay: 460,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(actionsSlide, {
        toValue: 0,
        duration: 420,
        delay: 460,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // Badge fade
    Animated.timing(badgeOpacity, {
      toValue: 1,
      duration: 500,
      delay: 700,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    // Floating loop
    const floating = Animated.loop(
      Animated.sequence([
        Animated.timing(logoLift, {
          toValue: -7,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(logoLift, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    floating.start();
    return () => floating.stop();
  }, []);

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.darkContainer]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

      {/* Decorative blobs */}
      <View style={[styles.blobTR, darkMode && styles.blobTRDark]} />
      <View style={[styles.blobBL, darkMode && styles.blobBLDark]} />
      <View style={[styles.blobCenter, darkMode && styles.blobCenterDark]} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(14, Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : insets.top + 8),
            paddingBottom: Math.max(28, insets.bottom + 20),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Nav */}
        <View style={styles.topRow}>
          <TouchableOpacity
            style={[styles.authBtnGhost, darkMode && styles.authBtnGhostDark]}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.82}
          >
            <Text style={[styles.authBtnGhostText, darkMode && styles.authBtnGhostTextDark]}>Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.authBtnSolid}
            onPress={() => navigation.navigate('Signup')}
            activeOpacity={0.82}
          >
            <Text style={styles.authBtnSolidText}>Get Started</Text>
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={styles.heroSection}>
          {/* Logo */}
          <Animated.View
            style={{
              opacity: logoOpacity,
              transform: [{ translateY: logoLift }, { scale: logoScale }],
              marginBottom: 24,
            }}
          >
            <View style={[styles.logoRing, darkMode && styles.logoRingDark]}>
              <View style={styles.logoWrap}>
                <Building2 size={36} color="#FFFFFF" strokeWidth={1.8} />
              </View>
            </View>
          </Animated.View>

          {/* Wordmark + tagline */}
          <Animated.View
            style={{
              opacity: heroOpacity,
              transform: [{ translateY: heroSlide }],
              alignItems: 'center',
            }}
          >
            <View style={styles.brandRow}>
              <Text style={[styles.heroTitle, darkMode && styles.heroTitleDark]}>CityZen</Text>
            </View>

            <Text style={[styles.heroSubtitle, darkMode && styles.heroSubtitleDark]}>
              Report issues. Track progress.{'\n'}Build a better city — together.
            </Text>
          </Animated.View>

          {/* Feature pills */}
          <View style={styles.pillRow}>
            <FeaturePill
              icon={<Zap size={12} color="#1E88E5" strokeWidth={2.2} />}
              label="Instant Reports"
              darkMode={darkMode}
              delay={520}
            />
            <FeaturePill
              icon={<MapPin size={12} color="#1E88E5" strokeWidth={2.2} />}
              label="Live Tracking"
              darkMode={darkMode}
              delay={620}
            />
            <FeaturePill
              icon={<Shield size={12} color="#1E88E5" strokeWidth={2.2} />}
              label="Verified"
              darkMode={darkMode}
              delay={720}
            />
          </View>
        </View>

        {/* Action Cards */}
        <Animated.View
          style={[
            styles.actionSection,
            {
              opacity: actionsOpacity,
              transform: [{ translateY: actionsSlide }],
            },
          ]}
        >
          {/* Primary CTA */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => navigation.navigate('Camera')}
            activeOpacity={0.88}
          >
            <View style={styles.submitBtnInner}>
              <View style={styles.submitIconWrap}>
                <PlusCircle size={22} color="#1E88E5" strokeWidth={2} />
              </View>
              <View style={styles.actionTextBlock}>
                <Text style={styles.submitBtnText}>Submit a Report</Text>
                <Text style={styles.submitBtnSubText}>Snap a photo & describe the issue</Text>
              </View>
            </View>
            <View style={styles.arrowWrap}>
              <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          </TouchableOpacity>

          {/* Divider label */}
          <View style={styles.orRow}>
            <View style={[styles.orLine, darkMode && styles.orLineDark]} />
            <Text style={[styles.orLabel, darkMode && styles.orLabelDark]}>or</Text>
            <View style={[styles.orLine, darkMode && styles.orLineDark]} />
          </View>

          {/* Secondary CTA */}
          <TouchableOpacity
            style={[styles.browseBtn, darkMode && styles.browseBtnDark]}
            onPress={() => navigation.navigate('Feed')}
            activeOpacity={0.88}
          >
            <View style={styles.browseIconWrap}>
              <MapPin size={20} color={darkMode ? '#D1D5DB' : '#1E88E5'} strokeWidth={2} />
            </View>
            <View style={styles.actionTextBlock}>
              <Text style={[styles.browseBtnText, darkMode && styles.browseBtnTextDark]}>Browse Local Feed</Text>
              <Text style={[styles.browseBtnSubText, darkMode && styles.browseBtnSubTextDark]}>
                See what's happening near you
              </Text>
            </View>
            <ArrowRight size={16} color={darkMode ? '#D1D5DB' : '#1E88E5'} strokeWidth={2.5} />
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <Animated.View style={[styles.footer, { opacity: badgeOpacity }]}>
          <Text style={[styles.footerStat, darkMode && styles.footerStatDark]}>
            Every report is a step toward a safer, stronger city.
          </Text>
          <Text style={styles.copyright}>© 2026 Team CityZen · All rights reserved</Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  darkContainer: {
    backgroundColor: '#111827',
  },

  // Decorative blobs
  blobTR: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: 'rgba(30, 136, 229, 0.10)',
    top: -100,
    right: -100,
  },
  blobTRDark: { backgroundColor: 'rgba(55, 65, 81, 0.35)' },
  blobBL: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
    bottom: 60,
    left: -80,
  },
  blobBLDark: { backgroundColor: 'rgba(75, 85, 99, 0.3)' },
  blobCenter: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: 'rgba(99, 179, 237, 0.07)',
    top: '38%',
    left: '55%',
  },
  blobCenterDark: { backgroundColor: 'rgba(107, 114, 128, 0.22)' },

  content: {
    flexGrow: 1,
    paddingHorizontal: 22,
  },

  // Top row
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginBottom: 4,
  },
  authBtnGhost: {
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  authBtnGhostDark: {
    backgroundColor: '#1F2937',
    borderColor: '#334155',
  },
  authBtnGhostText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  authBtnGhostTextDark: { color: '#D1D5DB' },
  authBtnSolid: {
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1E88E5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    shadowColor: '#1E88E5',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  authBtnSolidText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.15,
  },

  // Hero section
  heroSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 16,
  },

  // Logo
  logoRing: {
    width: 108,
    height: 108,
    borderRadius: 32,
    backgroundColor: 'rgba(30, 136, 229, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(30, 136, 229, 0.18)',
  },
  logoRingDark: {
    backgroundColor: 'rgba(56, 189, 248, 0.10)',
    borderColor: 'rgba(56, 189, 248, 0.18)',
  },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#1E88E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E88E5',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },

  // Brand row (title + live chip)
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 42,
    color: '#1F2937',
    fontWeight: '800',
    letterSpacing: -1.2,
  },
  heroTitleDark: { color: '#FFFFFF' },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginTop: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  liveChipText: {
    color: '#16A34A',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  heroSubtitle: {
    fontSize: 15.5,
    lineHeight: 23,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 300,
    letterSpacing: 0.05,
  },
  heroSubtitleDark: { color: '#94A3B8' },

  // Feature pills
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 22,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  featurePillDark: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
  },
  featurePillIcon: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featurePillLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: 0.1,
  },
  featurePillLabelDark: { color: '#D1D5DB' },

  // Action section
  actionSection: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    gap: 0,
    marginBottom: 20,
  },

  // Submit (primary) button
  submitBtn: {
    borderRadius: 18,
    backgroundColor: '#1E88E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingLeft: 14,
    paddingRight: 16,
    shadowColor: '#1E88E5',
    shadowOpacity: 0.30,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 7,
    marginBottom: 14,
  },
  submitBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  submitIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextBlock: { flex: 1 },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  submitBtnSubText: {
    marginTop: 2,
    color: '#BFDBFE',
    fontSize: 12,
    letterSpacing: 0.05,
  },
  arrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Or divider
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  orLineDark: { backgroundColor: '#374151' },
  orLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  orLabelDark: { color: '#9CA3AF' },

  // Browse (secondary) button
  browseBtn: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingLeft: 14,
    paddingRight: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  browseBtnDark: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
  },
  browseIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: 'rgba(30, 136, 229, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  browseBtnText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  browseBtnTextDark: { color: '#FFFFFF' },
  browseBtnSubText: {
    marginTop: 2,
    color: '#6B7280',
    fontSize: 12,
    letterSpacing: 0.05,
  },
  browseBtnSubTextDark: { color: '#9CA3AF' },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  footerStat: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  footerStatDark: { color: '#9CA3AF' },
  footerStatAccent: {
    color: '#1E88E5',
    fontWeight: '700',
  },
  copyright: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 11,
    letterSpacing: 0.1,
  },
});
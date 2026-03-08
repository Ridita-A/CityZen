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
import { Building2, ArrowRight, PlusCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LandingScreen({ navigation, darkMode }) {
  const insets = useSafeAreaInsets();
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoLift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.back(1.8)),
        useNativeDriver: true,
      }),
    ]).start();

    const floating = Animated.loop(
      Animated.sequence([
        Animated.timing(logoLift, {
          toValue: -6,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(logoLift, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    floating.start();
    return () => floating.stop();
  }, [logoLift, logoOpacity, logoScale]);

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.darkContainer]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

      <View style={[styles.bgOrbTop, darkMode && styles.bgOrbTopDark]} />
      <View style={[styles.bgOrbBottom, darkMode && styles.bgOrbBottomDark]} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(14, Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : insets.top + 8),
            paddingBottom: Math.max(26, insets.bottom + 18),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <TouchableOpacity
            style={[styles.authBtnGhost, darkMode && styles.authBtnGhostDark]}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={[styles.authBtnGhostText, darkMode && styles.authBtnGhostTextDark]}>Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.authBtnSolid}
            onPress={() => navigation.navigate('Signup')}
            activeOpacity={0.85}
          >
            <Text style={styles.authBtnSolidText}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroSection}>
          <Animated.View
            style={[
              styles.logoWrap,
              {
                opacity: logoOpacity,
                transform: [{ translateY: logoLift }, { scale: logoScale }],
              },
            ]}
          >
            <Building2 size={40} color="#FFFFFF" />
          </Animated.View>

          <Text style={[styles.heroTitle, darkMode && styles.textWhite]}>CityZen</Text>
          <Text style={[styles.heroSubtitle, darkMode && styles.textGray]}>
            Report faster. Track clearly. Improve together.
          </Text>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => navigation.navigate('Camera')}
            activeOpacity={0.9}
          >
            <View style={styles.actionTextBlock}>
              <Text style={styles.submitBtnText}>Submit Complaint</Text>
              <Text style={styles.submitBtnSubText}>Report an issue with image</Text>
            </View>
            <PlusCircle size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.browseBtn, darkMode && styles.browseBtnDark]}
            onPress={() => navigation.navigate('Feed')}
            activeOpacity={0.9}
          >
            <View style={styles.actionTextBlock}>
              <Text style={styles.browseBtnText}>Browse Feed</Text>
              <Text style={[styles.browseBtnSubText, darkMode && styles.browseBtnSubTextDark]}>
                Explore what's going on in your area
              </Text>
            </View>
            <ArrowRight size={18} color="#1E88E5" />
          </TouchableOpacity>
        </View>

        <Text style={styles.copyright}>© 2026 Team CityZen</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FBFF',
    },
    darkContainer: {
        backgroundColor: '#0F172A',
    },
    textWhite: { color: '#FFFFFF' },
    textGray: { color: '#94A3B8' },
    content: {
        flexGrow: 1,
        paddingHorizontal: 20,
    },
    bgOrbTop: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: 999,
        backgroundColor: 'rgba(30, 136, 229, 0.12)',
        top: -70,
        right: -80,
    },
    bgOrbTopDark: {
        backgroundColor: 'rgba(56, 189, 248, 0.12)',
    },
    bgOrbBottom: {
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: 999,
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        bottom: 80,
        left: -70,
    },
    bgOrbBottomDark: {
        backgroundColor: 'rgba(59, 130, 246, 0.12)',
    },
    topRow: {
        width: '100%',
        maxWidth: 420,
        alignSelf: 'center',
        flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    authBtnGhost: {
      flex: 1,
      minHeight: 46,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#BFDBFE',
        backgroundColor: '#FFFFFF',
      alignItems: 'center',
        justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    authBtnGhostDark: {
        backgroundColor: '#1E293B',
        borderColor: '#334155',
    },
    authBtnGhostText: {
        color: '#1D4ED8',
      fontSize: 13,
      fontWeight: '700',
    },
    authBtnGhostTextDark: {
        color: '#BFDBFE',
    },
    authBtnSolid: {
      flex: 1,
      minHeight: 46,
        borderRadius: 10,
        backgroundColor: '#1E88E5',
      alignItems: 'center',
        justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    authBtnSolidText: {
        color: '#FFFFFF',
      fontSize: 13,
        fontWeight: '700',
    },
    heroSection: {
        flex: 1,
        width: '100%',
        maxWidth: 420,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 44,
    },
    logoWrap: {
        width: 88,
        height: 88,
        borderRadius: 24,
        backgroundColor: '#1E88E5',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#1E88E5',
        shadowOpacity: 0.32,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 9,
        marginBottom: 18,
    },
    heroTitle: {
        fontSize: 38,
        color: '#0F172A',
        fontWeight: '800',
        letterSpacing: -0.8,
    },
    heroSubtitle: {
        marginTop: 10,
        fontSize: 15,
        lineHeight: 22,
        color: '#475569',
        textAlign: 'center',
        maxWidth: 320,
    },
    actionSection: {
        width: '100%',
        maxWidth: 420,
        alignSelf: 'center',
        gap: 12,
      marginBottom: 24,
    },
    submitBtn: {
      minHeight: 62,
        borderRadius: 14,
        backgroundColor: '#1E88E5',
        flexDirection: 'row',
        alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      gap: 10,
        shadowColor: '#1E88E5',
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        elevation: 4,
    },
    submitBtnText: {
        color: '#FFFFFF',
      fontSize: 16,
        fontWeight: '700',
    },
    submitBtnSubText: {
      marginTop: 2,
      color: 'rgba(255,255,255,0.86)',
      fontSize: 12,
    },
    actionTextBlock: {
      flex: 1,
      paddingRight: 10,
    },
    browseBtn: {
      minHeight: 62,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#DBEAFE',
        flexDirection: 'row',
        alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      gap: 10,
    },
    browseBtnDark: {
        backgroundColor: '#1E293B',
        borderColor: '#334155',
    },
    browseBtnText: {
        color: '#1E88E5',
      fontSize: 16,
        fontWeight: '600',
    },
    browseBtnSubText: {
      marginTop: 2,
      color: '#475569',
      fontSize: 12,
    },
    browseBtnSubTextDark: {
      color: '#94A3B8',
    },
    copyright: {
        marginTop: 'auto',
        textAlign: 'center',
        color: '#94A3B8',
        fontSize: 12,
        paddingTop: 10,
    },
});

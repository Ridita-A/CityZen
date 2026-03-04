import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Building2, ShieldCheck } from 'lucide-react-native';
import { useNotification } from '../context/NotificationContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function EmailOtpScreen({ route, navigation }) {
  const { refreshUser } = useNotification();
  const { purpose, challengeId, email, firebaseUid, signupPayload } = route.params || {};

  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');

  const goToRoleHome = (user) => {
    const selectedRole = user?.role || signupPayload?.role || 'citizen';
    if (selectedRole === 'admin') {
      navigation.reset({ index: 0, routes: [{ name: 'AdminDashboard' }] });
    } else if (selectedRole === 'authority') {
      navigation.reset({ index: 0, routes: [{ name: 'AuthorityDashboard' }] });
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'HomeScreen' }] });
    }
  };

  const persistUserSession = async (user) => {
    const authorityCompanyId =
      user?.authorityCompanyId ??
      user?.companyId ??
      user?.Authority?.authorityCompanyId ??
      user?.authority?.authorityCompanyId ??
      null;

    const normalizedUserData = {
      ...user,
      authorityCompanyId: authorityCompanyId ?? undefined,
      companyId: authorityCompanyId ?? undefined,
    };

    const tokenUid = normalizedUserData?.firebaseUid || firebaseUid || signupPayload?.firebaseUid;

    await AsyncStorage.setItem('userData', JSON.stringify(normalizedUserData));
    if (tokenUid) {
      await AsyncStorage.setItem('userToken', tokenUid);
    }

    if (normalizedUserData.role === 'authority' && authorityCompanyId != null) {
      await AsyncStorage.setItem('authorityCompanyId', String(authorityCompanyId));
    }

    if (refreshUser) {
      await refreshUser();
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setError('Please enter OTP.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await axios.post(`${API_URL}/api/auth/otp/verify`, {
        challengeId,
        otp: otp.trim(),
      }, {
        headers: {
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true',
        }
      });

      const user = response.data?.user;
      if (!user) {
        throw new Error('User data missing after OTP verification.');
      }

      await persistUserSession(user);
      goToRoleHome(user);
    } catch (verifyError) {
      const message = verifyError?.response?.data?.message || verifyError?.message || 'OTP verification failed.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setIsResending(true);

    try {
      if (purpose === 'signup') {
        const response = await axios.post(`${API_URL}/api/auth/signup/request-otp`, signupPayload, {
          headers: {
            'Content-Type': 'application/json',
            'bypass-tunnel-reminder': 'true',
          }
        });

        navigation.setParams({
          challengeId: response.data?.challengeId,
          email: response.data?.email || email,
        });
      } else {
        const response = await axios.post(`${API_URL}/api/auth/login/request-otp`, {
          firebaseUid,
        }, {
          headers: {
            'Content-Type': 'application/json',
            'bypass-tunnel-reminder': 'true',
          }
        });

        navigation.setParams({
          challengeId: response.data?.challengeId,
          email: response.data?.email || email,
        });
      }
    } catch (resendError) {
      const message = resendError?.response?.data?.message || 'Failed to resend OTP.';
      setError(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.card}>
        <View style={styles.headerSimple}>
          <Building2 size={40} color="#1E88E5" />
          <Text style={styles.headerSimpleText}>CityZen</Text>
        </View>

        <View style={styles.badgeRow}>
          <ShieldCheck size={20} color="#1E88E5" />
          <Text style={styles.badgeText}>2-Factor Verification</Text>
        </View>

        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>An email has been sent to {email || 'your email'}.</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter 6-digit OTP"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
        />

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.verifyButton, isSubmitting && styles.disabledButton]}
          onPress={handleVerifyOtp}
          disabled={isSubmitting}
        >
          {isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.verifyButtonText}>Verify OTP</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResendOtp}
          disabled={isResending || isSubmitting}
        >
          {isResending ? <ActivityIndicator color="#1E88E5" /> : <Text style={styles.resendButtonText}>Resend OTP</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
  },
  headerSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  headerSimpleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E88E5',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  badgeText: {
    color: '#1E88E5',
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 6,
    marginBottom: 10,
  },
  errorText: {
    color: '#B91C1C',
    textAlign: 'center',
    marginBottom: 8,
  },
  verifyButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#1E88E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  resendButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    height: 44,
  },
  resendButtonText: {
    color: '#1E88E5',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
});

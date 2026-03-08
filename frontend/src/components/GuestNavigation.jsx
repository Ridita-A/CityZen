import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Building2, LogIn, UserPlus } from 'lucide-react-native';

export default function GuestNavigation({ navigation, darkMode }) {
  return (
    <View style={[styles.headerContainer, darkMode && styles.darkBg]}>
      <View style={styles.contentRow}>
        {/* Logo */}
        <TouchableOpacity
          onPress={() => navigation?.navigate('Landing')}
          style={styles.logoContainer}
        >
          <Building2 size={28} color="#1E88E5" />
          <Text style={styles.logoText}>CityZen</Text>
        </TouchableOpacity>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.loginButton]}
            onPress={() => navigation?.navigate('Login')}
          >
            <LogIn size={18} color="#1E88E5" />
            <Text style={styles.loginText}>Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.signupButton]}
            onPress={() => navigation?.navigate('Signup')}
          >
            <UserPlus size={18} color="white" />
            <Text style={styles.signupText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: 'white',
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  darkBg: {
    backgroundColor: '#1F2937',
    borderBottomColor: '#374151',
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E88E5',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  loginButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1E88E5',
  },
  loginText: {
    color: '#1E88E5',
    fontSize: 14,
    fontWeight: '600',
  },
  signupButton: {
    backgroundColor: '#1E88E5',
  },
  signupText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

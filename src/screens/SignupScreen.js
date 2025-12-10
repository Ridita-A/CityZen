import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, 
  StyleSheet, KeyboardAvoidingView, Platform, Alert 
} from 'react-native';
import { User, Mail, Lock, MapPin, Building2, ShieldCheck, CheckSquare, Square, Briefcase, Key, CheckCircle } from 'lucide-react-native';

export default function SignupScreen({ navigation }) {
  const [step, setStep] = useState(1); // 1: Role, 2: Form, 3: Success
  const [role, setRole] = useState('citizen');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    ward: '', department: '', adminCode: ''
  });

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      // Simple Validation
      if (!formData.email || !formData.password) {
        Alert.alert('Missing Fields', 'Please fill in all required fields');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
      if (!agreeTerms) {
        Alert.alert('Terms', 'You must agree to the Terms & Privacy Policy');
        return;
      }
      // Simulate API call success
      setStep(3);
    }
  };

  const renderRoleSelection = () => (
    <View>
      <Text style={styles.stepTitle}>Choose your Role</Text>
      {['citizen', 'authority', 'admin'].map((r) => (
        <TouchableOpacity 
          key={r} 
          onPress={() => setRole(r)}
          style={[styles.roleCard, role === r && styles.roleCardActive]}
        >
          <View style={[styles.iconCircle, role === r && { backgroundColor: '#1E88E5' }]}>
            {r === 'citizen' && <User size={24} color={role === r ? 'white' : '#6B7280'} />}
            {r === 'authority' && <Briefcase size={24} color={role === r ? 'white' : '#6B7280'} />}
            {r === 'admin' && <ShieldCheck size={24} color={role === r ? 'white' : '#6B7280'} />}
          </View>
          <View>
            <Text style={[styles.roleTitle, role === r && { color: '#1E88E5' }]}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </Text>
            <Text style={styles.roleDesc}>
              {r === 'citizen' ? 'Report issues & track progress.' : 
               r === 'authority' ? 'Resolve complaints in your area.' : 
               'Manage users and moderation.'}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
      <TouchableOpacity onPress={handleNext} style={styles.submitBtn}>
        <Text style={styles.submitBtnText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderForm = () => (
    <View>
      <Text style={styles.stepTitle}>Create {role.charAt(0).toUpperCase() + role.slice(1)} Account</Text>
      
      {/* Common Fields */}
      <View style={styles.inputWrapper}><User size={20} color="#9CA3AF" /><TextInput style={styles.input} placeholder="Full Name" onChangeText={t => setFormData({...formData, fullName: t})} /></View>
      
      {/* Role Specific Fields */}
      {role === 'admin' ? (
        <View style={styles.inputWrapper}><Key size={20} color="#9CA3AF" /><TextInput style={styles.input} placeholder="Admin Code (Secure)" secureTextEntry onChangeText={t => setFormData({...formData, adminCode: t})} /></View>
      ) : null}

      {role === 'authority' ? (
        <View style={styles.inputWrapper}><Briefcase size={20} color="#9CA3AF" /><TextInput style={styles.input} placeholder="Department (e.g. WASA)" onChangeText={t => setFormData({...formData, department: t})} /></View>
      ) : null}

      <View style={styles.inputWrapper}><Mail size={20} color="#9CA3AF" /><TextInput style={styles.input} placeholder={role === 'authority' ? "Official Email / ID" : "Email Address"} keyboardType="email-address" onChangeText={t => setFormData({...formData, email: t})} /></View>
      
      {role !== 'admin' && (
        <View style={styles.inputWrapper}><MapPin size={20} color="#9CA3AF" /><TextInput style={styles.input} placeholder="Ward / Area" onChangeText={t => setFormData({...formData, ward: t})} /></View>
      )}

      <View style={styles.inputWrapper}><Lock size={20} color="#9CA3AF" /><TextInput style={styles.input} placeholder="Password" secureTextEntry onChangeText={t => setFormData({...formData, password: t})} /></View>
      <View style={styles.inputWrapper}><Lock size={20} color="#9CA3AF" /><TextInput style={styles.input} placeholder="Confirm Password" secureTextEntry onChangeText={t => setFormData({...formData, confirmPassword: t})} /></View>

      {role === 'citizen' && (
        <Text style={styles.privacyNote}>🔒 Your identity is hidden from public view.</Text>
      )}

      {/* Terms Checkbox */}
      <TouchableOpacity onPress={() => setAgreeTerms(!agreeTerms)} style={styles.checkboxContainer}>
        {agreeTerms ? <CheckSquare size={20} color="#1E88E5" /> : <Square size={20} color="#9CA3AF" />}
        <Text style={styles.checkboxText}>I agree to the Terms & Privacy Policy</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleNext} style={styles.submitBtn}>
        <Text style={styles.submitBtnText}>Sign Up</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => setStep(1)} style={{alignItems: 'center', marginTop: 16}}>
        <Text style={{color: '#6B7280'}}>Back to Role Selection</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.successContainer}>
      <CheckCircle size={80} color="#16A34A" />
      <Text style={styles.successTitle}>Account Created!</Text>
      <Text style={styles.successSub}>Your {role} account has been successfully created. You can now log in.</Text>
      
      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.submitBtn}>
        <Text style={styles.submitBtnText}>Go to Login</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: 'white', padding: 24 }}>
        <View style={styles.headerSimple}>
          <Building2 size={40} color="#1E88E5" />
          <Text style={styles.headerSimpleText}>CityZen</Text>
        </View>

        {step === 1 && renderRoleSelection()}
        {step === 2 && renderForm()}
        {step === 3 && renderSuccess()}

        {step !== 3 && (
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
            <Text style={{ color: '#6B7280' }}>Already have an account? <Text style={{ color: '#1E88E5', fontWeight: 'bold' }}>Log in</Text></Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerSimple: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32, marginTop: 40, gap: 8 },
  headerSimpleText: { fontSize: 24, fontWeight: 'bold', color: '#1E88E5' },
  stepTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 24, textAlign: 'center' },
  roleCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12, gap: 16 },
  roleCardActive: { borderColor: '#1E88E5', backgroundColor: '#EFF6FF' },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  roleTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151' },
  roleDesc: { fontSize: 12, color: '#6B7280' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, height: 50, marginBottom: 16 },
  input: { flex: 1, marginLeft: 12, fontSize: 16, color: '#1F2937' },
  privacyNote: { fontSize: 12, color: '#6B7280', marginBottom: 16, fontStyle: 'italic', textAlign: 'center' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, justifyContent: 'center', gap: 8 },
  checkboxText: { color: '#4B5563' },
  submitBtn: { backgroundColor: '#1E88E5', borderRadius: 12, height: 56, alignItems: 'center', justifyContent: 'center', elevation: 4, width: '100%' },
  submitBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  loginLink: { marginTop: 24, alignItems: 'center' },
  successContainer: { alignItems: 'center', justifyContent: 'center', flex: 1, paddingVertical: 40 },
  successTitle: { fontSize: 28, fontWeight: 'bold', color: '#1F2937', marginTop: 24, marginBottom: 8 },
  successSub: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 32 },
});
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { adminMobileApi, getFriendlyErrorMessage } from '../services/adminApi';

interface AdminLoginScreenProps {
  onLoginSuccess: (user: any) => void;
}

export const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fillDemo = () => {
    setEmail('admin@vidya.test');
    setPassword('AdminDemo1!');
    setErrorMessage('');
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const data = await adminMobileApi.login(email.trim(), password);
      onLoginSuccess(data?.user || { email, role: 'ADMIN' });
    } catch (err: any) {
      const friendly = getFriendlyErrorMessage(err, 'Incorrect email or password. Please try again.');
      setErrorMessage(friendly);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* Logo Badge */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <Image
                source={require('../../assets/app-images/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appTitle}>Vidya Admin</Text>
            <Text style={styles.appSubtitle}>
              AP SCERT Academic Management Portal
            </Text>
          </View>

          {/* Error Message Banner */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={20} color={Colors.error} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Admin Email Address</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="mail-outline" size={20} color={Colors.textPlaceholder} />
                <TextInput
                  style={styles.input}
                  placeholder="admin@vidya.test"
                  placeholderTextColor={Colors.textPlaceholder}
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    setErrorMessage('');
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Admin Password</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="lock-outline" size={20} color={Colors.textPlaceholder} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.textPlaceholder}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    setErrorMessage('');
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color={Colors.textPlaceholder}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Demo Credentials Button */}
            <TouchableOpacity style={styles.demoButton} onPress={fillDemo}>
              <MaterialIcons name="auto-fix-high" size={16} color={Colors.primary} />
              <Text style={styles.demoButtonText}>Fill Demo Admin (admin@vidya.test)</Text>
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Sign In to Admin Portal</Text>
                  <MaterialIcons name="arrow-forward" size={18} color={Colors.white} />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <MaterialIcons name="verified-user" size={16} color={Colors.success} />
            <Text style={styles.footerText}>
              Restricted to authorized teachers & academic administrators
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.softWarm,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    gap: 18,
  },
  logoContainer: {
    alignItems: 'center',
    gap: 6,
  },
  logoBox: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.borderAccent,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    marginBottom: 6,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  appSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.errorBg,
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.error,
  },
  form: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.softWarm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.palePeach,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
  },
  demoButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.softWarm,
  },
  footerText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    flex: 1,
  },
});

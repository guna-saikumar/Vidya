import React, { useState, useRef } from 'react';
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
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const passwordInputRef = useRef<any>(null);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = () => {
    let isValid = true;
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setEmailError('Administrator email is required.');
      isValid = false;
    } else if (!EMAIL_REGEX.test(cleanEmail)) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    } else {
      setEmailError(null);
    }

    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    } else if (password.length < 4) {
      setPasswordError('Password must be at least 4 characters.');
      isValid = false;
    } else {
      setPasswordError(null);
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validate()) {
      setErrorMessage('Please enter your administrator email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setEmailError(null);
    setPasswordError(null);

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
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardWrapper}>
          {/* Brand Header */}
          <View style={styles.brandHeader}>
            <View style={styles.logoBox}>
              <Image
                source={require('../../assets/app-images/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandTitle}>Vidya Admin</Text>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>ADMIN PORTAL &bull; AP SCERT</Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <View style={styles.cardTitleWrap}>
              <Text style={styles.cardTitle}>Sign In</Text>
              <Text style={styles.cardSubtitle}>
                Enter your credentials to manage books, alerts & enrolled students.
              </Text>
            </View>

            {/* Error Banner */}
            {errorMessage ? (
              <View style={styles.errorAlert}>
                <MaterialIcons name="error-outline" size={18} color={Colors.error} />
                <Text style={styles.errorAlertText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Admin Email</Text>
                {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
              </View>
              <View style={[styles.inputWrapper, emailError ? styles.inputWrapperError : null]}>
                <MaterialIcons
                  name="mail-outline"
                  size={18}
                  color={emailError ? Colors.error : Colors.textSecondary}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your admin email"
                  placeholderTextColor={Colors.textPlaceholder}
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    if (emailError) setEmailError(null);
                    if (errorMessage) setErrorMessage('');
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password</Text>
                {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
              </View>
              <View style={[styles.inputWrapper, passwordError ? styles.inputWrapperError : null]}>
                <MaterialIcons
                  name="lock-outline"
                  size={18}
                  color={passwordError ? Colors.error : Colors.textSecondary}
                />
                <TextInput
                  ref={passwordInputRef}
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.textPlaceholder}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (passwordError) setPasswordError(null);
                    if (errorMessage) setErrorMessage('');
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={18}
                    color={Colors.textPlaceholder}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
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

            <View style={styles.cardFooter}>
              <MaterialIcons name="verified-user" size={14} color={Colors.success} />
              <Text style={styles.cardFooterText}>
                Authorized access only &bull; AP SCERT 2026–27
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: Colors.palePeach,
    borderWidth: 1,
    borderColor: '#F2DED3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: Colors.textPrimary,
  },
  badgePill: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 99,
    backgroundColor: Colors.palePeach,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 16,
  },
  cardTitleWrap: {
    gap: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
  },
  errorAlertText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#B91C1C',
    lineHeight: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  fieldError: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  inputWrapperError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  eyeBtn: {
    padding: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    marginTop: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.softWarm,
  },
  cardFooterText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});

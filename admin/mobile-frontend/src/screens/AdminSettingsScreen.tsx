import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import {
  adminAxios,
  DEFAULT_TOKEN,
  adminMobileApi,
  getFriendlyErrorMessage,
  ADMIN_TOKEN_KEY,
  ADMIN_API_URL_KEY,
  ADMIN_USER_KEY,
} from '../services/adminApi';

interface AdminSettingsScreenProps {
  onLogout?: () => void;
}

export const AdminSettingsScreen: React.FC<AdminSettingsScreenProps> = ({ onLogout }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [apiUrl, setApiUrl] = useState('');
  const [token, setToken] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const user = await adminMobileApi.getCurrentUser();
        setCurrentUser(user);
        const storedUrl = await AsyncStorage.getItem(ADMIN_API_URL_KEY);
        const storedToken = await AsyncStorage.getItem(ADMIN_TOKEN_KEY);
        setApiUrl(storedUrl || adminAxios.defaults.baseURL || 'http://localhost:4000');
        setToken(storedToken || DEFAULT_TOKEN);
      } catch (err) {
        console.warn('Failed to load settings', err);
      }
    })();
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await adminAxios.get('/api/v1/admin/overview', {
        baseURL: apiUrl.trim(),
        headers: { 'x-admin-token': token.trim() },
        timeout: 8000,
      });
      setTestResult({
        ok: true,
        message: `Connected successfully! Found ${res.data?.totalStudents ?? 0} students and ${res.data?.totalStudyMaterials ?? 0} books.`,
      });
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: getFriendlyErrorMessage(err, 'Unable to connect to the server. Please check your network and endpoint.'),
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem(ADMIN_API_URL_KEY, apiUrl.trim());
      await AsyncStorage.setItem(ADMIN_TOKEN_KEY, token.trim());
      adminAxios.defaults.baseURL = apiUrl.trim();
      Alert.alert('Settings Saved', 'Connection parameters updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', getFriendlyErrorMessage(err));
    }
  };

  const handleReset = async () => {
    try {
      await AsyncStorage.removeItem(ADMIN_API_URL_KEY);
      await AsyncStorage.removeItem(ADMIN_TOKEN_KEY);
      setApiUrl('http://localhost:4000');
      setToken(DEFAULT_TOKEN);
      setTestResult(null);
      Alert.alert('Reset Complete', 'Default API settings restored.');
    } catch (err: any) {
      Alert.alert('Error', getFriendlyErrorMessage(err));
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out from the Admin Portal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await adminMobileApi.logout();
          onLogout?.();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Current Admin Account Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: Colors.palePeach }]}>
            <MaterialIcons name="person" size={24} color={Colors.primary} />
          </View>
          <View style={styles.userMeta}>
            <Text style={styles.cardTitle}>{currentUser?.name || 'Academic Administrator'}</Text>
            <Text style={styles.cardSubtitle}>{currentUser?.email || 'admin@vidya.test'}</Text>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>ADMIN</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialIcons name="logout" size={18} color={Colors.error} />
          <Text style={styles.logoutBtnText}>Sign Out of Admin Portal</Text>
        </TouchableOpacity>
      </View>

      {/* Connection Config Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <MaterialIcons name="dns" size={22} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.cardTitle}>Backend Server Connection</Text>
            <Text style={styles.cardSubtitle}>Configure local or LAN server endpoint</Text>
          </View>
        </View>

        <Text style={styles.label}>NestJS API Base URL</Text>
        <TextInput
          style={styles.input}
          value={apiUrl}
          onChangeText={setApiUrl}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="http://localhost:4000"
          placeholderTextColor={Colors.textPlaceholder}
        />
        <Text style={styles.hint}>
          On Android emulator use http://10.0.2.2:4000. On physical devices use your LAN IP.
        </Text>

        <Text style={styles.label}>Admin Authorization Secret</Text>
        <TextInput
          style={styles.input}
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          placeholder="vidya-admin-secret"
          placeholderTextColor={Colors.textPlaceholder}
        />

        {testResult && (
          <View style={[styles.testBox, testResult.ok ? styles.testSuccess : styles.testError]}>
            <MaterialIcons
              name={testResult.ok ? 'check-circle' : 'error'}
              size={18}
              color={testResult.ok ? Colors.success : Colors.error}
            />
            <Text style={[styles.testText, { color: testResult.ok ? Colors.success : Colors.error }]}>
              {testResult.message}
            </Text>
          </View>
        )}

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.btn, styles.testBtn]}
            onPress={handleTestConnection}
            disabled={testing}
          >
            {testing ? (
              <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
              <>
                <MaterialIcons name="network-check" size={18} color={Colors.primary} />
                <Text style={styles.testBtnText}>Test Server</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleSave}>
            <MaterialIcons name="save" size={18} color={Colors.white} />
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetBtnText}>Restore Defaults</Text>
        </TouchableOpacity>
      </View>

      {/* System Status Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: Colors.accentGoldBg }]}>
            <MaterialIcons name="info-outline" size={22} color={Colors.accentGold} />
          </View>
          <View>
            <Text style={styles.cardTitle}>Vidya System Info</Text>
            <Text style={styles.cardSubtitle}>Application & curriculum details</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>App Name</Text>
          <Text style={styles.infoVal}>Vidya Admin Mobile</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Version</Text>
          <Text style={styles.infoVal}>1.0.0 (Build 2026.11)</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Curriculum</Text>
          <Text style={styles.infoVal}>AP SCERT 2026–27</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Backend Framework</Text>
          <Text style={styles.infoVal}>NestJS v11 + Fastify v5</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Database</Text>
          <Text style={styles.infoVal}>PostgreSQL 17 (Raw pg SQL)</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceSoft },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.white,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  userMeta: { flex: 1 },
  roleBadge: {
    backgroundColor: Colors.palePeach,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.primary },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.errorBg,
    marginTop: 4,
  },
  logoutBtnText: { color: Colors.error, fontSize: 14, fontWeight: '700' },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.palePeach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  cardSubtitle: { fontSize: 12, color: Colors.textSecondary },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginTop: 4 },
  input: {
    backgroundColor: Colors.softWarm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  hint: { fontSize: 11, color: Colors.textMuted },
  testBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  testSuccess: { backgroundColor: Colors.successBg, borderColor: Colors.success },
  testError: { backgroundColor: Colors.errorBg, borderColor: Colors.error },
  testText: { fontSize: 12, fontWeight: '700', flex: 1 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  testBtn: { backgroundColor: Colors.palePeach },
  testBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  saveBtn: { backgroundColor: Colors.primary },
  saveBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  resetBtn: { alignItems: 'center', paddingVertical: 6 },
  resetBtnText: { color: Colors.textMuted, fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.softWarm,
  },
  infoKey: { fontSize: 13, color: Colors.textSecondary },
  infoVal: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
});

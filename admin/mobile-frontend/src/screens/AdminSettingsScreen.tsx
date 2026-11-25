import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { adminMobileApi } from '../services/adminApi';

interface AdminSettingsScreenProps {
  onLogout?: () => void;
}

export const AdminSettingsScreen: React.FC<AdminSettingsScreenProps> = ({ onLogout }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const user = await adminMobileApi.getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        console.warn('Failed to load admin profile', err);
      }
    })();
  }, []);

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Administrator Profile Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>
              {currentUser?.name ? currentUser.name[0].toUpperCase() : 'A'}
            </Text>
          </View>
          <View style={styles.userMeta}>
            <Text style={styles.userName}>{currentUser?.name || 'Academic Administrator'}</Text>
            <Text style={styles.userEmail}>{currentUser?.email || 'admin@vidya.test'}</Text>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>ADMIN</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Authority Board</Text>
          <Text style={styles.infoVal}>AP SCERT</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Academic Year</Text>
          <Text style={styles.infoVal}>2026–2027</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Session Status</Text>
          <View style={styles.statusPill}>
            <MaterialIcons name="verified-user" size={13} color={Colors.success} />
            <Text style={styles.statusPillText}>Authorized</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <MaterialIcons name="logout" size={18} color={Colors.error} />
          <Text style={styles.logoutBtnText}>Sign Out of Admin Portal</Text>
        </TouchableOpacity>
      </View>

      {/* Academic Coverage Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: Colors.palePeach }]}>
            <MaterialIcons name="school" size={22} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.cardTitle}>Curriculum Scope</Text>
            <Text style={styles.cardSubtitle}>Government of Andhra Pradesh</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Covered Classes</Text>
          <Text style={styles.infoVal}>Classes 6, 7, 8, 9, 10</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Medium of Study</Text>
          <Text style={styles.infoVal}>Telugu & English Medium</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Material Types</Text>
          <Text style={styles.infoVal}>PDF Textbooks & Notes</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Push Broadcasts</Text>
          <Text style={styles.infoVal}>Active</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceSoft },
  content: { padding: 18, gap: 16, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  avatarBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.palePeach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMeta: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  userEmail: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  cardSubtitle: { fontSize: 12, color: Colors.textSecondary },
  roleBadge: {
    backgroundColor: Colors.palePeach,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.primary },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.softWarm,
  },
  infoKey: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  infoVal: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  statusPillText: { fontSize: 11, fontWeight: '700', color: Colors.success },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.errorBg,
    marginTop: 8,
  },
  logoutBtnText: { color: Colors.error, fontSize: 14, fontWeight: '700' },
});

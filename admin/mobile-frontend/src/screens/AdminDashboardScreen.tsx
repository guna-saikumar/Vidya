import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { adminMobileApi } from '../services/adminApi';

export const AdminDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await adminMobileApi.getOverview();
      setStats(data);
    } catch (err) {
      console.warn('Could not load admin stats', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading Admin Overview...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      keyboardShouldPersistTaps="handled"
    >
      {/* Welcome Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerHeader}>
          <View style={styles.logoBadge}>
            <Image
              source={require('../../assets/app-images/logo.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
          </View>
          <View style={styles.bannerTextCol}>
            <View style={styles.badgeRow}>
              <MaterialIcons name="verified-user" size={13} color={Colors.primary} />
              <Text style={styles.badgeText}>AP SCERT 2026–27 &bull; ADMIN</Text>
            </View>
            <Text style={styles.bannerTitle}>Academic Management</Text>
          </View>
        </View>
        <Text style={styles.bannerSub}>
          Live status of textbooks, student registrations & push alerts
        </Text>
      </View>

      {/* KPI 2x2 Grid */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconBox, { backgroundColor: Colors.palePeach }]}>
            <MaterialIcons name="people" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.kpiValue}>{stats?.totalStudents || 0}</Text>
          <Text style={styles.kpiLabel}>Enrolled Students</Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconBox, { backgroundColor: Colors.successBg }]}>
            <MaterialIcons name="menu-book" size={24} color={Colors.success} />
          </View>
          <Text style={styles.kpiValue}>{stats?.totalStudyMaterials || 0}</Text>
          <Text style={styles.kpiLabel}>PDF Books / Notes</Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconBox, { backgroundColor: Colors.accentGoldBg }]}>
            <MaterialIcons name="campaign" size={24} color={Colors.accentGold} />
          </View>
          <Text style={styles.kpiValue}>Push Alerts</Text>
          <Text style={styles.kpiLabel}>Broadcast System</Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconBox, { backgroundColor: Colors.errorBg }]}>
            <MaterialIcons name="support-agent" size={24} color={Colors.error} />
          </View>
          <Text style={styles.kpiValue}>{stats?.openComplaints || 0}</Text>
          <Text style={styles.kpiLabel}>Open Tickets</Text>
        </View>
      </View>

      {/* Quick Actions Row */}
      <Text style={styles.sectionHeading}>Quick Actions</Text>
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Alerts')}
        >
          <MaterialIcons name="send" size={20} color={Colors.white} />
          <Text style={styles.actionButtonText}>Send Alert</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: Colors.palePeach }]}
          onPress={() => navigation.navigate('Books')}
        >
          <MaterialIcons name="book" size={20} color={Colors.primary} />
          <Text style={[styles.actionButtonText, { color: Colors.primary }]}>
            Books Library
          </Text>
        </TouchableOpacity>
      </View>

      {/* Grade Distribution */}
      <Text style={styles.sectionHeading}>Enrollment by Grade</Text>
      <View style={styles.cardContainer}>
        {[6, 7, 8, 9, 10].map((grade) => {
          const item = stats?.gradeDistribution?.find((g: any) => g.grade === grade);
          const count = item ? item.count : 0;
          return (
            <View key={grade} style={styles.gradeRow}>
              <Text style={styles.gradeText}>Class {grade}</Text>
              <View style={styles.gradeBarTrack}>
                <View
                  style={[
                    styles.gradeBarFill,
                    { width: `${Math.min(100, Math.max(8, (count / (stats?.totalStudents || 1)) * 100))}%` },
                  ]}
                />
              </View>
              <Text style={styles.gradeCountText}>{count} students</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceSoft },
  content: { padding: 18, gap: 16, paddingBottom: 40 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  banner: {
    backgroundColor: Colors.white,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bannerHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: { width: '100%', height: '100%' },
  bannerTextCol: { flex: 1 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  badgeText: { fontSize: 11, fontWeight: '800', color: Colors.primary },
  bannerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  bannerSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpiCard: {
    width: '48%',
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 4,
  },
  kpiIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  kpiValue: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginTop: 4 },
  kpiLabel: { fontSize: 11, fontWeight: '600', color: Colors.textMuted },
  sectionHeading: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginTop: 8 },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: Colors.primary,
  },
  actionButtonText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  cardContainer: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  gradeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  gradeText: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, width: 60 },
  gradeBarTrack: { flex: 1, height: 8, backgroundColor: Colors.softWarm, borderRadius: 99, overflow: 'hidden' },
  gradeBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 99 },
  gradeCountText: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, width: 70, textAlign: 'right' },
});

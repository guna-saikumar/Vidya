import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { adminMobileApi } from '../services/adminApi';

export const AdminBooksScreen: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    adminMobileApi.getClasses().then((data) => {
      setClasses(data || []);
    });
  }, []);

  const loadMaterials = useCallback(async () => {
    try {
      const params: any = { limit: 30 };
      if (selectedClassId) params.classId = selectedClassId;
      const res = await adminMobileApi.getMaterials(params);
      setMaterials(res.items || []);
    } catch (err) {
      console.warn('Failed to load books', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMaterials();
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Delete Material', `Are you sure you want to remove "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminMobileApi.deleteMaterial(id);
            loadMaterials();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Class filter strip */}
      <View style={styles.filterStrip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
          <TouchableOpacity
            style={[styles.filterChip, !selectedClassId && styles.filterChipActive]}
            onPress={() => setSelectedClassId('')}
          >
            <Text style={[styles.filterChipText, !selectedClassId && styles.filterChipTextActive]}>
              All Classes
            </Text>
          </TouchableOpacity>
          {classes.map((cls) => (
            <TouchableOpacity
              key={cls.id}
              style={[styles.filterChip, selectedClassId === cls.id && styles.filterChipActive]}
              onPress={() => setSelectedClassId(cls.id)}
            >
              <Text style={[styles.filterChipText, selectedClassId === cls.id && styles.filterChipTextActive]}>
                {cls.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Materials List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading books...</Text>
        </View>
      ) : materials.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialIcons name="menu-book" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No study materials found</Text>
          <Text style={styles.emptySub}>Upload materials via Admin Web Portal</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.materialsList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          keyboardShouldPersistTaps="handled"
        >
          {materials.map((item) => (
            <View key={item.id} style={styles.materialCard}>
              <View style={styles.materialIcon}>
                <MaterialIcons name="picture-as-pdf" size={24} color={Colors.primary} />
              </View>

              <View style={styles.materialContent}>
                <Text style={styles.materialTitle}>{item.title}</Text>
                <Text style={styles.materialMeta}>
                  {item.className || `Class ${item.classId}`} &bull; {item.subjectName || item.subjectId}
                </Text>
                <Text style={styles.materialFile}>
                  {(item.byteSize / (1024 * 1024)).toFixed(1)} MB &bull; {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id, item.title)}
              >
                <MaterialIcons name="delete-outline" size={20} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceSoft },
  filterStrip: { backgroundColor: Colors.white, paddingVertical: 10, borderBottomWidth: 1, borderColor: Colors.border },
  filterList: { paddingHorizontal: 16, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    backgroundColor: Colors.softWarm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.white },
  materialsList: { padding: 16, gap: 10, paddingBottom: 40 },
  materialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  materialIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.palePeach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialContent: { flex: 1 },
  materialTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  materialMeta: { fontSize: 12, fontWeight: '600', color: Colors.primary, marginTop: 2 },
  materialFile: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  deleteButton: { padding: 8, borderRadius: 8, backgroundColor: Colors.errorBg },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 },
  loadingText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  emptySub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
});

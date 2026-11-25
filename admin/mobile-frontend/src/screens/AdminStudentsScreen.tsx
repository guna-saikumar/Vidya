import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { adminMobileApi } from '../services/adminApi';

export const AdminStudentsScreen: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);

  const loadStudents = useCallback(async () => {
    try {
      const params: any = { limit: 50 };
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (selectedGrade !== null) params.grade = selectedGrade;
      const res = await adminMobileApi.getStudents(params);
      setStudents(res.items || res || []);
    } catch (err) {
      console.warn('Failed to load students', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedGrade]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStudents();
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Remove Student', `Are you sure you want to delete "${name}"? This action cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminMobileApi.deleteStudent(id);
            loadStudents();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchStrip}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color={Colors.textPlaceholder} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by student name or email..."
            placeholderTextColor={Colors.textPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Grade Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gradeChips}>
          <TouchableOpacity
            style={[styles.chip, selectedGrade === null && styles.chipActive]}
            onPress={() => setSelectedGrade(null)}
          >
            <Text style={[styles.chipText, selectedGrade === null && styles.chipTextActive]}>
              All Classes
            </Text>
          </TouchableOpacity>
          {[6, 7, 8, 9, 10].map((grade) => (
            <TouchableOpacity
              key={grade}
              style={[styles.chip, selectedGrade === grade && styles.chipActive]}
              onPress={() => setSelectedGrade(grade)}
            >
              <Text style={[styles.chipText, selectedGrade === grade && styles.chipTextActive]}>
                Class {grade}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Student List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading student records...</Text>
        </View>
      ) : students.length === 0 ? (
        <View style={styles.centerBox}>
          <MaterialIcons name="people-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No students found</Text>
          <Text style={styles.emptySub}>Try adjusting your search criteria</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.countText}>Showing {students.length} enrolled students</Text>
          {students.map((student) => {
            const initials = (student.name || student.email || 'S')
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <View key={student.id} style={styles.card}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>

                <View style={styles.info}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{student.name || 'Student'}</Text>
                    <View style={styles.classBadge}>
                      <Text style={styles.classBadgeText}>
                        Class {student.grade || student.classId || 10}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.email}>{student.email}</Text>
                  {student.schoolName && (
                    <Text style={styles.school} numberOfLines={1}>
                      {student.schoolName}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(student.id, student.name || student.email)}
                >
                  <MaterialIcons name="delete-outline" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceSoft },
  searchStrip: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.softWarm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    gap: 8,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  gradeChips: { gap: 8, paddingBottom: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: Colors.softWarm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  list: { padding: 16, gap: 10, paddingBottom: 40 },
  countText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, marginBottom: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.palePeach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  info: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  name: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary, flex: 1 },
  classBadge: {
    backgroundColor: Colors.palePeach,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  classBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.primary },
  email: { fontSize: 12, color: Colors.textSecondary },
  school: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  deleteBtn: { padding: 8, borderRadius: 8, backgroundColor: Colors.errorBg },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 },
  loadingText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  emptySub: { fontSize: 13, color: Colors.textSecondary },
});
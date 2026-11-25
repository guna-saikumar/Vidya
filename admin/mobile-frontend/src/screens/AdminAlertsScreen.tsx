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

export const AdminAlertsScreen: React.FC = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [audience, setAudience] = useState<'all' | 'class-6' | 'class-7' | 'class-8' | 'class-9' | 'class-10'>('all');
  const [sending, setSending] = useState(false);

  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const data = await adminMobileApi.getBroadcasts();
      setHistory(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      console.warn('Failed to load broadcast history', err);
    } finally {
      setLoadingHistory(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const handleSendBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Validation Error', 'Please enter both a title and message.');
      return;
    }

    setSending(true);
    try {
      await adminMobileApi.broadcastNotification({
        title: title.trim(),
        message: message.trim(),
        priority,
        targetAudience: audience,
      });
      Alert.alert('Broadcast Sent', 'Your notification has been dispatched to all selected students.');
      setTitle('');
      setMessage('');
      setPriority('normal');
      setAudience('all');
      loadHistory();
    } catch (err: any) {
      Alert.alert('Send Failed', err.response?.data?.message || err.message || 'Failed to send alert');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = (itemTitle: string) => {
    Alert.alert('Delete Alert', `Remove notification "${itemTitle}" from student feeds?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminMobileApi.deleteNotification(itemTitle);
            loadHistory();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      keyboardShouldPersistTaps="handled"
    >
      {/* Broadcast Form Card */}
      <View style={styles.formCard}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <MaterialIcons name="campaign" size={22} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.cardTitle}>New Broadcast Alert</Text>
            <Text style={styles.cardSubtitle}>Sends real-time notification to students</Text>
          </View>
        </View>

        {/* Title Input */}
        <Text style={styles.inputLabel}>Alert Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Unit Test 2 Schedule Released"
          placeholderTextColor={Colors.textPlaceholder}
          value={title}
          onChangeText={setTitle}
        />

        {/* Message Input */}
        <Text style={styles.inputLabel}>Message Content *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Type notification message details here..."
          placeholderTextColor={Colors.textPlaceholder}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Priority Selector */}
        <Text style={styles.inputLabel}>Priority Level</Text>
        <View style={styles.selectorRow}>
          {(['low', 'normal', 'high'] as const).map((p) => {
            const active = priority === p;
            return (
              <TouchableOpacity
                key={p}
                style={[
                  styles.selectorChip,
                  active && styles.selectorChipActive,
                  p === 'high' && active && { backgroundColor: Colors.error, borderColor: Colors.error },
                ]}
                onPress={() => setPriority(p)}
              >
                <Text
                  style={[
                    styles.selectorChipText,
                    active && styles.selectorChipTextActive,
                    p === 'high' && !active && { color: Colors.error },
                  ]}
                >
                  {p.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Audience Selector */}
        <Text style={styles.inputLabel}>Target Audience</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.audienceScroll}>
          {[
            { id: 'all', label: 'All Classes' },
            { id: 'class-6', label: 'Class 6' },
            { id: 'class-7', label: 'Class 7' },
            { id: 'class-8', label: 'Class 8' },
            { id: 'class-9', label: 'Class 9' },
            { id: 'class-10', label: 'Class 10' },
          ].map((aud) => {
            const active = audience === aud.id;
            return (
              <TouchableOpacity
                key={aud.id}
                style={[styles.audienceChip, active && styles.audienceChipActive]}
                onPress={() => setAudience(aud.id as any)}
              >
                <Text style={[styles.audienceChipText, active && styles.audienceChipTextActive]}>
                  {aud.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, sending && styles.submitButtonDisabled]}
          onPress={handleSendBroadcast}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <>
              <MaterialIcons name="send" size={18} color={Colors.white} />
              <Text style={styles.submitButtonText}>Dispatch Broadcast Alert</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Broadcast History */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Sent Broadcasts History</Text>

        {loadingHistory ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={Colors.primary} size="small" />
          </View>
        ) : history.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialIcons name="notifications-none" size={36} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No broadcasts sent yet</Text>
          </View>
        ) : (
          history.map((item, index) => (
            <View key={item.id || item.title || index} style={styles.historyCard}>
              <View style={styles.historyContent}>
                <View style={styles.historyHeaderRow}>
                  <Text style={styles.historyTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.priority === 'high' && (
                    <View style={styles.highBadge}>
                      <Text style={styles.highBadgeText}>URGENT</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.historyMessage} numberOfLines={2}>
                  {item.message || item.body || item.content}
                </Text>
                <Text style={styles.historyDate}>
                  {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Recently sent'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.deleteIconBtn}
                onPress={() => handleDelete(item.title)}
              >
                <MaterialIcons name="delete-outline" size={20} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceSoft },
  content: { padding: 16, gap: 18, paddingBottom: 40 },
  formCard: {
    backgroundColor: Colors.white,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.palePeach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  cardSubtitle: { fontSize: 12, color: Colors.textSecondary },
  inputLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginTop: 4 },
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
  textArea: { height: 90 },
  selectorRow: { flexDirection: 'row', gap: 8 },
  selectorChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.softWarm,
    alignItems: 'center',
  },
  selectorChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  selectorChipText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  selectorChipTextActive: { color: Colors.white },
  audienceScroll: { gap: 8, paddingVertical: 2 },
  audienceChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.softWarm,
  },
  audienceChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  audienceChipText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  audienceChipTextActive: { color: Colors.white },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: Colors.white, fontSize: 14, fontWeight: '800' },
  historySection: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  centerBox: { padding: 30, alignItems: 'center' },
  emptyBox: {
    padding: 30,
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  historyContent: { flex: 1, gap: 4 },
  historyHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  historyTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary, flex: 1 },
  highBadge: { backgroundColor: Colors.errorBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  highBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.error },
  historyMessage: { fontSize: 12, color: Colors.textSecondary },
  historyDate: { fontSize: 10, color: Colors.textMuted },
  deleteIconBtn: { padding: 8, borderRadius: 8, backgroundColor: Colors.errorBg },
});
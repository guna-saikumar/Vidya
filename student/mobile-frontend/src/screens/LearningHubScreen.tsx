import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import Colors from '../constants/colors';
import { HeaderBar, BottomNav } from '../components/navigation';
import { getApiErrorMessage } from '../services/apiClient';
import {
  DoubtPhoto,
  LearningOverview,
  speakText,
  stopSpeaking,
  learningService,
} from '../services/learningService';
import { showAlert } from '../utils/dialog';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'LearningHub'>;

const EMPTY_OVERVIEW: LearningOverview = {
  gamification: {
    streakDays: 0,
    xp: 0,
    level: 1,
    xpToNextLevel: 100,
    badges: [],
    weeklyGoal: { targetMinutes: 120, progressMinutes: 0, percent: 0 },
  },
  tasks: [],
  doubts: [],
  glossary: [],
};

const formatDue = (value: string) => {
  if (!value) return 'No due date';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const statusLabel = (status: string) =>
  ({
    open: 'Open',
    escalated: 'With teacher',
    answered: 'Answered',
    resolved: 'Resolved',
    pending: 'To do',
    submitted: 'Submitted',
    late: 'Late',
    graded: 'Graded',
  }[status] || status);

export const LearningHubScreen: React.FC<Props> = ({ route, navigation }) => {
  const context = route.params || {};
  const [overview, setOverview] = useState<LearningOverview>(EMPTY_OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState('');
  const [details, setDetails] = useState('');
  const [escalate, setEscalate] = useState(false);
  const [photo, setPhoto] = useState<DoubtPhoto | null>(null);
  const [posting, setPosting] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [glossarySearch, setGlossarySearch] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await learningService.getOverview();
      setOverview({ ...EMPTY_OVERVIEW, ...data });
    } catch (error) {
      showAlert('Learning Hub', getApiErrorMessage(error, 'Could not load your learning overview.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    learningService
      .getOverview()
      .then((data) => {
        if (!mounted) return;
        setOverview({ ...EMPTY_OVERVIEW, ...data });
        setLoading(false);
      })
      .catch((error) => {
        if (!mounted) return;
        showAlert('Learning Hub', getApiErrorMessage(error, 'Could not load your learning overview.'));
        setLoading(false);
      });
    return () => {
      mounted = false;
      stopSpeaking();
    };
  }, []);

  const recordSession = async () => {
    try {
      const result = await learningService.recordSession(15, context.chapterId);
      const nextGamification = result?.gamification;
      if (nextGamification) {
        setOverview((current) => ({ ...current, gamification: nextGamification }));
      } else {
        await load();
      }
      showAlert('Session logged', 'Fifteen minutes added to your streak and weekly goal.');
    } catch (error) {
      showAlert('Could not log session', getApiErrorMessage(error));
    }
  };

  const submitTask = async (id: string) => {
    const note = notes[id]?.trim();
    if (!note) {
      showAlert('Submission note', 'Add a short note before submitting.');
      return;
    }
    setBusyTaskId(id);
    try {
      await learningService.submitTask(id, note);
      setNotes((current) => ({ ...current, [id]: '' }));
      await load();
      showAlert('Assignment submitted', 'Your teacher can now review it.');
    } catch (error) {
      showAlert('Submission failed', getApiErrorMessage(error));
    } finally {
      setBusyTaskId(null);
    }
  };

  const pickPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showAlert('Photo permission', 'Allow photo access to attach a picture with your doubt.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setPhoto({
          uri: asset.uri,
          name: asset.fileName || `doubt-photo-${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
        });
      }
    } catch (error) {
      showAlert('Photo picker', getApiErrorMessage(error, 'Could not open your photo library.'));
    }
  };

  const postDoubt = async () => {
    if (question.trim().length < 8) {
      showAlert('Ask a doubt', 'Please describe your doubt in at least 8 characters.');
      return;
    }
    setPosting(true);
    try {
      await learningService.askDoubt({
        question: question.trim(),
        details: details.trim(),
        photo: photo || undefined,
        escalate,
        ...context,
      });
      setQuestion('');
      setDetails('');
      setPhoto(null);
      setEscalate(false);
      await load();
      showAlert(
        'Doubt posted',
        escalate ? 'Sent to your teacher for escalation.' : 'A teacher can review it from the learning desk.'
      );
    } catch (error) {
      showAlert('Could not post doubt', getApiErrorMessage(error));
    } finally {
      setPosting(false);
    }
  };

  const glossary = overview.glossary || [];
  const filteredGlossary = glossarySearch.trim()
    ? glossary.filter(
        (item) =>
          item.term.toLowerCase().includes(glossarySearch.trim().toLowerCase()) ||
          item.english.toLowerCase().includes(glossarySearch.trim().toLowerCase()) ||
          item.hindi.includes(glossarySearch.trim())
      )
    : glossary;

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <HeaderBar
        showBack
        onBackPress={() => navigation.goBack()}
        title="Learning Hub"
        eyebrow="Streaks · Tasks · Doubts · Glossary"
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 44, gap: 18 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loading && (
          <View className="flex-row items-center justify-center py-3">
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text className="font-manrope-medium text-xs text-textSecondary ml-2">Syncing…</Text>
          </View>
        )}

        {/* Gamification */}
        <View className="rounded-[22px] bg-white border border-[#E8DFD8] p-5 gap-3 shadow-sm">
          <View className="flex-row items-center gap-2">
            <MaterialIcons name="local-fire-department" size={19} color={Colors.primary} />
            <Text className="font-manrope-extrabold text-base text-textPrimary">Streak, XP & goals</Text>
          </View>
          <View className="flex-row gap-2.5">
            <View className="flex-1 rounded-xl bg-palePeach p-3">
              <Text className="font-manrope-extrabold text-xl text-primary">
                {overview.gamification.streakDays}
              </Text>
              <Text className="font-manrope-medium text-[10px] text-textSecondary">day streak</Text>
            </View>
            <View className="flex-1 rounded-xl bg-palePeach p-3">
              <Text className="font-manrope-extrabold text-xl text-primary">{overview.gamification.xp}</Text>
              <Text className="font-manrope-medium text-[10px] text-textSecondary">XP</Text>
            </View>
            <View className="flex-1 rounded-xl bg-palePeach p-3">
              <Text className="font-manrope-extrabold text-base text-primary">
                Level {overview.gamification.level}
              </Text>
              <Text className="font-manrope-medium text-[10px] text-textSecondary">
                {overview.gamification.xpToNextLevel} XP to next
              </Text>
            </View>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="font-manrope-bold text-[11px] text-textSecondary">Weekly goal</Text>
            <Text className="font-manrope-extrabold text-[11px] text-primaryDark">
              {overview.gamification.weeklyGoal.progressMinutes}/{overview.gamification.weeklyGoal.targetMinutes} min
            </Text>
          </View>
          <View className="h-2 rounded-full bg-[#EFE8E3] overflow-hidden">
            <View
              className="h-full bg-primary rounded-full"
              style={{ width: `${Math.min(100, overview.gamification.weeklyGoal.percent || 0)}%` }}
            />
          </View>
          {overview.gamification.badges.length > 0 && (
            <View className="flex-row flex-wrap gap-1.5">
              {overview.gamification.badges.slice(0, 4).map((badge) => (
                <View key={badge.code} className="rounded-full bg-[#FFF0D5] px-2.5 py-1">
                  <Text className="font-manrope-bold text-[10px] text-[#8A5C11]">{badge.name}</Text>
                </View>
              ))}
            </View>
          )}
          <TouchableOpacity
            className="flex-row items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5"
            onPress={recordSession}
            activeOpacity={0.85}
          >
            <MaterialIcons name="bolt" size={16} color={Colors.white} />
            <Text className="font-manrope-bold text-xs text-white">Log a 15-minute session</Text>
          </TouchableOpacity>
        </View>

        {/* Task inbox */}
        <View className="gap-2">
          <Text className="font-manrope-extrabold text-lg text-textPrimary">Teacher task inbox</Text>
          {(overview.tasks || []).length === 0 ? (
            <View className="rounded-[18px] border border-border bg-white p-4">
              <Text className="font-manrope-medium text-xs text-textSecondary">
                {"No assignments yet. Your teacher’s tasks will appear here."}
              </Text>
            </View>
          ) : (
            (overview.tasks || []).map((task) => {
              const done = ['submitted', 'late', 'graded'].includes(task.status);
              return (
                <View key={task.id} className="rounded-[18px] border border-border bg-white p-4 gap-2">
                  <View className="flex-row items-center justify-between gap-2">
                    <Text className="font-manrope-extrabold text-sm text-textPrimary flex-1" numberOfLines={2}>
                      {task.title}
                    </Text>
                    <View className="rounded-full bg-palePeach px-2 py-1">
                      <Text className="font-manrope-bold text-[10px] text-primary">
                        {statusLabel(task.status)}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <MaterialIcons name="schedule" size={13} color={Colors.textMuted} />
                    <Text className="font-manrope-medium text-[11px] text-textMuted">
                      Due {formatDue(task.dueAt)}
                    </Text>
                  </View>
                  {!!task.description && (
                    <Text className="font-manrope-medium text-xs text-textSecondary">{task.description}</Text>
                  )}
                  {!done && (
                    <View className="flex-row gap-2 items-center">
                      <TextInput
                        className="flex-1 rounded-xl border border-border px-3 py-2 font-manrope-medium text-xs text-textPrimary"
                        placeholder="Short submission note"
                        value={notes[task.id] || ''}
                        onChangeText={(value) => setNotes((current) => ({ ...current, [task.id]: value }))}
                      />
                      <TouchableOpacity
                        className="rounded-xl bg-primary px-3 py-2"
                        disabled={busyTaskId === task.id}
                        onPress={() => submitTask(task.id)}
                        activeOpacity={0.85}
                      >
                        {busyTaskId === task.id ? (
                          <ActivityIndicator size="small" color={Colors.white} />
                        ) : (
                          <Text className="font-manrope-bold text-xs text-white">Submit</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                  {!!task.feedback && (
                    <Text className="font-manrope-medium text-[11px] text-success">Teacher: {task.feedback}</Text>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Ask a doubt */}
        <View className="rounded-[22px] bg-white border border-[#E8DFD8] p-5 gap-3 shadow-sm">
          <View className="flex-row items-center gap-2">
            <MaterialIcons name="help-outline" size={19} color={Colors.primary} />
            <Text className="font-manrope-extrabold text-base text-textPrimary">Ask a doubt</Text>
          </View>
          <Text className="font-manrope-medium text-xs text-textSecondary">
            Attach a photo of the problem and optionally send it straight to your teacher.
          </Text>
          <TextInput
            className="rounded-xl border border-border px-3 py-2.5 font-manrope-medium text-sm text-textPrimary"
            placeholder="Type your question…"
            multiline
            value={question}
            onChangeText={setQuestion}
          />
          <TextInput
            className="rounded-xl border border-border px-3 py-2.5 font-manrope-medium text-xs text-textPrimary"
            placeholder="What have you tried? (optional)"
            multiline
            value={details}
            onChangeText={setDetails}
          />
          <TouchableOpacity
            className="flex-row items-center gap-2 self-start rounded-xl border border-dashed border-primary px-3 py-2"
            onPress={pickPhoto}
            activeOpacity={0.8}
          >
            <MaterialIcons name="add-a-photo" size={16} color={Colors.primary} />
            <Text className="font-manrope-bold text-xs text-primary" numberOfLines={1}>
              {photo ? photo.name || 'Photo attached' : 'Add photo'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-row items-center gap-2 self-start"
            onPress={() => setEscalate((value) => !value)}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name={escalate ? 'check-box' : 'check-box-outline-blank'}
              size={18}
              color={Colors.primary}
            />
            <Text className="font-manrope-medium text-xs text-textSecondary">Escalate to teacher</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-row items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5"
            onPress={postDoubt}
            disabled={posting}
            activeOpacity={0.85}
          >
            {posting ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <MaterialIcons name="send" size={15} color={Colors.white} />
            )}
            <Text className="font-manrope-bold text-xs text-white">Post doubt</Text>
          </TouchableOpacity>

          {(overview.doubts || []).length > 0 && (
            <View className="gap-2 mt-1">
              <Text className="font-manrope-extrabold text-xs text-textPrimary">Your doubts</Text>
              {overview.doubts.slice(0, 4).map((doubt) => (
                <View key={doubt.id} className="rounded-xl border border-border bg-softWarm p-3 gap-1">
                  <View className="flex-row items-center justify-between gap-2">
                    <Text className="font-manrope-bold text-xs text-textPrimary flex-1" numberOfLines={2}>
                      {doubt.question}
                    </Text>
                    <Text className="font-manrope-bold text-[10px] text-primary">
                      {statusLabel(doubt.status)}
                    </Text>
                  </View>
                  {!!doubt.teacherNote && (
                    <Text className="font-manrope-medium text-[11px] text-success">
                      Teacher: {doubt.teacherNote}
                    </Text>
                  )}
                  {doubt.status === 'open' && (
                    <TouchableOpacity
                      className="self-start"
                      onPress={async () => {
                        try {
                          await learningService.escalateDoubt(doubt.id);
                          await load();
                          showAlert('Escalated', 'Your teacher will review this doubt.');
                        } catch (error) {
                          showAlert('Could not escalate', getApiErrorMessage(error));
                        }
                      }}
                    >
                      <Text className="font-manrope-bold text-[11px] text-primary">Escalate to teacher</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Bilingual glossary with audio */}
        <View className="gap-2">
          <Text className="font-manrope-extrabold text-lg text-textPrimary">Bilingual glossary</Text>
          <TextInput
            className="rounded-xl border border-border bg-white px-3 py-2.5 font-manrope-medium text-xs text-textPrimary"
            placeholder="Search a term…"
            value={glossarySearch}
            onChangeText={setGlossarySearch}
          />
          {filteredGlossary.slice(0, 6).map((item) => (
            <View key={item.term} className="flex-row items-start justify-between gap-2 rounded-[18px] border border-border bg-white p-3">
              <View className="flex-1">
                <Text className="font-manrope-extrabold text-xs text-primaryDark">{item.term}</Text>
                <Text className="font-manrope-medium text-[11px] text-textSecondary mt-0.5">{item.english}</Text>
                <Text className="font-manrope-medium text-[11px] text-[#7A5C9E] mt-0.5">{item.hindi}</Text>
              </View>
              <TouchableOpacity
                className="w-9 h-9 rounded-full bg-[#EEF7F2] items-center justify-center"
                onPress={() => speakText(`${item.term}. ${item.english}`, 'en-IN')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="volume-up" size={17} color="#21815A" />
              </TouchableOpacity>
            </View>
          ))}
          {filteredGlossary.length === 0 && (
            <Text className="font-manrope-medium text-xs text-textSecondary">No matching terms yet.</Text>
          )}
        </View>
      </ScrollView>
      <BottomNav activeTab="Home" navigation={navigation} />
    </View>
  );
};

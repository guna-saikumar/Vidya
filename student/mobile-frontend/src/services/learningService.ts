import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

import apiClient, { getApiErrorMessage } from './apiClient';

export type DoubtStatus = 'open' | 'escalated' | 'answered' | 'resolved';
export type TaskStatus = 'pending' | 'submitted' | 'late' | 'graded';

export type Badge = {
  code: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  earnedAt: string | null;
};

export type WeeklyGoal = {
  targetMinutes: number;
  progressMinutes: number;
  percent: number;
  weekStart?: string;
};

export type Gamification = {
  streakDays: number;
  xp: number;
  level: number;
  xpToNextLevel: number;
  badges: Badge[];
  weeklyGoal: WeeklyGoal;
};

export type Doubt = {
  id: string;
  question: string;
  details: string;
  status: DoubtStatus;
  photoUrl: string | null;
  teacherNote: string;
  createdAt: string;
  classId?: string | null;
  subjectId?: string | null;
  chapterId?: string | null;
  sectionId?: string | null;
};

export type LearningTask = {
  id: string;
  title: string;
  description: string;
  classId: string;
  subjectId: string | null;
  dueAt: string;
  status: TaskStatus;
  isOverdue: boolean;
  note?: string | null;
  feedback?: string | null;
};

export type GlossaryEntry = {
  term: string;
  english: string;
  hindi: string;
  pronunciation: string | null;
  category: string;
};

export type LearningOverview = {
  gamification: Gamification;
  tasks: LearningTask[];
  doubts: Doubt[];
  glossary: GlossaryEntry[];
};

export type DoubtPhoto = {
  uri: string;
  name?: string;
  type?: string;
};

export type LearningContext = {
  classId?: string;
  subjectId?: string;
  chapterId?: string;
  sectionId?: string;
};

const unwrap = <T>(response: { data: T }): T => response.data;

/** Reads text aloud with the device TTS engine. No recording is stored. */
export const speakText = (text: string, language = 'en-IN'): boolean => {
  if (!text) return false;
  void Speech.speak(text, {
    language,
    rate: 0.92,
    onError: (error) => console.warn('Speech error:', error),
  });
  return true;
};

export const stopSpeaking = () => {
  void Speech.stop();
};

/**
 * Builds the doubt photo part. Text fields are appended before the photo so
 * Fastify's multipart parser can expose them in `file.fields`.
 */
const appendPhoto = async (form: FormData, photo: DoubtPhoto) => {
  const name = photo.name || `doubt-photo.${photo.type === 'image/png' ? 'png' : photo.type === 'image/webp' ? 'webp' : 'jpg'}`;
  const type = photo.type || 'image/jpeg';

  if (Platform.OS === 'web' && photo.uri.startsWith('blob:')) {
    try {
      const response = await fetch(photo.uri);
      const blob = await response.blob();
      form.append('photo', blob, name);
      return;
    } catch {
      // Fall through to the React Native file descriptor form below.
    }
  }

  form.append('photo', { uri: photo.uri, name, type } as unknown as Blob);
};

export const learningService = {
  async getOverview(): Promise<LearningOverview> {
    return unwrap(await apiClient.get<LearningOverview>('/api/v1/learning/overview'));
  },

  async getGamification(): Promise<Gamification> {
    return unwrap(await apiClient.get<Gamification>('/api/v1/learning/gamification'));
  },

  async recordSession(
    minutes: number,
    chapterId?: string
  ): Promise<{ gamification?: Gamification; newBadges?: string[] }> {
    return unwrap(
      await apiClient.post<{ gamification?: Gamification; newBadges?: string[] }>(
        '/api/v1/learning/sessions',
        {
          minutes,
          ...(chapterId ? { chapterId } : {}),
        }
      )
    );
  },

  async getDoubts(): Promise<Doubt[]> {
    return unwrap(await apiClient.get<Doubt[]>('/api/v1/learning/doubts'));
  },

  async askDoubt(input: {
    question: string;
    details?: string;
    photo?: DoubtPhoto;
    escalate?: boolean;
  } & LearningContext): Promise<Doubt> {
    const form = new FormData();
    form.append('question', input.question.trim());
    if (input.details) form.append('details', input.details.trim());
    if (input.escalate) form.append('escalate', 'true');
    if (input.classId) form.append('classId', input.classId);
    if (input.subjectId) form.append('subjectId', input.subjectId);
    if (input.chapterId) form.append('chapterId', input.chapterId);
    if (input.sectionId) form.append('sectionId', input.sectionId);
    if (input.photo) await appendPhoto(form, input.photo);

    const headers =
      Platform.OS === 'web'
        ? { 'Content-Type': undefined as string | undefined }
        : { 'Content-Type': 'multipart/form-data' };

    const response = await apiClient.post<{ doubt: Doubt }>(
      '/api/v1/learning/doubts',
      form,
      { headers }
    );
    return response.data.doubt;
  },

  async escalateDoubt(id: string) {
    return unwrap(await apiClient.post(`/api/v1/learning/doubts/${id}/escalate`));
  },

  async getTasks(): Promise<LearningTask[]> {
    return unwrap(await apiClient.get<LearningTask[]>('/api/v1/learning/tasks'));
  },

  async submitTask(id: string, note: string) {
    return unwrap(await apiClient.post(`/api/v1/learning/tasks/${id}/submit`, { note }));
  },

  async getGlossary(search?: string): Promise<GlossaryEntry[]> {
    return unwrap(
      await apiClient.get<GlossaryEntry[]>('/api/v1/learning/glossary', {
        params: search ? { search } : undefined,
      })
    );
  },
};

export { getApiErrorMessage };

/** Splits reader text into plain and glossary-linked segments. */
export const splitGlossaryText = (
  text: string,
  entries: GlossaryEntry[]
): { text: string; entry?: GlossaryEntry }[] => {
  if (!text || entries.length === 0) return [{ text }];

  const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const terms = [...new Set(entries.map((entry) => entry.term))].sort(
    (a, b) => b.length - a.length
  );
  const pattern = new RegExp(`(${terms.map(escape).join('|')})`, 'gi');

  return text
    .split(pattern)
    .filter((part) => part.length > 0)
    .map((part) => {
      const entry = entries.find(
        (item) => item.term.toLowerCase() === part.toLowerCase()
      );
      return entry ? { text: part, entry } : { text: part };
    });
};

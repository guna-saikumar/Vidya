import { apiClient } from '../lib/apiClient';

const unwrap = (response) => response.data;

/**
 * Student learning features: streaks/XP/goals, doubts, assignments and the
 * bilingual glossary. All calls use the authenticated student API client.
 */
export const learningService = {
  async getOverview() {
    return unwrap(await apiClient.get('/api/v1/learning/overview'));
  },

  async getGamification() {
    return unwrap(await apiClient.get('/api/v1/learning/gamification'));
  },

  async recordSession(minutes, chapterId) {
    const payload = { minutes };
    if (chapterId) payload.chapterId = chapterId;
    return unwrap(await apiClient.post('/api/v1/learning/sessions', payload));
  },

  async getDoubts() {
    return unwrap(await apiClient.get('/api/v1/learning/doubts'));
  },

  /**
   * Fields are appended before the photo: @fastify/busboy parses multipart
   * form data serially, so the API can only read fields seen before the file.
   */
  async askDoubt({ question, details, photo, escalate, classId, subjectId, chapterId, sectionId }) {
    const form = new FormData();
    form.append('question', question);
    if (details) form.append('details', details);
    if (escalate) form.append('escalate', 'true');
    if (classId) form.append('classId', classId);
    if (subjectId) form.append('subjectId', subjectId);
    if (chapterId) form.append('chapterId', chapterId);
    if (sectionId) form.append('sectionId', sectionId);
    if (photo) form.append('photo', photo, photo.name || 'doubt-photo.jpg');

    // Let axios set the multipart boundary; a manual Content-Type breaks parsing.
    return unwrap(await apiClient.post('/api/v1/learning/doubts', form));
  },

  async escalateDoubt(id) {
    return unwrap(await apiClient.post(`/api/v1/learning/doubts/${id}/escalate`));
  },

  async getTasks() {
    return unwrap(await apiClient.get('/api/v1/learning/tasks'));
  },

  async submitTask(id, note) {
    return unwrap(await apiClient.post(`/api/v1/learning/tasks/${id}/submit`, { note }));
  },

  async getGlossary(search) {
    return unwrap(
      await apiClient.get('/api/v1/learning/glossary', {
        params: search ? { search } : undefined,
      })
    );
  },
};

/** Speaks text through the browser's built-in speechSynthesis (no audio file stored). */
export const speakText = (text, language = 'en-IN') => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.rate = 0.92;
  window.speechSynthesis.speak(utterance);
  return true;
};

export const stopSpeaking = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

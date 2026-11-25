import { apiClient } from '../lib/apiClient';
import { notificationService } from './notificationService';

const PROGRESS_STORAGE_KEY = '@vidya_web_chapter_progress';
const BOOKMARKS_STORAGE_KEY = '@vidya_web_bookmarks';
const NOTIFICATIONS_STORAGE_KEY = '@vidya_web_notifications';

export const getStoredProgress = () => {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const saveChapterProgress = async (progress) => {
  const current = getStoredProgress();
  current[progress.chapterId] = progress;
  localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(current));

  // Sync to backend if possible
  try {
    await apiClient.put(`/api/v1/students/me/progress/${progress.chapterId}`, {
      progressPercent: progress.progressPercent,
      completed: progress.completed,
      sectionId: progress.completedSections[progress.completedSections.length - 1],
    });
  } catch {
    // Offline fallback: progress safely preserved in localStorage
  }

  return current;
};

export const getStoredBookmarks = () => {
  try {
    const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const addBookmark = async (item) => {
  const current = getStoredBookmarks();
  const newBookmark = {
    id: `bm-${Date.now()}`,
    dateAdded: new Date().toISOString(),
    ...item,
  };
  const updated = [newBookmark, ...current.filter((b) => b.chapterId !== item.chapterId || b.sectionId !== item.sectionId)];
  localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(updated));

  try {
    await apiClient.post('/api/v1/students/me/bookmarks', {
      chapterId: item.chapterId,
      sectionId: item.sectionId,
      type: item.type,
      title: item.title,
      subtitle: item.subtitle,
      previewText: item.previewText,
    });
  } catch {
    // Offline fallback
  }

  return updated;
};

export const removeBookmark = async (bookmarkId) => {
  const current = getStoredBookmarks();
  const updated = current.filter((b) => b.id !== bookmarkId);
  localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(updated));

  try {
    await apiClient.delete(`/api/v1/students/me/bookmarks/${bookmarkId}`);
  } catch {
    // Offline fallback
  }

  return updated;
};

export const getStoredNotifications = () => {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return [];
};

export const markNotificationAsRead = (id) => {
  notificationService.markAsRead(id).catch(() => {});
  const current = getStoredNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, isRead: true, read: true } : n));
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const markAllNotificationsAsRead = () => {
  notificationService.markAllAsRead().catch(() => {});
  const current = getStoredNotifications();
  const updated = current.map((n) => ({ ...n, isRead: true, read: true }));
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
};


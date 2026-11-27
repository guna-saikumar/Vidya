import { apiClient } from '../lib/apiClient';
import { notificationService } from './notificationService';

const PROGRESS_STORAGE_KEY = '@vidya_web_chapter_progress';
const BOOKMARKS_STORAGE_KEY = '@vidya_web_bookmarks';
const NOTIFICATIONS_STORAGE_KEY = '@vidya_web_notifications';

const writeProgressCache = (progressMap) => {
  localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progressMap));
};

const writeBookmarksCache = (bookmarks) => {
  localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
};

const bookmarkKey = (item) => [
  item?.chapterId || '',
  item?.sectionId || '',
  item?.type || 'chapter',
].join('|');

const toClientBookmark = (bookmark) => ({
  id: bookmark.id,
  classId: bookmark.classId,
  chapterId: bookmark.chapterId,
  chapterTitle: bookmark.chapterTitle,
  subjectId: bookmark.subjectId,
  subjectName: bookmark.subjectName,
  sectionId: bookmark.sectionId || undefined,
  sectionTitle: bookmark.sectionTitle,
  title: bookmark.title,
  subtitle: bookmark.subtitle,
  type: bookmark.type || 'chapter',
  previewText: bookmark.previewText,
  dateAdded: bookmark.dateAdded || bookmark.createdAt || new Date().toISOString(),
});

export const getStoredProgress = () => {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

/**
 * Hydrate the local cache from the API so a new device/session shows the same
 * progress as the server. Server values win; local-only entries are kept as an
 * offline fallback.
 */
export const loadProgressFromApi = async () => {
  const current = getStoredProgress();
  try {
    const { data } = await apiClient.get('/api/v1/students/me/progress');
    const remote = data?.chapters || {};
    const merged = { ...current, ...remote };
    writeProgressCache(merged);
    return merged;
  } catch {
    return current;
  }
};

export const saveChapterProgress = async (progress) => {
  const current = getStoredProgress();
  current[progress.chapterId] = progress;
  writeProgressCache(current);

  // Sync to backend if possible. Never send sectionId: null — the API rejects it.
  try {
    const payload = {
      progressPercent: progress.progressPercent,
      completed: progress.completed,
    };
    if (progress.completedSections?.length) {
      payload.completedSections = progress.completedSections;
    }
    const sectionId =
      progress.lastSectionId || progress.completedSections?.[progress.completedSections.length - 1];
    if (sectionId) payload.sectionId = sectionId;

    const { data } = await apiClient.put(
      `/api/v1/students/me/progress/${progress.chapterId}`,
      payload
    );
    const saved = data?.updatedProgress || data;
    if (saved?.chapterId) {
      current[progress.chapterId] = {
        ...current[progress.chapterId],
        ...saved,
        lastAccessed: progress.lastAccessed || current[progress.chapterId].lastAccessed,
      };
      writeProgressCache(current);
    }
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

/** Hydrate bookmarks from the API, keeping local-only items as offline fallback. */
export const loadBookmarksFromApi = async () => {
  const current = getStoredBookmarks();
  try {
    const { data } = await apiClient.get('/api/v1/students/me/bookmarks');
    const remote = (Array.isArray(data) ? data : []).map(toClientBookmark);
    const remoteKeys = new Set(remote.map(bookmarkKey));
    const localOnly = current.filter((b) => !remoteKeys.has(bookmarkKey(b)));
    const merged = [...remote, ...localOnly];
    writeBookmarksCache(merged);
    return merged;
  } catch {
    return current;
  }
};

export const addBookmark = async (item) => {
  const current = getStoredBookmarks();
  const payload = {
    chapterId: item.chapterId,
    type: item.type || (item.sectionId ? 'section' : 'chapter'),
    title: item.title,
    subtitle: item.subtitle,
    previewText: item.previewText,
  };
  if (item.sectionId) payload.sectionId = item.sectionId;

  try {
    const { data } = await apiClient.post('/api/v1/students/me/bookmarks', payload);
    if (data?.bookmark) {
      const saved = toClientBookmark(data.bookmark);
      const updated = [
        saved,
        ...current.filter((b) => bookmarkKey(b) !== bookmarkKey(saved)),
      ];
      writeBookmarksCache(updated);
      return updated;
    }
  } catch {
    // Offline fallback below.
  }

  const newBookmark = {
    id: `bm-${Date.now()}`,
    dateAdded: new Date().toISOString(),
    ...item,
  };
  const updated = [
    newBookmark,
    ...current.filter((b) => bookmarkKey(b) !== bookmarkKey(newBookmark)),
  ];
  writeBookmarksCache(updated);
  return updated;
};

export const removeBookmark = async (bookmarkId) => {
  const current = getStoredBookmarks();
  const updated = current.filter((b) => b.id !== bookmarkId);

  try {
    await apiClient.delete(`/api/v1/students/me/bookmarks/${bookmarkId}`);
  } catch {
    // A locally-created bookmark may not exist on the server; remove locally anyway.
  }

  writeBookmarksCache(updated);
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

import { apiClient } from '../lib/apiClient';

const NOTIFICATIONS_STORAGE_KEY = '@vidya_web_notifications';

export const notificationService = {
  /**
   * Fetch all notifications for the authenticated student from the backend.
   * Falls back to localStorage cache if offline.
   */
  async getNotifications(options = {}) {
    try {
      const params = {};
      if (options.unread !== undefined) {
        params.unread = String(options.unread);
      }
      const res = await apiClient.get('/api/v1/notifications', { params });
      if (Array.isArray(res.data)) {
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(res.data));
        return res.data;
      }
      return [];
    } catch (err) {
      console.warn('Could not fetch notifications from backend, using cache:', err?.message);
      try {
        const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch {
        // ignore
      }
      return [];
    }
  },

  /**
   * Get single notification by id
   */
  async getNotificationById(id) {
    const res = await apiClient.get(`/api/v1/notifications/${encodeURIComponent(id)}`);
    return res.data;
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(id) {
    try {
      await apiClient.patch(`/api/v1/notifications/${encodeURIComponent(id)}/read`);
    } catch (err) {
      console.warn('Failed to mark notification read on backend:', err?.message);
    }

    try {
      const cached = JSON.parse(localStorage.getItem(NOTIFICATIONS_STORAGE_KEY) || '[]');
      const updated = cached.map((n) =>
        n.id === id ? { ...n, isRead: true, read: true } : n
      );
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      await apiClient.post('/api/v1/notifications/read-all');
    } catch (err) {
      console.warn('Failed to mark all notifications read on backend:', err?.message);
    }

    try {
      const cached = JSON.parse(localStorage.getItem(NOTIFICATIONS_STORAGE_KEY) || '[]');
      const updated = cached.map((n) => ({ ...n, isRead: true, read: true }));
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },
};

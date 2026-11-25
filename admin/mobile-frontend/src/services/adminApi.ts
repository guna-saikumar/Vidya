import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const ADMIN_TOKEN_KEY = '@vidya_admin_mobile_token';
export const ADMIN_USER_KEY = '@vidya_admin_mobile_user';
export const ADMIN_API_URL_KEY = '@vidya_admin_mobile_api_url';
export const DEFAULT_TOKEN = 'vidya-admin-secret';

// Automatically resolve local host on emulators vs devices
const getDefaultBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === 'android') return 'http://10.0.2.2:4000';
  return 'http://localhost:4000';
};

export const adminAxios = axios.create({
  baseURL: getDefaultBaseUrl(),
  timeout: 15000,
});

adminAxios.interceptors.request.use(async (config) => {
  try {
    const stored = await AsyncStorage.getItem(ADMIN_TOKEN_KEY);
    if (stored) {
      config.headers['x-admin-token'] = stored;
    } else {
      config.headers['x-admin-token'] = DEFAULT_TOKEN;
    }
    const storedUrl = await AsyncStorage.getItem(ADMIN_API_URL_KEY);
    if (storedUrl) config.baseURL = storedUrl;
  } catch {
    // ignore
  }
  return config;
});

export function getFriendlyErrorMessage(err: any, fallback = 'Something went wrong. Please try again.'): string {
  if (!err) return fallback;

  let raw = '';
  if (typeof err === 'string') {
    raw = err;
  } else if (err.response?.data?.message) {
    raw = err.response.data.message;
  } else if (err.response?.data?.error) {
    raw = err.response.data.error;
  } else if (err.message) {
    raw = err.message;
  } else {
    raw = fallback;
  }

  if (/ERR_NETWORK|ECONNREFUSED|ENOTFOUND|Network Error/i.test(raw)) {
    return 'Unable to reach the server. Please check your network connection.';
  }
  if (/Request failed with status code 401|Unauthorized|Invalid admin token/i.test(raw)) {
    return 'Incorrect email or password, or session expired. Please sign in again.';
  }
  if (/Request failed with status code 403|Forbidden/i.test(raw)) {
    return 'You do not have permission to perform this action.';
  }
  if (/Request failed with status code 404|Not Found/i.test(raw)) {
    return 'The requested resource could not be found.';
  }
  if (/Request failed with status code 5\d\d|Internal Server Error|syntax error|Postgres|violates|duplicate key|P2002/i.test(raw)) {
    return 'A temporary server error occurred. Please try again shortly.';
  }
  if (/timeout|ECONNABORTED/i.test(raw)) {
    return 'The request timed out. Please check your connection and try again.';
  }
  if (/^Error: /i.test(raw)) {
    return getFriendlyErrorMessage(raw.replace(/^Error: /i, ''), fallback);
  }

  return raw;
}

export const adminMobileApi = {
  async login(email: string, password: string) {
    const res = await adminAxios.post('/api/v1/admin/auth/login', { email, password });
    const data = res.data;
    if (data?.token) {
      await AsyncStorage.setItem(ADMIN_TOKEN_KEY, data.token);
    }
    if (data?.user) {
      await AsyncStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.user));
    }
    return data;
  },

  async logout() {
    await AsyncStorage.removeItem(ADMIN_TOKEN_KEY);
    await AsyncStorage.removeItem(ADMIN_USER_KEY);
  },

  async getCurrentUser() {
    try {
      const raw = await AsyncStorage.getItem(ADMIN_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async getStoredToken() {
    return AsyncStorage.getItem(ADMIN_TOKEN_KEY);
  },

  async getOverview() {
    const res = await adminAxios.get('/api/v1/admin/overview');
    return res.data;
  },

  async getClasses() {
    const res = await adminAxios.get('/api/v1/admin/classes');
    return res.data;
  },

  async getMaterials(params: Record<string, any> = {}) {
    const res = await adminAxios.get('/api/v1/admin/study-materials', { params });
    return res.data;
  },

  async deleteMaterial(id: string) {
    const res = await adminAxios.delete(`/api/v1/admin/study-materials/${id}`);
    return res.data;
  },

  async broadcastNotification(data: any) {
    const res = await adminAxios.post('/api/v1/admin/notifications/broadcast', data);
    return res.data;
  },

  async getBroadcasts() {
    const res = await adminAxios.get('/api/v1/admin/notifications');
    return res.data;
  },

  async deleteNotification(title: string) {
    const res = await adminAxios.delete('/api/v1/admin/notifications', { params: { title } });
    return res.data;
  },

  async getStudents(params: Record<string, any> = {}) {
    const res = await adminAxios.get('/api/v1/admin/students', { params });
    return res.data;
  },

  async deleteStudent(id: string) {
    const res = await adminAxios.delete(`/api/v1/admin/students/${id}`);
    return res.data;
  },
};

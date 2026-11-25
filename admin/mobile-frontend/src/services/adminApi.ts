import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const ADMIN_TOKEN_KEY = '@vidya_admin_mobile_token';
const ADMIN_API_URL_KEY = '@vidya_admin_mobile_api_url';
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
  let token = DEFAULT_TOKEN;
  try {
    const stored = await AsyncStorage.getItem(ADMIN_TOKEN_KEY);
    if (stored) token = stored;
    const storedUrl = await AsyncStorage.getItem(ADMIN_API_URL_KEY);
    if (storedUrl) config.baseURL = storedUrl;
  } catch {
    // ignore
  }
  config.headers['x-admin-token'] = token;
  return config;
});

export const adminMobileApi = {
  async getOverview() {
    const res = await adminAxios.get('/api/v1/admin/overview');
    return res.data;
  },
  async getClasses() {
    const res = await adminAxios.get('/api/v1/admin/classes');
    return res.data;
  },
  async getMaterials(params = {}) {
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
  async getStudents(params = {}) {
    const res = await adminAxios.get('/api/v1/admin/students', { params });
    return res.data;
  },
  async deleteStudent(id: string) {
    const res = await adminAxios.delete(`/api/v1/admin/students/${id}`);
    return res.data;
  },
};

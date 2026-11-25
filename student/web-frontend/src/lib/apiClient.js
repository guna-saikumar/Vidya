import axios from 'axios';
import { storage } from './storage';

const envBase =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  import.meta.env.NEXT_PUBLIC_API_URL ||
  import.meta.env.EXPO_PUBLIC_API_URL;

export const API_BASE_URL = (envBase || 'http://localhost:4000').replace(/\/$/, '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
});

const isAuthEndpoint = (url) =>
  !!url && (url.includes('/api/v1/auth/login') ||
    url.includes('/api/v1/auth/refresh') ||
    url.includes('/api/v1/auth/logout'));

apiClient.interceptors.request.use((config) => {
  const token = storage.getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (
    config.data &&
    !(config.data instanceof FormData) &&
    !config.headers?.['Content-Type']
  ) {
    config.headers = config.headers || {};
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = storage.getRefreshToken();
  if (!refreshToken) return null;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
        refreshToken,
      });
      const { accessToken, refreshToken: newRefresh } = res.data;
      storage.setAccessToken(accessToken);
      storage.setRefreshToken(newRefresh);
      return accessToken;
    } catch {
      storage.clearAuth();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !isAuthEndpoint(original.url)
    ) {
      original._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }
      // redirect to login
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function sanitizeErrorMessage(raw, fallback = 'Something went wrong. Please try again.') {
  if (!raw) return fallback;
  const str = typeof raw === 'string' ? raw : String(raw?.message || raw?.error || fallback);

  if (/ERR_NETWORK|ECONNREFUSED|ENOTFOUND|Network Error/i.test(str)) {
    return 'Unable to reach the server. Please check your network connection.';
  }
  if (/Request failed with status code 401|Unauthorized/i.test(str)) {
    return 'Incorrect email or password. Please try again.';
  }
  if (/Request failed with status code 403|Forbidden/i.test(str)) {
    return 'You do not have permission to perform this action.';
  }
  if (/Request failed with status code 404|Not Found/i.test(str)) {
    return 'The requested resource could not be found.';
  }
  if (/Request failed with status code 5\d\d|Internal Server Error|syntax error|Postgres|violates|duplicate key|P2002/i.test(str)) {
    return 'A temporary server error occurred. Please try again shortly.';
  }
  if (/timeout|ECONNABORTED/i.test(str)) {
    return 'The request timed out. Please check your connection and try again.';
  }
  if (/^Error: /i.test(str)) {
    return sanitizeErrorMessage(str.replace(/^Error: /i, ''), fallback);
  }
  return str;
}

export function extractErrorMessage(err) {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (data?.error && typeof data.error === 'string') return sanitizeErrorMessage(data.error);
    if (data?.message && typeof data.message === 'string') return sanitizeErrorMessage(data.message);
    if (err.response?.status === 401) return 'Incorrect email or password. Please try again.';
    if (err.response?.status === 403) return 'You do not have permission to perform this action.';
    if (err.response?.status === 404) return 'The requested resource could not be found.';
    if (err.response?.status && err.response.status >= 500) return 'A temporary server error occurred. Please try again shortly.';
    if (err.code === 'ECONNABORTED' || !err.response) return 'Unable to reach the server. Please check your network connection.';
    return sanitizeErrorMessage(err.message);
  }
  if (err instanceof Error) return sanitizeErrorMessage(err.message);
  return 'Something went wrong. Please try again.';
}


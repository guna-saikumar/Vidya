import axios from 'axios';

export const ADMIN_TOKEN_KEY = 'vidya_admin_token';
export const ADMIN_USER_KEY = 'vidya_admin_user';
export const DEFAULT_TOKEN = 'vidya-admin-secret';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  return 'http://localhost:4000';
};

export const adminApiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
});

adminApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) {
    config.headers['x-admin-token'] = token;
  }
  return config;
});

export function sanitizeErrorMessage(raw, fallback = 'Something went wrong. Please try again.') {
  if (!raw) return fallback;
  const str = typeof raw === 'string' ? raw : String(raw?.message || raw?.error || fallback);

  // Technical error codes & patterns to clean up
  if (/ERR_NETWORK|ECONNREFUSED|ENOTFOUND|Network Error/i.test(str)) {
    return 'Unable to reach the server. Please check your network connection.';
  }
  if (/Request failed with status code 401|Unauthorized|Invalid admin token/i.test(str)) {
    return 'Invalid credentials or session expired. Please sign in again.';
  }
  if (/Request failed with status code 403|Forbidden/i.test(str)) {
    return 'You do not have permission to perform this action.';
  }
  if (/Request failed with status code 404|Not Found/i.test(str)) {
    return 'The requested resource could not be found.';
  }
  if (/Request failed with status code 5\d\d|Internal Server Error|syntax error|Postgres|violates|duplicate key|P2002/i.test(str)) {
    return 'A server error occurred. Please try again shortly.';
  }
  if (/timeout|ECONNABORTED/i.test(str)) {
    return 'The request timed out. Please check your connection and try again.';
  }
  if (/^Error: /i.test(str)) {
    return sanitizeErrorMessage(str.replace(/^Error: /i, ''), fallback);
  }

  return str;
}

adminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let raw = error.response?.data?.message || error.response?.data?.error || error.message;
    if (error.response?.status === 401) {
      raw = error.response?.data?.message || 'Invalid credentials or session expired.';
    }
    const cleanMessage = sanitizeErrorMessage(raw);
    return Promise.reject(new Error(cleanMessage));
  }
);

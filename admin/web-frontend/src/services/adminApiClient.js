import axios from 'axios';

const ADMIN_TOKEN_KEY = 'vidya_admin_token';
const DEFAULT_TOKEN = 'vidya-admin-secret';

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
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) || DEFAULT_TOKEN;
  if (token) {
    config.headers['x-admin-token'] = token;
  }
  return config;
});

adminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

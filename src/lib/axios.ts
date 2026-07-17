import axios from 'axios';
import { getToken, redirectToLogin } from '@/lib/auth-session';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    config.headers.delete('Content-Type');
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      const isAuthPage = path === '/login' || path === '/register';

      if (!isAuthPage) {
        redirectToLogin();
      }
    }
    return Promise.reject(error);
  }
);

export default api;

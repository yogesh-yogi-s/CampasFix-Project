import axios from 'axios';

function getApiBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const baseUrl = configuredUrl.replace(/\/$/, '');

  // The Express application mounts all REST endpoints beneath /api. Accepting
  // either the API URL or just the deployed server URL prevents a production
  // 404 when the environment variable is configured without that suffix.
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        delete config.headers.Authorization;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      const hadToken = !!localStorage.getItem('token');
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('campusfix:token-cleared'));

      const path = window.location.pathname || '';
      if (hadToken && !path.startsWith('/login') && !path.startsWith('/register')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;

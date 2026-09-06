// This file creates a central Axios API client for your React application.

// Its main job is:

// Send requests to your backend.
// Automatically attach the access token.
// If the access token expires and backend returns 401, automatically ge/t a new access token using the refresh token.
// Retry the original request.
// If refreshing fails, clear the token.

// Think of it as a security + API middleman between your React frontend and backend.

import axios from 'axios';
import { getAccessToken, setAccessToken, clearAccessToken } from './tokenStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(
          `${api.defaults.baseURL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = res.data.accessToken;
        setAccessToken(newToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        clearAccessToken();
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

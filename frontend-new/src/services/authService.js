import api from './api';
import { setAccessToken, clearAccessToken } from './tokenStore';

const authService = {
  loginUser: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    setAccessToken(response.data.accessToken);
    return response.data;
  },

  registerUser: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },

  refreshToken: async () => {
    const response = await api.post('/api/auth/refresh');
    setAccessToken(response.data.accessToken);
    return response.data;
  },

  logoutUser: async () => {
    await api.post('/api/auth/logout');
    clearAccessToken();
  },
};

export default authService;

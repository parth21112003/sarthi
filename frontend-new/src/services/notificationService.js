import api from './api';

const notificationService = {
  list: async () => {
    const response = await api.get('/api/notifications');
    return response.data;
  },

  markRead: async (notificationId) => {
    const response = await api.patch(`/api/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllRead: async () => {
    const response = await api.patch('/api/notifications/read-all');
    return response.data;
  },

  delete: async (notificationId) => {
    const response = await api.delete(`/api/notifications/${notificationId}`);
    return response.data;
  },

  deleteAllRead: async () => {
    const response = await api.delete('/api/notifications/read');
    return response.data;
  },
};

export default notificationService;

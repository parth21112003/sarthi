import api from './api';

const chatService = {
  list: async () => {
    const response = await api.get('/api/chats');
    return response.data;
  },

  start: async (participantId) => {
    const response = await api.post('/api/chats', { participantId });
    return response.data;
  },

  messages: async (chatId) => {
    const response = await api.get(`/api/chats/${chatId}/messages`);
    return response.data;
  },

  send: async (chatId, content) => {
    const response = await api.post(`/api/chats/${chatId}/messages`, { content });
    return response.data;
  },

  markRead: async (chatId) => {
    const response = await api.patch(`/api/chats/${chatId}/read`);
    return response.data;
  },
};

export default chatService;

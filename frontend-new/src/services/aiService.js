import api from './api';

const aiService = {
  chat: async (message, chatHistory = []) => {
    const response = await api.post('/api/ai/chat', { message, chatHistory });
    return response.data;
  },

  generateRoadmap: async (resultId) => {
    const response = await api.post('/api/ai/roadmap', { resultId });
    return response.data;
  },
};

export default aiService;

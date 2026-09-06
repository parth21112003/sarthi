import api from './api';

const meetingService = {
  listMine: async () => {
    const response = await api.get('/api/meetings');
    return response.data;
  },

  stats: async () => {
    const response = await api.get('/api/meetings/stats');
    return response.data;
  },

  create: async (meetingData) => {
    const response = await api.post('/api/meetings', meetingData);
    return response.data;
  },

  updateStatus: async (meetingId, status) => {
    const response = await api.patch(`/api/meetings/${meetingId}/status`, { status });
    return response.data;
  },

  getRoom: async (meetingId) => {
    const response = await api.get(`/api/meetings/${meetingId}/room`);
    return response.data;
  },
};

export default meetingService;

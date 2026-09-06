import api from './api';

const counselorService = {
  list: async (params = {}) => {
    const response = await api.get('/api/counselors', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/counselors/${id}`);
    return response.data;
  },

  getAvailability: async (id) => {
    const response = await api.get(`/api/counselors/${id}/availability`);
    return response.data;
  },

  getBookedSlots: async (id, date) => {
    const response = await api.get(`/api/counselors/${id}/booked-slots`, { params: { date } });
    return response.data;
  },

  saveAvailability: async (slots) => {
    const response = await api.put('/api/counselors/me/availability', { slots });
    return response.data;
  },

  getRecommended: async (limit = 6) => {
    const response = await api.get('/api/counselors/recommended', { params: { limit } });
    return response.data;
  },
};

export default counselorService;

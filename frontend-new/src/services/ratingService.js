import api from './api';

const ratingService = {
  create: async (ratingData) => {
    const response = await api.post('/api/ratings', ratingData);
    return response.data;
  },

  listForCounselor: async (counselorId, params = {}) => {
    const response = await api.get(`/api/ratings/counselor/${counselorId}`, { params });
    return response.data;
  },

  listMine: async () => {
    const response = await api.get('/api/ratings/mine');
    return response.data;
  },
};

export default ratingService;

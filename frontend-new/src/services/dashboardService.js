import api from './api';

const dashboardService = {
  summary: async () => {
    const response = await api.get('/api/dashboard/summary');
    return response.data;
  },
};

export default dashboardService;

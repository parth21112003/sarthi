import api from './api';

const aptitudeService = {
  questions: async () => {
    const response = await api.get('/api/aptitude/questions');
    return response.data;
  },

  results: async () => {
    const response = await api.get('/api/aptitude/results');
    return response.data;
  },

  submit: async (answers) => {
    const response = await api.post('/api/aptitude/submit', { answers });
    return response.data;
  },
};

export default aptitudeService;

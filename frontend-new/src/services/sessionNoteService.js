import api from './api';

const sessionNoteService = {
  create: async (meetingId, content) => {
    const response = await api.post('/api/session-notes', { meetingId, content });
    return response.data;
  },

  getByMeeting: async (meetingId) => {
    const response = await api.get(`/api/session-notes/meeting/${meetingId}`);
    return response.data;
  },

  update: async (noteId, content) => {
    const response = await api.put(`/api/session-notes/${noteId}`, { content });
    return response.data;
  },

  listMine: async () => {
    const response = await api.get('/api/session-notes/mine');
    return response.data;
  },

  listStudent: async () => {
    const response = await api.get('/api/session-notes/student');
    return response.data;
  },
};

export default sessionNoteService;

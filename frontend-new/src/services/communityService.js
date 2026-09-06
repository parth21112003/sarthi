import api from './api';

const communityService = {
  listPosts: async (params = {}) => {
    const response = await api.get('/api/community/posts', { params });
    return response.data;
  },

  createPost: async (postData) => {
    const response = await api.post('/api/community/posts', postData);
    return response.data;
  },

  updatePost: async (postId, postData) => {
    const response = await api.put(`/api/community/posts/${postId}`, postData);
    return response.data;
  },

  deletePost: async (postId) => {
    const response = await api.delete(`/api/community/posts/${postId}`);
    return response.data;
  },

  toggleLike: async (postId) => {
    const response = await api.post(`/api/community/posts/${postId}/like`);
    return response.data;
  },

  addComment: async (postId, content) => {
    const response = await api.post(`/api/community/posts/${postId}/comments`, { content });
    return response.data;
  },
};

export default communityService;

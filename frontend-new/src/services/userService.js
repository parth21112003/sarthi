import api from './api';

const userService = {
  updateProfile: async (profileData) => {
    const response = await api.put('/api/users/profile', profileData);
    return response.data;
  },
};

export default userService;

import axiosInstance from '../utils/axiosinstance';

// Use the centralized axios instance
const api = axiosInstance;

export const userService = {
  searchUsers: (params) => api.get("/users/search", { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  followUser: (userId) => api.post(`/users/follow/${userId}`),
  unfollowUser: (userId) => api.post(`/users/unfollow/${userId}`),
};

export default userService;

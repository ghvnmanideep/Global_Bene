import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach accessToken in requests when needed
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyEmail: (token) => api.get(`/auth/verify/${token}`),
  forgot: (email) => api.post('/auth/forgot', { email }),
  reset: (token, data) => api.post(`/auth/reset/${token}`, data),
  getMe: () => api.get('/users/me'),
  updateProfile: (formData) =>
    api.put('/users/update', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  changePassword: (newPassword) => api.put('/users/password', { newPassword }),
  // Followers
  followUser: (userId) => api.post(`/users/${userId}/follow`),
  unfollowUser: (userId) => api.post(`/users/${userId}/unfollow`),
  // User search (by username or partial match)
  searchUsers: (query) => api.get(`/users/search`, { params: { q: query } }),
  getUserById: (id) => api.get(`/users/${id}`),
};


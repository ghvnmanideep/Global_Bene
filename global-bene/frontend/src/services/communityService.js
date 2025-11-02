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

export const communityService = {
  getAllCommunities: (params) => api.get('/communities', { params }),
  getCommunityById: (id) => api.get(`/communities/${id}`),
  createCommunity: (data) => api.post('/communities', data),
  toggleJoinCommunity: (id) => api.post(`/communities/${id}/join`),
  updateCommunity: (id, data) => api.put(`/communities/${id}`, data),
  getUserSavedPosts: () => api.get('/communities/user/saved'),
  getUserCommunities: () => api.get('/communities/user/joined'),
};


import axios from 'axios';
import axiosInstance from '../utils/axiosinstance';

// Create authenticated API instance
const api = axiosInstance;

// Create public API instance without auth interceptor
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const postService = {
  getAllPosts: (params) => publicApi.get('/posts', { params }),
  getPostById: (id) => publicApi.get(`/posts/${id}`),
  createPost: (data) => {
    if (data instanceof FormData) {
      return api.post('/posts', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.post('/posts', data);
  },
  updatePost: (id, data) => {
    if (data instanceof FormData) {
      return api.put(`/posts/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.put(`/posts/${id}`, data);
  },
  votePost: (id, voteType) => api.post(`/votes/post/${id}/${voteType === 'upvote' ? 'up' : 'down'}`),
  removeVote: (id) => api.post(`/votes/post/${id}/up`), // Use same endpoint for toggle
  toggleSavePost: (id) => api.post(`/posts/${id}/save`),
  deletePost: (id) => api.delete(`/posts/${id}`),
};


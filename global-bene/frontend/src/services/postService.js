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

// Handle 401 responses by clearing token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('user');
      // Optionally redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Public API instance without auth interceptor
const publicApi = axios.create({
  baseURL: API,
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


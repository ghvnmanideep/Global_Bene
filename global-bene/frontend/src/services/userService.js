import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const api = axios.create({
  baseURL: API,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export const userService = {
  searchUsers: (params) => api.get('/users/search', { params })
};

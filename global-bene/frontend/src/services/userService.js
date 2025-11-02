import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ✅ Token interceptor
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const userService = {
  searchUsers: (params) => api.get("/users/search", { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  followUser: (userId) => api.post(`/users/follow/${userId}`),
  unfollowUser: (userId) => api.post(`/users/unfollow/${userId}`),
};

export default userService;

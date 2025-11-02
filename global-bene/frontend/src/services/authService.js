import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Attach access token automatically
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Clear token on 401 to avoid repeated unauthorized calls
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      sessionStorage.removeItem('accessToken');
    }
    return Promise.reject(error);
  }
);

export const authService = {
  // Authentication
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  verifyEmail: (token) => api.get(`/auth/verify/${token}`),
  forgot: (email) => api.post("/auth/forgot", { email }),
  reset: (token, data) => api.post(`/auth/reset/${token}`, data),

  // Profile
  getMe: () => api.get("/users/me"),
  updateProfile: (formData) =>
    api.put("/users/update", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  changePassword: (newPassword) =>
    api.put("/users/password", { newPassword }),

  // Followers — ✅ matches backend routes
  followUser: (userId) => api.post(`/users/${userId}/follow`),
  unfollowUser: (userId) => api.post(`/users/${userId}/unfollow`),

  // User utilities
  searchUsers: (query) => api.get("/users/search", { params: { q: query } }),
  getUserById: (id) => api.get(`/users/${id}`),
};

export default authService;

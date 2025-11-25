import axiosInstance from '../utils/axiosinstance';

// Use the centralized axios instance
const api = axiosInstance;

export const commentService = {
  getPostComments: (postId) => api.get(`/comments/post/${postId}`),
  createComment: (postId, data) => api.post(`/comments/post/${postId}`, data),
  voteComment: (id, voteType) => api.post(`/comments/${id}/vote`, { voteType }),
  updateComment: (id, data) => api.put(`/comments/${id}`, data),
  deleteComment: (id) => api.delete(`/comments/${id}`),
};


import axiosInstance from '../utils/axiosinstance';

// Use the centralized axios instance
const api = axiosInstance;

export const communityService = {
  getAllCommunities: (params) => api.get('/communities', { params }),
  getCommunityById: (id) => api.get(`/communities/${id}`),
  createCommunity: (data) => api.post('/communities', data),
  toggleJoinCommunity: (id) => api.post(`/communities/${id}/join`),
  updateCommunity: (id, data) => api.put(`/communities/${id}`, data),
  getUserSavedPosts: () => api.get('/communities/user/saved'),
  getUserCommunities: () => api.get('/communities/user/joined'),

  // Moderator management
  promoteToModerator: (id, userId) => api.post(`/communities/${id}/moderators`, { userId }),
  demoteModerator: (id, userId) => api.delete(`/communities/${id}/moderators`, { data: { userId } }),
  getCommunityMembers: (id) => api.get(`/communities/${id}/members`),
  removeMember: (id, userId) => api.delete(`/communities/${id}/members`, { data: { userId } }),

  // Community admin functions
  deleteCommunity: (id) => api.delete(`/communities/${id}`),
  deletePost: (postId) => api.delete(`/posts/${postId}`),
  deleteCommunityUser: (id, userId) => api.delete(`/communities/${id}/users`, { data: { userId } }),
  transferOwnership: (id, newOwnerId) => api.post(`/communities/${id}/transfer-ownership`, { newOwnerId }),

  // User groups management
  createUserGroup: (id, groupData) => api.post(`/communities/${id}/groups`, groupData),
  getUserGroups: (id) => api.get(`/communities/${id}/groups`),
  addUserToGroup: (id, groupId, userId) => api.post(`/communities/${id}/groups/${groupId}/users`, { userId }),
  removeUserFromGroup: (id, groupId, userId) => api.delete(`/communities/${id}/groups/${groupId}/users`, { data: { userId } }),
};


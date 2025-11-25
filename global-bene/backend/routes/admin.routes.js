const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyJWT } = require('../middleware/auth.middleware');
const { adminRequired } = require('../middleware/admin.middleware');

// All admin routes require authentication and admin role
router.use(verifyJWT);
router.use(adminRequired);

// =================== USER MANAGEMENT ===================
router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/ban', adminController.toggleUserBan);

// =================== POST MANAGEMENT ===================
router.get('/posts', adminController.getAllPosts);
router.delete('/posts/:id', adminController.deletePost);

// =================== NOTIFICATIONS ===================
router.post('/notifications/user/:userId', adminController.sendNotificationToUser);
router.post('/notifications/all', adminController.sendNotificationToAll);

// =================== DASHBOARD ===================
router.get('/dashboard/stats', adminController.getDashboardStats);

// =================== SPAM MANAGEMENT ===================
router.post('/posts/:id/report', adminController.reportPost);
router.get('/posts/reported', adminController.getReportedPosts);
router.get('/spam-posts', adminController.getSpamPosts);
router.put('/spam-posts/:id/restore', adminController.restoreSpamPost);
router.get('/users/:userId/spam-posts', adminController.getUserSpamPosts);

// =================== COMMUNITY MANAGEMENT ===================
router.get('/communities', adminController.getAllCommunities);
router.delete('/communities/:id', adminController.deleteCommunity);
router.put('/communities/:id', adminController.updateCommunity);
router.delete('/communities/:id/members/:userId', adminController.removeCommunityMember);

module.exports = router;
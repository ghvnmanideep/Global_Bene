const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendation.controller');
const { authRequired } = require('../middleware/auth.middleware');
const { adminRequired } = require('../middleware/admin.middleware');

// Public recommendation routes (require authentication)
router.use(authRequired);

// Get recommended posts for a user
router.get('/users/:userId/posts', recommendationController.getRecommendedPostsForUser);

// Get recommended communities for a user
router.get('/users/:userId/communities', recommendationController.getRecommendedCommunitiesForUser);

// Get recommended users to follow
router.get('/users/:userId/follow-suggestions', recommendationController.getRecommendedUsersToFollow);

// Admin-only routes for analytics
router.use(adminRequired);

// Get all interaction logs for AI team
router.get('/interaction-logs', recommendationController.getInteractionLogs);

// Get interaction logs for specific user
router.get('/users/:userId/interaction-logs', recommendationController.getUserInteractionLogs);

// Alias for activities
router.get('/users/:userId/activities', recommendationController.getUserInteractionLogs);

// Get interaction statistics
router.get('/stats', recommendationController.getInteractionStats);

module.exports = router;
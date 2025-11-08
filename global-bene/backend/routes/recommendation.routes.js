const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendation.controller');
const { authRequired } = require('../middleware/auth.middleware');
const { adminRequired } = require('../middleware/admin.middleware');

// All recommendation routes require authentication and admin access
router.use(authRequired);
router.use(adminRequired);

// Get all interaction logs for AI team
router.get('/interaction-logs', recommendationController.getInteractionLogs);

// Get interaction logs for specific user
router.get('/users/:userId/interaction-logs', recommendationController.getUserInteractionLogs);

// Get interaction statistics
router.get('/stats', recommendationController.getInteractionStats);

module.exports = router;
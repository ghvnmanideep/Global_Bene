const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { verifyJWT } = require('../middleware/auth.middleware');

// All notification routes require authentication
router.use(verifyJWT);

// Get notifications
router.get('/', notificationController.getNotifications);

// Mark notification as read
router.put('/:id/read', notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);

// Get unread notification count
router.get('/unread-count', notificationController.getUnreadCount);

module.exports = router;

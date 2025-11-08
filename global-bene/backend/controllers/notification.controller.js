const Notification = require('../models/notification');

// Helper function to create a notification
const createNotification = async (userId, type, message, relatedUser = null, relatedPost = null, relatedComment = null, relatedCommunity = null) => {
  try {
    const notification = new Notification({
      user: userId,
      type,
      message,
      relatedUser,
      relatedPost,
      relatedComment,
      relatedCommunity,
    });
    await notification.save();
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

// Create spam notification
const createSpamNotification = async (userId, postId, postTitle, reason, confidence) => {
  try {
    const message = `Your post "${postTitle}" has been flagged as spam (confidence: ${(confidence * 100).toFixed(1)}%). Reason: ${reason}`;
    await createNotification(userId, 'spam', message, null, postId);
  } catch (err) {
    console.error('Error creating spam notification:', err);
  }
};

// Create ban notification
const createBanNotification = async (userId, reason) => {
  try {
    const message = `Your account has been banned. Reason: ${reason}`;
    await createNotification(userId, 'ban', message);
  } catch (err) {
    console.error('Error creating ban notification:', err);
  }
};

// Get notifications for the current user
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ user: userId })
      .populate('relatedUser', 'username profile')
      .populate('relatedPost', 'title')
      .populate('relatedComment', 'content')
      .populate('relatedCommunity', 'name displayName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments({ user: userId });

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read', notification });
  } catch (err) {
    console.error('Mark as read error:', err);
    res.status(500).json({ message: 'Server error marking notification as read' });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all as read error:', err);
    res.status(500).json({ message: 'Server error marking all notifications as read' });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.countDocuments({ user: userId, isRead: false });
    res.json({ unreadCount: count });
  } catch (err) {
    console.error('Get unread count error:', err);
    res.status(500).json({ message: 'Server error fetching unread count' });
  }
};

module.exports = { createNotification, createSpamNotification, createBanNotification, getNotifications: exports.getNotifications, markAsRead: exports.markAsRead, markAllAsRead: exports.markAllAsRead, getUnreadCount: exports.getUnreadCount };

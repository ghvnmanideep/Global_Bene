const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['comment', 'upvote', 'downvote', 'follow', 'mention', 'reply', 'admin_message', 'spam', 'ban'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  relatedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
  },
  relatedComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
  },
  relatedCommunity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Notification', notificationSchema);
  
const mongoose = require('mongoose');

const userInteractionLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      enum: [
        'view_post',
        'like_post',
        'unlike_post',
        'save_post',
        'unsave_post',
        'comment_post',
        'vote_post_up',
        'vote_post_down',
        'remove_vote_post',
        'follow_user',
        'unfollow_user',
        'join_community',
        'leave_community',
        'search',
        'view_profile',
        'share_post'
      ]
    },
    targetType: {
      type: String,
      required: true,
      enum: ['post', 'comment', 'user', 'community', 'search']
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: function() { return this.targetType !== 'search'; },
      index: true
    },
    metadata: {
      // Additional context data
      postCategory: String,
      postType: String, // 'text', 'image', 'link'
      communityId: mongoose.Schema.Types.ObjectId,
      searchQuery: String,
      timeSpent: Number, // in seconds
      scrollDepth: Number, // percentage
      deviceType: String,
      userAgent: String,
      ipAddress: String,
      sessionId: String
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
userInteractionLogSchema.index({ userId: 1, timestamp: -1 });
userInteractionLogSchema.index({ action: 1, timestamp: -1 });
userInteractionLogSchema.index({ targetType: 1, targetId: 1, timestamp: -1 });
userInteractionLogSchema.index({ 'metadata.communityId': 1, timestamp: -1 });

// TTL index to automatically delete logs after 90 days
userInteractionLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const UserInteractionLog = mongoose.models.UserInteractionLog || mongoose.model('UserInteractionLog', userInteractionLogSchema);

module.exports = UserInteractionLog;
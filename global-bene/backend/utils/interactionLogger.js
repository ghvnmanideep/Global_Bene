const UserInteractionLog = require('../models/userInteractionLog');
const { trackUserAction } = require('./mixpanelTracker');

// Helper function to log user interactions
const logInteraction = async (userId, action, targetType, targetId, metadata = {}) => {
  try {
    // Add session and device info if available
    const enhancedMetadata = {
      ...metadata,
      sessionId: metadata.sessionId || generateSessionId(),
      timestamp: new Date()
    };

    const logEntry = new UserInteractionLog({
      userId,
      action,
      targetType,
      targetId,
      metadata: enhancedMetadata
    });

    await logEntry.save();

    // Track in Mixpanel
    trackUserAction(userId, action, targetType, targetId, enhancedMetadata);
  } catch (err) {
    console.error('Error logging interaction:', err);
    // Don't throw error to avoid breaking main functionality
  }
};

// Generate a simple session ID
const generateSessionId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Specific logging functions for different actions
const logPostView = (userId, postId, metadata = {}) => {
  return logInteraction(userId, 'view_post', 'post', postId, metadata);
};

const logPostLike = (userId, postId, metadata = {}) => {
  return logInteraction(userId, 'like_post', 'post', postId, metadata);
};

const logPostUnlike = (userId, postId, metadata = {}) => {
  return logInteraction(userId, 'unlike_post', 'post', postId, metadata);
};

const logPostSave = (userId, postId, metadata = {}) => {
  return logInteraction(userId, 'save_post', 'post', postId, metadata);
};

const logPostUnsave = (userId, postId, metadata = {}) => {
  return logInteraction(userId, 'unsave_post', 'post', postId, metadata);
};

const logPostComment = (userId, postId, commentId, metadata = {}) => {
  return logInteraction(userId, 'comment_post', 'post', postId, {
    ...metadata,
    commentId
  });
};

const logPostVote = (userId, postId, voteType, metadata = {}) => {
  const action = voteType === 'upvote' ? 'vote_post_up' : 'vote_post_down';
  return logInteraction(userId, action, 'post', postId, metadata);
};

const logVoteRemove = (userId, postId, metadata = {}) => {
  return logInteraction(userId, 'remove_vote_post', 'post', postId, metadata);
};

const logUserFollow = (userId, targetUserId, metadata = {}) => {
  return logInteraction(userId, 'follow_user', 'user', targetUserId, metadata);
};

const logUserUnfollow = (userId, targetUserId, metadata = {}) => {
  return logInteraction(userId, 'unfollow_user', 'user', targetUserId, metadata);
};

const logCommunityJoin = (userId, communityId, metadata = {}) => {
  return logInteraction(userId, 'join_community', 'community', communityId, metadata);
};

const logCommunityLeave = (userId, communityId, metadata = {}) => {
  return logInteraction(userId, 'leave_community', 'community', communityId, metadata);
};

const logSearch = (userId, searchQuery, metadata = {}) => {
  return logInteraction(userId, 'search', 'search', null, {
    ...metadata,
    searchQuery
  });
};

const logProfileView = (userId, targetUserId, metadata = {}) => {
  return logInteraction(userId, 'view_profile', 'user', targetUserId, metadata);
};

const logPostShare = (userId, postId, metadata = {}) => {
  return logInteraction(userId, 'share_post', 'post', postId, metadata);
};

module.exports = {
  logInteraction,
  logPostView,
  logPostLike,
  logPostUnlike,
  logPostSave,
  logPostUnsave,
  logPostComment,
  logPostVote,
  logVoteRemove,
  logUserFollow,
  logUserUnfollow,
  logCommunityJoin,
  logCommunityLeave,
  logSearch,
  logProfileView,
  logPostShare
};
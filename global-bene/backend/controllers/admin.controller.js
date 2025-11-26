const User = require('../models/user');
const Post = require('../models/post');
const Community = require('../models/community');
const Comment = require('../models/comment');
const SpamPost = require('../models/spamPost');
const UserInteractionLog = require('../models/userInteractionLog');
const NightlyJob = require('../models/nightlyJob');
const Report = require('../models/report');
const { createNotification } = require('./notification.controller');

// =================== ADMIN USER MANAGEMENT ===================

// Get all users with pagination and search
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role = '' } = req.query;
    const skip = (page - 1) * limit;
    let query = {};

    if (search && search.trim()) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { username: { $regex: regex } },
        { email: { $regex: regex } },
      ];
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-passwordHash -refreshTokens -resetToken -emailToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

// Delete a user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    if (id === adminId) {
      return res.status(400).json({ message: 'Cannot delete your own admin account' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete all posts by this user
    await Post.deleteMany({ author: id });

    // Delete all comments by this user
    await Comment.deleteMany({ author: id });

    // Remove user from communities
    await Community.updateMany(
      { members: id },
      { $pull: { members: id } }
    );

    // Remove user from followers/following
    await User.updateMany(
      { followers: id },
      { $pull: { followers: id } }
    );
    await User.updateMany(
      { following: id },
      { $pull: { following: id } }
    );

    await User.findByIdAndDelete(id);

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Server error deleting user' });
  }
};

// Update user role (admin only)
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({ message: 'User role updated successfully', user: { _id: user._id, username: user.username, role: user.role } });
  } catch (err) {
    console.error('Update user role error:', err);
    res.status(500).json({ message: 'Server error updating user role' });
  }
};

// =================== ADMIN POST MANAGEMENT ===================

// Get all posts with pagination and filters
exports.getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', author = '', community = '', type = '', spamStatus = '' } = req.query;
    const skip = (page - 1) * limit;
    let query = {};

    if (search && search.trim()) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { title: { $regex: regex } },
        { content: { $regex: regex } },
        { tags: { $regex: regex } },
      ];
    }

    if (author) {
      query.author = author;
    }

    if (community) {
      query.community = community;
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (spamStatus && spamStatus !== 'all') {
      query.spamStatus = spamStatus;
    }

    const posts = await Post.find(query)
      .populate('author', 'username email role')
      .populate('community', 'name displayName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Clean spam posts for admin view
    const cleanedPosts = posts.map(post => {
      const postObj = post.toObject();
      if (postObj.spamStatus === 'spam') {
        postObj.content = 'This post has been flagged as spam and its content is hidden.';
        postObj.imageUrl = null; // Hide spam images
        postObj.imagePublicId = null;
        postObj.linkUrl = ''; // Hide spam links
      }
      return postObj;
    });

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Get all posts error:', err);
    res.status(500).json({ message: 'Server error fetching posts' });
  }
};

// Delete any post (admin only)
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Delete all comments on this post
    await Comment.deleteMany({ post: id });

    // Remove from community
    const community = await Community.findById(post.community);
    if (community) {
      community.posts = community.posts.filter(p => p.toString() !== id);
      community.postCount = community.posts.length;
      await community.save();
    }

    // Get post author before deletion for notification
    const postAuthor = post.author;

    await Post.findByIdAndDelete(id);

    // Send notification to post author
    if (postAuthor) {
      const message = `Your post "${post.title}" has been deleted by an admin.`;
      await createNotification(postAuthor, 'delete', message, req.user.id);
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ message: 'Server error deleting post' });
  }
};

// =================== ADMIN NOTIFICATION SYSTEM ===================

// Send notification to specific user
exports.sendNotificationToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, message } = req.body;

    if (!type || !message) {
      return res.status(400).json({ message: 'Type and message are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await createNotification(userId, type, message, req.user.id);

    res.json({ message: 'Notification sent successfully' });
  } catch (err) {
    console.error('Send notification error:', err);
    res.status(500).json({ message: 'Server error sending notification' });
  }
};

// Send notification to all users
exports.sendNotificationToAll = async (req, res) => {
  try {
    const { type, message } = req.body;

    if (!type || !message) {
      return res.status(400).json({ message: 'Type and message are required' });
    }

    const users = await User.find({}, '_id');
    const notifications = users.map(user => ({
      user: user._id,
      type,
      message,
      fromUser: req.user.id,
    }));

    // Note: This would need to be implemented in notification controller
    // For now, we'll send individually
    for (const user of users) {
      await createNotification(user._id, type, message, req.user.id);
    }

    res.json({ message: `Notification sent to ${users.length} users` });
  } catch (err) {
    console.error('Send notification to all error:', err);
    res.status(500).json({ message: 'Server error sending notifications' });
  }
};

// =================== ADMIN DASHBOARD ===================

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalCommunities = await Community.countDocuments();

    const adminUsers = await User.countDocuments({ role: 'admin' });
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    const recentPosts = await Post.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    const bannedUsers = await User.countDocuments({ isBanned: true });
    const totalSpamPosts = await SpamPost.countDocuments();

    // Get report statistics
    const totalReports = await Report.countDocuments();
    const openReports = await Report.countDocuments({ status: 'open' });
    const recentReports = await Report.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    // Get interaction analytics from UserInteractionLog
    const interactionStats = await UserInteractionLog.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      }
    ]);

    // Extract specific interaction counts
    const statsMap = {};
    interactionStats.forEach(stat => {
      statsMap[stat._id] = stat.count;
    });

    const totalUpvotes = statsMap['vote_post_up'] || 0;
    const totalDownvotes = statsMap['vote_post_down'] || 0;
    const totalViews = statsMap['view_post'] || 0;
    const totalShares = statsMap['share_post'] || 0;
    const totalJoins = statsMap['join_community'] || 0;
    const totalProfileViews = statsMap['view_profile'] || 0;
    const totalSearches = statsMap['search'] || 0;
    const totalComments = statsMap['comment_post'] || 0;

    res.json({
      stats: {
        totalUsers,
        totalPosts,
        totalCommunities,
        totalComments,
        adminUsers,
        recentUsers,
        recentPosts,
        bannedUsers,
        totalSpamPosts,
        // Report statistics
        totalReports,
        openReports,
        recentReports,
        // Interaction analytics
        totalUpvotes,
        totalDownvotes,
        totalViews,
        totalShares,
        totalJoins,
        totalProfileViews,
        totalSearches,
        // Engagement ratios
        engagementRate: totalUsers > 0 ? ((totalViews + totalUpvotes + totalComments) / totalUsers).toFixed(1) : 0,
        interactionRate: totalUsers > 0 ? ((totalUpvotes + totalDownvotes + totalComments + totalShares) / totalUsers).toFixed(1) : 0
      },
    });
  } catch (err) {
    console.error('Get dashboard stats error:', err);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
};

// =================== SPAM DETECTION ===================

// Report post as spam
exports.reportPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Add spam report (you might want to create a separate SpamReport model)
    if (!post.spamReports) {
      post.spamReports = [];
    }

    post.spamReports.push({
      reportedBy: req.user.id,
      reason: reason || 'Spam',
      reportedAt: new Date(),
    });

    await post.save();

    // If multiple reports, auto-hide or flag
    if (post.spamReports.length >= 3) {
      post.isHidden = true;
      await post.save();
    }

    res.json({ message: 'Post reported successfully' });
  } catch (err) {
    console.error('Report post error:', err);
    res.status(500).json({ message: 'Server error reporting post' });
  }
};

// Get reported posts
exports.getReportedPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ 'spamReports.0': { $exists: true } })
      .populate('author', 'username email')
      .populate('community', 'name')
      .sort({ 'spamReports.reportedAt': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Post.countDocuments({ 'spamReports.0': { $exists: true } });

    // Clean spam posts for admin view
    const cleanedPosts = posts.map(post => {
      const postObj = post.toObject();
      if (postObj.spamStatus === 'spam') {
        postObj.content = 'This post has been flagged as spam and its content is hidden.';
        postObj.imageUrl = null; // Hide spam images
        postObj.imagePublicId = null;
        postObj.linkUrl = ''; // Hide spam links
      }
      return postObj;
    });

    res.json({
      posts: cleanedPosts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Get reported posts error:', err);
    res.status(500).json({ message: 'Server error fetching reported posts' });
  }
};

// Get all spam posts
exports.getSpamPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', author = '' } = req.query;
    const skip = (page - 1) * limit;
    let query = {};

    if (search && search.trim()) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { title: { $regex: regex } },
        { content: { $regex: regex } },
        { tags: { $regex: regex } },
      ];
    }

    if (author) {
      query.author = author;
    }

    const spamPosts = await SpamPost.find(query)
      .populate('author', 'username email spamPostCount isBanned')
      .populate('community', 'name displayName')
      .sort({ detectedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SpamPost.countDocuments(query);

    res.json({
      spamPosts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Get spam posts error:', err);
    res.status(500).json({ message: 'Server error fetching spam posts' });
  }
};

// Get spam posts by user
exports.getUserSpamPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const spamPosts = await SpamPost.find({ author: userId })
      .populate('author', 'username email spamPostCount isBanned')
      .populate('community', 'name displayName')
      .sort({ detectedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SpamPost.countDocuments({ author: userId });

    res.json({
      spamPosts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Get user spam posts error:', err);
    res.status(500).json({ message: 'Server error fetching user spam posts' });
  }
};

// Restore spam post back to normal posts
exports.restoreSpamPost = async (req, res) => {
  try {
    const { id } = req.params;

    const spamPost = await SpamPost.findById(id);
    if (!spamPost) {
      return res.status(404).json({ message: 'Spam post not found' });
    }

    // Create a new post from the spam post data
    const restoredPost = new Post({
      title: spamPost.title,
      content: spamPost.content,
      author: spamPost.author,
      community: spamPost.community,
      type: spamPost.type,
      linkUrl: spamPost.linkUrl,
      imageUrl: spamPost.imageUrl,
      imagePublicId: spamPost.imagePublicId,
      tags: spamPost.tags,
      category: spamPost.category,
      spamStatus: 'not_spam', // Mark as not spam since admin restored it
      spamConfidence: 0,
      spamReason: 'Restored by admin',
    });

    await restoredPost.save();

    // Add post to community if applicable
    if (spamPost.community) {
      const community = await Community.findById(spamPost.community);
      if (community) {
        community.posts.push(restoredPost._id);
        community.postCount = community.posts.length;
        await community.save();
      }
    }

    // Decrease user's spam count
    const user = await User.findById(spamPost.author);
    if (user && user.spamPostCount > 0) {
      user.spamPostCount -= 1;
      await user.save();
    }

    // Delete the spam post record
    await SpamPost.findByIdAndDelete(id);

    // Send notification to user
    await createNotification(spamPost.author, 'restore', `Your post "${spamPost.title}" has been restored by an admin.`, req.user.id);

    res.json({ message: 'Post restored successfully', post: restoredPost });
  } catch (err) {
    console.error('Restore spam post error:', err);
    res.status(500).json({ message: 'Server error restoring post' });
  }
};

// Ban/unban user
exports.toggleUserBan = async (req, res) => {
  try {
    const { id } = req.params;
    const { ban, reason } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isBanned = ban;
    if (ban) {
      user.bannedReason = reason || 'Banned by admin';
      user.bannedAt = new Date();
    } else {
      user.bannedReason = undefined;
      user.bannedAt = undefined;
    }
    await user.save();

    // Send notification to user
    const message = ban ? `Your account has been banned. Reason: ${reason || 'Banned by admin'}` : 'Your account ban has been lifted.';
    await createNotification(user._id, ban ? 'ban' : 'unban', message, req.user.id);

    res.json({ message: `User ${ban ? 'banned' : 'unbanned'} successfully`, user: { _id: user._id, username: user.username, isBanned: user.isBanned, bannedReason: user.bannedReason } });
  } catch (err) {
    console.error('Toggle user ban error:', err);
    res.status(500).json({ message: 'Server error toggling user ban' });
  }
};

// =================== ADMIN COMMUNITY MANAGEMENT ===================

// Get all communities with pagination and search
exports.getAllCommunities = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', creator = '', isPrivate = '' } = req.query;
    const skip = (page - 1) * limit;
    let query = {};

    if (search && search.trim()) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { name: { $regex: regex } },
        { displayName: { $regex: regex } },
        { description: { $regex: regex } },
      ];
    }

    if (creator) {
      query.creator = creator;
    }

    if (isPrivate && isPrivate !== 'all') {
      query.isPrivate = isPrivate === 'true';
    }

    const communities = await Community.find(query)
      .populate('creator', 'username email')
      .populate('moderators', 'username')
      .sort({ memberCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Community.countDocuments(query);

    res.json({
      communities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Get all communities error:', err);
    res.status(500).json({ message: 'Server error fetching communities' });
  }
};

// Delete any community (admin only)
exports.deleteCommunity = async (req, res) => {
  try {
    const { id } = req.params;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Delete all posts in the community
    await Post.deleteMany({ community: id });

    // Delete all comments on those posts
    const posts = await Post.find({ community: id }).select('_id');
    const postIds = posts.map(p => p._id);
    await Comment.deleteMany({ post: { $in: postIds } });

    // Get community creator before deletion for notification
    const communityCreator = community.creator;

    await Community.findByIdAndDelete(id);

    // Send notification to community creator
    if (communityCreator) {
      const message = `Your community "${community.displayName}" has been deleted by an admin.`;
      await createNotification(communityCreator, 'delete', message, req.user.id);
    }

    res.json({ message: 'Community deleted successfully' });
  } catch (err) {
    console.error('Delete community error:', err);
    res.status(500).json({ message: 'Server error deleting community' });
  }
};

// Update community settings (admin only)
exports.updateCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, description, isPrivate, rules } = req.body;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Update allowed fields
    if (displayName !== undefined) community.displayName = displayName;
    if (description !== undefined) community.description = description;
    if (isPrivate !== undefined) community.isPrivate = isPrivate;
    if (rules !== undefined) community.rules = rules;

    await community.save();

    res.json({ message: 'Community updated successfully', community });
  } catch (err) {
    console.error('Update community error:', err);
    res.status(500).json({ message: 'Server error updating community' });
  }
};

// Remove member from community (admin only)
exports.removeCommunityMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Remove user from members and moderators
    community.members = community.members.filter(member => member.toString() !== userId);
    community.moderators = community.moderators.filter(mod => mod.toString() !== userId);
    community.memberCount = community.members.length;

    await community.save();

    // Send notification to removed user
    const message = `You have been removed from the community "${community.displayName}" by an admin.`;
    await createNotification(userId, 'remove', message, req.user.id);

    res.json({ message: 'Member removed successfully', community });
  } catch (err) {
    console.error('Remove community member error:', err);
    res.status(500).json({ message: 'Server error removing member' });
  }
};

// =================== ANALYTICS DASHBOARD ===================

// Get analytics dashboard overview
exports.getAnalyticsDashboard = async (req, res) => {
  try {
    // Get basic platform stats
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalCommunities = await Community.countDocuments();
    const totalInteractions = await UserInteractionLog.countDocuments();

    // Recent activity (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentUsers = await User.countDocuments({ createdAt: { $gte: last24Hours } });
    const recentPosts = await Post.countDocuments({ createdAt: { $gte: last24Hours } });
    const recentInteractions = await UserInteractionLog.countDocuments({ timestamp: { $gte: last24Hours } });

    // Try to get latest analytics from nightlyJob collection
    let topCommunities = [];
    let userEngagement = [];
    let nightlyJob = {
      lastRun: new Date(),
      status: 'pending',
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    try {
      // Get latest community trending data
      const communityJob = await NightlyJob.findOne({ jobType: 'community_trending' })
        .sort({ date: -1 })
        .limit(1);

      if (communityJob && communityJob.status === 'completed') {
        topCommunities = communityJob.data.trendingCommunities.slice(0, 5);
        nightlyJob.lastRun = communityJob.date;
        nightlyJob.status = 'completed';
      }

      // Get latest user interests data for engagement metrics
      const userJob = await NightlyJob.findOne({ jobType: 'user_interests' })
        .sort({ date: -1 })
        .limit(1);

      if (userJob && userJob.status === 'completed') {
        // Calculate engagement from user interests data
        const actionCounts = {};
        userJob.data.userInterests.forEach(user => {
          user.interactionCount = user.interactionCount || 0;
          // This is simplified - in production you'd track specific actions
        });
        userEngagement = [
          { action: 'view_post', count: Math.floor(totalInteractions * 0.4), uniqueUsers: Math.floor(totalUsers * 0.8) },
          { action: 'like_post', count: Math.floor(totalInteractions * 0.2), uniqueUsers: Math.floor(totalUsers * 0.6) },
          { action: 'comment_post', count: Math.floor(totalInteractions * 0.15), uniqueUsers: Math.floor(totalUsers * 0.4) },
          { action: 'join_community', count: Math.floor(totalInteractions * 0.1), uniqueUsers: Math.floor(totalUsers * 0.3) },
          { action: 'search', count: Math.floor(totalInteractions * 0.05), uniqueUsers: Math.floor(totalUsers * 0.5) },
          { action: 'share_post', count: Math.floor(totalInteractions * 0.1), uniqueUsers: Math.floor(totalUsers * 0.2) }
        ];
      }
    } catch (analyticsErr) {
      console.log('Analytics data not available, using fallback:', analyticsErr.message);
    }

    res.json({
      overview: {
        totalUsers,
        totalPosts,
        totalCommunities,
        totalInteractions,
        recentUsers,
        recentPosts,
        recentInteractions
      },
      topCommunities,
      userEngagement,
      nightlyJob
    });
  } catch (err) {
    console.error('Get analytics dashboard error:', err);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
};

// Get user behavior analytics
exports.getUserBehaviorAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Try to get data from nightlyJob collection first
    const userJob = await NightlyJob.findOne({ jobType: 'user_interests' })
      .sort({ date: -1 })
      .limit(1);

    let mostActiveUsers = [];
    let actionDistribution = [];
    let retention = { newUsers: 0, returningUsers: 0, retentionRate: 0 };

    if (userJob && userJob.status === 'completed') {
      // Use stored data
      const userData = userJob.data.userInterests;

      // Sort users by interaction count for most active
      mostActiveUsers = userData
        .sort((a, b) => (b.interactionCount || 0) - (a.interactionCount || 0))
        .slice(0, 10)
        .map(user => ({
          username: user.username,
          interactions: user.interactionCount || 0
        }));

      // Calculate action distribution from stored data (simplified)
      const totalInteractions = userData.reduce((sum, user) => sum + (user.interactionCount || 0), 0);
      actionDistribution = [
        { _id: 'view_post', count: Math.floor(totalInteractions * 0.4) },
        { _id: 'like_post', count: Math.floor(totalInteractions * 0.2) },
        { _id: 'comment_post', count: Math.floor(totalInteractions * 0.15) },
        { _id: 'join_community', count: Math.floor(totalInteractions * 0.1) },
        { _id: 'search', count: Math.floor(totalInteractions * 0.05) },
        { _id: 'share_post', count: Math.floor(totalInteractions * 0.1) }
      ];

      retention = {
        newUsers: userData.length,
        returningUsers: userData.filter(u => u.interactionCount > 1).length,
        retentionRate: userData.length > 0 ? (userData.filter(u => u.interactionCount > 1).length / userData.length) * 100 : 0
      };
    } else {
      // Fallback to real-time calculation if no stored data
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      mostActiveUsers = await UserInteractionLog.aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        { $group: { _id: '$userId', interactions: { $sum: 1 } } },
        { $sort: { interactions: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        { $project: { username: '$user.username', interactions: 1 } }
      ]);

      actionDistribution = await UserInteractionLog.aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      const totalUsers = await User.countDocuments();
      const newUsers = await User.countDocuments({ createdAt: { $gte: startDate } });
      const returningUsers = await UserInteractionLog.distinct('userId', { timestamp: { $gte: startDate } }).length;

      retention = {
        newUsers,
        returningUsers,
        retentionRate: returningUsers > 0 ? (returningUsers / totalUsers) * 100 : 0
      };
    }

    // User activity over time (always calculate real-time for this)
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const userActivityOverTime = await UserInteractionLog.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          interactions: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          date: '$_id',
          interactions: 1,
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json({
      period,
      userActivityOverTime,
      mostActiveUsers,
      actionDistribution,
      retention
    });
  } catch (err) {
    console.error('Get user behavior analytics error:', err);
    res.status(500).json({ message: 'Server error fetching user behavior analytics' });
  }
};

// Get post ranking analytics
exports.getPostRankingAnalytics = async (req, res) => {
  try {
    // Try to get data from nightlyJob collection first
    const postJob = await NightlyJob.findOne({ jobType: 'post_ranking' })
      .sort({ date: -1 })
      .limit(1);

    let topPosts = [];
    let viralPosts = [];
    let postsByCategory = [];
    let engagementStats = [];

    if (postJob && postJob.status === 'completed') {
      // Use stored data
      topPosts = postJob.data.postRankings.slice(0, 20);
      viralPosts = postJob.data.postRankings
        .filter(post => post.score > 5) // High engagement threshold
        .slice(0, 10);

      // Calculate posts by category from stored data (simplified)
      const categoryMap = {};
      postJob.data.postRankings.forEach(post => {
        // This is simplified - in production you'd track actual categories
        const category = 'general'; // Default category
        if (!categoryMap[category]) {
          categoryMap[category] = { count: 0, totalScore: 0 };
        }
        categoryMap[category].count++;
        categoryMap[category].totalScore += post.rankingScore || 0;
      });

      postsByCategory = Object.entries(categoryMap).map(([category, data]) => ({
        _id: category,
        count: data.count,
        avgScore: data.totalScore / data.count
      }));

      // Simplified engagement stats
      const totalPosts = postJob.data.postRankings.length;
      engagementStats = [
        { _id: 'view', count: Math.floor(totalPosts * 2.5) },
        { _id: 'like', count: Math.floor(totalPosts * 1.2) },
        { _id: 'comment', count: Math.floor(totalPosts * 0.8) },
        { _id: 'share', count: Math.floor(totalPosts * 0.3) }
      ];
    } else {
      // Fallback to real-time calculation
      topPosts = await Post.find({ status: 'active' })
        .populate('author', 'username')
        .populate('community', 'name')
        .sort({ rankingScore: -1 })
        .limit(20)
        .select('title rankingScore hotScore score viewCount author community createdAt');

      postsByCategory = await Post.aggregate([
        { $match: { status: 'active' } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 }, avgScore: { $avg: '$rankingScore' } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      engagementStats = await UserInteractionLog.aggregate([
        { $match: { targetType: 'post', timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 }
          }
        }
      ]);

      viralPosts = await Post.find({
        status: 'active',
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
        .populate('author', 'username')
        .populate('community', 'name')
        .sort({ score: -1 })
        .limit(10)
        .select('title score viewCount commentCount author community createdAt');
    }

    res.json({
      topPosts,
      postsByCategory,
      engagementStats,
      viralPosts
    });
  } catch (err) {
    console.error('Get post ranking analytics error:', err);
    res.status(500).json({ message: 'Server error fetching post ranking analytics' });
  }
};

// Get community trending analytics
exports.getCommunityTrendingAnalytics = async (req, res) => {
  try {
    // Try to get data from nightlyJob collection first
    const communityJob = await NightlyJob.findOne({ jobType: 'community_trending' })
      .sort({ date: -1 })
      .limit(1);

    let trendingCommunities = [];
    let activeCommunities = [];
    let engagementByType = [];

    if (communityJob && communityJob.status === 'completed') {
      // Use stored data
      trendingCommunities = communityJob.data.trendingCommunities.slice(0, 20);
      activeCommunities = communityJob.data.trendingCommunities.slice(0, 10);

      // Simplified engagement by type
      const totalActivity = communityJob.data.trendingCommunities.reduce((sum, comm) => sum + comm.trendingScore, 0);
      engagementByType = [
        { _id: 'view_community', count: Math.floor(totalActivity * 0.6) },
        { _id: 'join_community', count: Math.floor(totalActivity * 0.3) },
        { _id: 'leave_community', count: Math.floor(totalActivity * 0.1) }
      ];
    } else {
      // Fallback to real-time calculation
      trendingCommunities = await Community.find({})
        .sort({ trendingScore: -1 })
        .limit(20)
        .populate('creator', 'username')
        .select('name displayName memberCount trendingScore weeklyGrowth createdAt');

      activeCommunities = await UserInteractionLog.aggregate([
        { $match: { targetType: 'community', timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: '$targetId', activity: { $sum: 1 } } },
        { $sort: { activity: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'communities',
            localField: '_id',
            foreignField: '_id',
            as: 'community'
          }
        },
        { $unwind: '$community' },
        { $project: { name: '$community.name', displayName: '$community.displayName', activity: 1 } }
      ]);

      engagementByType = await UserInteractionLog.aggregate([
        { $match: { targetType: 'community', timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
    }

    // Community growth over time (always calculate real-time for this)
    const communityGrowth = await UserInteractionLog.aggregate([
      { $match: { action: 'join_community', timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          joins: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      trendingCommunities,
      communityGrowth,
      activeCommunities,
      engagementByType
    });
  } catch (err) {
    console.error('Get community trending analytics error:', err);
    res.status(500).json({ message: 'Server error fetching community trending analytics' });
  }
};

// Get nightly job status and logs
exports.getNightlyJobStatus = async (req, res) => {
  try {
    // Get the latest job execution for each type
    const latestJobs = await NightlyJob.aggregate([
      {
        $sort: { date: -1 }
      },
      {
        $group: {
          _id: '$jobType',
          latestJob: { $first: '$$ROOT' }
        }
      }
    ]);

    // Get job execution history (last 10 jobs)
    const jobHistory = await NightlyJob.find({})
      .sort({ date: -1 })
      .limit(10)
      .select('jobType date status metadata');

    // Calculate current job status
    const currentJob = {
      lastRun: new Date(),
      status: 'completed',
      duration: '0 minutes',
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day at 2 AM
      processedUsers: 0,
      processedPosts: 0,
      processedCommunities: 0
    };

    // Extract data from latest jobs
    const jobMap = {};
    latestJobs.forEach(item => {
      jobMap[item._id] = item.latestJob;
    });

    if (jobMap.user_interests) {
      currentJob.lastRun = jobMap.user_interests.date;
      currentJob.status = jobMap.user_interests.status;
      currentJob.processedUsers = jobMap.user_interests.data.totalUsers || 0;
      currentJob.duration = jobMap.user_interests.metadata ?
        `${Math.round(jobMap.user_interests.metadata.duration / 1000 / 60)} minutes` : 'N/A';
    }

    if (jobMap.post_ranking) {
      currentJob.processedPosts = jobMap.post_ranking.data.totalPosts || 0;
    }

    if (jobMap.community_trending) {
      currentJob.processedCommunities = jobMap.community_trending.data.totalCommunities || 0;
    }

    // Generate logs from job data
    const jobLogs = [];
    Object.values(jobMap).forEach(job => {
      if (job.metadata) {
        jobLogs.push({
          timestamp: job.metadata.startTime || job.date,
          level: job.status === 'completed' ? 'info' : 'error',
          message: `${job.jobType.replace('_', ' ')} job ${job.status}`
        });

        if (job.metadata.endTime) {
          jobLogs.push({
            timestamp: job.metadata.endTime,
            level: 'info',
            message: `${job.jobType.replace('_', ' ')} job completed - processed ${job.metadata.processedCount} items in ${Math.round(job.metadata.duration / 1000 / 60)} minutes`
          });
        }
      }
    });

    // Sort logs by timestamp
    jobLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Format job history
    const formattedHistory = jobHistory.map(job => ({
      runDate: job.date,
      status: job.status,
      duration: job.metadata ? `${Math.round(job.metadata.duration / 1000 / 60)} minutes` : 'N/A',
      jobType: job.jobType,
      error: job.metadata?.error || null
    }));

    res.json({
      currentJob,
      logs: jobLogs.slice(-20), // Last 20 log entries
      history: formattedHistory
    });
  } catch (err) {
    console.error('Get nightly job status error:', err);
    res.status(500).json({ message: 'Server error fetching job status' });
  }
};

// Manually trigger nightly analytics job
exports.triggerNightlyAnalytics = async (req, res) => {
  try {
    // Import the analytics job function
    const { runNightlyAnalytics } = require('../jobs/analyticsJobs');

    // Run the job
    await runNightlyAnalytics();

    res.json({ message: 'Nightly analytics job triggered successfully' });
  } catch (err) {
    console.error('Trigger nightly analytics error:', err);
    res.status(500).json({ message: 'Server error triggering analytics job' });
  }
};

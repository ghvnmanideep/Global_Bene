const User = require('../models/user');
const Post = require('../models/post');
const Community = require('../models/community');
const Comment = require('../models/comment');
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
    const { page = 1, limit = 20, search = '', author = '', community = '', type = '' } = req.query;
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

    const posts = await Post.find(query)
      .populate('author', 'username email role')
      .populate('community', 'name displayName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

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

    await Post.findByIdAndDelete(id);

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
    const totalComments = await Comment.countDocuments();

    const adminUsers = await User.countDocuments({ role: 'admin' });
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    const recentPosts = await Post.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      stats: {
        totalUsers,
        totalPosts,
        totalCommunities,
        totalComments,
        adminUsers,
        recentUsers,
        recentPosts,
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
    console.error('Get reported posts error:', err);
    res.status(500).json({ message: 'Server error fetching reported posts' });
  }
};
const UserInteractionLog = require('../models/userInteractionLog');
const User = require('../models/user');
const Post = require('../models/post');
const Community = require('../models/community');

// Get all interaction logs for AI team
exports.getInteractionLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 1000,
      userId,
      action,
      targetType,
      startDate,
      endDate,
      format = 'json'
    } = req.query;

    const skip = (page - 1) * limit;
    let query = {};

    // Apply filters
    if (userId) {
      query.userId = userId;
    }

    if (action) {
      query.action = action;
    }

    if (targetType) {
      query.targetType = targetType;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    // Get logs with user population for richer data
    const logs = await UserInteractionLog.find(query)
      .populate('userId', 'username email createdAt')
      .populate('targetId', 'title username name') // Works for posts, users, communities
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await UserInteractionLog.countDocuments(query);

    // Format data for AI team
    const formattedLogs = logs.map(log => ({
      userId: log.userId._id,
      username: log.userId.username,
      email: log.userId.email,
      userCreatedAt: log.userId.createdAt,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId._id,
      targetTitle: log.targetId.title || log.targetId.username || log.targetId.name,
      metadata: log.metadata,
      timestamp: log.timestamp,
      createdAt: log.createdAt
    }));

    // Return different formats based on request
    if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertToCSV(formattedLogs);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="interaction_logs.csv"');
      return res.send(csvData);
    }

    res.json({
      logs: formattedLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      summary: {
        totalLogs: total,
        dateRange: {
          start: startDate || null,
          end: endDate || null
        },
        filters: {
          userId,
          action,
          targetType
        }
      }
    });

  } catch (err) {
    console.error('Get interaction logs error:', err);
    res.status(500).json({ message: 'Server error fetching interaction logs' });
  }
};

// Get user-specific interaction logs
exports.getUserInteractionLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 100, action, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    let query = { userId };

    if (action) {
      query.action = action;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    const logs = await UserInteractionLog.find(query)
      .populate('targetId', 'title username name')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await UserInteractionLog.countDocuments(query);

    res.json({
      userId,
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      }
    });

  } catch (err) {
    console.error('Get user interaction logs error:', err);
    res.status(500).json({ message: 'Server error fetching user interaction logs' });
  }
};

// Get interaction statistics
exports.getInteractionStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let matchQuery = {};
    if (startDate || endDate) {
      matchQuery.timestamp = {};
      if (startDate) {
        matchQuery.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        matchQuery.timestamp.$lte = new Date(endDate);
      }
    }

    const stats = await UserInteractionLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            action: '$action',
            targetType: '$targetType'
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          action: '$_id.action',
          targetType: '$_id.targetType',
          count: 1,
          uniqueUsersCount: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get total users with interactions
    const totalUsers = await UserInteractionLog.distinct('userId', matchQuery);
    const totalLogs = await UserInteractionLog.countDocuments(matchQuery);

    res.json({
      totalLogs,
      totalUsers: totalUsers.length,
      stats,
      dateRange: {
        start: startDate || null,
        end: endDate || null
      }
    });

  } catch (err) {
    console.error('Get interaction stats error:', err);
    res.status(500).json({ message: 'Server error fetching interaction stats' });
  }
};

// Helper function to convert data to CSV
const convertToCSV = (data) => {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add headers
  csvRows.push(headers.join(','));

  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Handle nested objects and arrays
      if (typeof value === 'object' && value !== null) {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      // Escape commas and quotes in strings
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
};

// Get recommended posts for a user
exports.getRecommendedPostsForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has opted out of recommendations
    if (user.recommendationOptOut) {
      return res.json({ posts: [], message: 'User has opted out of recommendations' });
    }

    // Try to get recommendations from advanced Python API
    try {
      const axios = require('axios');
      const response = await axios.get(`http://localhost:8000/recommendations/${userId}`, { timeout: 5000 });
      const data = response.data;

      if (data.recommendations && data.recommendations.length > 0) {
        // Get post IDs from recommendations
        const postIds = data.recommendations.map(rec => rec.item_id);

        // Fetch posts
        const posts = await Post.find({ _id: { $in: postIds }, status: 'active' })
          .populate('author', 'username')
          .populate('community', 'name displayName')
          .sort({ createdAt: -1 });

        // Sort posts according to recommendation order
        const postMap = {};
        posts.forEach(post => {
          postMap[post._id.toString()] = post;
        });

        const orderedPosts = postIds.map(id => postMap[id]).filter(p => p);

        // Apply offset and limit
        const paginatedPosts = orderedPosts.slice(offset, offset + limit);

        return res.json({
          posts: paginatedPosts,
          total: orderedPosts.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          source: data.source,
          strategy: data.strategy
        });
      }
    } catch (apiError) {
      console.log('Advanced recommendation API not available, falling back to basic logic:', apiError.message);
    }

    // Fallback to basic recommendation logic
    // Get user's interaction history
    const userInteractions = await UserInteractionLog.find({
      userId,
      action: { $in: ['like_post', 'save_post', 'comment_post', 'view_post'] },
      targetType: 'post'
    }).sort({ timestamp: -1 }).limit(100);

    // Extract preferred tags and topics from interactions
    const interactedPostIds = userInteractions.map(log => log.targetId);
    const interactedPosts = await Post.find({ _id: { $in: interactedPostIds } });

    const preferredTags = new Set();
    const preferredTopics = new Set();

    interactedPosts.forEach(post => {
      post.tags.forEach(tag => preferredTags.add(tag));
      post.topics.forEach(topic => preferredTopics.add(topic));
    });

    // Also consider user's explicitly set interests
    user.interests.forEach(interest => preferredTags.add(interest));
    user.preferredTags.forEach(tag => preferredTags.add(tag));

    // Build recommendation query
    const tagArray = Array.from(preferredTags);
    const topicArray = Array.from(preferredTopics);

    let query = {
      status: 'active',
      author: { $ne: userId } // Don't recommend user's own posts
    };

    // Exclude posts user has already interacted with heavily
    const heavilyInteractedPostIds = userInteractions
      .filter(log => ['like_post', 'save_post'].includes(log.action))
      .map(log => log.targetId);

    if (heavilyInteractedPostIds.length > 0) {
      query._id = { $nin: heavilyInteractedPostIds };
    }

    // Score-based sorting with tag/topic matching
    let posts = [];

    if (tagArray.length > 0 || topicArray.length > 0) {
      // First try to find posts with matching tags/topics
      const tagMatchQuery = { ...query };
      if (tagArray.length > 0) {
        tagMatchQuery.tags = { $in: tagArray };
      }
      if (topicArray.length > 0) {
        tagMatchQuery.topics = { $in: topicArray };
      }

      posts = await Post.find(tagMatchQuery)
        .populate('author', 'username')
        .populate('community', 'name displayName')
        .sort({ score: -1, createdAt: -1 })
        .limit(limit * 2); // Get more to filter
    }

    // If not enough personalized results, fall back to trending posts
    if (posts.length < limit) {
      const trendingQuery = {
        ...query,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      };

      const trendingPosts = await Post.find(trendingQuery)
        .populate('author', 'username')
        .populate('community', 'name displayName')
        .sort({ score: -1, viewCount: -1 })
        .limit(limit - posts.length);

      posts = [...posts, ...trendingPosts];
    }

    // Remove duplicates and apply offset/limit
    const uniquePosts = posts.filter((post, index, self) =>
      index === self.findIndex(p => p._id.toString() === post._id.toString())
    );

    const paginatedPosts = uniquePosts.slice(offset, offset + limit);

    res.json({
      posts: paginatedPosts,
      total: uniquePosts.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (err) {
    console.error('Get recommended posts error:', err);
    res.status(500).json({ message: 'Server error fetching recommended posts' });
  }
};

// Get recommended communities for a user
exports.getRecommendedCommunitiesForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.recommendationOptOut) {
      return res.json({ communities: [], message: 'User has opted out of recommendations' });
    }

    // Get communities user is already following
    const followingCommunityIds = await UserInteractionLog.distinct('targetId', {
      userId,
      action: 'join_community',
      targetType: 'community'
    });

    // Get user's interaction history with communities
    const communityInteractions = await UserInteractionLog.find({
      userId,
      targetType: 'community',
      action: { $in: ['join_community', 'view_community'] }
    });

    // Extract preferred tags from community interactions
    const interactedCommunityIds = communityInteractions.map(log => log.targetId);
    const interactedCommunities = await Community.find({ _id: { $in: interactedCommunityIds } });

    const preferredTags = new Set();
    interactedCommunities.forEach(community => {
      community.tags.forEach(tag => preferredTags.add(tag));
    });

    // Also consider user's interests
    user.interests.forEach(interest => preferredTags.add(interest));

    // Build recommendation query
    const tagArray = Array.from(preferredTags);

    let query = {
      _id: { $nin: followingCommunityIds },
      isPrivate: false
    };

    let communities = [];

    if (tagArray.length > 0) {
      // Find communities with matching tags
      query.tags = { $in: tagArray };

      communities = await Community.find(query)
        .sort({ recommendationScore: -1, memberCount: -1 })
        .limit(limit * 2);
    }

    // Fallback to popular communities
    if (communities.length < limit) {
      const popularQuery = {
        _id: { $nin: followingCommunityIds },
        isPrivate: false
      };

      const popularCommunities = await Community.find(popularQuery)
        .sort({ memberCount: -1, recommendationScore: -1 })
        .limit(limit - communities.length);

      communities = [...communities, ...popularCommunities];
    }

    // Remove duplicates and apply pagination
    const uniqueCommunities = communities.filter((community, index, self) =>
      index === self.findIndex(c => c._id.toString() === community._id.toString())
    );

    const paginatedCommunities = uniqueCommunities.slice(offset, offset + limit);

    res.json({
      communities: paginatedCommunities,
      total: uniqueCommunities.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (err) {
    console.error('Get recommended communities error:', err);
    res.status(500).json({ message: 'Server error fetching recommended communities' });
  }
};

// Get recommended users to follow
exports.getRecommendedUsersToFollow = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.recommendationOptOut) {
      return res.json({ users: [], message: 'User has opted out of recommendations' });
    }

    // Get users already following
    const followingIds = user.following.map(id => id.toString());
    followingIds.push(userId.toString()); // Exclude self

    // Get users who follow similar people or have similar interests
    const similarUsers = await User.find({
      _id: { $nin: followingIds },
      interests: { $in: user.interests },
      isBanned: false
    })
    .select('username profile totalLikesReceived totalPosts')
    .sort({ totalLikesReceived: -1, totalPosts: -1 })
    .limit(limit);

    // If not enough similar users, get active users
    if (similarUsers.length < limit) {
      const activeUsers = await User.find({
        _id: { $nin: followingIds },
        isBanned: false,
        totalPosts: { $gt: 0 }
      })
      .select('username profile totalLikesReceived totalPosts')
      .sort({ totalLikesReceived: -1, totalPosts: -1 })
      .limit(limit - similarUsers.length);

      similarUsers.push(...activeUsers);
    }

    const paginatedUsers = similarUsers.slice(offset, offset + limit);

    res.json({
      users: paginatedUsers,
      total: similarUsers.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (err) {
    console.error('Get recommended users error:', err);
    res.status(500).json({ message: 'Server error fetching recommended users' });
  }
};
const User = require('../models/user');
const UserInteractionLog = require('../models/userInteractionLog');
const Post = require('../models/post');
const Comment = require('../models/comment');

/**
 * Calculate user activity level based on interaction patterns
 * @param {Object} user - User object
 * @param {Array} recentInteractions - User's recent interactions
 * @returns {string} Activity level: 'highly_active', 'moderately_active', 'low_active', 'inactive'
 */
const calculateActivityLevel = (user, recentInteractions) => {
  const interactionCount = recentInteractions.length;
  const daysSinceRegistration = Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24));

  // Highly active: > 10 interactions in last 30 days OR > 50 total interactions
  if (interactionCount > 10 || user.totalInteractions > 50) {
    return 'highly_active';
  }

  // Moderately active: 5-10 interactions in last 30 days OR 20-50 total interactions
  if (interactionCount >= 5 || (user.totalInteractions >= 20 && user.totalInteractions <= 50)) {
    return 'moderately_active';
  }

  // Low active: 1-4 interactions in last 30 days OR 5-19 total interactions
  if (interactionCount >= 1 || (user.totalInteractions >= 5 && user.totalInteractions <= 19)) {
    return 'low_active';
  }

  // Inactive: No recent interactions and low total interactions
  return 'inactive';
};

/**
 * Calculate user engagement score (0-100)
 * @param {Array} recentInteractions - User's recent interactions
 * @param {Object} userStats - User's aggregated stats
 * @returns {number} Engagement score
 */
const calculateEngagementScore = (recentInteractions, userStats) => {
  let score = 0;

  // Base score from interaction count (max 40 points)
  const interactionScore = Math.min(recentInteractions.length * 2, 40);
  score += interactionScore;

  // Content creation score (max 30 points)
  const contentScore = Math.min((userStats.totalPosts * 5) + (userStats.totalComments * 2), 30);
  score += contentScore;

  // Social engagement score (max 20 points)
  const socialScore = Math.min((userStats.totalLikes * 1) + (userStats.totalShares * 3) + (userStats.totalCommunitiesJoined * 2), 20);
  score += socialScore;

  // Community participation score (max 10 points)
  const communityScore = Math.min(userStats.totalCommunitiesJoined * 2, 10);
  score += communityScore;

  return Math.round(score);
};

/**
 * Determine user cohort based on registration date
 * @param {Date} registrationDate - User registration date
 * @returns {string} Cohort identifier
 */
const calculateUserCohort = (registrationDate) => {
  const now = new Date();
  const monthsSinceRegistration = Math.floor((now - registrationDate) / (1000 * 60 * 60 * 24 * 30));

  if (monthsSinceRegistration === 0) return 'new_this_month';
  if (monthsSinceRegistration <= 1) return '1_month_old';
  if (monthsSinceRegistration <= 3) return '2-3_months_old';
  if (monthsSinceRegistration <= 6) return '4-6_months_old';
  if (monthsSinceRegistration <= 12) return '7-12_months_old';
  if (monthsSinceRegistration <= 24) return '1-2_years_old';
  return '2+_years_old';
};

/**
 * Get comprehensive user segmentation data
 * @param {string} userId - User ID
 * @returns {Object} User segmentation data
 */
const getUserSegmentationData = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    // Get recent interactions (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentInteractions = await UserInteractionLog.find({
      userId,
      timestamp: { $gte: thirtyDaysAgo }
    });

    // Get last activity date
    const lastInteraction = await UserInteractionLog.findOne({ userId })
      .sort({ timestamp: -1 })
      .select('timestamp');

    // Aggregate user statistics
    const userStats = await UserInteractionLog.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      }
    ]);

    // Parse stats
    const statsMap = {};
    userStats.forEach(stat => {
      statsMap[stat._id] = stat.count;
    });

    // Calculate derived metrics
    const daysSinceRegistration = Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24));
    const daysSinceLastActivity = lastInteraction ?
      Math.floor((Date.now() - lastInteraction.timestamp) / (1000 * 60 * 60 * 24)) : daysSinceRegistration;

    // Get user's content creation stats
    const totalPostsCreated = await Post.countDocuments({ author: userId });
    const totalCommentsMade = await Comment.countDocuments({ author: userId });

    // Calculate activity level and engagement score
    const activityLevel = calculateActivityLevel(user, recentInteractions);
    const engagementScore = calculateEngagementScore(recentInteractions, {
      totalPosts: totalPostsCreated,
      totalComments: totalCommentsMade,
      totalLikes: statsMap['like_post'] || 0,
      totalShares: statsMap['share_post'] || 0,
      totalCommunitiesJoined: statsMap['join_community'] || 0
    });

    // Get user's preferred categories and topics (from calculated interests)
    const preferredCategories = user.calculatedInterests || [];
    const preferredTopics = user.calculatedTopics || [];

    return {
      activityLevel,
      engagementScore,
      lastActivityDate: lastInteraction ? lastInteraction.timestamp.toISOString() : user.createdAt.toISOString(),
      daysSinceRegistration,
      daysSinceLastActivity,
      userCohort: calculateUserCohort(user.createdAt),
      totalPostsCreated,
      totalCommentsMade,
      totalCommunitiesJoined: statsMap['join_community'] || 0,
      totalLikesGiven: statsMap['like_post'] || 0,
      totalSharesMade: statsMap['share_post'] || 0,
      preferredCategories,
      preferredTopics,
      accountStatus: user.isBanned ? 'banned' : 'active',
      isPremium: user.role === 'premium' || false,
      notificationPreferences: user.notificationPreferences || {}
    };

  } catch (error) {
    console.error('Error calculating user segmentation data:', error);
    return null;
  }
};

/**
 * Update segmentation data for all users (used in nightly analytics)
 * @returns {Object} Update summary
 */
const updateAllUserSegmentation = async () => {
  try {
    const users = await User.find({});
    let updatedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        const segmentationData = await getUserSegmentationData(user._id);
        if (segmentationData) {
          // Import here to avoid circular dependency
          const { setUserSegmentation } = require('./mixpanelTracker');
          setUserSegmentation(user._id.toString(), segmentationData);
          updatedCount++;
        }
      } catch (error) {
        console.error(`Error updating segmentation for user ${user._id}:`, error);
        errorCount++;
      }
    }

    return {
      totalUsers: users.length,
      updatedCount,
      errorCount
    };

  } catch (error) {
    console.error('Error updating all user segmentation:', error);
    return { error: error.message };
  }
};

module.exports = {
  getUserSegmentationData,
  updateAllUserSegmentation,
  calculateActivityLevel,
  calculateEngagementScore,
  calculateUserCohort
};
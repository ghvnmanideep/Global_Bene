const cron = require('node-cron');
const UserInteractionLog = require('../models/userInteractionLog');
const User = require('../models/user');
const Post = require('../models/post');
const Community = require('../models/community');
const NightlyJob = require('../models/nightlyJob');
const { setUserProfile } = require('../utils/mixpanelTracker');
const { updateAllUserSegmentation } = require('../utils/userSegmentation');

const runNightlyAnalytics = async () => {
  console.log('Starting nightly analytics job...');

  try {
    // Calculate user interests
    await calculateUserInterests();

    // Update user segmentation data for Mixpanel
    await updateUserSegmentation();

    // Identify trending communities
    await identifyTrendingCommunities();

    // Rank posts based on engagement
    await rankPosts();

    // Generate personalized recommendations
    await generateRecommendations();

    console.log('Nightly analytics completed successfully');
  } catch (error) {
    console.error('Nightly analytics error:', error);
  }
};

// Calculate user interests based on recent interactions
const calculateUserInterests = async () => {
  const startTime = new Date();
  const users = await User.find({});
  const userInterestsData = [];

  for (const user of users) {
    // Get user's recent interactions (last 30 days)
    const recentLogs = await UserInteractionLog.find({
      userId: user._id,
      timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    // Calculate interest scores for tags/topics
    const tagScores = {};
    const topicScores = {};

    recentLogs.forEach(log => {
      const weight = getActionWeight(log.action);

      // Tags from posts
      if (log.metadata.postCategory) {
        tagScores[log.metadata.postCategory] = (tagScores[log.metadata.postCategory] || 0) + weight;
      }

      // Topics from posts
      if (log.metadata.postType) {
        topicScores[log.metadata.postType] = (topicScores[log.metadata.postType] || 0) + weight;
      }
    });

    const calculatedInterests = Object.keys(tagScores).sort((a,b) => tagScores[b] - tagScores[a]);
    const calculatedTopics = Object.keys(topicScores).sort((a,b) => topicScores[b] - topicScores[a]);

    userInterestsData.push({
      userId: user._id,
      username: user.username,
      interests: calculatedInterests,
      topics: calculatedTopics,
      interactionCount: recentLogs.length,
      tagScores,
      topicScores
    });

    // Update user interests (keep this for backward compatibility)
    user.calculatedInterests = calculatedInterests;
    user.calculatedTopics = calculatedTopics;
    await user.save();

    // Get last activity date
    const lastActivityLog = recentLogs.length > 0 ? recentLogs[0] : null; // recentLogs is sorted by timestamp desc

    // Update complete user profile in Mixpanel
    const userProfileData = {
      email: user.email,
      username: user.username,
      role: user.role || 'user',
      createdAt: user.createdAt.toISOString(),
      emailVerified: user.emailVerified,
      account_status: user.isBanned ? 'banned' : 'active',
      user_role: user.role || 'user',
      bio: user.profile?.bio || '',
      gender: user.profile?.gender || '',
      date_of_birth: user.profile?.dob || '',
      phone: user.profile?.mobile || '',
      followers_count: user.followers?.length || 0,
      following_count: user.following?.length || 0,
      posts_count: user.postsCount || 0,
      communities_joined: user.communitiesJoined || 0,
      total_interactions: recentLogs.length,
      last_activity: lastActivityLog ? lastActivityLog.timestamp.toISOString() : user.createdAt.toISOString(),
      interests: calculatedInterests,
      topics: calculatedTopics,
      last_analytics_update: new Date().toISOString()
    };

    setUserProfile(user._id.toString(), userProfileData);
  }

  const endTime = new Date();

  // Store results in nightlyJob collection
  await NightlyJob.create({
    jobType: 'user_interests',
    date: new Date(),
    status: 'completed',
    data: {
      totalUsers: users.length,
      userInterests: userInterestsData
    },
    metadata: {
      processedCount: users.length,
      duration: endTime - startTime,
      startTime,
      endTime
    }
  });
};

// Update user segmentation data for Mixpanel user-wise analytics
const updateUserSegmentation = async () => {
  const startTime = new Date();
  console.log('Updating user segmentation data for Mixpanel...');

  try {
    const result = await updateAllUserSegmentation();

    const endTime = new Date();

    // Store results in nightlyJob collection
    await NightlyJob.create({
      jobType: 'user_segmentation',
      date: new Date(),
      status: result.error ? 'failed' : 'completed',
      data: result,
      metadata: {
        processedCount: result.updatedCount || 0,
        errorCount: result.errorCount || 0,
        duration: endTime - startTime,
        startTime,
        endTime
      }
    });

    console.log(`User segmentation update completed: ${result.updatedCount || 0} users updated`);

  } catch (error) {
    console.error('User segmentation update error:', error);

    // Store error in nightlyJob collection
    await NightlyJob.create({
      jobType: 'user_segmentation',
      date: new Date(),
      status: 'failed',
      data: { error: error.message },
      metadata: {
        duration: new Date() - startTime,
        startTime,
        endTime: new Date()
      }
    });
  }
};

// Identify trending communities
const identifyTrendingCommunities = async () => {
  const startTime = new Date();

  // Calculate community engagement scores
  const communityStats = await UserInteractionLog.aggregate([
    {
      $match: {
        targetType: 'community',
        timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      }
    },
    {
      $group: {
        _id: '$targetId',
        joinCount: { $sum: { $cond: [{ $eq: ['$action', 'join_community'] }, 1, 0] } },
        viewCount: { $sum: { $cond: [{ $eq: ['$action', 'view_community'] }, 1, 0] } },
        totalEngagement: { $sum: 1 }
      }
    },
    {
      $sort: { totalEngagement: -1 }
    }
  ]);

  // Get community details and prepare data
  const trendingCommunities = [];
  for (const stat of communityStats) {
    const community = await Community.findById(stat._id).select('name displayName memberCount');
    if (community) {
      trendingCommunities.push({
        communityId: stat._id,
        name: community.displayName || community.name,
        memberCount: community.memberCount,
        trendingScore: stat.totalEngagement,
        weeklyGrowth: stat.joinCount,
        viewCount: stat.viewCount
      });

      // Update community trending scores (keep for backward compatibility)
      await Community.findByIdAndUpdate(stat._id, {
        trendingScore: stat.totalEngagement,
        weeklyGrowth: stat.joinCount
      });
    }
  }

  const endTime = new Date();

  // Store results in nightlyJob collection
  await NightlyJob.create({
    jobType: 'community_trending',
    date: new Date(),
    status: 'completed',
    data: {
      totalCommunities: communityStats.length,
      trendingCommunities
    },
    metadata: {
      processedCount: communityStats.length,
      duration: endTime - startTime,
      startTime,
      endTime
    }
  });
};

// Rank posts using Reddit-like algorithm
const rankPosts = async () => {
  const startTime = new Date();

  // Get posts from last 30 days
  const posts = await Post.find({
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    status: 'active'
  });

  const postRankings = [];

  for (const post of posts) {
    const interactions = await UserInteractionLog.find({
      targetId: post._id,
      targetType: 'post'
    });

    // Calculate engagement metrics
    const upvotes = interactions.filter(i => i.action === 'vote_post_up').length;
    const downvotes = interactions.filter(i => i.action === 'vote_post_down').length;
    const comments = interactions.filter(i => i.action === 'comment_post').length;
    const views = interactions.filter(i => i.action === 'view_post').length;

    const score = upvotes - downvotes;
    const hoursSincePosted = (Date.now() - post.createdAt) / (1000 * 60 * 60);

    // Reddit hot ranking formula
    const hotScore = score + comments * 0.5 + views * 0.1;
    const gravity = 1.8;
    const rankingScore = hotScore / Math.pow(hoursSincePosted + 2, gravity);

    postRankings.push({
      postId: post._id,
      title: post.title,
      author: post.author,
      score,
      upvotes,
      downvotes,
      comments,
      views,
      hotScore,
      rankingScore,
      hoursSincePosted: hoursSincePosted.toFixed(1)
    });

    // Update post ranking scores (keep for backward compatibility)
    post.rankingScore = rankingScore;
    post.hotScore = hotScore;
    await post.save();
  }

  const endTime = new Date();

  // Store results in nightlyJob collection
  await NightlyJob.create({
    jobType: 'post_ranking',
    date: new Date(),
    status: 'completed',
    data: {
      totalPosts: posts.length,
      postRankings: postRankings.sort((a, b) => b.rankingScore - a.rankingScore)
    },
    metadata: {
      processedCount: posts.length,
      duration: endTime - startTime,
      startTime,
      endTime
    }
  });
};

// Generate recommendations (placeholder for now)
const generateRecommendations = async () => {
  const startTime = new Date();
  const users = await User.find({ recommendationOptOut: false });

  const recommendationData = [];

  for (const user of users) {
    // Get user's calculated interests
    const interests = user.calculatedInterests || [];
    const topics = user.calculatedTopics || [];

    // Find posts matching interests (this would be cached in production)
    const recommendedPosts = await Post.find({
      tags: { $in: interests },
      topics: { $in: topics },
      author: { $ne: user._id },
      status: 'active'
    })
    .populate('author', 'username')
    .populate('community', 'name')
    .sort({ rankingScore: -1 })
    .limit(50)
    .select('title author community rankingScore');

    recommendationData.push({
      userId: user._id,
      username: user.username,
      interests,
      topics,
      recommendationCount: recommendedPosts.length,
      topRecommendations: recommendedPosts.slice(0, 5).map(post => ({
        postId: post._id,
        title: post.title,
        author: post.author?.username,
        community: post.community?.name,
        score: post.rankingScore
      }))
    });

    console.log(`Generated ${recommendedPosts.length} recommendations for user ${user.username}`);
  }

  const endTime = new Date();

  // Store results in nightlyJob collection
  await NightlyJob.create({
    jobType: 'recommendations',
    date: new Date(),
    status: 'completed',
    data: {
      totalUsers: users.length,
      recommendations: recommendationData
    },
    metadata: {
      processedCount: users.length,
      duration: endTime - startTime,
      startTime,
      endTime
    }
  });
};

// Helper function to get action weights
const getActionWeight = (action) => {
  const weights = {
    'view_post': 1,
    'like_post': 3,
    'save_post': 4,
    'comment_post': 5,
    'vote_post_up': 2,
    'vote_post_down': -2,
    'join_community': 3,
    'search': 1
  };
  return weights[action] || 1;
};

// Schedule job to run at 2 AM daily
cron.schedule('0 2 * * *', runNightlyAnalytics);

module.exports = { runNightlyAnalytics };
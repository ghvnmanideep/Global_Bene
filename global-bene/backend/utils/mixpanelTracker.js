const Mixpanel = require('mixpanel');
const mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN);

const trackEvent = (eventName, userId, properties = {}) => {
  try {
    mixpanel.track(eventName, {
      distinct_id: userId,
      ...properties,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Mixpanel tracking error:', error);
  }
};

const setUserProfile = (userId, profileData) => {
  try {
    // Enhanced user profile with all available user data
    const profile = {
      // Basic user information
      $email: profileData.email,
      $username: profileData.username,
      $first_name: profileData.firstName || profileData.username,
      $last_name: profileData.lastName || '',
      $name: profileData.name || profileData.username,
      $phone: profileData.phone || profileData.mobile || '',

      // Account information
      $created: profileData.createdAt || new Date().toISOString(),
      $last_login: profileData.lastLogin || new Date().toISOString(),
      email_verified: profileData.emailVerified || false,
      account_status: profileData.isBanned ? 'banned' : 'active',
      user_role: profileData.role || 'user',

      // Profile information
      bio: profileData.bio || '',
      gender: profileData.gender || '',
      date_of_birth: profileData.dob || '',
      location: profileData.location || '',
      website: profileData.website || '',

      // Social metrics
      followers_count: profileData.followersCount || 0,
      following_count: profileData.followingCount || 0,
      posts_count: profileData.postsCount || 0,
      communities_joined: profileData.communitiesJoined || 0,

      // Activity metrics
      total_interactions: profileData.totalInteractions || 0,
      last_activity: profileData.lastActivity || new Date().toISOString(),

      // Preferences
      theme_preference: profileData.themePreference || 'system',
      email_notifications: profileData.emailNotifications !== false,
      push_notifications: profileData.pushNotifications !== false,

      // Additional custom properties
      ...profileData.customProperties,

      // Update timestamp
      $last_profile_update: new Date().toISOString()
    };

    mixpanel.people.set(userId, profile);
  } catch (error) {
    console.error('Mixpanel profile update error:', error);
  }
};

const setUserSegmentation = (userId, segmentationData) => {
  try {
    // Enhanced user segmentation for user-wise analytics
    const segmentation = {
      // Activity level segmentation
      $activity_level: segmentationData.activityLevel || 'unknown',
      $engagement_score: segmentationData.engagementScore || 0,
      $last_activity_date: segmentationData.lastActivityDate || new Date().toISOString(),

      // Time-based segmentation
      $days_since_registration: segmentationData.daysSinceRegistration || 0,
      $days_since_last_activity: segmentationData.daysSinceLastActivity || 0,
      $user_cohort: segmentationData.userCohort || 'unknown',

      // Behavioral segmentation
      $total_posts_created: segmentationData.totalPostsCreated || 0,
      $total_comments_made: segmentationData.totalCommentsMade || 0,
      $total_communities_joined: segmentationData.totalCommunitiesJoined || 0,
      $total_likes_given: segmentationData.totalLikesGiven || 0,
      $total_shares_made: segmentationData.totalSharesMade || 0,

      // Content preferences
      $preferred_categories: segmentationData.preferredCategories || [],
      $preferred_topics: segmentationData.preferredTopics || [],

      // Geographic and device info (if available)
      $country: segmentationData.country || 'unknown',
      $city: segmentationData.city || 'unknown',
      $timezone: segmentationData.timezone || 'unknown',
      $preferred_device: segmentationData.preferredDevice || 'unknown',
      $preferred_browser: segmentationData.preferredBrowser || 'unknown',

      // User status
      $account_status: segmentationData.accountStatus || 'active',
      $is_premium: segmentationData.isPremium || false,
      $notification_preferences: segmentationData.notificationPreferences || {},

      // Update timestamp
      $last_segmentation_update: new Date().toISOString()
    };

    mixpanel.people.set(userId, segmentation);
  } catch (error) {
    console.error('Mixpanel user segmentation error:', error);
  }
};

const trackUserAction = (userId, action, targetType, targetId, metadata = {}) => {
  const eventName = `${action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
  const properties = {
    action,
    target_type: targetType,
    target_id: targetId,
    ...metadata
  };

  trackEvent(eventName, userId, properties);
};

module.exports = { trackEvent, setUserProfile, setUserSegmentation, trackUserAction };
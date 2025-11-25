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
    mixpanel.people.set(userId, profileData);
  } catch (error) {
    console.error('Mixpanel profile update error:', error);
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

module.exports = { trackEvent, setUserProfile, trackUserAction };
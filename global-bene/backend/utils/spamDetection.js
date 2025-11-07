const axios = require('axios');

const SPAM_API_URL = 'https://spam-toxicity-api-latest.onrender.com/predict';

// Keywords associated with promotional spam and scams
const PROMOTIONAL_KEYWORDS = [
  // Promotional/Giveaway
  'free', 'giveaway', 'claim', 'subscription', 'survey', 'hurry', 'gift', 'prize', 'win',
  'discount', 'offer', 'deal', 'promo', 'bonus', 'reward', 'cash', 'money',
  'earn', 'make money', 'income', 'profit', 'investment', 'bitcoin', 'crypto',
  'lottery', 'jackpot', 'winner', 'congratulations', 'urgent', 'limited time',
  'act now', 'click here', 'sign up', 'register', 'join now', 'apply now',
  'get started', 'download', 'install', 'app', 'mobile app', 'software',

  // Services/Platforms
  'netflix', 'spotify', 'amazon', 'uber', 'paypal', 'ebay', 'facebook', 'instagram',
  'google', 'apple', 'microsoft', 'bank', 'account', 'password', 'verify',

  // Scam/Phishing
  'alert', 'warning', 'locked', 'suspended', 'security', 'breach', 'hack',
  'compromised', 'unauthorized', 'verify', 'confirm', 'validate', 'secure',
  'login', 'update', 'reset', 'immediately', 'urgent', 'action required',
  'account suspended', 'bank account', 'credit card', 'social security',
  'tax refund', 'inheritance', 'lottery win', 'prize claim', 'wire transfer',

  // Suspicious URLs/Domains
  '.net', 'secure-', 'verify-', 'login-', 'account-', 'bank-', 'paypal-',
  'amazon-', 'apple-', 'microsoft-', 'google-', 'facebook-', 'instagram-',

  // Urgency/Pressure
  'now', 'today', 'immediately', 'asap', 'deadline', 'expires', 'limited',
  'last chance', 'final notice', 'time sensitive', 'do not ignore', 'tag 5 friends'
];

// Check for promotional spam keywords
const checkPromotionalSpam = (text) => {
  const lowerText = text.toLowerCase();
  const foundKeywords = PROMOTIONAL_KEYWORDS.filter(keyword =>
    lowerText.includes(keyword.toLowerCase())
  );

  // If multiple promotional keywords are found, consider it spam
  if (foundKeywords.length >= 2) {
    return {
      isPromotionalSpam: true,
      confidence: 0.9, // High confidence for keyword-based detection
      keywords: foundKeywords,
      reason: `Detected promotional spam keywords: ${foundKeywords.join(', ')}`
    };
  }

  return { isPromotionalSpam: false };
};

const checkSpam = async (text) => {
  try {
    const response = await axios.post(SPAM_API_URL, {
      text: text
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // The API returns different structure - use spam_detection.label_probs.spam or toxicity_detection.confidence
    const spamConfidence = response.data.spam_detection?.label_probs?.spam || 0;
    const toxicityConfidence = response.data.toxicity_detection?.confidence || 0;

    // Use the higher confidence score, but prioritize toxicity detection for spam classification
    let confidence = Math.max(spamConfidence, toxicityConfidence);

    // Check for promotional spam
    const promoCheck = checkPromotionalSpam(text);
    if (promoCheck.isPromotionalSpam) {
      confidence = Math.max(confidence, promoCheck.confidence);
    }

    let spamStatus = 'not_spam';
    let isSpam = false;
    let reason = response.data.toxicity_detection?.label === 'spam' ? 'Detected as spam/toxic content by AI' : 'Detected as spam by AI';

    if (confidence > 0.8) {
      spamStatus = 'spam';
      isSpam = true;
      if (promoCheck.isPromotionalSpam) {
        reason = promoCheck.reason;
      }
    } else if (confidence >= 0.6) {
      spamStatus = 'might_be_spam';
    }

    return {
      isSpam,
      confidence,
      spamStatus,
      reason
    };
  } catch (error) {
    console.error('Spam detection API error:', error.message);
    // Even if API fails, still check for promotional spam
    const promoCheck = checkPromotionalSpam(text);
    if (promoCheck.isPromotionalSpam) {
      return {
        isSpam: true,
        confidence: promoCheck.confidence,
        spamStatus: 'spam',
        reason: promoCheck.reason
      };
    }
    // If API fails and no promotional spam, don't block the post
    return {
      isSpam: false,
      confidence: 0,
      spamStatus: 'not_spam',
      reason: 'API unavailable'
    };
  }
};

module.exports = { checkSpam };
const axios = require('axios');

// Try local Python API first, fallback to external API
const LOCAL_SPAM_API_URL = 'http://localhost:8001/predict';
const EXTERNAL_SPAM_API_URL = 'https://spam-toxicity-api-latest.onrender.com/predict';

// Keywords associated with promotional spam and scams
const PROMOTIONAL_KEYWORDS = [
  // Promotional/Giveaway
  'free', 'giveaway', 'claim', 'subscription', 'survey', 'hurry', 'gift', 'prize', 'win',
  'discount', 'offer', 'deal', 'promo', 'bonus', 'reward', 'cash', 'money',
  'earn', 'make money', 'income', 'profit', 'investment', 'bitcoin', 'crypto',
  'lottery', 'jackpot', 'winner', 'congratulations', 'urgent', 'limited time',
  'act now', 'click here', 'sign up', 'register', 'join now', 'apply now',
  'get started', 'download', 'install', 'app', 'mobile app', 'software',

  // Loan/Financial Scams
  'loan', 'instant loan', 'quick loan', 'easy loan', 'personal loan', 'business loan',
  'home loan', 'car loan', 'education loan', 'approval', 'no credit check', 'bad credit',
  'pre-approved', 'guaranteed approval', 'instant approval', 'fast approval',
  'no documentation', 'minimal documentation', 'online loan', 'loan online',
  'get loan', 'apply for loan', 'loan application', 'loan offer', 'loan deal',
  'funds', 'receive funds', 'transfer funds', 'disburse', 'disbursement',
  'emi', 'interest rate', 'low interest', 'zero interest', 'flexible repayment',
  'collateral free', 'unsecured loan', 'secured loan', 'loan against',

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
  // Lower threshold for loan-related keywords since they're highly suspicious
  const hasLoanKeywords = foundKeywords.some(keyword =>
    keyword.includes('loan') || keyword.includes('approval') || keyword.includes('funds')
  );

  if (foundKeywords.length >= 2 || (hasLoanKeywords && foundKeywords.length >= 1)) {
    return {
      isPromotionalSpam: true,
      confidence: 0.95, // Very high confidence for loan scams
      keywords: foundKeywords,
      reason: `Detected promotional spam keywords: ${foundKeywords.join(', ')}`
    };
  }

  return { isPromotionalSpam: false };
};

const checkSpam = async (text) => {
  // Try local API first
  try {
    const response = await axios.post(LOCAL_SPAM_API_URL, {
      text: text
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000 // 5 second timeout for local API
    });

    console.log('Using local spam detection API');

    // Local API structure: spam_detection.label_probs.spam and toxicity_detection.confidence
    const spamConfidence = response.data.spam_detection?.label_probs?.spam || 0;
    const toxicityConfidence = response.data.toxicity_detection?.confidence || 0;

    // Use the higher confidence score
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
  } catch (localError) {
    console.log('Local spam API unavailable, trying external API:', localError.message);

    // Fallback to external API
    try {
      const response = await axios.post(EXTERNAL_SPAM_API_URL, {
        text: text
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Using external spam detection API');

      // External API structure
      const spamConfidence = response.data.spam_detection?.label_probs?.spam || 0;
      const toxicityConfidence = response.data.toxicity_detection?.confidence || 0;

      let confidence = Math.max(spamConfidence, toxicityConfidence);

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
    } catch (externalError) {
      console.error('Both spam detection APIs failed:', externalError.message);
      // Even if APIs fail, still check for promotional spam
      const promoCheck = checkPromotionalSpam(text);
      if (promoCheck.isPromotionalSpam) {
        return {
          isSpam: true,
          confidence: promoCheck.confidence,
          spamStatus: 'spam',
          reason: promoCheck.reason
        };
      }
      // If APIs fail and no promotional spam, don't block the post
      return {
        isSpam: false,
        confidence: 0,
        spamStatus: 'not_spam',
        reason: 'APIs unavailable'
      };
    }
  }
};

module.exports = { checkSpam };
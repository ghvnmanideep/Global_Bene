// Auto-tagging service for posts and comments
// Integrates with external AI tagging API

const axios = require('axios');
const Post = require('../models/post');
const Comment = require('../models/comment');
const Community = require('../models/community');

// Try local Python API first, fallback to external API
const LOCAL_AUTOTAG_API_URL = 'http://localhost:8002/predict';
const EXTERNAL_AUTOTAG_API_URL = process.env.AUTOTAG_API_URL || 'https://saisuchendar-autotagapi2.hf.space';
const AUTOTAG_API_KEY = process.env.AUTOTAG_API_KEY; // If authentication is required

// Call AI tagging API (local first, then external)
const callAutoTagAPI = async (text) => {
  try {
    if (!text || text.trim().length === 0) {
      return [];
    }

    // Try local API first
    try {
      const response = await axios.post(`${LOCAL_AUTOTAG_API_URL}`, {
        text: text.trim()
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000 // 5 second timeout for local API
      });

      console.log('Using local autotag API');

      // Local API returns { results: [{ all_tags: { tag1: score1, tag2: score2 } }] }
      const results = response.data.results || [];
      if (results.length > 0 && results[0].all_tags) {
        const tagsObj = results[0].all_tags;
        // Convert to array of tags, sorted by score
        const tags = Object.entries(tagsObj)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10) // Top 10 tags
          .map(([tag]) => tag);

        return tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0);
      }

      return [];
    } catch (localError) {
      console.log('Local autotag API unavailable, trying external API:', localError.message);

      // Fallback to external API
      const response = await axios.post(`${EXTERNAL_AUTOTAG_API_URL}/predict`, {
        text: text.trim()
      }, {
        headers: {
          'Content-Type': 'application/json',
          ...(AUTOTAG_API_KEY && { 'Authorization': `Bearer ${AUTOTAG_API_KEY}` })
        },
        timeout: 10000 // 10 second timeout
      });

      console.log('Using external autotag API');

      // External API returns { tags: ['tag1', 'tag2', ...] }
      const tags = response.data.tags || response.data.predictions || response.data.results || [];

      // Validate and clean tags
      return Array.isArray(tags) ? tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0) : [];
    }

  } catch (error) {
    console.error('Auto-tag API error:', error.message);

    // Fallback to basic keyword extraction if API fails
    return fallbackKeywordExtraction(text);
  }
};

// Fallback keyword extraction when API is unavailable
const fallbackKeywordExtraction = (text) => {
  if (!text) return [];

  const tags = new Set();
  const lowerText = text.toLowerCase();

  // Basic keyword mappings as fallback
  const tagMappings = {
    'javascript': ['javascript', 'programming'],
    'python': ['python', 'programming'],
    'react': ['react', 'javascript', 'frontend'],
    'node': ['node', 'javascript', 'backend'],
    'mongodb': ['mongodb', 'database'],
    'machine learning': ['ai', 'machine-learning'],
    'design': ['design', 'ui', 'ux'],
    'business': ['business', 'startup'],
    'health': ['health', 'fitness'],
    'education': ['education', 'learning'],
    'sports': ['sports', 'fitness'],
    'politics': ['politics', 'government'],
    'entertainment': ['entertainment', 'movies'],
    'science': ['science', 'research'],
    'finance': ['finance', 'investment']
  };

  Object.entries(tagMappings).forEach(([keyword, mappedTags]) => {
    if (lowerText.includes(keyword)) {
      mappedTags.forEach(tag => tags.add(tag));
    }
  });

  return Array.from(tags);
};

// Extract topics from tags (higher-level categorization)
const extractTopicsFromTags = (tags) => {
  const topics = new Set();

  // Enhanced topic mappings with more comprehensive categorization
  const topicMappings = {
    // Technology
    'javascript': ['technology', 'programming', 'web-development'],
    'python': ['technology', 'programming', 'data-science'],
    'react': ['technology', 'programming', 'web-development', 'frontend'],
    'node': ['technology', 'programming', 'backend', 'server'],
    'mongodb': ['technology', 'database', 'backend'],
    'machine-learning': ['technology', 'ai', 'data-science'],
    'ai': ['technology', 'artificial-intelligence', 'innovation'],
    'programming': ['technology', 'software', 'development'],
    'web-development': ['technology', 'software', 'internet'],
    'data-science': ['technology', 'analytics', 'research'],
    'database': ['technology', 'data', 'backend'],
    'backend': ['technology', 'server', 'infrastructure'],
    'frontend': ['technology', 'ui', 'user-experience'],
    'design': ['technology', 'creative', 'ui-ux'],
    'software': ['technology', 'development', 'engineering'],

    // Business & Professional
    'business': ['business', 'professional', 'entrepreneurship'],
    'startup': ['business', 'innovation', 'entrepreneurship'],
    'finance': ['business', 'finance', 'investment'],
    'investment': ['business', 'finance', 'wealth'],
    'marketing': ['business', 'marketing', 'sales'],
    'management': ['business', 'leadership', 'professional'],
    'career': ['professional', 'career-development', 'work'],
    'job': ['professional', 'employment', 'career'],

    // Lifestyle & Health
    'health': ['lifestyle', 'health', 'wellness'],
    'fitness': ['lifestyle', 'health', 'fitness'],
    'nutrition': ['lifestyle', 'health', 'food'],
    'mental-health': ['lifestyle', 'health', 'psychology'],
    'sports': ['lifestyle', 'sports', 'fitness'],
    'travel': ['lifestyle', 'travel', 'adventure'],
    'food': ['lifestyle', 'food', 'cooking'],
    'cooking': ['lifestyle', 'food', 'culinary'],

    // Education & Learning
    'education': ['education', 'learning', 'teaching'],
    'learning': ['education', 'personal-development', 'growth'],
    'science': ['education', 'science', 'research'],
    'research': ['education', 'science', 'academic'],
    'teaching': ['education', 'pedagogy', 'mentoring'],

    // Society & Culture
    'politics': ['society', 'politics', 'government'],
    'news': ['society', 'news', 'current-events'],
    'entertainment': ['society', 'entertainment', 'culture'],
    'music': ['society', 'entertainment', 'arts'],
    'movies': ['society', 'entertainment', 'cinema'],
    'gaming': ['society', 'entertainment', 'gaming'],
    'social': ['society', 'social', 'community'],
    'community': ['society', 'community', 'social']
  };

  tags.forEach(tag => {
    const mappedTopics = topicMappings[tag.toLowerCase()];
    if (mappedTopics) {
      mappedTopics.forEach(topic => topics.add(topic));
    }
  });

  return Array.from(topics);
};

// Generate auto-tags for a post using AI API
const generateAutoTagsForPost = async (postId) => {
  try {
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Prepare text content for AI analysis
    let contentText = post.title || '';

    // Handle different content structures (backward compatibility)
    if (typeof post.content === 'string') {
      // Old format: content is a string
      contentText += ' ' + post.content;
    } else if (post.content && typeof post.content === 'object') {
      // New format: content is an object
      if (post.content.text) {
        contentText += ' ' + post.content.text;
      }
      // Add image captions
      if (post.content.images && Array.isArray(post.content.images)) {
        const captions = post.content.images
          .map(img => img.caption)
          .filter(caption => caption && caption.trim())
          .join(' ');
        if (captions) contentText += ' ' + captions;
      }
      // Add link titles and descriptions
      if (post.content.links && Array.isArray(post.content.links)) {
        const linkText = post.content.links
          .map(link => `${link.title || ''} ${link.description || ''}`)
          .filter(text => text.trim())
          .join(' ');
        if (linkText) contentText += ' ' + linkText;
      }
    }

    contentText = contentText.trim();

    if (!contentText) {
      console.log('No content text found for post:', postId);
      return { autoTags: [], topics: [] };
    }

    console.log('Generating auto-tags for post:', postId, 'with text length:', contentText.length);

    // Call AI tagging API
    const autoTags = await callAutoTagAPI(contentText);

    // Extract topics from tags
    const topics = extractTopicsFromTags(autoTags);

    // Update post with auto-generated tags and topics
    const updateData = {
      autoTags,
      topics
    };

    // Determine tag source
    if (post.tags && post.tags.length > 0) {
      updateData.tagSource = 'mixed';
    } else {
      updateData.tagSource = 'auto';
    }

    await Post.findByIdAndUpdate(postId, updateData);

    console.log('Auto-tagged post:', postId, 'with tags:', autoTags.length, 'topics:', topics.length);

    return { autoTags, topics };

  } catch (error) {
    console.error('Error generating auto-tags for post:', error);
    // Don't throw error - allow post creation to continue
    return { autoTags: [], topics: [] };
  }
};

// Generate auto-tags for a comment
const generateAutoTagsForComment = async (commentId) => {
  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    if (!comment.content || !comment.content.trim()) {
      return { autoTags: [] };
    }

    console.log('Generating auto-tags for comment:', commentId);

    // Call AI tagging API for comment content
    const autoTags = await callAutoTagAPI(comment.content);

    // Update comment with auto-generated tags
    await Comment.findByIdAndUpdate(commentId, { autoTags });

    console.log('Auto-tagged comment:', commentId, 'with tags:', autoTags.length);

    return { autoTags };

  } catch (error) {
    console.error('Error generating auto-tags for comment:', error);
    // Don't throw - allow comment creation to continue
    return { autoTags: [] };
  }
};

// Generate auto-tags for a community
const generateAutoTagsForCommunity = async (communityId) => {
  try {
    const community = await Community.findById(communityId);
    if (!community) {
      throw new Error('Community not found');
    }

    const allText = [
      community.displayName || community.name || '',
      community.description || '',
      Array.isArray(community.rules) ? community.rules.join(' ') : (community.rules || '')
    ].join(' ').trim();

    if (!allText) {
      return { autoTags: [] };
    }

    console.log('Generating auto-tags for community:', communityId);

    // Call AI tagging API for community content
    const autoTags = await callAutoTagAPI(allText);

    // Update community with auto-generated tags
    await Community.findByIdAndUpdate(communityId, { autoTags });

    console.log('Auto-tagged community:', communityId, 'with tags:', autoTags.length);

    return { autoTags };

  } catch (error) {
    console.error('Error generating auto-tags for community:', error);
    // Don't throw - allow community creation to continue
    return { autoTags: [] };
  }
};

// Merge and deduplicate tags
const mergeTags = (manualTags, autoTags) => {
  const allTags = new Set([...manualTags, ...autoTags]);
  return Array.from(allTags);
};

// Test the auto-tagging API connection
const testAutoTagAPI = async () => {
  try {
    console.log('Testing Auto-Tag API connection...');
    const testTags = await callAutoTagAPI('This is a test post about JavaScript and React development');
    console.log('API test successful. Returned tags:', testTags);
    return { success: true, tags: testTags };
  } catch (error) {
    console.error('API test failed:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateAutoTagsForPost,
  generateAutoTagsForComment,
  generateAutoTagsForCommunity,
  callAutoTagAPI,
  extractTopicsFromTags,
  mergeTags,
  testAutoTagAPI
};
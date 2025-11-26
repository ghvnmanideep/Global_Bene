const Post = require('../models/post');
const Community = require('../models/community');
const Comment = require('../models/comment');
const SpamPost = require('../models/spamPost');
const User = require('../models/user');
const { createNotification } = require('./notification.controller');
const { checkSpam } = require('../utils/spamDetection');
const { generateAutoTagsForPost } = require('../utils/autoTagging');
const { logActivity } = require('../utils/logActivity.utils');
const {
  logPostView,
  logPostLike,
  logPostUnlike,
  logPostSave,
  logPostUnsave,
  logPostVote,
  logVoteRemove,
  logSearch
} = require('../utils/interactionLogger');

// Create a new post
exports.createPost = async (req, res) => {
  try {
    const { title, content, communityId, tags = [], category = 'general' } = req.body;
    const userId = req.user.id;

    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    // Validate content structure (optional)
    if (content !== undefined && content !== null && typeof content !== 'object') {
      return res.status(400).json({ success: false, message: 'Content must be an object if provided' });
    }

    // Check if content has valid components (all optional)
    const hasText = content?.text && content.text.trim() !== '';
    const hasImages = content?.images && Array.isArray(content.images) && content.images.length > 0;
    const hasLinks = content?.links && Array.isArray(content.links) && content.links.length > 0;

    // Allow posts with no content (title-only posts)
    // if (!hasText && !hasImages && !hasLinks) {
    //   return res.status(400).json({ success: false, message: 'Post must contain at least text, an image, or a link' });
    // }

    // Validate images array
    if (hasImages) {
      for (const image of content.images) {
        if (!image.public_id || !image.secure_url) {
          return res.status(400).json({ success: false, message: 'Each image must have public_id and secure_url' });
        }
      }
    }

    // Validate links array
    if (hasLinks) {
      for (const link of content.links) {
        if (!link.url || !isValidUrl(link.url)) {
          return res.status(400).json({ success: false, message: 'Each link must have a valid URL' });
        }
      }
    }

    // Validate tags
    if (!Array.isArray(tags)) {
      return res.status(400).json({ success: false, message: 'Tags must be an array' });
    }

    // Check community permissions if specified
    let community = null;
    if (communityId) {
      community = await Community.findById(communityId);
      if (!community) {
        return res.status(404).json({ message: 'Community not found' });
      }

      const isMember = community.members.includes(userId);
      const isCreator = community.creator.toString() === userId;
      const isAdmin = req.user.role === 'admin';

      if (community.isPrivate) {
        if (!isAdmin) {
          return res.status(403).json({ message: 'Only admins can post in private communities' });
        }
      } else {
        if (!isMember && !isCreator) {
          return res.status(403).json({ message: 'You must be a member to post in this community' });
        }
      }
    }

    // Create the post
    const post = new Post({
      title: title.trim(),
      content: content ? {
        text: content.text?.trim() || '',
        images: content.images || [],
        links: content.links || []
      } : {
        text: '',
        images: [],
        links: []
      },
      author: userId,
      community: communityId || undefined,
      tags: tags.filter(tag => tag && typeof tag === 'string').map(tag => tag.toLowerCase().trim()),
      category: category,
      tagSource: tags.length > 0 ? 'manual' : 'auto',
      status: 'active',
      spamStatus: 'not_spam',
      spamConfidence: 0,
      spamReason: ''
    });

    await post.save();

    // Log post creation activity
    await logActivity(
      userId,
      "post",
      `User created a new post: "${title}"`,
      req,
      "post",
      post._id
    );

    // Add post to community
    if (community) {
      community.posts.push(post._id);
      community.postCount = community.posts.length;
      await community.save();
    }

    // Populate author and community
    await post.populate('author', 'username');
    if (community) {
      await post.populate('community', 'name displayName');
    }

    // Generate auto-tags asynchronously
    try {
      await generateAutoTagsForPost(post._id);
    } catch (tagError) {
      console.error('Auto-tagging failed:', tagError);
      // Don't fail the post creation for tagging errors
    }

    // Start async spam check
    const spamText = [title, content?.text || '', ...tags].join(' ');
    processSpamCheck(post._id, title, spamText, tags);

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: { post }
    });

  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ success: false, message: err?.message || 'Server error creating post' });
  }
};

// Helper function to validate URLs
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Async function to check spam after post creation
const processSpamCheck = async (postId, title, content, tags) => {
  try {
    const textToCheck = title + ' ' + (content || '') + ' ' + (tags ? tags.join(' ') : '');
    console.log('Async spam check for post:', postId, 'text:', textToCheck.substring(0, 100) + '...');

    const spamResult = await checkSpam(textToCheck);
    console.log('Async spam check result:', spamResult);

    const post = await Post.findById(postId);
    if (!post) {
      console.error('Post not found for spam check:', postId);
      return;
    }

    // Update post with spam results
    post.spamStatus = spamResult.spamStatus;
    post.spamConfidence = spamResult.confidence;
    post.spamReason = spamResult.reason;
    await post.save();

    // If spam detected, handle spam actions (but don't delete the post)
    if (spamResult.isSpam) {
      console.log('Spam detected asynchronously for post:', postId);

      // Create spam record for tracking
      const spamPost = new SpamPost({
        originalPostId: postId,
        title,
        content: content || '',
        author: post.author,
        community: post.community,
        type: post.type,
        linkUrl: post.linkUrl,
        imageUrl: post.imageUrl,
        imagePublicId: post.imagePublicId,
        tags: post.tags,
        category: post.category,
        spamReason: spamResult.reason,
        detectedAt: new Date(),
      });
      await spamPost.save();

      // Update user's spam post count
      const user = await User.findById(post.author);
      if (user) {
        user.spamPostCount += 1;
        await user.save();

        // Send in-app notification
        const { createSpamNotification } = require('./notification.controller');
        await createSpamNotification(post.author, postId, title, spamResult.reason, spamResult.confidence);

        // Send email notification (SendGrid commented out for now)
        // try {
        //   const { sendSpamNotificationEmail } = require('../utils/email.util');
        //   await sendSpamNotificationEmail(user.email, user.username, title, spamResult.reason, spamResult.confidence);
        // } catch (emailErr) {
        //   console.error('Failed to send spam email notification:', emailErr);
        // }

        // Check if user should be banned (>5 spam posts)
        if (user.spamPostCount >= 5) {
          user.isBanned = true;
          user.bannedReason = 'Account banned due to multiple spam posts and comments';
          user.bannedAt = new Date();
          await user.save();

          // Notify user about ban
          const { createBanNotification } = require('./notification.controller');
          await createBanNotification(post.author, user.bannedReason);

          // Send ban email (SendGrid commented out for now)
          // try {
          //   const { sendBanNotificationEmail } = require('../utils/email.util');
          //   await sendBanNotificationEmail(user.email, user.username, user.bannedReason);
          // } catch (emailErr) {
          //   console.error('Failed to send ban email notification:', emailErr);
          // }
        }
      }
    }
  } catch (err) {
    console.error('Async spam check error for post:', postId, err);
  }
};

// Get all posts (with pagination, filter, and search)
exports.getAllPosts = async (req, res) => {
  try {
    console.log('getAllPosts called with query:', req.query);
    const { page = 1, limit = 20, communityId, sortBy = 'hot', category, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (communityId) {
      query.community = communityId;
    }
    if (req.query.author) {
      query.author = req.query.author;
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { title: { $regex: regex } },
        // Handle both old string content and new object content
        {
          $or: [
            { content: { $regex: regex } }, // Old posts with string content
            { 'content.text': { $regex: regex } } // New posts with object content
          ]
        },
        { tags: { $regex: regex } },
        { autoTags: { $regex: regex } },
        { topics: { $regex: regex } },
      ];

      // Log search interaction
      if (req.user && req.user.id) {
        await logSearch(req.user.id, search.trim());
      }
    }

    // Handle specific tag search (for hashtag functionality)
    if (req.query.tag && req.query.tag.trim()) {
      query.tags = { $regex: new RegExp(req.query.tag.trim(), 'i') };

      // Log tag search interaction
      if (req.user && req.user.id) {
        await logSearch(req.user.id, `#${req.query.tag.trim()}`);
      }
    }

    // Filter out spam posts for regular users, but allow admins to see all posts
    if (!req.user || req.user.role !== 'admin') {
      query.spamStatus = { $ne: 'spam' };
    }

    console.log('Final query:', JSON.stringify(query, null, 2));

    let sortOption = {};
    if (sortBy === 'hot') {
      sortOption = { score: -1, createdAt: -1 };
    } else if (sortBy === 'new') {
      sortOption = { createdAt: -1 };
    } else if (sortBy === 'top') {
      sortOption = { score: -1 };
    }

    console.log('Sort option:', sortOption);

    const posts = await Post.find(query)
      .populate('author', 'username profile')
      .populate('community', 'name displayName iconUrl')
      .select('title content author community createdAt upvotes downvotes commentCount tags category type imageUrl linkUrl score')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    console.log(`Found ${posts.length} posts`);

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
    console.error('Stack trace:', err.stack);
    res.status(500).json({ message: 'Server error fetching posts', error: err.message });
  }
};

// Get single post by ID
exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id)
      .populate('author', 'username profile')
      .populate('community', 'name displayName iconUrl')
      .select('title content author community createdAt upvotes downvotes commentCount tags category type imageUrl linkUrl score');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Log post view interaction
    if (req.user && req.user.id) {
      await logPostView(req.user.id, id, {
        postCategory: post.category,
        postType: post.type,
        communityId: post.community
      });
    }

    res.json(post);
  } catch (err) {
    console.error('Get post by ID error:', err);
    res.status(500).json({ message: 'Server error fetching post' });
  }
};

// Vote on a post
exports.votePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body; // 'upvote' or 'downvote'
    const userId = req.user.id;

    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({ message: 'Invalid vote type' });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Handle old votes array format for backward compatibility
    if (post.votes && Array.isArray(post.votes)) {
      // Remove existing vote from user
      post.votes = post.votes.filter(v => v.userId.toString() !== userId);
      // Add new vote
      post.votes.push({ userId, voteType });
    } else {
      // Handle new upvotes/downvotes arrays
      // Initialize arrays if they don't exist
      if (!Array.isArray(post.upvotes)) post.upvotes = [];
      if (!Array.isArray(post.downvotes)) post.downvotes = [];

      // Remove user from both arrays first
      post.upvotes = post.upvotes.filter(id => id && id.toString() !== userId);
      post.downvotes = post.downvotes.filter(id => id && id.toString() !== userId);

      // Add vote to appropriate array
      if (voteType === 'upvote') {
        post.upvotes.push(userId);
      } else {
        post.downvotes.push(userId);
      }
    }

    // Mark arrays as modified for Mixed type
    post.markModified('upvotes');
    post.markModified('downvotes');

    await post.save();

    // Log vote activity
    await logActivity(
      userId,
      voteType === 'upvote' ? 'upvote' : 'downvote',
      `User ${voteType}d post: "${post.title}"`,
      req,
      "post",
      id
    );

    // Log vote interaction
    await logPostVote(userId, id, voteType, {
      postCategory: post.category,
      postType: post.type || 'mixed',
      communityId: post.community
    });

    // Create notification for post author if voter is not the author
    if (post.author.toString() !== userId) {
      const message = `${req.user.username} ${voteType}d your post "${post.title}"`;
      await createNotification(post.author, voteType, message, userId, id);
    }

    res.json({ message: 'Vote recorded', post });
  } catch (err) {
    console.error('Vote post error:', err);
    res.status(500).json({ message: 'Server error voting on post' });
  }
};

// Remove vote
exports.removeVote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Handle old votes array format for backward compatibility
    if (post.votes && Array.isArray(post.votes)) {
      post.votes = post.votes.filter(v => v.userId.toString() !== userId);
    } else {
      // Handle new upvotes/downvotes arrays
      // Initialize arrays if they don't exist
      if (!Array.isArray(post.upvotes)) post.upvotes = [];
      if (!Array.isArray(post.downvotes)) post.downvotes = [];

      // Remove user from both arrays
      post.upvotes = post.upvotes.filter(id => id && id.toString() !== userId);
      post.downvotes = post.downvotes.filter(id => id && id.toString() !== userId);
    }

    // Mark arrays as modified for Mixed type
    post.markModified('upvotes');
    post.markModified('downvotes');

    await post.save();

    // Log vote removal interaction
    await logVoteRemove(userId, id, {
      postCategory: post.category,
      postType: post.type || 'mixed',
      communityId: post.community
    });

    res.json({ message: 'Vote removed', post });
  } catch (err) {
    console.error('Remove vote error:', err);
    res.status(500).json({ message: 'Server error removing vote' });
  }
};

// Like/Unlike post
exports.toggleLikePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isLiked = post.likedBy ? post.likedBy.includes(userId) : false;
    if (isLiked) {
      post.likedBy = post.likedBy.filter(id => id.toString() !== userId);
      // Log unlike interaction
      await logPostUnlike(userId, id, {
        postCategory: post.category,
        postType: post.type,
        communityId: post.community
      });
    } else {
      if (!post.likedBy) post.likedBy = [];
      post.likedBy.push(userId);
      // Log like interaction
      await logPostLike(userId, id, {
        postCategory: post.category,
        postType: post.type,
        communityId: post.community
      });
    }

    await post.save();
    res.json({ message: isLiked ? 'Post unliked' : 'Post liked', post });
  } catch (err) {
    console.error('Toggle like post error:', err);
    res.status(500).json({ message: 'Server error toggling like' });
  }
};

// Save/Unsave post
exports.toggleSavePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isSaved = post.savedBy.includes(userId);
    if (isSaved) {
      post.savedBy = post.savedBy.filter(id => id.toString() !== userId);

      // Log unsave activity
      await logActivity(
        userId,
        "unsave-post",
        `User unsaved post: "${post.title}"`,
        req,
        "post",
        id
      );

      // Log unsave interaction
      await logPostUnsave(userId, id, {
        postCategory: post.category,
        postType: post.type,
        communityId: post.community
      });
    } else {
      post.savedBy.push(userId);

      // Log save activity
      await logActivity(
        userId,
        "save-post",
        `User saved post: "${post.title}"`,
        req,
        "post",
        id
      );

      // Log save interaction
      await logPostSave(userId, id, {
        postCategory: post.category,
        postType: post.type,
        communityId: post.community
      });
    }

    await post.save();
    res.json({ message: isSaved ? 'Post unsaved' : 'Post saved', post });
  } catch (err) {
    console.error('Toggle save post error:', err);
    res.status(500).json({ message: 'Server error toggling save' });
  }
};

// Update post
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type, linkUrl, tags, category } = req.body;
    const userId = req.user.id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is author or admin
    if (post.author.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    // Validate updates
    const normalizedType = (type || post.type).toLowerCase();
    if (normalizedType === 'text' && (!content && !post.content) && content !== '') {
      return res.status(400).json({ message: 'Content is required for text posts' });
    }
    if (normalizedType === 'image' && !req.file && !post.imageUrl) {
      return res.status(400).json({ message: 'Image file is required for image posts' });
    }

    // Update fields
    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (type !== undefined) post.type = normalizedType;
    if (linkUrl !== undefined) post.linkUrl = linkUrl || '';
    if (tags !== undefined) post.tags = tags || [];
    if (category !== undefined) post.category = category || 'general';

    // Handle image update
    if (req.file) {
      post.imageUrl = req.file.path;
      post.imagePublicId = req.file.filename;
    }

    await post.save();

    // Populate author and community only if present
    await post.populate('author', 'username');
    if (post.community) {
      await post.populate('community', 'name displayName');
    }

    res.json({ message: 'Post updated successfully', post });
  } catch (err) {
    console.error('Update post error:', err);
    res.status(500).json({ message: 'Server error updating post' });
  }
};

// Share post
exports.sharePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Log share interaction
    await logPostShare(userId, id, {
      postCategory: post.category,
      postType: post.type,
      communityId: post.community
    });

    res.json({ message: 'Post shared successfully' });
  } catch (err) {
    console.error('Share post error:', err);
    res.status(500).json({ message: 'Server error sharing post' });
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is author, admin, or community creator/moderator
    const isAuthor = post.author.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    let isCommunityModerator = false;
    if (post.community) {
      const community = await Community.findById(post.community);
      if (community) {
        const isCreator = community.creator.toString() === userId;
        const isModerator = community.moderators.includes(userId);
        isCommunityModerator = isCreator || isModerator;
      }
    }

    if (!isAuthor && !isAdmin && !isCommunityModerator) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    // Delete all comments
    await Comment.deleteMany({ post: id });

    // Remove from community
    const community = await Community.findById(post.community);
    if (community) {
      community.posts = community.posts.filter(p => p.toString() !== id);
      community.postCount = community.posts.length;
      await community.save();
    }

    await Post.findByIdAndDelete(id);

    // Log post deletion activity
    await logActivity(
      userId,
      "delete-post",
      `User deleted post: "${post.title}"`,
      req,
      "post",
      id
    );

    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ message: 'Server error deleting post' });
  }
};


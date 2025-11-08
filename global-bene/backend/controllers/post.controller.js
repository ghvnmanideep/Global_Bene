const Post = require('../models/post');
const Community = require('../models/community');
const Comment = require('../models/comment');
const SpamPost = require('../models/spamPost');
const User = require('../models/user');
const { createNotification } = require('./notification.controller');
const { checkSpam } = require('../utils/spamDetection');
const {
  logPostView,
  logPostLike,
  logPostUnlike,
  logPostSave,
  logPostUnsave,
  logPostVote,
  logVoteRemove
} = require('../utils/interactionLogger');

// Create a new post
exports.createPost = async (req, res) => {
  try {
    const { title, content, communityId, type, linkUrl, tags, category } = req.body;
    const userId = req.user.id;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const normalizedType = (type || 'text').toLowerCase();
    if (normalizedType === 'text' && (!content || content.trim() === '')) {
      return res.status(400).json({ success: false, message: 'Content is required for text posts' });
    }
    if (normalizedType === 'image' && !req.file) {
      return res.status(400).json({ success: false, message: 'Image file is required for image posts' });
    }

    // For user posts, communityId is optional. For community posts, required.
    let community = null;
    if (communityId) {
      community = await Community.findById(communityId);
      if (!community) {
        return res.status(404).json({ message: 'Community not found' });
      }
      // Check permissions based on community type
      const isMember = community.members.includes(userId);
      const isCreator = community.creator.toString() === userId;
      const isAdmin = req.user.role === 'admin';

      if (community.isPrivate) {
        // Private community: only admins can post
        if (!isAdmin) {
          return res.status(403).json({ message: 'Only admins can post in private communities' });
        }
      } else {
        // Public community: members can post
        if (!isMember && !isCreator) {
          return res.status(403).json({ message: 'You must be a member to post in this community' });
        }
      }
    }

    // Create and save the post first
    const post = new Post({
      title,
      content,
      author: userId,
      community: communityId || undefined, // only set if present
      type: normalizedType,
      linkUrl: linkUrl || '', // always store (optional string)
      imageUrl: req.file?.path,
      imagePublicId: req.file?.filename,
      tags: tags || [],
      category: category || 'general',
      spamStatus: 'not_spam', // Default to not spam initially
      spamConfidence: 0,
      spamReason: '',
    });

    await post.save();

    // Add post to community (if applicable)
    if (community) {
      community.posts.push(post._id);
      community.postCount = community.posts.length;
      await community.save();
    }

    // Populate author and community only if present
    await post.populate('author', 'username');
    if (community) {
      await post.populate('community', 'name displayName');
    }

    // Start async spam check after post creation
    processSpamCheck(post._id, title, content, tags);

    res.status(201).json({ success: true, message: 'Post created successfully', data: { post } });
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ success: false, message: err?.message || 'Server error creating post' });
  }
};

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

        // Send email notification
        try {
          const { sendSpamNotificationEmail } = require('../utils/email.util');
          await sendSpamNotificationEmail(user.email, user.username, title, spamResult.reason, spamResult.confidence);
        } catch (emailErr) {
          console.error('Failed to send spam email notification:', emailErr);
        }

        // Check if user should be banned (>5 spam posts)
        if (user.spamPostCount >= 5) {
          user.isBanned = true;
          user.bannedReason = 'Account banned due to multiple spam posts and comments';
          user.bannedAt = new Date();
          await user.save();

          // Notify user about ban
          const { createBanNotification } = require('./notification.controller');
          await createBanNotification(post.author, user.bannedReason);

          // Send ban email
          try {
            const { sendBanNotificationEmail } = require('../utils/email.util');
            await sendBanNotificationEmail(user.email, user.username, user.bannedReason);
          } catch (emailErr) {
            console.error('Failed to send ban email notification:', emailErr);
          }
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
        { content: { $regex: regex } },
        { tags: { $regex: regex } },
      ];
    }

    // Filter out spam posts for regular users, but allow admins to see all posts
    if (!req.user || req.user.role !== 'admin') {
      query.spamStatus = { $ne: 'spam' };
    }

    let sortOption = {};
    if (sortBy === 'hot') {
      sortOption = { score: -1, createdAt: -1 };
    } else if (sortBy === 'new') {
      sortOption = { createdAt: -1 };
    } else if (sortBy === 'top') {
      sortOption = { score: -1 };
    }

    const posts = await Post.find(query)
      .populate('author', 'username profile')
      .populate('community', 'name displayName iconUrl')
      .sort(sortOption)
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

// Get single post by ID
exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id)
      .populate('author', 'username profile')
      .populate('community', 'name displayName iconUrl')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username profile',
        },
      });

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

    // Remove existing vote from user
    post.votes = post.votes.filter(v => v.userId.toString() !== userId);

    // Add new vote
    post.votes.push({ userId, voteType });

    await post.save();

    // Log vote interaction
    await logPostVote(userId, id, voteType, {
      postCategory: post.category,
      postType: post.type,
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

    post.votes = post.votes.filter(v => v.userId.toString() !== userId);
    await post.save();

    // Log vote removal interaction
    await logVoteRemove(userId, id, {
      postCategory: post.category,
      postType: post.type,
      communityId: post.community
    });

    res.json({ message: 'Vote removed', post });
  } catch (err) {
    console.error('Remove vote error:', err);
    res.status(500).json({ message: 'Server error removing vote' });
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
      // Log unsave interaction
      await logPostUnsave(userId, id, {
        postCategory: post.category,
        postType: post.type,
        communityId: post.community
      });
    } else {
      post.savedBy.push(userId);
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

// Delete post
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is author or admin
    if (post.author.toString() !== userId && req.user.role !== 'admin') {
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

    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ message: 'Server error deleting post' });
  }
};


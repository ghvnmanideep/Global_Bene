const Post = require('../models/post');
const Community = require('../models/community');
const Comment = require('../models/comment');

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
      // Check if user is a member (for private communities)
      if (community.isPrivate && !community.members.includes(userId)) {
        return res.status(403).json({ message: 'You must be a member to post in this community' });
      }
    }

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
    res.status(201).json({ success: true, message: 'Post created successfully', data: { post } });
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ success: false, message: err?.message || 'Server error creating post' });
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
    } else {
      post.savedBy.push(userId);
    }

    await post.save();
    res.json({ message: isSaved ? 'Post unsaved' : 'Post saved', post });
  } catch (err) {
    console.error('Toggle save post error:', err);
    res.status(500).json({ message: 'Server error toggling save' });
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


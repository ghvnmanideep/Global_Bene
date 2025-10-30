const Community = require('../models/community');
const Post = require('../models/post');

// Create a new community
exports.createCommunity = async (req, res) => {
  try {
    const { name, displayName, description, iconUrl, bannerUrl, rules, isPrivate } = req.body;
    const userId = req.user.id;

    if (!name || !displayName) {
      return res.status(400).json({ message: 'Name and display name are required' });
    }

    // Validate name format (alphanumeric, lowercase, no spaces)
    const nameRegex = /^[a-z0-9]+$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({ message: 'Community name must be lowercase alphanumeric only' });
    }

    // Check if name already exists
    const existing = await Community.findOne({ name: name.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'Community name already exists' });
    }

    const community = new Community({
      name: name.toLowerCase(),
      displayName,
      description: description || '',
      creator: userId,
      members: [userId], // Creator is automatically a member
      iconUrl,
      bannerUrl,
      rules: rules || [],
      isPrivate: isPrivate || false,
    });

    await community.save();

    await community.populate('creator', 'username');

    res.status(201).json({ message: 'Community created successfully', community });
  } catch (err) {
    console.error('Create community error:', err);
    res.status(500).json({ message: 'Server error creating community' });
  }
};

// Get all communities
exports.getAllCommunities = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const communities = await Community.find(query)
      .populate('creator', 'username')
      .sort({ memberCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Community.countDocuments(query);

    res.json({
      communities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Get all communities error:', err);
    res.status(500).json({ message: 'Server error fetching communities' });
  }
};

// Get community by ID
exports.getCommunityById = async (req, res) => {
  try {
    const { id } = req.params;

    const community = await Community.findById(id)
      .populate('creator', 'username profile')
      .populate({
        path: 'posts',
        options: { limit: 10, sort: { createdAt: -1 } },
        populate: {
          path: 'author',
          select: 'username',
        },
      });

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    res.json(community);
  } catch (err) {
    console.error('Get community by ID error:', err);
    res.status(500).json({ message: 'Server error fetching community' });
  }
};

// Join/Leave community
exports.toggleJoinCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    const isMember = community.members.includes(userId);
    if (isMember) {
      community.members = community.members.filter(id => id.toString() !== userId);
    } else {
      community.members.push(userId);
    }

    await community.save();

    res.json({
      message: isMember ? 'Left community' : 'Joined community',
      community,
    });
  } catch (err) {
    console.error('Toggle join community error:', err);
    res.status(500).json({ message: 'Server error toggling membership' });
  }
};

// Update community
exports.updateCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { displayName, description, iconUrl, bannerUrl, rules, isPrivate } = req.body;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Check if user is creator or admin
    if (community.creator.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this community' });
    }

    if (displayName) community.displayName = displayName;
    if (description !== undefined) community.description = description;
    if (iconUrl !== undefined) community.iconUrl = iconUrl;
    if (bannerUrl !== undefined) community.bannerUrl = bannerUrl;
    if (rules) community.rules = rules;
    if (isPrivate !== undefined) community.isPrivate = isPrivate;

    await community.save();

    res.json({ message: 'Community updated successfully', community });
  } catch (err) {
    console.error('Update community error:', err);
    res.status(500).json({ message: 'Server error updating community' });
  }
};

// Get user's saved posts
exports.getUserSavedPosts = async (req, res) => {
  try {
    const userId = req.user.id;

    const posts = await Post.find({ savedBy: userId })
      .populate('author', 'username profile')
      .populate('community', 'name displayName iconUrl')
      .sort({ createdAt: -1 });

    res.json({ posts });
  } catch (err) {
    console.error('Get saved posts error:', err);
    res.status(500).json({ message: 'Server error fetching saved posts' });
  }
};


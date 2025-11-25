const Community = require('../models/community');
const Post = require('../models/post');
const Comment = require('../models/comment');
const User = require('../models/user');
const { logActivity } = require('../utils/logActivity.utils');
const { logCommunityJoin, logCommunityLeave } = require('../utils/interactionLogger');

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

    // Log community creation activity
    await logActivity(
      userId,
      "community",
      `User created community: ${displayName}`,
      req,
      "community",
      community._id
    );

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

// Get community by ID or name
exports.getCommunityById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;

    let community;
    // Check if id is ObjectId or name
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // It's an ObjectId
      community = await Community.findById(id)
        .populate('creator', 'username profile')
        .populate('members', 'username profile');
    } else {
      // It's a name
      community = await Community.findOne({ name: id.toLowerCase() })
        .populate('creator', 'username profile')
        .populate('members', 'username profile');
    }

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Check if user is a member
    const isMember = userId && community.members.includes(userId);

    // Populate posts: show all for members, limited for non-members
    const populateOptions = {
      path: 'posts',
      options: { sort: { createdAt: -1 } },
      populate: {
        path: 'author',
        select: 'username',
      },
    };

    if (!isMember) {
      populateOptions.options.limit = 10;
    }

    await community.populate(populateOptions);

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

    let community;
    // Check if id is ObjectId or name
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // It's an ObjectId
      community = await Community.findById(id);
    } else {
      // It's a name
      community = await Community.findOne({ name: id.toLowerCase() });
    }

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    const isMember = community.members.includes(userId);
    if (isMember) {
      community.members = community.members.filter(id => id.toString() !== userId);

      // Log leave activity
      await logActivity(
        userId,
        "leave-community",
        `User left community: ${community.displayName}`,
        req,
        "community",
        community._id
      );

      // Log leave interaction
      await logCommunityLeave(userId, id);
    } else {
      community.members.push(userId);

      // Log join activity
      await logActivity(
        userId,
        "join-community",
        `User joined community: ${community.displayName}`,
        req,
        "community",
        community._id
      );

      // Log join interaction
      await logCommunityJoin(userId, id);
    }

    // Update member count
    community.memberCount = community.members.length;
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

    // Log community update activity
    await logActivity(
      userId,
      "update-community",
      `User updated community: ${community.displayName}`,
      req,
      "community",
      community._id
    );

    res.json({ message: 'Community updated successfully', community });
  } catch (err) {
    console.error('Update community error:', err);
    res.status(500).json({ message: 'Server error updating community' });
  }
};

// Get user's joined communities
exports.getUserCommunities = async (req, res) => {
  try {
    const userId = req.user.id;

    const communities = await Community.find({ members: userId })
      .populate('creator', 'username')
      .sort({ createdAt: -1 });

    res.json({ communities });
  } catch (err) {
    console.error('Get user communities error:', err);
    res.status(500).json({ message: 'Server error fetching user communities' });
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

// Promote user to moderator
exports.promoteToModerator = async (req, res) => {
  try {
    const { id } = req.params; // community id
    const { userId } = req.body; // user to promote
    const currentUserId = req.user.id;

    let community;
    // Check if id is ObjectId or name
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      community = await Community.findById(id);
    } else {
      community = await Community.findOne({ name: id.toLowerCase() });
    }

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Only creator can promote moderators
    if (community.creator.toString() !== currentUserId) {
      return res.status(403).json({ message: 'Only community creator can manage moderators' });
    }

    // Check if user is a member
    if (!community.members.includes(userId)) {
      return res.status(400).json({ message: 'User must be a member to become moderator' });
    }

    // Check if already a moderator
    if (community.moderators.includes(userId)) {
      return res.status(400).json({ message: 'User is already a moderator' });
    }

    // Add to moderators
    community.moderators.push(userId);
    await community.save();

    res.json({ message: 'User promoted to moderator successfully', community });
  } catch (err) {
    console.error('Promote to moderator error:', err);
    res.status(500).json({ message: 'Server error promoting user' });
  }
};

// Demote moderator
exports.demoteModerator = async (req, res) => {
  try {
    const { id } = req.params; // community id
    const { userId } = req.body; // user to demote
    const currentUserId = req.user.id;

    let community;
    // Check if id is ObjectId or name
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      community = await Community.findById(id);
    } else {
      community = await Community.findOne({ name: id.toLowerCase() });
    }

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Only creator can demote moderators
    if (community.creator.toString() !== currentUserId) {
      return res.status(403).json({ message: 'Only community creator can manage moderators' });
    }

    // Remove from moderators
    community.moderators = community.moderators.filter(id => id.toString() !== userId);
    await community.save();

    res.json({ message: 'Moderator demoted successfully', community });
  } catch (err) {
    console.error('Demote moderator error:', err);
    res.status(500).json({ message: 'Server error demoting moderator' });
  }
};

// Get community members with roles
exports.getCommunityMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    let community;
    // Check if id is ObjectId or name
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      community = await Community.findById(id);
    } else {
      community = await Community.findOne({ name: id.toLowerCase() });
    }

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Check if user has permission to view members (creator, moderator, or member for private communities)
    const isCreator = community.creator.toString() === currentUserId;
    const isModerator = community.moderators.includes(currentUserId);
    const isMember = community.members.includes(currentUserId);

    if (!isCreator && !isModerator && community.isPrivate && !isMember) {
      return res.status(403).json({ message: 'Not authorized to view community members' });
    }

    // Populate members with roles
    await community.populate('creator', 'username profile');
    await community.populate('moderators', 'username profile');
    await community.populate('members', 'username profile');

    const membersWithRoles = [
      {
        user: community.creator,
        role: 'creator'
      },
      ...community.moderators.map(mod => ({ user: mod, role: 'moderator' })),
      ...community.members
        .filter(member => member._id.toString() !== community.creator.toString() && !community.moderators.includes(member._id))
        .map(member => ({ user: member, role: 'member' }))
    ];

    res.json({
      community: {
        _id: community._id,
        name: community.name,
        displayName: community.displayName
      },
      members: membersWithRoles
    });
  } catch (err) {
    console.error('Get community members error:', err);
    res.status(500).json({ message: 'Server error fetching community members' });
  }
};

// Remove member (moderator action)
exports.removeMember = async (req, res) => {
  try {
    const { id } = req.params; // community id
    const { userId } = req.body; // user to remove
    const currentUserId = req.user.id;

    let community;
    // Check if id is ObjectId or name
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      community = await Community.findById(id);
    } else {
      community = await Community.findOne({ name: id.toLowerCase() });
    }

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Check permissions: creator or moderator can remove members
    const isCreator = community.creator.toString() === currentUserId;
    const isModerator = community.moderators.includes(currentUserId);

    if (!isCreator && !isModerator) {
      return res.status(403).json({ message: 'Not authorized to remove members' });
    }

    // Cannot remove creator
    if (userId === community.creator.toString()) {
      return res.status(400).json({ message: 'Cannot remove community creator' });
    }

    // Remove from members and moderators
    community.members = community.members.filter(id => id.toString() !== userId);
    community.moderators = community.moderators.filter(id => id.toString() !== userId);
    // Update member count
    community.memberCount = community.members.length;
    await community.save();

    res.json({ message: 'Member removed successfully', community });
  } catch (err) {
    console.error('Remove member error:', err);
    res.status(500).json({ message: 'Server error removing member' });
  }
};

// Delete user from community (creator/admin action)
exports.deleteCommunityUser = async (req, res) => {
  try {
    const { id } = req.params; // community id
    const { userId } = req.body; // user to delete
    const currentUserId = req.user.id;

    let community;
    // Check if id is ObjectId or name
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      community = await Community.findById(id);
    } else {
      community = await Community.findOne({ name: id.toLowerCase() });
    }

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Only creator or platform admin can delete users
    const isCreator = community.creator.toString() === currentUserId;
    const isAdmin = req.user.role === 'admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ message: 'Only community creator or admin can delete users' });
    }

    // Cannot delete the creator
    if (userId === community.creator.toString()) {
      return res.status(400).json({ message: 'Cannot delete community creator' });
    }

    // Find the user to delete
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove user from community members and moderators
    community.members = community.members.filter(id => id.toString() !== userId);
    community.moderators = community.moderators.filter(id => id.toString() !== userId);
    community.memberCount = community.members.length;
    await community.save();

    // Delete all posts by this user in this community
    const userPosts = await Post.find({ author: userId, community: community._id });
    const postIds = userPosts.map(p => p._id);
    await Post.deleteMany({ author: userId, community: community._id });

    // Delete all comments by this user on posts in this community
    await Comment.deleteMany({
      author: userId,
      post: { $in: postIds }
    });

    // Also delete comments by this user on other posts in the community
    const allCommunityPosts = await Post.find({ community: community._id }).select('_id');
    const allPostIds = allCommunityPosts.map(p => p._id);
    await Comment.deleteMany({
      author: userId,
      post: { $in: allPostIds }
    });

    res.json({
      message: 'User deleted from community successfully',
      deletedPosts: postIds.length,
      community
    });
  } catch (err) {
    console.error('Delete community user error:', err);
    res.status(500).json({ message: 'Server error deleting user from community' });
  }
};

// Transfer community ownership
exports.transferOwnership = async (req, res) => {
  try {
    const { id } = req.params; // community id
    const { newOwnerId } = req.body; // new owner user id
    const currentUserId = req.user.id;

    let community;
    // Check if id is ObjectId or name
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      community = await Community.findById(id);
    } else {
      community = await Community.findOne({ name: id.toLowerCase() });
    }

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Only current creator can transfer ownership
    if (community.creator.toString() !== currentUserId) {
      return res.status(403).json({ message: 'Only community creator can transfer ownership' });
    }

    // Check if new owner is a member
    if (!community.members.includes(newOwnerId)) {
      return res.status(400).json({ message: 'New owner must be a community member' });
    }

    // Transfer ownership
    community.creator = newOwnerId;

    // If new owner was a moderator, remove them from moderators (they're now owner)
    community.moderators = community.moderators.filter(id => id.toString() !== newOwnerId);

    await community.save();

    // Populate the updated community
    await community.populate('creator', 'username profile');

    res.json({
      message: 'Community ownership transferred successfully',
      community
    });
  } catch (err) {
    console.error('Transfer ownership error:', err);
    res.status(500).json({ message: 'Server error transferring ownership' });
  }
};

// User Groups Management

// Create a user group
exports.createUserGroup = async (req, res) => {
  try {
    const { id } = req.params; // community id
    const { name, description, permissions } = req.body;
    const currentUserId = req.user.id;

    let community;
    // Check if id is ObjectId or name
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      community = await Community.findById(id);
    } else {
      community = await Community.findOne({ name: id.toLowerCase() });
    }

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Only creator can create groups
    if (community.creator.toString() !== currentUserId) {
      return res.status(403).json({ message: 'Only community creator can create user groups' });
    }

    // Check if group name already exists
    if (community.userGroups.some(group => group.name.toLowerCase() === name.toLowerCase())) {
      return res.status(400).json({ message: 'Group name already exists' });
    }

    const newGroup = {
      name,
      description: description || '',
      members: [],
      permissions: {
        canPost: permissions?.canPost ?? true,
        canComment: permissions?.canComment ?? true,
        canModerate: permissions?.canModerate ?? false
      }
    };

    community.userGroups.push(newGroup);
    await community.save();

    res.json({
      message: 'User group created successfully',
      group: community.userGroups[community.userGroups.length - 1]
    });
  } catch (err) {
    console.error('Create user group error:', err);
    res.status(500).json({ message: 'Server error creating user group' });
  }
};

// Add user to group
exports.addUserToGroup = async (req, res) => {
  try {
    const { id, groupId } = req.params; // community id, group id
    const { userId } = req.body;
    const currentUserId = req.user.id;

    let community;
    // Check if id is ObjectId or name
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      community = await Community.findById(id);
    } else {
      community = await Community.findOne({ name: id.toLowerCase() });
    }

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Only creator can manage groups
    if (community.creator.toString() !== currentUserId) {
      return res.status(403).json({ message: 'Only community creator can manage user groups' });
    }

    const group = community.userGroups.id(groupId);
    if (!group) {
      return res.status(404).json({ message: 'User group not found' });
    }

    // Check if user is a member
    if (!community.members.includes(userId)) {
      return res.status(400).json({ message: 'User must be a community member' });
    }

    // Check if already in group
    if (group.members.includes(userId)) {
      return res.status(400).json({ message: 'User is already in this group' });
    }

    group.members.push(userId);
    await community.save();

    res.json({ message: 'User added to group successfully', group });
  } catch (err) {
    console.error('Add user to group error:', err);
    res.status(500).json({ message: 'Server error adding user to group' });
  }
};

// Remove user from group
exports.removeUserFromGroup = async (req, res) => {
  try {
    const { id, groupId } = req.params; // community id, group id
    const { userId } = req.body;
    const currentUserId = req.user.id;

    let community;
    // Check if id is ObjectId or name
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      community = await Community.findById(id);
    } else {
      community = await Community.findOne({ name: id.toLowerCase() });
    }

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Only creator can manage groups
    if (community.creator.toString() !== currentUserId) {
      return res.status(403).json({ message: 'Only community creator can manage user groups' });
    }

    const group = community.userGroups.id(groupId);
    if (!group) {
      return res.status(404).json({ message: 'User group not found' });
    }

    group.members = group.members.filter(id => id.toString() !== userId);
    await community.save();

    res.json({ message: 'User removed from group successfully', group });
  } catch (err) {
    console.error('Remove user from group error:', err);
    res.status(500).json({ message: 'Server error removing user from group' });
  }
};

// Get community user groups
exports.getUserGroups = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    let community;
    // Check if id is ObjectId or name
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      community = await Community.findById(id);
    } else {
      community = await Community.findOne({ name: id.toLowerCase() });
    }

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Only creator or moderators can view groups
    const isCreator = community.creator.toString() === currentUserId;
    const isModerator = community.moderators.includes(currentUserId);

    if (!isCreator && !isModerator) {
      return res.status(403).json({ message: 'Not authorized to view user groups' });
    }

    // Populate group members
    await community.populate('userGroups.members', 'username profile');

    res.json({
      community: { _id: community._id, name: community.name },
      userGroups: community.userGroups
    });
  } catch (err) {
    console.error('Get user groups error:', err);
    res.status(500).json({ message: 'Server error fetching user groups' });
  }
};

// Delete community
exports.deleteCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Check if user is creator or admin
    if (community.creator.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this community' });
    }

    // Delete all posts in the community
    await Post.deleteMany({ community: id });

    // Delete all comments on those posts
    const posts = await Post.find({ community: id }).select('_id');
    const postIds = posts.map(p => p._id);
    await Comment.deleteMany({ post: { $in: postIds } });

    // Delete the community
    await Community.findByIdAndDelete(id);

    // Log community deletion activity
    await logActivity(
      userId,
      "delete-community",
      `User deleted community: ${community.displayName}`,
      req,
      "community",
      id
    );

    res.json({ message: 'Community deleted successfully' });
  } catch (err) {
    console.error('Delete community error:', err);
    res.status(500).json({ message: 'Server error deleting community' });
  }
};


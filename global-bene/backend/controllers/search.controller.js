const { asyncHandler } = require('../middleware/asyncHandler.middleware');
const Community = require('../models/community');
const Post = require('../models/post');
const User = require('../models/user');
const { ApiResponse } = require('../utils/ApiResponse');

// Search communities
const searchCommunities = asyncHandler(async (req, res) => {
    const { q, limit = 5 } = req.query;

    if (!q || q.trim().length < 2) {
        return res.status(200).json(new ApiResponse(200, [], "Search query too short"));
    }

    const communities = await Community.find({
        $or: [
            { name: { $regex: q.trim(), $options: 'i' } },
            { title: { $regex: q.trim(), $options: 'i' } },
            { description: { $regex: q.trim(), $options: 'i' } }
        ]
    })
    .select('name title description avatar members createdAt')
    .sort({ members: -1, createdAt: -1 })
    .limit(parseInt(limit));

    res.status(200).json(new ApiResponse(200, communities, "Communities searched successfully"));
});

// Search posts
const searchPosts = asyncHandler(async (req, res) => {
    const { q, limit = 5 } = req.query;

    if (!q || q.trim().length < 2) {
        return res.status(200).json(new ApiResponse(200, [], "Search query too short"));
    }

    const posts = await Post.find({
        status: 'active',
        $or: [
            { title: { $regex: q.trim(), $options: 'i' } },
            { content: { $regex: q.trim(), $options: 'i' } },
            { tags: { $in: [new RegExp(q.trim(), 'i')] } }
        ]
    })
    .populate('author', 'username profile.avatarUrl')
    .populate('community', 'title name')
    .select('title content author community createdAt score upvotes downvotes type imageUrl linkUrl')
    .sort({ score: -1, createdAt: -1 })
    .limit(parseInt(limit));

    res.status(200).json(new ApiResponse(200, posts, "Posts searched successfully"));
});

// Search users
const searchUsers = asyncHandler(async (req, res) => {
    const { q, limit = 5 } = req.query;

    if (!q || q.trim().length < 2) {
        return res.status(200).json(new ApiResponse(200, [], "Search query too short"));
    }

    const users = await User.find({
        $or: [
            { username: { $regex: q.trim(), $options: 'i' } },
            { email: { $regex: q.trim(), $options: 'i' } }
        ]
    })
    .select('username email profile.avatarUrl createdAt totalLikesReceived')
    .sort({ totalLikesReceived: -1, createdAt: -1 })
    .limit(parseInt(limit));

    res.status(200).json(new ApiResponse(200, users, "Users searched successfully"));
});

// Combined search
const searchAll = asyncHandler(async (req, res) => {
    const { q, limit = 5 } = req.query;

    if (!q || q.trim().length < 2) {
        return res.status(200).json(new ApiResponse(200, {
            communities: [],
            posts: [],
            users: []
        }, "Search query too short"));
    }

    const [communities, posts, users] = await Promise.all([
        Community.find({
            $or: [
                { name: { $regex: q.trim(), $options: 'i' } },
                { title: { $regex: q.trim(), $options: 'i' } },
                { description: { $regex: q.trim(), $options: 'i' } }
            ]
        })
        .select('name title description avatar members createdAt')
        .sort({ members: -1, createdAt: -1 })
        .limit(parseInt(limit)),

        Post.find({
            status: 'active',
            $or: [
                { title: { $regex: q.trim(), $options: 'i' } },
                { content: { $regex: q.trim(), $options: 'i' } },
                { tags: { $in: [new RegExp(q.trim(), 'i')] } }
            ]
        })
        .populate('author', 'username profile.avatarUrl')
        .populate('community', 'title name')
        .select('title content author community createdAt score upvotes downvotes type imageUrl linkUrl')
        .sort({ score: -1, createdAt: -1 })
        .limit(parseInt(limit)),

        User.find({
            $or: [
                { username: { $regex: q.trim(), $options: 'i' } },
                { email: { $regex: q.trim(), $options: 'i' } }
            ]
        })
        .select('username email profile.avatarUrl createdAt totalLikesReceived')
        .sort({ totalLikesReceived: -1, createdAt: -1 })
        .limit(parseInt(limit))
    ]);

    res.status(200).json(new ApiResponse(200, {
        communities,
        posts,
        users
    }, "Search completed successfully"));
});

module.exports = {
    searchCommunities,
    searchPosts,
    searchUsers,
    searchAll
};
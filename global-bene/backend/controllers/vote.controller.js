const { asyncHandler } = require('../middleware/asyncHandler.middleware');
const Vote = require('../models/vote');
const Post = require('../models/post');
const Comment = require('../models/comment');
const { ApiError } = require('../utils/ApiError');
const { ApiResponse } = require('../utils/ApiResponse');
const { logActivity } = require('../utils/logActivity.utils');

// Vote on a post or comment
const vote = asyncHandler(async (req, res) => {
    const { target_type, target_id, vote_type } = req.params;
    const user_id = req.user._id;

    if (!['post', 'comment'].includes(target_type)) {
        throw new ApiError(400, "Invalid target_type. Must be 'post' or 'comment'");
    }

    if (!['up', 'down'].includes(vote_type)) {
        throw new ApiError(400, "Invalid vote_type. Must be 'up' or 'down'");
    }

    // Find the target model
    const TargetModel = target_type === 'post' ? Post : Comment;
    const target = await TargetModel.findById(target_id);
    if (!target) {
        throw new ApiError(404, `${target_type} not found`);
    }

    // Check if user already voted
    const hasUpvoted = target.upvotes.some(id => id.toString() === user_id.toString());
    const hasDownvoted = target.downvotes.some(id => id.toString() === user_id.toString());

    let action = 'none';
    if (vote_type === 'up') {
        if (hasUpvoted) {
            // Unvote up
            target.upvotes.pull(user_id);
            action = 'unvote';
        } else {
            // Vote up, remove down if exists
            target.upvotes.push(user_id);
            if (hasDownvoted) {
                target.downvotes.pull(user_id);
            }
            action = 'vote';
        }
    } else if (vote_type === 'down') {
        if (hasDownvoted) {
            // Unvote down
            target.downvotes.pull(user_id);
            action = 'unvote';
        } else {
            // Vote down, remove up if exists
            target.downvotes.push(user_id);
            if (hasUpvoted) {
                target.upvotes.pull(user_id);
            }
            action = 'vote';
        }
    }

    // Mark arrays as modified for Mixed type
    target.markModified('upvotes');
    target.markModified('downvotes');

    await target.save();

    // Send Kafka event
    // const eventType = action === 'vote' ? `${vote_type}vote` : `un${vote_type}vote`;
    // if (target_type === 'post') {
    //     await sendPostEvent(eventType, { ...target.toObject(), voter_id: user_id });
    // } else {
    //     await sendCommentEvent(eventType, { ...target.toObject(), voter_id: user_id });
    // }

    // Update Vote model
    let userVote = await Vote.findOne({ user_id });
    if (!userVote) {
        userVote = new Vote({ user_id, votes: { post: { target_ids: [], value: 0 }, comment: { target_ids: [], value: 0 } } });
    }

    const voteData = userVote.votes[target_type];
    const targetIdStr = target_id.toString();
    const hasVoted = voteData.target_ids.some(id => id.toString() === targetIdStr);

    if (action === 'vote') {
        if (!hasVoted) {
            voteData.target_ids.push(target_id);
        }
        voteData.value += 1;
    } else if (action === 'unvote') {
        if (hasVoted) {
            voteData.target_ids.pull(target_id);
        }
        voteData.value = Math.max(0, voteData.value - 1);
    }

    await userVote.save();

    // Log voting activity
    await logActivity(
      user_id,
      vote_type === 'up' ? 'upvote' : 'downvote',
      `User ${vote_type}voted ${target_type}: "${target_type === 'post' ? target.title : target.content}"`,
      req,
      target_type,
      target_id
    );

    res.status(200).json(new ApiResponse(200, {
        upvotes: target.upvotes,
        downvotes: target.downvotes,
        userVote: action === 'vote' ? vote_type : null
    }, "Vote updated successfully"));
});

// Get user's vote data
const getUserVotes = asyncHandler(async (req, res) => {
    const user_id = req.user._id;

    const userVote = await Vote.findOne({ user_id }).populate('votes.post.target_ids').populate('votes.comment.target_ids');

    if (!userVote) {
        return res.status(200).json(new ApiResponse(200, {
            votes: {
                post: { target_ids: [], value: 0 },
                comment: { target_ids: [], value: 0 }
            }
        }, "No votes found"));
    }

    res.status(200).json(new ApiResponse(200, userVote, "User votes retrieved successfully"));
});

module.exports = {
    vote,
    getUserVotes
};
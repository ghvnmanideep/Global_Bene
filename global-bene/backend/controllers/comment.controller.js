const Comment = require('../models/comment');
const Post = require('../models/post');
const Community = require('../models/community');
const User = require('../models/user');
const { createNotification } = require('./notification.controller');
const { logActivity } = require('../utils/logActivity.utils');
const { logPostComment } = require('../utils/interactionLogger');

// Create a comment
exports.createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = req.user._id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Skip spam detection for comments

    const comment = new Comment({
      content: content.trim(),
      author: userId,
      post: postId,
      parentComment: parentCommentId || null,
    });

    // Save the comment if not spam
    await comment.save();

    // Add comment to post
    post.comments.push(comment._id);
    post.commentCount = post.comments.length;
    await post.save();

    // If it's a reply, add to parent comment
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (parentComment) {
        parentComment.replies.push(comment._id);
        await parentComment.save();
      }
    }

    await comment.populate('author', 'username profile');

    // Log comment activity
    await logActivity(
      userId,
      parentCommentId ? "reply" : "comment",
      parentCommentId ? `User replied to comment on post: "${post.title}"` : `User commented on post: "${post.title}"`,
      req,
      "comment",
      comment._id
    );

    // Log comment interaction
    await logPostComment(userId, postId, comment._id, {
      postCategory: post.category,
      postType: post.type,
      communityId: post.community,
      isReply: !!parentCommentId
    });

    // Create notification for post author if commenter is not the author
    if (post.author.toString() !== userId) {
      const type = parentCommentId ? 'reply' : 'comment';
      const message = parentCommentId
        ? `${comment.author.username} replied to your comment`
        : `${comment.author.username} commented on your post "${post.title}"`;
      await createNotification(post.author, type, message, userId, postId, comment._id);
    }

    res.status(201).json({ message: 'Comment created successfully', comment });
  } catch (err) {
    console.error('Create comment error:', err);
    res.status(500).json({ message: 'Server error creating comment' });
  }
};

// Get comments for a post
exports.getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;

    // Get all comments for the post (both top-level and replies)
    const allComments = await Comment.find({ post: postId })
      .populate('author', 'username profile')
      .sort({ createdAt: 1 }); // Sort by creation time

    // Create a map for quick lookup
    const commentMap = {};
    const topLevelComments = [];

    // First pass: create map and identify top-level comments
    allComments.forEach(comment => {
      commentMap[comment._id] = {
        ...comment.toObject(),
        replies: []
      };

      if (!comment.parentComment) {
        topLevelComments.push(commentMap[comment._id]);
      }
    });

    // Second pass: nest replies
    allComments.forEach(comment => {
      if (comment.parentComment && commentMap[comment.parentComment]) {
        commentMap[comment.parentComment].replies.push(commentMap[comment._id]);
      }
    });

    // Sort top-level comments by score (upvotes - downvotes) then by creation time
    topLevelComments.sort((a, b) => {
      const scoreA = (a.upvotes?.length || 0) - (a.downvotes?.length || 0);
      const scoreB = (b.upvotes?.length || 0) - (b.downvotes?.length || 0);

      if (scoreB !== scoreA) {
        return scoreB - scoreA; // Higher score first
      }

      // If scores are equal, sort by creation time (newest first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json({ comments: topLevelComments });
  } catch (err) {
    console.error('Get post comments error:', err);
    res.status(500).json({ message: 'Server error fetching comments' });
  }
};

// Vote on a comment
exports.voteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body;
    const userId = req.user._id;

    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({ message: 'Invalid vote type' });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Handle old votes array format for backward compatibility
    if (comment.votes && Array.isArray(comment.votes)) {
      // Remove existing vote
      comment.votes = comment.votes.filter(v => v.userId.toString() !== userId);
      // Add new vote
      comment.votes.push({ userId, voteType });
    } else {
      // Handle new upvotes/downvotes arrays
      // Initialize arrays if they don't exist
      if (!Array.isArray(comment.upvotes)) comment.upvotes = [];
      if (!Array.isArray(comment.downvotes)) comment.downvotes = [];

      // Remove user from both arrays first
      comment.upvotes = comment.upvotes.filter(id => id && id.toString() !== userId);
      comment.downvotes = comment.downvotes.filter(id => id && id.toString() !== userId);

      // Add vote to appropriate array
      if (voteType === 'upvote') {
        comment.upvotes.push(userId);
      } else {
        comment.downvotes.push(userId);
      }
    }

    await comment.save();

    // Log comment voting activity
    await logActivity(
      userId,
      voteType === 'upvote' ? 'upvote' : 'downvote',
      `User ${voteType}d comment: "${comment.content.substring(0, 50)}..."`,
      req,
      "comment",
      id
    );

    res.json({
      message: 'Vote recorded',
      data: {
        upvotes: comment.upvotes,
        downvotes: comment.downvotes,
        userVote: voteType === 'upvote' ? 'up' : 'down'
      }
    });
  } catch (err) {
    console.error('Vote comment error:', err);
    res.status(500).json({ message: 'Server error voting on comment' });
  }
};

// Remove vote from comment
exports.removeVote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Handle old votes array format for backward compatibility
    if (comment.votes && Array.isArray(comment.votes)) {
      comment.votes = comment.votes.filter(v => v.userId.toString() !== userId);
    } else {
      // Handle new upvotes/downvotes arrays
      // Initialize arrays if they don't exist
      if (!Array.isArray(comment.upvotes)) comment.upvotes = [];
      if (!Array.isArray(comment.downvotes)) comment.downvotes = [];

      // Remove user from both arrays
      comment.upvotes = comment.upvotes.filter(id => id && id.toString() !== userId);
      comment.downvotes = comment.downvotes.filter(id => id && id.toString() !== userId);
    }

    await comment.save();

    res.json({ message: 'Vote removed', comment });
  } catch (err) {
    console.error('Remove vote from comment error:', err);
    res.status(500).json({ message: 'Server error removing vote from comment' });
  }
};

// Update comment
exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.author.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this comment' });
    }

    comment.content = content.trim();
    comment.isEdited = true;

    await comment.save();

    // Log comment update activity
    await logActivity(
      userId,
      "update-reply",
      `User updated comment: "${comment.content.substring(0, 50)}..."`,
      req,
      "comment",
      id
    );

    res.json({ message: 'Comment updated successfully', comment });
  } catch (err) {
    console.error('Update comment error:', err);
    res.status(500).json({ message: 'Server error updating comment' });
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is author, admin, or community creator/moderator
    const isAuthor = comment.author.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    let isCommunityModerator = false;
    const commentPost = await Post.findById(comment.post);
    if (commentPost && commentPost.community) {
      const community = await Community.findById(commentPost.community);
      if (community) {
        const isCreator = community.creator.toString() === userId;
        const isModerator = community.moderators.includes(userId);
        isCommunityModerator = isCreator || isModerator;
      }
    }

    if (!isAuthor && !isAdmin && !isCommunityModerator) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // Remove from post
    const post = await Post.findById(comment.post);
    if (post) {
      post.comments = post.comments.filter(c => c.toString() !== id);
      post.commentCount = post.comments.length;
      await post.save();
    }

    // Remove from parent comment if it's a reply
    if (comment.parentComment) {
      const parent = await Comment.findById(comment.parentComment);
      if (parent) {
        parent.replies = parent.replies.filter(r => r.toString() !== id);
        await parent.save();
      }
    }

    // Delete all replies
    await Comment.deleteMany({ parentComment: id });

    await Comment.findByIdAndDelete(id);

    // Log comment deletion activity
    await logActivity(
      userId,
      "delete-reply",
      `User deleted comment: "${comment.content.substring(0, 50)}..."`,
      req,
      "comment",
      id
    );

    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ message: 'Server error deleting comment' });
  }
};


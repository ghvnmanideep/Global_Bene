const Comment = require('../models/comment');
const Post = require('../models/post');
const { createNotification } = require('./notification.controller');

// Create a comment
exports.createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = new Comment({
      content: content.trim(),
      author: userId,
      post: postId,
      parentComment: parentCommentId || null,
    });

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

    const comments = await Comment.find({ post: postId, parentComment: null })
      .populate('author', 'username profile')
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          select: 'username profile',
        },
      })
      .sort({ score: -1, createdAt: -1 });

    res.json({ comments });
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
    const userId = req.user.id;

    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({ message: 'Invalid vote type' });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Remove existing vote
    comment.votes = comment.votes.filter(v => v.userId.toString() !== userId);

    // Add new vote
    comment.votes.push({ userId, voteType });

    await comment.save();

    res.json({ message: 'Vote recorded', comment });
  } catch (err) {
    console.error('Vote comment error:', err);
    res.status(500).json({ message: 'Server error voting on comment' });
  }
};

// Update comment
exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

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
    const userId = req.user.id;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.author.toString() !== userId && req.user.role !== 'admin') {
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

    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ message: 'Server error deleting comment' });
  }
};


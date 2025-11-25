import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { commentService } from '../services/commentService';

export default function CommentSection({ postId, onCommentUpdate }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyFor, setReplyFor] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [voteStatus, setVoteStatus] = useState({});

  // Get user ID from session storage or token
  const getUserInfo = () => {
    try {
      // First try to get from sessionStorage user object
      const userStr = sessionStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user._id) {
          return user._id;
        }
      }

      // Fallback: try to extract from JWT token
      const token = sessionStorage.getItem('accessToken');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload && payload.id) {
            return payload.id;
          }
        } catch (tokenErr) {
          console.warn('Failed to decode token:', tokenErr);
        }
      }
    } catch (err) {
      console.error('Error getting user info:', err);
    }
    return null;
  };

  const userId = getUserInfo();

  // Calculate total comments including replies
  const getTotalCommentCount = (comments) => {
    let count = 0;
    const countReplies = (items) => {
      items.forEach(comment => {
        count++;
        if (comment.replies && comment.replies.length > 0) {
          countReplies(comment.replies);
        }
      });
    };
    countReplies(comments);
    return count;
  };

  // Comments are already nested from the API, no need to nest them again

  const load = async () => {
    setLoading(true);
    try {
      const res = await commentService.getPostComments(postId);
      setComments(res.data.comments || []);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, [postId]);

  // Initialize vote status from comments
  useEffect(() => {
    const newVoteStatus = {};
    const flatten = (items) => {
      items.forEach(c => {
        if (userId) {
          if (Array.isArray(c.upvotes) && c.upvotes.some(id => id.toString() === userId.toString())) {
            newVoteStatus[c._id] = 'upvote';
          } else if (Array.isArray(c.downvotes) && c.downvotes.some(id => id.toString() === userId.toString())) {
            newVoteStatus[c._id] = 'downvote';
          } else {
            newVoteStatus[c._id] = null;
          }
        }
        if (c.replies) flatten(c.replies);
      });
    };
    flatten(comments);
    setVoteStatus(newVoteStatus);
  }, [comments, userId]);

  const handleVote = async (commentId, voteType) => {
    if (!userId) return alert('Login to vote!');
    try {
      // The backend handles toggle logic, so just call vote with the desired type
      const response = await commentService.voteComment(commentId, voteType);

      // Update local vote status based on response
      if (response?.data?.data?.userVote) {
        setVoteStatus({ ...voteStatus, [commentId]: response.data.data.userVote === 'up' ? 'upvote' : 'downvote' });
      } else {
        // If no userVote in response, it means the vote was removed
        setVoteStatus({ ...voteStatus, [commentId]: null });
      }

      // Update the comment data locally instead of reloading
      setComments(prevComments => {
        const updateComment = (comments) => {
          return comments.map(comment => {
            if (comment._id === commentId) {
              return {
                ...comment,
                upvotes: response.data.data.upvotes || [],
                downvotes: response.data.data.downvotes || []
              };
            }
            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: updateComment(comment.replies)
              };
            }
            return comment;
          });
        };
        return updateComment(prevComments);
      });
    } catch (error) {
      console.error('Vote error:', error);
    }
  };

  const handleReply = async (parentCommentId) => {
    if (!replyText.trim()) return;
    try {
      await commentService.createComment(postId, { content: replyText, parentCommentId });
      setReplyText('');
      setReplyFor(null);
      load();
      if (onCommentUpdate) onCommentUpdate();
    } catch {}
  };

  const handleNewComment = async () => {
    if (!newCommentText.trim()) return;
    if (!userId) return alert('Please login to comment!');
    try {
      await commentService.createComment(postId, { content: newCommentText });
      setNewCommentText('');
      load();
      if (onCommentUpdate) onCommentUpdate();
    } catch (err) {
      alert('Failed to post comment. Please try again.');
    }
  };

  const renderComments = (items, level = 0) => (
    <div className={`${level > 0 ? 'ml-2 sm:ml-4 md:ml-6 lg:ml-8 border-l-2 border-orange-200 pl-2 sm:pl-3 md:pl-4 lg:pl-5' : ''}`}>
      {items.map(comment => (
        <div key={comment._id} className="mb-3 sm:mb-4 rounded-lg p-2 sm:p-3 md:p-4 bg-gray-50 dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-2">
            <Link to={`/profile/${comment.author?._id}`} className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline truncate">
              u/{comment.author?.username}
            </Link>
            <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(comment.createdAt).toLocaleString()}</span>
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base mb-3 leading-relaxed break-words">{comment.content}</p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500">
            <button
              onClick={() => handleVote(comment._id, 'upvote')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all duration-200 transform hover:scale-110 ${voteStatus[comment._id] === 'upvote' ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-md' : userId ? 'text-gray-400 hover:text-orange-500 hover:bg-gray-200 dark:hover:bg-gray-700' : 'text-gray-300 cursor-not-allowed'}`}
              disabled={!userId}
              title={!userId ? 'Login to upvote' : voteStatus[comment._id] === 'upvote' ? 'Remove upvote' : 'Upvote'}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{Array.isArray(comment.upvotes) ? comment.upvotes.length : (comment.upvotes || 0)}</span>
            </button>
            <button
              onClick={() => handleVote(comment._id, 'downvote')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all duration-200 transform hover:scale-110 ${voteStatus[comment._id] === 'downvote' ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' : userId ? 'text-gray-400 hover:text-blue-500 hover:bg-gray-200 dark:hover:bg-gray-700' : 'text-gray-300 cursor-not-allowed'}`}
              disabled={!userId}
              title={!userId ? 'Login to downvote' : voteStatus[comment._id] === 'downvote' ? 'Remove downvote' : 'Downvote'}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{Array.isArray(comment.downvotes) ? comment.downvotes.length : (comment.downvotes || 0)}</span>
            </button>
            <button
              onClick={() => setReplyFor(replyFor === comment._id ? null : comment._id)}
              className="px-2 py-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 hover:underline"
              disabled={!userId}
            >
              Reply
            </button>
          </div>
          {replyFor === comment._id && (
            <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                rows={3}
                className="block w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm sm:text-base resize-y focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                autoFocus
              />
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <button
                  onClick={() => handleReply(comment._id)}
                  disabled={!replyText.trim()}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200 text-sm sm:text-base"
                >
                  Send Reply
                </button>
                <button
                  onClick={() => setReplyFor(null)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200 text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {/* Recursive render for replies */}
          {comment.replies && comment.replies.length > 0 && renderComments(comment.replies, level + 1)}
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4">
      {/* New Comment Form */}
      <div className="mb-4 sm:mb-6">
        <h4 className="font-bold text-base sm:text-lg md:text-xl mb-3 text-slate-700 dark:text-slate-100">Add a Comment</h4>
        <textarea
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder={userId ? "Write a comment..." : "Please login to comment"}
          disabled={!userId}
          rows={4}
          className="w-full p-3 sm:p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-y text-sm sm:text-base transition-all duration-200"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handleNewComment}
            disabled={!userId || !newCommentText.trim()}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 text-sm sm:text-base"
          >
            Post Comment
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div>
        <h4 className="font-bold text-base sm:text-lg md:text-xl mb-3 sm:mb-4 text-slate-700 dark:text-slate-100">
          All Comments ({getTotalCommentCount(comments)})
        </h4>
        {loading ? (
          <div className="flex items-center justify-center p-6 sm:p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-sm sm:text-base text-gray-500">Loading comments...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center p-6 sm:p-8 text-gray-500">
            <div className="text-4xl sm:text-6xl mb-4">💬</div>
            <p className="text-sm sm:text-base">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {renderComments(comments)}
          </div>
        )}
      </div>
    </div>
  );
}

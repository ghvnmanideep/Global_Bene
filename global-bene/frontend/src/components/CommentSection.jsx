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

  const userId = (() => {
    try {
      const userStr = sessionStorage.getItem('user');
      if (userStr) return JSON.parse(userStr)._id;
      const token = sessionStorage.getItem('accessToken');
      if (token) return JSON.parse(atob(token.split('.')[1])).id;
    } catch {}
    return null;
  })();

  // Recursive function to nest replies
  const nestComments = (commentsFlat) => {
    const lookup = {};
    const roots = [];
    commentsFlat.forEach(c => lookup[c._id] = { ...c, replies: [] });
    commentsFlat.forEach(c => {
      if (c.parentComment) {
        lookup[c.parentComment]?.replies.push(lookup[c._id]);
      } else {
        roots.push(lookup[c._id]);
      }
    });
    return roots;
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await commentService.getPostComments(postId);
      setComments(res.data.comments || []);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, [postId]);

  const handleVote = async (commentId, voteType) => {
    if (!userId) return alert('Login to vote!');
    try {
      await commentService.voteComment(commentId, { voteType });
      load();
      setVoteStatus({ ...voteStatus, [commentId]: voteType });
    } catch {}
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
    <div className={level > 0 ? 'ml-5 border-l-2 border-orange-200 pl-4' : ''}>
      {items.map(comment => (
        <div key={comment._id} className="mb-4 rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center space-x-2 mb-1">
            <Link to={`/profile/${comment.author?._id}`} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              u/{comment.author?.username}
            </Link>
            <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString()}</span>
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">{comment.content}</p>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <button onClick={() => handleVote(comment._id, 'upvote')}
              className={`hover:text-orange-500 ${voteStatus[comment._id] === 'upvote' ? 'text-orange-500' : ''}`}>⬆️ {comment.upvotes || 0}</button>
            <button onClick={() => handleVote(comment._id, 'downvote')}
              className={`hover:text-blue-500 ${voteStatus[comment._id] === 'downvote' ? 'text-blue-500' : ''}`}>⬇️ {comment.downvotes || 0}</button>
            <button onClick={() => setReplyFor(replyFor === comment._id ? null : comment._id)} className="hover:underline">Reply</button>
          </div>
          {replyFor === comment._id && (
            <div className="mt-2">
              <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                placeholder="Reply..." rows={2} className="block w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm" />
              <div className="flex mt-1">
                <button onClick={() => handleReply(comment._id)} className="bg-orange-500 text-white py-1 px-3 rounded text-xs mr-2">Send</button>
                <button onClick={() => setReplyFor(null)} className="text-xs">Cancel</button>
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
    <div>
      {/* New Comment Form */}
      <div className="mb-6">
        <h4 className="font-bold text-lg mb-3 text-slate-700 dark:text-slate-100">Add a Comment</h4>
        <textarea
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder={userId ? "Write a comment..." : "Please login to comment"}
          disabled={!userId}
          rows={3}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handleNewComment}
            disabled={!userId || !newCommentText.trim()}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            Post Comment
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div>
        <h4 className="font-bold text-lg mb-3 text-slate-700 dark:text-slate-100">
          All Comments ({comments.length})
        </h4>
        {loading ? (
          <div className="p-4 text-xs text-gray-500">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="p-4 text-xs text-gray-500">No comments yet. Be the first to comment!</div>
        ) : (
          renderComments(nestComments(comments))
        )}
      </div>
    </div>
  );
}

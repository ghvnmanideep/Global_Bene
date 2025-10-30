import React, { useState, useEffect } from 'react';
import { commentService } from '../services/commentService';

export default function CommentSection({ postId, onCommentUpdate }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyFor, setReplyFor] = useState(null);
  const [replyText, setReplyText] = useState('');
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

  const renderComments = (items, level = 0) => (
    <div className={level > 0 ? 'ml-5 border-l-2 border-orange-200 pl-4' : ''}>
      {items.map(comment => (
        <div key={comment._id} className="mb-4 rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">u/{comment.author?.username}</span>
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

  if (loading) return <div className="p-4 text-xs text-gray-500">Loading comments...</div>;
  if (!comments.length) return <div className="p-4 text-xs text-gray-500">No comments yet.</div>;
  return (
    <div>
      <h4 className="font-bold text-lg mb-3 text-slate-700 dark:text-slate-100">All Comments</h4>
      {renderComments(nestComments(comments))}
    </div>
  );
}

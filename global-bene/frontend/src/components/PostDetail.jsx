import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { postService } from '../services/postService';
import CommentSection from './CommentSection';

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    postService.getPostById(id)
      .then(res => setPost(res.data))
      .catch(() => setError('Could not load post'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-700 dark:text-gray-200">Loading…</div>;
  if (error) return <div className="p-8 text-center text-red-600 dark:text-red-400">{error}</div>;
  if (!post) return null;

  const formatTime = (date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diff = now - postDate;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  return (
    <div className="max-w-4xl mx-auto my-10">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        {/* Post Header */}
        <div className="flex items-center space-x-2 text-sm mb-4">
          {post.community ? (
            <span className="bg-green-600/15 text-green-900 dark:bg-green-400/10 dark:text-green-200 rounded px-2 font-semibold">Community: r/{post.community.name || post.community.displayName}</span>
          ) : (
            <span className="bg-blue-600/15 text-blue-900 dark:bg-blue-400/10 dark:text-blue-100 rounded px-2 font-semibold">User Post</span>
          )}
          <span className="bg-orange-500/15 text-orange-900 dark:text-orange-300/20 dark:text-orange-100 rounded px-2 font-semibold ml-2">{post.category ? post.category.charAt(0).toUpperCase() + post.category.slice(1) : 'General'}</span>
          <span className="text-gray-600 dark:text-gray-300">•</span>
          <span className="font-medium text-slate-700 dark:text-slate-200">Posted by u/{post.author?.username || 'Anonymous'}</span>
          <span className="text-gray-600 dark:text-gray-400">•</span>
          <span className="font-light text-slate-700 dark:text-slate-300">{formatTime(post.createdAt)}</span>
        </div>

        {/* Post Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{post.title}</h1>

        {/* Post Image */}
        {post.imageUrl && (
          <img src={post.imageUrl} alt={post.title} className="w-full rounded-lg mb-4 max-h-96 object-cover" />
        )}

        {/* Post Link */}
        {post.linkUrl && (
          <div className="flex items-center mb-4">
            <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7a5 5 0 0 1 0 10H7a5 5 0 0 1 0-10h2" />
            </svg>
            <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline break-words">
              {post.linkUrl}
            </a>
          </div>
        )}

        {/* Post Content */}
        {post.content && (
          <p className="text-gray-700 dark:text-gray-300 mb-6 whitespace-pre-wrap">{post.content}</p>
        )}

        {/* Post Stats */}
        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
          <span>{post.upvotes || 0} upvotes</span>
          <span>{post.downvotes || 0} downvotes</span>
          <span>{post.commentCount || 0} comments</span>
        </div>

        {/* Comments Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Comments</h3>
          <CommentSection postId={post._id} onCommentUpdate={() => {}} />
        </div>
      </div>
    </div>
  );
}

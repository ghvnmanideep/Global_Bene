import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { postService } from '../services/postService';
import { commentService } from '../services/commentService';
import { authService } from '../services/authService';
import CommentSection from './CommentSection';

function MiniProfileModal({ userId, onClose }) {
  const [profile, setProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState(null);
  const [isFollowPending, setIsFollowPending] = React.useState(false);
  const [loadError, setLoadError] = React.useState(false);

  React.useEffect(() => {
    async function fetchAll() {
      try {
        setLoadError(false);
        setLoading(true);
        const res = await authService.getUserById(userId);
        setProfile(res.data);
        const me = await authService.getMe();
        setUser(me.data);
      } catch (err) {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [userId]);

  const isOwnProfile = user && profile && user._id === profile._id;
  const isFollowing = user && profile && user.following && user.following.some(f => (typeof f === 'object' ? f._id : f) === profile._id);
  const handleFollow = async () => {
    try {
      setIsFollowPending(true);
      await authService.followUser(profile._id);
      const res = await authService.getUserById(profile._id);
      setProfile(res.data);
      const me = await authService.getMe();
      setUser(me.data);
    } catch (e) {
      console.error('Follow error:', e);
      alert(e?.response?.data?.message || 'Failed to follow user');
    } finally {
      setIsFollowPending(false);
    }
  };
  const handleUnfollow = async () => {
    try {
      setIsFollowPending(true);
      await authService.unfollowUser(profile._id);
      const res = await authService.getUserById(profile._id);
      setProfile(res.data);
      const me = await authService.getMe();
      setUser(me.data);
    } catch (e) {
      console.error('Unfollow error:', e);
      alert(e?.response?.data?.message || 'Failed to unfollow user');
    } finally {
      setIsFollowPending(false);
    }
  };

  if (loading || !profile)
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-sm relative">
          <div className="flex flex-col items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500 mb-3"></div>
            <div className="text-center text-gray-700 dark:text-gray-50">Loading profile...</div>
          </div>
          <button onClick={onClose} className="absolute top-3 right-5 text-lg">×</button>
        </div>
      </div>
    );

  if (loadError)
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-sm relative flex flex-col items-center">
          <div className="text-red-500 text-center font-bold">User not found or unavailable.</div>
          <button onClick={onClose} className="mt-5 px-5 py-2 rounded-full bg-orange-500 text-white font-semibold shadow hover:bg-orange-600">Close</button>
        </div>
      </div>
    );

  const followerCount = profile.followers?.length || 0;
  const followingCount = profile.following?.length || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-7 w-full max-w-sm relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-2 right-4 text-lg text-gray-500 hover:text-orange-600">×</button>
        <div className="flex flex-col items-center">
          <img src={profile.profile?.avatarUrl || 'https://www.gravatar.com/avatar/?d=mp'} className="w-20 h-20 rounded-full border-4 border-orange-300 shadow mb-2" alt="avatar" />
          <h2 className="text-xl font-bold mb-0.5">{profile.username}</h2>
          <p className="text-xs text-gray-400 mb-2">{profile.email}</p>
          {profile.profile?.bio && (
            <p className="text-xs text-slate-600 dark:text-slate-200 mb-2 italic text-center border-l-4 border-orange-200 pl-2">{profile.profile.bio}</p>
          )}
          <div className="flex gap-6 my-1 mb-4">
            <div className="text-center"><div className="font-semibold">{followerCount}</div><div className="text-xs text-gray-600">Followers</div></div>
            <div className="text-center"><div className="font-semibold">{profile.posts?.length || 0}</div><div className="text-xs text-gray-600">Posts</div></div>
            <div className="text-center"><div className="font-semibold">{followingCount}</div><div className="text-xs text-gray-600">Following</div></div>
          </div>
          {!isOwnProfile && (
            isFollowing ? (
              <button disabled={isFollowPending} onClick={handleUnfollow} className="bg-orange-200 text-orange-900 px-4 py-1 rounded-full shadow hover:bg-orange-300 font-semibold transition disabled:opacity-60 w-full">
                {isFollowPending ? 'Unfollowing...' : 'Unfollow'}
              </button>
            ) : (
              <button disabled={isFollowPending} onClick={handleFollow} className="bg-orange-500 text-white px-4 py-1 rounded-full shadow hover:bg-orange-600 font-semibold transition disabled:opacity-60 w-full">
                {isFollowPending ? 'Following...' : 'Follow'}
              </button>
            )
          )}
          <Link
            to={`/profile/${profile._id}`}
            onClick={onClose}
            className="block mt-4 px-4 py-1 rounded-full font-semibold text-orange-700 hover:bg-orange-100 text-xs border border-orange-200 transition"
          >
            Go to full profile
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PostCard({ post, onUpdate }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userVote, setUserVote] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Get user ID from session storage or token
  const getUserInfo = () => {
    try {
      const userStr = sessionStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user._id;
      }
      // Try to extract from token (basic fallback)
      const token = sessionStorage.getItem('accessToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id;
      }
    } catch (err) {
      console.error('Error getting user info:', err);
    }
    return null;
  };
  
  const userId = getUserInfo();

  // Check user's vote
  React.useEffect(() => {
    if (userId && post.votes) {
      const userVoteData = post.votes.find(v => v.userId.toString() === userId.toString());
      setUserVote(userVoteData?.voteType || null);
    }
    if (userId && post.savedBy) {
      setIsSaved(post.savedBy.some(id => id.toString() === userId.toString()));
    }
  }, [post, userId]);

  const handleVote = async (voteType) => {
    // Check if user is logged in
    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      alert('Please log in to vote');
      window.location.href = '/login';
      return;
    }

    try {
      // If clicking the same vote type, remove it (toggle off)
      if (userVote === voteType) {
        await postService.removeVote(post._id);
        setUserVote(null);
      } else {
        // If clicking different vote type (e.g., upvote when downvoted), 
        // backend will remove existing vote and add new one
        await postService.votePost(post._id, voteType);
        setUserVote(voteType);
      }
      onUpdate();
    } catch (err) {
      console.error('Error voting:', err);
      if (err.response?.status === 401) {
        alert('Please log in to vote');
        window.location.href = '/login';
      }
    }
  };

  const handleSave = async () => {
    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      alert('Please log in to save posts');
      window.location.href = '/login';
      return;
    }

    try {
      await postService.toggleSavePost(post._id);
      setIsSaved(!isSaved);
    } catch (err) {
      console.error('Error saving post:', err);
      if (err.response?.status === 401) {
        alert('Please log in to save posts');
        window.location.href = '/login';
      }
    }
  };

  const loadComments = async () => {
    if (!showComments && post.commentCount > 0) {
      setLoading(true);
      try {
        const res = await commentService.getPostComments(post._id);
        setComments(res.data.comments || []);
      } catch (err) {
        console.error('Error loading comments:', err);
      } finally {
        setLoading(false);
      }
    }
    setShowComments(!showComments);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      alert('Please log in to comment');
      window.location.href = '/login';
      return;
    }

    try {
      await commentService.createComment(post._id, { content: commentText });
      setCommentText('');
      loadComments();
      onUpdate();
    } catch (err) {
      console.error('Error creating comment:', err);
      if (err.response?.status === 401) {
        alert('Please log in to comment');
        window.location.href = '/login';
      }
    }
  };

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
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-orange-500 transition-colors">
      <div className="flex flex-col sm:flex-row">
        {/* Vote Section */}
        <div className="flex flex-col items-center p-2 bg-gray-50 dark:bg-gray-900 rounded-l-lg">
          <button
            onClick={() => handleVote('upvote')}
            disabled={!userId}
            title={!userId ? 'Login to upvote' : userVote === 'upvote' ? 'Remove upvote' : 'Upvote'}
            className={`p-1 rounded transition-colors ${
              userVote === 'upvote' 
                ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                : userId 
                ? 'text-gray-400 hover:text-orange-500 hover:bg-gray-200 dark:hover:bg-gray-700' 
                : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <span className={`text-xs font-semibold mt-1 ${userVote === 'upvote' ? 'text-orange-500' : 'text-gray-500 dark:text-gray-400'}`}>
            {post.upvotes || 0}
          </span>
          <button
            onClick={() => handleVote('downvote')}
            disabled={!userId}
            title={!userId ? 'Login to downvote' : userVote === 'downvote' ? 'Remove downvote' : 'Downvote'}
            className={`p-1 rounded transition-colors ${
              userVote === 'downvote' 
                ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : userId 
                ? 'text-gray-400 hover:text-blue-500 hover:bg-gray-200 dark:hover:bg-gray-700' 
                : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <span className={`text-xs font-semibold mt-1 ${userVote === 'downvote' ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}>
            {post.downvotes || 0}
          </span>
        </div>

        {/* Post Content */}
        <div className="flex-1 p-4 min-w-0">
          {/* Post Header */}
          <div className="flex items-center space-x-2 text-sm mb-2">
            {post.community ? (
              <span className="bg-green-600/15 text-green-900 dark:bg-green-400/10 dark:text-green-200 rounded px-2 font-semibold">Community: r/{post.community.name || post.community.displayName}</span>
            ) : (
              <span className="bg-blue-600/15 text-blue-900 dark:bg-blue-400/10 dark:text-blue-100 rounded px-2 font-semibold">User Post</span>
            )}
            <span className="bg-orange-500/15 text-orange-900 dark:text-orange-300/20 dark:text-orange-100 rounded px-2 font-semibold ml-2">{post.category ? post.category.charAt(0).toUpperCase() + post.category.slice(1) : 'General'}</span>
            <span className="text-gray-600 dark:text-gray-300">•</span>
            <span className="font-medium text-slate-700 dark:text-slate-200 cursor-pointer underline-offset-2 hover:underline" onClick={() => setShowProfileModal(true)}>Posted by u/{post.author?.username || 'Anonymous'}</span>
            <span className="text-gray-600 dark:text-gray-400">•</span>
            <span className="font-light text-slate-700 dark:text-slate-300">{formatTime(post.createdAt)}</span>
          </div>

          {/* Post Title */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 hover:text-orange-500 cursor-pointer">
            <Link
              to={`/post/${post._id}`}
              onClick={(e) => {
                const token = sessionStorage.getItem('accessToken');
                if (!token) {
                  e.preventDefault();
                  window.location.href = '/login';
                }
              }}
            >
              {post.title}
            </Link>
          </h3>

          {/* Post Image (Cloudinary/Mongo) */}
          {post.imageUrl && (
            <img src={post.imageUrl} alt={post.title} className="w-full rounded-lg mb-2 max-h-96 object-cover" style={{display: post.imageUrl ? undefined : 'none'}} />
          )}
          {/* Post Link (always, if present) */}
          {post.linkUrl && (
            <div className="flex items-center mb-2">
              <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7a5 5 0 0 1 0 10H7a5 5 0 0 1 0-10h2" /></svg>
              <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-sm break-words">
                {post.linkUrl}
              </a>
            </div>
          )}
          {/* Post Content/Text (for text or if present with image/link) */}
          {post.content && (
            <p className="text-gray-700 dark:text-gray-300 mb-3 line-clamp-3">{post.content}</p>
          )}

          {/* Post Actions */}
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <button
              onClick={loadComments}
              className="flex items-center space-x-1 hover:text-orange-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span>{post.commentCount || 0} Comments</span>
            </button>
            <button
              onClick={handleSave}
              className={`flex items-center space-x-1 hover:text-orange-500 transition-colors ${
                isSaved ? 'text-orange-500' : ''
              }`}
            >
              <svg className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
              <span>Save</span>
            </button>
            <button className="flex items-center space-x-1 hover:text-orange-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.885 12.938 9 12.482 9 12c0-.482-.115-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              <span>Share</span>
            </button>
          </div>

          {/* Comment Section */}
          {showComments && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <CommentSection postId={post._id} onCommentUpdate={onUpdate} />
            </div>
          )}
          {showProfileModal && post.author?._id && (
            <MiniProfileModal userId={post.author._id} onClose={() => setShowProfileModal(false)} />
          )}
        </div>
      </div>
    </div>
  );
}


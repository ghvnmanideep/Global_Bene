import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { postService } from '../services/postService';
import { commentService } from '../services/commentService';
import { authService } from '../services/authService';
import { reportService } from '../services/reportService';
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
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [currentPost, setCurrentPost] = useState(post); // Local post state for immediate updates
  
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

  // Update local post state when prop changes
  React.useEffect(() => {
    setCurrentPost(post);
  }, [post]);

  // Check user's vote
  React.useEffect(() => {
    if (userId && Array.isArray(currentPost.upvotes)) {
      setUserVote(currentPost.upvotes.some(id => id.toString() === userId.toString()) ? 'upvote' : null);
    }
    if (userId && Array.isArray(currentPost.downvotes)) {
      if (currentPost.downvotes.some(id => id.toString() === userId.toString())) {
        setUserVote('downvote');
      }
    }
    if (userId && Array.isArray(currentPost.savedBy)) {
      setIsSaved(currentPost.savedBy.some(id => id.toString() === userId.toString()));
    }
  }, [currentPost, userId]);

  const handleVote = async (voteType) => {
    // Check if user is logged in
    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      alert('Please log in to vote');
      window.location.href = '/login';
      return;
    }

    try {
      // The backend handles toggle logic, so just call vote with the desired type
      const response = await postService.votePost(currentPost._id, voteType);

      // Update local vote status based on response
      if (response?.data?.data?.userVote) {
        setUserVote(response.data.data.userVote === 'up' ? 'upvote' : response.data.data.userVote === 'down' ? 'downvote' : null);
      } else {
        // If no userVote in response, it means the vote was removed
        setUserVote(null);
      }

      // Update local post data with response for immediate UI feedback
      if (response?.data?.data) {
        setCurrentPost(prev => ({
          ...prev,
          upvotes: response.data.data.upvotes || [],
          downvotes: response.data.data.downvotes || []
        }));
      }

      // Don't call onUpdate immediately to prevent state reset
      // onUpdate(); // Commented out to prevent vote reset
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
      await postService.toggleSavePost(currentPost._id);
      setIsSaved(!isSaved);
    } catch (err) {
      console.error('Error saving post:', err);
      if (err.response?.status === 401) {
        alert('Please log in to save posts');
        window.location.href = '/login';
      }
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      alert('Please log in to report posts');
      window.location.href = '/login';
      return;
    }

    if (!reportReason.trim()) {
      alert('Please provide a reason for reporting');
      return;
    }

    setIsReporting(true);
    try {
      await reportService.createReport('Post', currentPost._id, reportReason);
      alert('Report submitted successfully. Thank you for helping keep our community safe.');
      setShowReportModal(false);
      setReportReason('');
    } catch (err) {
      console.error('Error reporting post:', err);
      if (err.response?.status === 400) {
        alert(err.response.data.message || 'You have already reported this post');
      } else if (err.response?.status === 401) {
        alert('Please log in to report posts');
        window.location.href = '/login';
      } else {
        alert('Failed to submit report. Please try again.');
      }
    } finally {
      setIsReporting(false);
    }
  };

  const loadComments = async () => {
    if (!showComments && currentPost.commentCount > 0) {
      setLoading(true);
      try {
        const res = await commentService.getPostComments(currentPost._id);
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
      await commentService.createComment(currentPost._id, { content: commentText });
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
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-orange-500 transition-all duration-200 hover:shadow-lg max-w-4xl mx-auto">
      <div className="flex flex-col lg:flex-row">
        {/* Vote Section */}
        <div className="flex lg:flex-col flex-row items-center justify-center p-2 sm:p-3 lg:p-4 bg-gray-50 dark:bg-gray-900 rounded-t-lg lg:rounded-l-lg lg:rounded-t-none border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 gap-1 lg:gap-0">
          {/* Upvote Section */}
          <div className="flex lg:flex-col flex-row items-center gap-1 lg:gap-0">
            <button
              onClick={() => handleVote('upvote')}
              disabled={!userId}
              title={!userId ? 'Login to upvote' : userVote === 'upvote' ? 'Remove upvote' : 'Upvote'}
              className={`p-1 sm:p-2 lg:p-3 rounded-lg transition-all duration-200 transform hover:scale-110 ${
                userVote === 'upvote'
                  ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-md'
                  : userId
                  ? 'text-gray-400 hover:text-orange-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <span className={`text-xs sm:text-sm lg:text-base font-bold lg:mt-2 px-1 sm:px-2 py-1 rounded ${userVote === 'upvote' ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'text-gray-500 dark:text-gray-400'}`}>
              {Array.isArray(currentPost.upvotes) ? currentPost.upvotes.length : (currentPost.upvotes || 0)}
            </span>
          </div>

          {/* Downvote Section */}
          <div className="flex lg:flex-col flex-row items-center gap-1 lg:gap-0">
            <button
              onClick={() => handleVote('downvote')}
              disabled={!userId}
              title={!userId ? 'Login to downvote' : userVote === 'downvote' ? 'Remove downvote' : 'Downvote'}
              className={`p-1 sm:p-2 lg:p-3 rounded-lg transition-all duration-200 transform hover:scale-110 ${
                userVote === 'downvote'
                  ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                  : userId
                  ? 'text-gray-400 hover:text-blue-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <span className={`text-xs sm:text-sm lg:text-base font-bold lg:mt-2 px-1 sm:px-2 py-1 rounded ${userVote === 'downvote' ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-500 dark:text-gray-400'}`}>
              {Array.isArray(currentPost.downvotes) ? currentPost.downvotes.length : (currentPost.downvotes || 0)}
            </span>
          </div>
        </div>

        {/* Post Content */}
        <div className="flex-1 p-4 lg:p-6 min-w-0">
          {/* Post Header */}
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm mb-3">
            {currentPost.community ? (
              <span className="bg-green-600/15 text-green-900 dark:bg-green-400/10 dark:text-green-200 rounded-full px-3 py-1 font-semibold text-xs">g/{currentPost.community.name || currentPost.community.displayName}</span>
            ) : (
              <span className="bg-blue-600/15 text-blue-900 dark:bg-blue-400/10 dark:text-blue-100 rounded-full px-3 py-1 font-semibold text-xs">User Post</span>
            )}
            <span className="bg-orange-500/15 text-orange-900 dark:text-orange-300/20 dark:text-orange-100 rounded-full px-3 py-1 font-semibold text-xs">{currentPost.category ? currentPost.category.charAt(0).toUpperCase() + currentPost.category.slice(1) : 'General'}</span>
            <span className="text-gray-600 dark:text-gray-300 hidden sm:inline">•</span>
            <span className="font-medium text-slate-700 dark:text-slate-200 cursor-pointer hover:underline transition-all duration-200" onClick={() => {
              const token = sessionStorage.getItem('accessToken');
              if (!token) {
                setLoginPrompt(true);
                setTimeout(() => setLoginPrompt(false), 3000);
              } else {
                setShowProfileModal(true);
              }
            }}>u/{currentPost.author?.username || 'Anonymous'}</span>
            <span className="text-gray-600 dark:text-gray-400 hidden sm:inline">•</span>
            <span className="font-light text-slate-700 dark:text-slate-300">{formatTime(currentPost.createdAt)}</span>
          </div>

          {/* Post Title */}
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-3 hover:text-orange-500 cursor-pointer transition-colors duration-200">
            <Link
              to={`/post/${currentPost._id}`}
              onClick={(e) => {
                const token = sessionStorage.getItem('accessToken');
                if (!token) {
                  e.preventDefault();
                  alert('Please login to view the full post');
                  return;
                }
              }}
              className="hover:text-orange-500 transition-colors duration-200"
            >
              {currentPost.title}
            </Link>
          </h3>

          {/* Post Images */}
          {currentPost.content?.images && currentPost.content.images.length > 0 && (
            <div className="mb-4 space-y-2">
              {currentPost.content.images.map((image, index) => (
                <div key={index} className="rounded-lg overflow-hidden shadow-md">
                  <img
                    src={image.secure_url}
                    alt={currentPost.title}
                    className="w-full h-auto max-h-96 sm:max-h-[500px] lg:max-h-[600px] object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Post Links */}
          {currentPost.content?.links && currentPost.content.links.length > 0 && (
            <div className="mb-4 space-y-2">
              {currentPost.content.links.map((link, index) => (
                <div key={index} className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <svg className="w-5 h-5 mr-2 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7a5 5 0 0 1 0 10H7a5 5 0 0 1 0-10h2" />
                  </svg>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm sm:text-base break-words font-medium"
                  >
                    {link.title || link.url}
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Post Text Content */}
          {currentPost.content?.text && (
            <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm sm:text-base leading-relaxed line-clamp-3">{currentPost.content.text}</p>
          )}

          {/* Legacy support for old format */}
          {currentPost.imageUrl && !currentPost.content?.images && (
            <div className="mb-4 rounded-lg overflow-hidden shadow-md">
              <img
                src={currentPost.imageUrl}
                alt={currentPost.title}
                className="w-full h-auto max-h-96 sm:max-h-[500px] lg:max-h-[600px] object-cover hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
          )}

          {currentPost.linkUrl && !currentPost.content?.links && (
            <div className="flex items-center mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <svg className="w-5 h-5 mr-2 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7a5 5 0 0 1 0 10H7a5 5 0 0 1 0-10h2" />
              </svg>
              <a
                href={currentPost.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm sm:text-base break-words font-medium"
              >
                {currentPost.linkUrl}
              </a>
            </div>
          )}

          {/* Post Actions */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-500 dark:text-gray-400">
            <button
              onClick={loadComments}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-orange-500 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span className="font-medium">{currentPost.commentCount || 0} Comments</span>
            </button>
            <button
              onClick={handleSave}
              disabled={!userId}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                isSaved
                  ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-orange-500'
              } ${!userId ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <svg className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
              <span className="font-medium">{isSaved ? 'Saved' : 'Save'}</span>
            </button>
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-orange-500 transition-all duration-200"
                onClick={() => {
                  const shareText = currentPost.content?.text || currentPost.title;
                  if (navigator.share) {
                    navigator.share({
                      title: currentPost.title,
                      text: shareText,
                      url: window.location.origin + `/post/${currentPost._id}`
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.origin + `/post/${currentPost._id}`);
                    alert('Link copied to clipboard!');
                  }
                }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.885 12.938 9 12.482 9 12c0-.482-.115-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              <span className="font-medium">Share</span>
            </button>
            <button
              onClick={() => setShowReportModal(true)}
              disabled={!userId}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                !userId
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-500'
              }`}
              title={!userId ? 'Login to report posts' : 'Report this post'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <span className="font-medium">Report</span>
            </button>
          </div>

          {/* Comment Section */}
          {showComments && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <CommentSection postId={currentPost._id} onCommentUpdate={onUpdate} />
            </div>
          )}
          {showProfileModal && currentPost.author?._id && (
            <MiniProfileModal userId={currentPost.author._id} onClose={() => setShowProfileModal(false)} />
          )}
          {loginPrompt && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-sm text-center">
                <p className="text-gray-700 dark:text-gray-300 mb-4">Please login to see user profile</p>
                <button
                  onClick={() => setLoginPrompt(false)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          )}
          {showReportModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Report Post</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                  Please provide a reason for reporting this post. Your report will be reviewed by our moderators.
                </p>
                <form onSubmit={handleReport}>
                  <textarea
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Describe why you're reporting this post..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    rows={4}
                    maxLength={500}
                    required
                  />
                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowReportModal(false);
                        setReportReason('');
                      }}
                      className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isReporting || !reportReason.trim()}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isReporting ? 'Reporting...' : 'Submit Report'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


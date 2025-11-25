import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authService } from '../services/authService';
import PostCard from './PostCard';
import { postService } from '../services/postService';
import { communityService } from '../services/communityService';
import { commentService } from '../services/commentService';
import CreatePost from './CreatePost';

export default function Profile() {
  const { id } = useParams(); // Get user ID from URL params
  const [user, setUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null); // For others' profiles
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();
  const [profilePosts, setProfilePosts] = useState([]);
  const [isFollowPending, setIsFollowPending] = useState(false);
  const [followersDetails, setFollowersDetails] = useState([]);
  const [followingDetails, setFollowingDetails] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [userComments, setUserComments] = useState([]);
  const [userActivities, setUserActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [editingPost, setEditingPost] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [totalUserPosts, setTotalUserPosts] = useState(0);

  useEffect(() => {
    authService
      .getMe()
      .then((res) => setUser(res.data))
      .catch(() => {
        setUser(null);
      });
  }, []);

  // Fetch profile user if id is provided (for other users' profiles)
  useEffect(() => {
    if (id) {
      authService.getUserById(id)
        .then((res) => setProfileUser(res.data))
        .catch((err) => {
          console.error('Error fetching user profile:', err);
          if (!user) {
            setMsg('Please login to see the users');
          } else {
            setMsg('User not found');
          }
        });
    } else {
      setProfileUser(null); // Reset for own profile
    }
  }, [id, user]);

  const displayedId = profileUser?._id || user?._id;
  const isOwnProfile = !id || (user && profileUser && profileUser._id === user._id);
  const isFollowing = user && profileUser && user.following && user.following.some(f => (typeof f === 'object' ? f._id : f) === profileUser._id);
  const refreshData = async () => {
    if (profileUser?._id) {
      const res = await authService.getUserById(profileUser._id);
      setProfileUser(res.data);
    }
    const resMe = await authService.getMe();
    setUser(resMe.data);
  }
  const handleFollow = async () => {
    setIsFollowPending(true);
    await authService.followUser(profileUser._id);
    await refreshData();
    setIsFollowPending(false);
  };
  const handleUnfollow = async () => {
    setIsFollowPending(true);
    await authService.unfollowUser(profileUser._id);
    await refreshData();
    setIsFollowPending(false);
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setShowEditModal(true);
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await postService.deletePost(postId);
      // Refresh posts
      const res = await postService.getAllPosts({ author: displayedId, limit: 20 });
      setProfilePosts(res.data.posts || []);
      setTotalUserPosts(res.data.pagination?.total || 0);
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentService.deleteComment(commentId);
      // Refresh comments
      const res = await authService.getUserComments(displayedId);
      setUserComments(res.data.comments || []);
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('Failed to delete comment');
    }
  };

  const handleEditPostSubmit = async () => {
    setShowEditModal(false);
    // Refresh posts
    const res = await postService.getAllPosts({ author: displayedId, limit: 20 });
    setProfilePosts(res.data.posts || []);
    setTotalUserPosts(res.data.pagination?.total || 0);
  };

  // Fetch posts for this profile on mount or id change
  useEffect(() => {
    async function fetchPosts() {
      if (!displayedId) return;
      try {
        const res = await postService.getAllPosts({ author: displayedId, limit: 20 });
        setProfilePosts(res.data.posts || []);
        setTotalUserPosts(res.data.pagination?.total || 0);
      } catch {}
    }
    fetchPosts();
  }, [displayedId]);

  // Helper: get count
  const displayedUser = profileUser || user;

  // Fetch followers and following details
  useEffect(() => {
    async function fetchUserDetails() {
      if (!displayedUser) return;

      const followersIds = displayedUser.followers || [];
      const followingIds = displayedUser.following || [];

      try {
        const followersPromises = followersIds.map(id => authService.getUserById(id).catch(() => ({ data: { username: 'Unknown' } })));
        const followingPromises = followingIds.map(id => authService.getUserById(id).catch(() => ({ data: { username: 'Unknown' } })));

        const followersRes = await Promise.all(followersPromises);
        const followingRes = await Promise.all(followingPromises);

        setFollowersDetails(followersRes.map(res => res.data));
        setFollowingDetails(followingRes.map(res => res.data));
      } catch (err) {
        console.error('Error fetching user details:', err);
      }
    }
    fetchUserDetails();
  }, [displayedUser]);

  // Fetch saved posts and user comments if it's the user's own profile
  useEffect(() => {
    async function fetchSavedPosts() {
      if (!isOwnProfile || !user) return;
      try {
        const res = await communityService.getUserSavedPosts();
        setSavedPosts(res.data.posts || []);
      } catch (err) {
        console.error('Error fetching saved posts:', err);
      }
    }

    async function fetchUserComments() {
      if (!isOwnProfile || !user || !displayedId) return;
      try {
        const res = await authService.getUserComments(displayedId);
        setUserComments(res.data.comments || []);
      } catch (err) {
        console.error('Error fetching user comments:', err);
      }
    }

    async function fetchUserActivities() {
      if (!isOwnProfile || !user || !displayedId) return;
      try {
        const res = await authService.getUserInteractionLogs(displayedId);
        setUserActivities(res.data.activities || []);
      } catch (err) {
        console.error('Error fetching user activities:', err);
      }
    }

    fetchSavedPosts();
    fetchUserComments();
    fetchUserActivities();
  }, [isOwnProfile, displayedId, user]);
  const followerCount = displayedUser?.followers?.length || 0;
  const followingCount = displayedUser?.following?.length || 0;
  // Use the total count from API instead of loaded posts length
  const postCount = totalUserPosts;
  const followerLabel = followerCount === 1 ? 'Follower' : 'Followers';
  const followingLabel = followingCount === 1 ? 'Following' : 'Following';

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
        Loading profile or redirecting to login...
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto mt-10 p-4">
      {/* Profile Avatar and Username */}
      <div className="flex flex-col items-center bg-gradient-to-r from-orange-200 via-white to-orange-100 rounded-2xl shadow-lg p-8 mb-6 border border-orange-300">
        <img
          src={displayedUser.profile?.avatarUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}
          alt={`${displayedUser.username}'s avatar`}
          className="w-32 h-32 rounded-full border-4 border-orange-500 shadow-lg mb-4 object-cover hover:scale-105 transition-transform"
        />
        <h1 className="text-4xl font-black text-orange-900 mb-1">{displayedUser.username}</h1>
        <p className="text-gray-500 mb-2">{displayedUser.email}</p>
        {displayedUser.googleId && (
          <div className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs mb-2 font-medium">
            Signed in with Google
          </div>
        )}
        {profileUser && user && !isOwnProfile && (
          <div className="my-2">
            {isFollowing ? (
              <button
                disabled={isFollowPending}
                onClick={handleUnfollow}
                className="bg-orange-200 text-orange-900 px-4 py-2 rounded-full shadow hover:bg-orange-300 font-semibold transition disabled:opacity-60"
              >
                {isFollowPending ? 'Unfollowing...' : 'Unfollow'}
              </button>
            ) : (
              <button
                disabled={isFollowPending}
                onClick={handleFollow}
                className="bg-orange-500 text-white px-4 py-2 rounded-full shadow hover:bg-orange-600 font-semibold transition disabled:opacity-60"
              >
                {isFollowPending ? 'Following...' : 'Follow'}
              </button>
            )}
          </div>
        )}
        {/* Stats Bar */}
        <div className="flex gap-10 justify-center mt-4 mb-2">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{followerCount}</div>
            <div className="text-xs uppercase tracking-widest text-gray-700">{followerLabel}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{postCount}</div>
            <div className="text-xs uppercase tracking-widest text-gray-700">Posts</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{followingCount}</div>
            <div className="text-xs uppercase tracking-widest text-gray-700">{followingLabel}</div>
          </div>
        </div>
        {/* Spam Status Transparency */}
        {isOwnProfile && displayedUser.spamPostCount > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
            <div className="text-red-700 font-semibold">Spam Activity Warning</div>
            <div className="text-sm text-red-600 mt-1">
              You have {displayedUser.spamPostCount} spam post{displayedUser.spamPostCount !== 1 ? 's' : ''}.
              {displayedUser.spamPostCount >= 5 && ' Your account is banned due to excessive spam.'}
            </div>
          </div>
        )}
        <div className="flex gap-2 justify-center mt-4">
          {isOwnProfile && (
            <Link
              to="/edit-profile"
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full font-bold shadow transition"
            >
              Edit Profile
            </Link>
          )}
          <button
            onClick={() => document.getElementById('posts-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-white hover:bg-orange-50 border border-orange-400 text-orange-700 px-6 py-2 rounded-full font-bold shadow ml-2 transition"
          >
            View Posts
          </button>
        </div>
      </div>

      {/* Followers/Following Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Followers Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <h3 className="font-bold mb-3 text-orange-700 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Followers ({followerCount})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {followersDetails.length > 0 ? (
              followersDetails.map(user => (
                <Link
                  to={`/profile/${user._id}`}
                  key={user._id}
                  className="flex items-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition"
                >
                  <img
                    src={user.profile?.avatarUrl || 'https://www.gravatar.com/avatar/?d=mp'}
                    alt={user.username}
                    className="w-8 h-8 rounded-full mr-3"
                  />
                  <span className="font-medium text-orange-700 dark:text-orange-300">@{user.username}</span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">No followers yet.</p>
            )}
          </div>
        </div>

        {/* Following Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <h3 className="font-bold mb-3 text-orange-700 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Following ({followingCount})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {followingDetails.length > 0 ? (
              followingDetails.map(user => (
                <Link
                  to={`/profile/${user._id}`}
                  key={user._id}
                  className="flex items-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition"
                >
                  <img
                    src={user.profile?.avatarUrl || 'https://www.gravatar.com/avatar/?d=mp'}
                    alt={user.username}
                    className="w-8 h-8 rounded-full mr-3"
                  />
                  <span className="font-medium text-orange-700 dark:text-orange-300">@{user.username}</span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">Not following anyone yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Bio and Profile Details Cards*/}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-xl bg-white dark:bg-gray-800 p-4 shadow border border-orange-100">
          <h2 className="font-bold mb-2 text-orange-700">Bio</h2>
          <p className="text-gray-700 dark:text-gray-200 min-h-[40px]">{displayedUser.profile?.bio || 'No bio available.'}</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-800 p-4 shadow border border-orange-100">
          <h2 className="font-bold mb-2 text-orange-700">Mobile</h2>
          <p className="text-gray-700 dark:text-gray-200 min-h-[32px]">{displayedUser.profile?.mobile || 'Not provided'}</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-800 p-4 shadow border border-orange-100">
          <h2 className="font-bold mb-2 text-orange-700">Gender</h2>
          <p className="text-gray-700 dark:text-gray-200 min-h-[32px]">{displayedUser.profile?.gender || 'Not specified'}</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-800 p-4 shadow border border-orange-100">
          <h2 className="font-bold mb-2 text-orange-700">Date of Birth</h2>
          <p className="text-gray-700 dark:text-gray-200 min-h-[32px]">{displayedUser.profile?.dob ? new Date(displayedUser.profile.dob).toLocaleDateString() : 'Not specified'}</p>
        </div>
      </div>
      {/* Message Section */}
      {msg && (
        <p className={`mt-6 p-2 text-center rounded ${msg.includes('success') ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
          {msg}
        </p>
      )}

      {/* Tabs for Posts, Saved Posts, and Comments */}
      {isOwnProfile && (
        <div className="mt-12 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-4 py-2 font-semibold ${activeTab === 'posts' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600 hover:text-orange-600'}`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-2 font-semibold ${activeTab === 'saved' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600 hover:text-orange-600'}`}
            >
              Saved Posts
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`px-4 py-2 font-semibold ${activeTab === 'comments' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600 hover:text-orange-600'}`}
            >
              Comments
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`px-4 py-2 font-semibold ${activeTab === 'activities' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600 hover:text-orange-600'}`}
            >
              Activity Logs
            </button>
          </div>
        </div>
      )}

      {/* User posts section anchor */}
      <div id="posts-section" className="mt-12">
        {activeTab === 'posts' && (
          <>
            <h2 className="text-2xl font-bold mb-4 text-orange-800">Posts by {displayedUser.username}</h2>
            {profilePosts.length === 0 ? (
              <p className="p-8 text-center text-gray-500">No posts yet.</p>
            ) : (
              <div className="space-y-4">
                {profilePosts
                  .filter(post => post.author && post.author._id === displayedId)
                  .map(post => (
                    <div key={post._id} className="relative">
                      <PostCard post={post} onUpdate={() => {}} />
                      {isOwnProfile && (
                        <div className="absolute top-2 right-2 flex gap-2">
                          <button
                            onClick={() => handleEditPost(post)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePost(post._id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'saved' && isOwnProfile && (
          <>
            <h2 className="text-2xl font-bold mb-4 text-orange-800">Saved Posts</h2>
            {savedPosts.length === 0 ? (
              <p className="p-8 text-center text-gray-500">No saved posts yet.</p>
            ) : (
              <div className="space-y-4">
                {savedPosts.map(post => (
                  <PostCard key={post._id} post={post} onUpdate={() => {}} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'comments' && isOwnProfile && (
          <>
            <h2 className="text-2xl font-bold mb-4 text-orange-800">My Comments</h2>
            {userComments.length === 0 ? (
              <p className="p-8 text-center text-gray-500">No comments yet.</p>
            ) : (
              <div className="space-y-4">
                {userComments.map(comment => (
                  <div key={comment._id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <Link to={`/post/${comment.post._id}`} className="text-lg font-semibold text-orange-600 hover:text-orange-800 underline">
                            On: {comment.post.title}
                          </Link>
                          <span className="ml-2 text-sm text-gray-500">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-3">{comment.content}</p>
                        <div className="text-sm text-gray-500">
                          <span>👍 {comment.upvotes || 0} upvotes</span>
                          <span className="ml-4">👎 {comment.downvotes || 0} downvotes</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm ml-4"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'activities' && isOwnProfile && (
          <>
            <h2 className="text-2xl font-bold mb-4 text-orange-800">Activity Logs</h2>
            {userActivities.length === 0 ? (
              <p className="p-8 text-center text-gray-500">No activities yet.</p>
            ) : (
              <div className="space-y-4">
                {userActivities.map(activity => (
                  <div key={activity.event_id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {activity.event_type.includes('login') && <span className="text-2xl">🔐</span>}
                        {activity.event_type.includes('logout') && <span className="text-2xl">🚪</span>}
                        {activity.event_type.includes('post') && <span className="text-2xl">📝</span>}
                        {activity.event_type.includes('comment') && <span className="text-2xl">💬</span>}
                        {activity.event_type.includes('vote') && <span className="text-2xl">👍</span>}
                        {activity.event_type.includes('follow') && <span className="text-2xl">👥</span>}
                        {!['login', 'logout', 'post', 'comment', 'vote', 'follow'].some(a => activity.event_type.includes(a)) && <span className="text-2xl">📋</span>}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                            {activity.event_type.replace('_', ' ')}
                          </h3>
                          <span className="text-sm text-gray-500">
                            {new Date(activity.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-3">
                          {activity.entity_type} interaction
                        </p>
                        {activity.props && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            {activity.props.browser && <p><strong>Browser:</strong> {activity.props.browser}</p>}
                            {activity.props.platform && <p><strong>Platform:</strong> {activity.props.platform}</p>}
                            {activity.props.ip_address && <p><strong>IP:</strong> {activity.props.ip_address}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Post Modal */}
      {showEditModal && editingPost && (
        <CreatePost
          onClose={() => {
            setShowEditModal(false);
            setEditingPost(null);
          }}
          onSuccess={handleEditPostSubmit}
          communities={[]} // Pass empty array since editing doesn't need community selection
          editPost={editingPost}
        />
      )}
    </div>
  );
}

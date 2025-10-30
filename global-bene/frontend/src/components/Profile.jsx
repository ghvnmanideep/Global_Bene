import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import PostCard from './PostCard';
import { postService } from '../services/postService';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null); // For others' profiles (TODO for route view)
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();
  const [profilePosts, setProfilePosts] = useState([]);
  const [isFollowPending, setIsFollowPending] = useState(false);

  useEffect(() => {
    authService
      .getMe()
      .then((res) => setUser(res.data))
      .catch(() => {
        setUser(null);
        navigate('/login');
      });
  }, [navigate]);

  const displayedId = profileUser?._id || user?._id;
  const isOwnProfile = user && profileUser?._id === user._id;
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

  // Fetch posts for this profile on mount or id change
  useEffect(() => {
    async function fetchPosts() {
      if (!displayedId) return;
      try {
        const res = await postService.getAllPosts({ author: displayedId });
        setProfilePosts(res.data.posts || []);
      } catch {}
    }
    fetchPosts();
  }, [displayedId]);

  // Helper: get count
  const followerCount = user?.followers?.length || 0;
  const followingCount = user?.following?.length || 0;
  // For the total posts count, use user.posts?.length if available, or placeholder
  const postCount = user?.posts?.length || 0; // update this if you fetch posts
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
          src={user.profile?.avatarUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}
          alt={`${user.username}'s avatar`}
          className="w-32 h-32 rounded-full border-4 border-orange-500 shadow-lg mb-4 object-cover hover:scale-105 transition-transform"
        />
        <h1 className="text-4xl font-black text-orange-900 mb-1">{user.username}</h1>
        <p className="text-gray-500 mb-2">{user.email}</p>
        {user.googleId && (
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
        <div className="flex gap-2 justify-center mt-4">
          <Link
            to="/edit-profile"
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full font-bold shadow transition"
          >
            Edit Profile
          </Link>
          <button
            onClick={() => document.getElementById('posts-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-white hover:bg-orange-50 border border-orange-400 text-orange-700 px-6 py-2 rounded-full font-bold shadow ml-2 transition"
          >
            View Posts
          </button>
        </div>
      </div>

      {/* Followers/Following Chips */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6 flex flex-col gap-2">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(user.followers || []).length > 0 ? (
            user.followers.map(id => (
              <Link to={`/profile/${id}`} key={id} className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-semibold shadow hover:bg-orange-200 text-xs mr-2 mb-2 transition whitespace-nowrap">
                {id}
              </Link>
            ))
          ) : <span className="text-xs italic text-gray-400">No followers yet.</span>}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(user.following || []).length > 0 ? (
            user.following.map(id => (
              <Link to={`/profile/${id}`} key={id} className="inline-block px-3 py-1 bg-orange-50 text-orange-600 rounded-full font-semibold shadow hover:bg-orange-200 text-xs mr-2 mb-2 transition whitespace-nowrap">
                {id}
              </Link>
            ))
          ) : <span className="text-xs italic text-gray-400">Not following anyone yet.</span>}
        </div>
      </div>

      {/* Bio and Profile Details Cards*/}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-xl bg-white dark:bg-gray-800 p-4 shadow border border-orange-100">
          <h2 className="font-bold mb-2 text-orange-700">Bio</h2>
          <p className="text-gray-700 dark:text-gray-200 min-h-[40px]">{user.profile?.bio || 'No bio available.'}</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-800 p-4 shadow border border-orange-100">
          <h2 className="font-bold mb-2 text-orange-700">Mobile</h2>
          <p className="text-gray-700 dark:text-gray-200 min-h-[32px]">{user.profile?.mobile || 'Not provided'}</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-800 p-4 shadow border border-orange-100">
          <h2 className="font-bold mb-2 text-orange-700">Gender</h2>
          <p className="text-gray-700 dark:text-gray-200 min-h-[32px]">{user.profile?.gender || 'Not specified'}</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-800 p-4 shadow border border-orange-100">
          <h2 className="font-bold mb-2 text-orange-700">Date of Birth</h2>
          <p className="text-gray-700 dark:text-gray-200 min-h-[32px]">{user.profile?.dob ? new Date(user.profile.dob).toLocaleDateString() : 'Not specified'}</p>
        </div>
      </div>
      {/* Message Section */}
      {msg && (
        <p className={`mt-6 p-2 text-center rounded ${msg.includes('success') ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
          {msg}
        </p>
      )}

      {/* User posts section anchor */}
      <div id="posts-section" className="mt-12">
        <h2 className="text-2xl font-bold mb-4 text-orange-800">Posts by {profileUser?._id ? profileUser.username : user.username}</h2>
        {profilePosts.length === 0 ? (
          <p className="p-8 text-center text-gray-500">No posts yet.</p>
        ) : (
          <div className="space-y-4">
            {profilePosts
              .filter(post => post.author && post.author._id === displayedId)
              .map(post => (
                <PostCard key={post._id} post={post} onUpdate={() => {}} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

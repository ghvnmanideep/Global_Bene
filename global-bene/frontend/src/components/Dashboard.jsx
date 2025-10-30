import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { postService } from '../services/postService';
import { communityService } from '../services/communityService';
import { authService } from '../services/authService';
import PostCard from './PostCard';
import CreatePost from './CreatePost';
import CreateCommunity from './CreateCommunity';
import CommunityList from './CommunityList';

export default function Dashboard() {
  const [posts, setPosts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('hot');
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const navigate = useNavigate();
  const [userResults, setUserResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadUser();
    loadPosts();
    loadCommunities();
  }, [sortBy]);

  // Update search effect to also fetch users
  useEffect(() => {
    if (!search.trim()) {
      setUserResults([]);
      setShowDropdown(false);
      return;
    }
    const handle = setTimeout(async () => {
      setIsSearching(true);
      // Search users (fetch usernames)
      try {
        const res = await authService.searchUsers(search.trim());
        setUserResults(res.data.users||[]);
        setShowDropdown(true);
      } catch { setUserResults([]); setShowDropdown(false); }
      loadPosts().finally(() => setIsSearching(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    // Store user in sessionStorage for easy access
    if (user) {
      sessionStorage.setItem('user', JSON.stringify(user));
    }
  }, [user]);

  const loadUser = async () => {
    try {
      const res = await authService.getMe();
      setUser(res.data);
    } catch (err) {
      console.error('Error loading user:', err);
    }
  };

  const loadPosts = async () => {
    try {
      const params = { sortBy };
      if (search && search.trim()) params.search = search.trim();
      const res = await postService.getAllPosts(params);
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error('Error loading posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCommunities = async () => {
    try {
      const res = await communityService.getAllCommunities({ limit: 10 });
      setCommunities(res.data.communities || []);
    } catch (err) {
      console.error('Error loading communities:', err);
    }
  };

  const handlePostCreated = () => {
    setShowCreatePost(false);
    loadPosts();
    loadCommunities();
  };

  const handleCommunityCreated = () => {
    setShowCreateCommunity(false);
    loadCommunities();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Reddit-like Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">r</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">GlobalBene</span>
            </Link>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:block relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users or posts..."
                  className="w-64 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  onFocus={() => {if (userResults.length || posts.length) setShowDropdown(true);}}
                  onBlur={() => setTimeout(()=>setShowDropdown(false),150)}
                />
                {showDropdown && (userResults.length>0 || posts.length>0) && (
                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded shadow z-50 text-sm border border-gray-200 dark:border-gray-600 max-h-60 overflow-y-auto">
                    {userResults.length > 0 && (
                      <div>
                        <div className="px-3 py-1 font-bold text-gray-700 dark:text-gray-200">Users</div>
                        {userResults.map(u => (
                          <div key={u._id}
                            className="px-3 py-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 cursor-pointer"
                            onMouseDown={() => navigate(`/profile/${u._id}`)}>
                            <span className="font-medium text-orange-600 dark:text-orange-300">@{u.username}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {posts.length > 0 && (
                      <div>
                        <div className="px-3 py-1 font-bold text-gray-700 dark:text-gray-200">Posts</div>
                        {posts.filter(post => post.title&&post.title.toLowerCase().includes(search.toLowerCase()))
                          .map(post => (
                            <div key={post._id} className="px-3 py-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 cursor-pointer"
                            onMouseDown={() => {
                              // Scroll to post in list
                              const el = document.getElementById(`post-${post._id}`);
                              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              setShowDropdown(false);
                            }}>
                              <span className="text-gray-900 dark:text-gray-100">{post.title}</span>
                            </div>
                        ))}
                      </div>
                    )}
                    {(!userResults.length && !posts.some(post => post.title&&post.title.toLowerCase().includes(search.toLowerCase()))) && (
                      <div className="px-3 py-2 text-gray-500">No results found.</div>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowCreatePost(true)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-semibold text-sm"
              >
                Create Post
              </button>
              <button
                onClick={() => setShowCreateCommunity(true)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold text-sm"
              >
                Create Community
              </button>
              {user && (
                <Link to="/profile" className="flex items-center space-x-2">
                  <img
                    src={user.profile?.avatarUrl || 'https://www.gravatar.com/avatar/?d=mp'}
                    alt={user.username}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user.username}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="w-full lg:flex-1 min-w-0">
            {/* Sort Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg mb-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-1 p-2">
                <button
                  onClick={() => setSortBy('hot')}
                  className={`px-4 py-2 rounded text-sm font-semibold ${
                    sortBy === 'hot'
                      ? 'bg-gray-100 dark:bg-gray-700 text-orange-500'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  🔥 Hot
                </button>
                <button
                  onClick={() => setSortBy('new')}
                  className={`px-4 py-2 rounded text-sm font-semibold ${
                    sortBy === 'new'
                      ? 'bg-gray-100 dark:bg-gray-700 text-orange-500'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  ⭐ New
                </button>
                <button
                  onClick={() => setSortBy('top')}
                  className={`px-4 py-2 rounded text-sm font-semibold ${
                    sortBy === 'top'
                      ? 'bg-gray-100 dark:bg-gray-700 text-orange-500'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  ⬆️ Top
                </button>
              </div>
            </div>

            {/* Posts List */}
            {posts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">No posts yet. Be the first to create one!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post._id} id={`post-${post._id}`}><PostCard post={post} onUpdate={loadPosts} /></div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-80 space-y-4">
            {/* Communities Sidebar */}
            <CommunityList communities={communities} onJoin={loadCommunities} />

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Posts</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{posts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Communities</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{communities.length}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Modals */}
      {showCreatePost && (
        <CreatePost
          onClose={() => setShowCreatePost(false)}
          onSuccess={handlePostCreated}
          communities={communities}
        />
      )}

      {showCreateCommunity && (
        <CreateCommunity onClose={() => setShowCreateCommunity(false)} onSuccess={handleCommunityCreated} />
      )}
    </div>
  );
}


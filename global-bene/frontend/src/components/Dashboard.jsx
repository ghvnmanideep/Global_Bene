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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const navigate = useNavigate();
  const [userResults, setUserResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalCommunities, setTotalCommunities] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    loadUser();
    loadPosts();
    loadCommunities();
  }, [sortBy, page]);

  // Update search effect to also fetch users
  useEffect(() => {
    if (!search.trim()) {
      setUserResults([]);
      setShowDropdown(false);
      setPage(1); // Reset page when clearing search
      return;
    }
    const handle = setTimeout(async () => {
      setIsSearching(true);
      setPage(1); // Reset page when searching
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
      const hasToken = !!sessionStorage.getItem('accessToken');
      if (!hasToken) return; // don't call if not logged in
      const res = await authService.getMe();
      setUser(res.data);
    } catch (err) {
      if (err?.response?.status !== 401) {
        console.error('Error loading user:', err);
      }
    }
  };

  const loadPosts = async () => {
    try {
      const params = { sortBy, limit: 20, page };
      if (search && search.trim()) params.search = search.trim();
      const res = await postService.getAllPosts(params);
      setPosts(res.data.posts || []);
      setTotalPosts(res.data.pagination?.total || 0);
      setTotalPages(res.data.pagination?.pages || 1);
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
      setTotalCommunities(res.data.pagination?.total || 0);
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 py-2 md:py-0">
            <Link to="/dashboard" className="flex items-center space-x-2">
               <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                 <span className="text-white font-bold text-lg">G</span>
               </div>
               <span className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">GlobalBene</span>
             </Link>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
               {/* Sidebar Toggle Button */}
               <button
                 onClick={() => setSidebarOpen(!sidebarOpen)}
                 className="flex items-center justify-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-110"
                 title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
               >
                 <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   {sidebarOpen ? (
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   ) : (
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                   )}
                 </svg>
               </button>
               <div className="relative flex-1 sm:flex-none">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users or posts..."
                  className="w-full sm:w-64 px-3 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-400"
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
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="flex-1 sm:flex-none px-3 md:px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-semibold text-sm"
                >
                  Create Post
                </button>
                <button
                  onClick={() => setShowCreateCommunity(true)}
                  className="flex-1 sm:flex-none px-3 md:px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold text-sm"
                >
                  Create Community
                </button>
              </div>
              {user && (
                <Link to="/profile" className="flex items-center space-x-2 justify-center sm:justify-start">
                  <img
                    src={user.profile?.avatarUrl || 'https://www.gravatar.com/avatar/?d=mp'}
                    alt={user.username}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">{user.username}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        <div className="flex flex-col xl:flex-row gap-4 md:gap-6">
          {/* Left Sidebar - Toggleable on all screens */}
          <aside className={`w-64 space-y-4 transition-all duration-300 ease-in-out ${sidebarOpen ? 'block' : 'hidden'} xl:block ${sidebarOpen ? 'fixed left-0 top-0 h-full z-40 xl:relative xl:top-auto xl:left-auto xl:h-auto bg-gray-50 dark:bg-gray-900 xl:bg-transparent p-4 xl:p-0 shadow-lg xl:shadow-none' : ''}`}>
            {/* Navigation Menu */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sticky top-20 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Navigation</h3>
                <button onClick={() => setSidebarOpen(false)} className="xl:hidden p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="space-y-2">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 rounded-lg transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                  </svg>
                  Home
                </Link>
                <Link
                  to="/communities"
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 rounded-lg transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Communities
                </Link>
                <Link
                  to="/create-post"
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 rounded-lg transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Post
                </Link>
                {user && (
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 rounded-lg transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </Link>
                )}
              </nav>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Quick Stats</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total Posts</span>
                  <span className="font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded text-xs">{totalPosts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Communities</span>
                  <span className="font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded text-xs">{totalCommunities}</span>
                </div>
                {user && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Your Posts</span>
                    <span className="font-bold text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded text-xs">{user.posts?.length || 0}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Popular Communities */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Popular Communities</h3>
              <div className="space-y-2">
                {communities.slice(0, 5).map(community => (
                  <Link
                    key={community._id}
                    to={`/community/${community.name}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-bold text-xs">g</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">g/{community.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{community.memberCount || 0} members</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* Mobile Backdrop */}
          {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-30 xl:hidden transition-opacity duration-300" onClick={() => setSidebarOpen(false)} />}

          {/* Main Content */}
          <div className="w-full xl:flex-1 min-w-0 xl:order-2">
            {/* Sort Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg mb-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex flex-wrap items-center gap-1 p-3">
                <button
                  onClick={() => setSortBy('hot')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    sortBy === 'hot'
                      ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-orange-500'
                  }`}
                >
                  🔥 Hot
                </button>
                <button
                  onClick={() => setSortBy('new')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    sortBy === 'new'
                      ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-orange-500'
                  }`}
                >
                  ⭐ New
                </button>
                <button
                  onClick={() => setSortBy('top')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    sortBy === 'top'
                      ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-orange-500'
                  }`}
                >
                  ⬆️ Top
                </button>
              </div>
            </div>

            {/* Posts List */}
            {posts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center shadow-sm">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No posts yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Be the first to create a post and start the conversation!</p>
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  Create First Post
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post._id} id={`post-${post._id}`} className="transform transition-all duration-200 hover:scale-[1.01]">
                      <PostCard post={post} onUpdate={loadPosts} />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-all duration-200 ${
                          page <= 1
                            ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-all duration-200 ${
                          page >= totalPages
                            ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Page {page} of {totalPages}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Sidebar - Communities */}
          <aside className="w-full xl:w-80 space-y-4 xl:order-3">
            {/* Communities Sidebar */}
            <CommunityList communities={communities} onJoin={loadCommunities} />

            {/* Mobile Navigation - Show on smaller screens */}
            <div className="xl:hidden bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="flex flex-col items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition-all duration-200"
                >
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs font-medium text-orange-600">Create Post</span>
                </button>
                <button
                  onClick={() => setShowCreateCommunity(true)}
                  className="flex flex-col items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200"
                >
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-xs font-medium text-blue-600">Create Community</span>
                </button>
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


import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { postService } from '../services/postService';
import { communityService } from '../services/communityService';
import { userService } from '../services/userService';
import PostCard from './PostCard';
import CommunityList from './CommunityList';

export default function Home({ darkMode }) {
  const [posts, setPosts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('hot');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  // Category/Filter/Search state hooks
  const CATEGORIES = [
    { label: 'All', value: 'all' },
    { label: 'General', value: 'general' },
    { label: 'Tech', value: 'tech' },
    { label: 'Sports', value: 'sports' },
    { label: 'Political', value: 'political' },
    { label: 'Entertainment', value: 'entertainment' },
    { label: 'News', value: 'news' },
    { label: 'Health', value: 'health' },
    { label: 'Other', value: 'other' },
  ];
  const [category, setCategory] = useState('all');
  const [searchMode, setSearchMode] = useState('all'); // 'all' | 'posts' | 'users'
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState({ posts: [], users: [] });
  const [showingSearch, setShowingSearch] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Load posts and communities
  useEffect(() => {
    const load = async () => {
      try {
        const [postRes, commRes] = await Promise.all([
          postService.getAllPosts({ sortBy, page, limit, category, search }).catch(() => ({ data: { posts: [], pagination: { pages: 1 } } })),
          communityService.getAllCommunities({ limit: 5 }),
        ]);
        setPosts(postRes.data.posts || []);
        const pg = postRes.data.pagination;
        setTotalPages(pg ? pg.pages || 1 : 1);
        setCommunities(commRes.data.communities || []);
      } catch (e) {
        // no-op
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sortBy, page, limit, category, search]);

  const handleUnifiedSearch = async (e) => {
    e?.preventDefault();
    setSearchLoading(true);
    setShowingSearch(true);
    try {
      let posts = [], users = [];
      if (searchMode === 'posts' || searchMode === 'all') {
        const res = await postService.getAllPosts({ search, limit: 10 });
        posts = res.data.posts;
      }
      if (searchMode === 'users' || searchMode === 'all') {
        const res = await userService.searchUsers({ search, limit: 10 });
        users = res.data.users;
      }
      setSearchResults({ posts, users });
    } catch {
      setSearchResults({ posts: [], users: [] });
    } finally {
      setSearchLoading(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    sessionStorage.removeItem('token'); // Save same key used in login
    sessionStorage.removeItem('user');
    sessionStorage.clear();
    window.location.href = '/home';
  };

  // Check login status - change to match your token key
  const isLoggedIn = !!sessionStorage.getItem('token');

  return (
    <div className={`min-h-screen font-sans ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} transition-colors duration-500`}>
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          {/* Posts Section */}
          <div className="w-full lg:flex-1 min-w-0">
            {/* Buttons to sort posts */}
            <div className="bg-white dark:bg-gray-800 rounded-lg mb-4 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap items-center gap-1 p-2">
                <button
                  onClick={() => setSortBy('hot')}
                  className={`px-3 md:px-4 py-2 rounded text-sm font-semibold ${sortBy==='hot' ? 'bg-gray-100 dark:bg-gray-700 text-orange-500' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >🔥 Hot</button>
                <button
                  onClick={() => setSortBy('new')}
                  className={`px-3 md:px-4 py-2 rounded text-sm font-semibold ${sortBy==='new' ? 'bg-gray-100 dark:bg-gray-700 text-orange-500' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >⭐ New</button>
                <button
                  onClick={() => setSortBy('top')}
                  className={`px-3 md:px-4 py-2 rounded text-sm font-semibold ${sortBy==='top' ? 'bg-gray-100 dark:bg-gray-700 text-orange-500' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >⬆️ Top</button>
              </div>
            </div>

            {/* Add filter/search bar above posts */}
            <div className="flex flex-col sm:flex-row items-center gap-2 mb-4 md:mb-6 bg-slate-50 dark:bg-slate-900 p-3 md:p-4 rounded-lg">
              <select value={searchMode} onChange={e => setSearchMode(e.target.value)} className="w-full sm:w-auto p-2 border rounded bg-white dark:bg-slate-800 dark:text-white shadow text-sm">
                <option value="all">All</option>
                <option value="posts">Posts</option>
                <option value="users">Users</option>
              </select>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 w-full sm:w-auto p-2 border border-gray-400 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 shadow text-sm"
                placeholder="Search anything..."
              />
              <button onClick={handleUnifiedSearch} className="w-full sm:w-auto bg-orange-600 dark:bg-orange-400 text-white dark:text-slate-900 px-4 py-2 rounded font-bold shadow hover:bg-orange-700 dark:hover:bg-orange-300 transition text-sm">Search</button>
            </div>

            {showingSearch && (
              <div className="mb-6">
                {searchLoading ? (
                  <div className="text-center">Loading…</div>
                ) : searchResults.posts.length === 0 && searchResults.users.length === 0 ? (
                  <div className="text-center text-gray-500">No results found.</div>
                ) : (
                  <>
                    {searchMode !== 'users' && (
                      <>
                        <div className="font-bold mb-2 mt-2">Posts</div>
                        <div className="space-y-4">
                          {searchResults.posts.map(post => (
                            <PostCard key={post._id} post={post} onUpdate={() => handleUnifiedSearch()} />
                          ))}
                        </div>
                      </>)
                    }
                    {searchMode !== 'posts' && (
                      <>
                        <div className="font-bold mb-2 mt-4">Users</div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {searchResults.users.map(user => (
                            <div key={user._id} className="flex items-center py-3 gap-3">
                              <img src={user.profile?.avatarUrl || 'https://www.gravatar.com/avatar/?d=mp'} alt={user.username} className="w-10 h-10 rounded-full object-cover border-2 border-blue-500" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-base text-gray-900 dark:text-white">{user.username}</div>
                                <div className="text-gray-500 text-sm truncate">{user.email}</div>
                              </div>
                              <span className="inline-block px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">{user.role}</span>
                            </div>
                          ))}
                        </div>
                      </>)
                    }
                  </>
                )}
              </div>
            )}

            {/* Posts list */}
            {loading ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">Loading posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">No posts yet.</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {posts.map((post) => (
                    <PostCard key={post._id} post={post} onUpdate={() => {
                      postService.getAllPosts({ sortBy, page, limit, category, search }).then(res => setPosts(res.data.posts || []));
                    }} />
                  ))}
                </div>
                {/* Pagination */}
                <div className="mt-4 md:mt-6 flex flex-col sm:flex-row items-center justify-center gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className={`px-3 py-2 rounded border text-sm ${page <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} border-gray-300 dark:border-gray-700 w-full sm:w-auto`}
                    >Prev</button>
                    <button
                      onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                      disabled={page >= totalPages}
                      className={`px-3 py-2 rounded border text-sm ${page >= totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} border-gray-300 dark:border-gray-700 w-full sm:w-auto`}
                    >Next</button>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 text-center">Page {page} of {totalPages}</span>
                </div>
              </>
            )}
          </div>

          {/* Sidebar with communities */}
          <aside className="w-full lg:w-80 space-y-4 order-first lg:order-last">
            <CommunityList communities={communities} onJoin={() => {
              // Refresh communities after join/leave
              communityService.getAllCommunities({ limit: 5 }).then(res => setCommunities(res.data.communities || []));
            }} />
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 text-center py-12 text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} Global Bene. All rights reserved.
      </footer>
    </div>
  );
}

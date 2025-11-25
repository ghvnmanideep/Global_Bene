import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { communityService } from '../services/communityService';

export default function CommunityList({ communities: propCommunities, onJoin = () => {} }) {
  const [communities, setCommunities] = useState(propCommunities || []);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFullPage] = useState(!propCommunities); // Detect if used as full page

  React.useEffect(() => {
    if (!propCommunities) {
      loadCommunities();
    }
  }, [propCommunities, page, searchTerm]);

  const loadCommunities = async () => {
    setLoading(true);
    try {
      const params = isFullPage ? { page, limit: 20, search: searchTerm || undefined } : {};
      const res = await communityService.getAllCommunities(params);
      setCommunities(res.data.communities || []);
      if (res.data.pagination) {
        setTotalPages(res.data.pagination.pages);
      }
    } catch (err) {
      console.error('Error loading communities:', err);
      setCommunities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
    loadCommunities();
  };

  const handleJoin = async (communityId) => {
    setJoining({ ...joining, [communityId]: true });
    try {
      await communityService.toggleJoinCommunity(communityId);
      // Refresh communities list after join/leave
      const res = await communityService.getAllCommunities();
      setCommunities(res.data.communities || []);
      onJoin();
    } catch (err) {
      console.error('Error joining community:', err);
    } finally {
      setJoining({ ...joining, [communityId]: false });
    }
  };

  if (isFullPage) {
    return (
      <div className="max-w-4xl mx-auto my-10 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Communities</h1>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search communities..."
              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold"
            >
              Search
            </button>
          </form>
        </div>

        {/* Communities Grid/List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading communities...</p>
            </div>
          ) : communities.length === 0 ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              {searchTerm ? 'No communities found matching your search.' : 'No communities yet.'}
            </div>
          ) : (
            communities.map((community) => (
              <div key={community._id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {community.iconUrl ? (
                      <img
                        src={community.iconUrl}
                        alt={community.displayName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-orange-500"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">g</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/community/${community._id}`}
                        className="text-xl font-bold text-gray-900 dark:text-white hover:text-orange-500 transition-colors"
                      >
                        g/{community.name}
                      </Link>
                      <p className="text-gray-600 dark:text-gray-300 mt-1">{community.displayName}</p>
                      {community.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{community.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                        <span>{community.memberCount || 0} members</span>
                        <span>{community.postCount || 0} posts</span>
                        <span>Created by u/{community.creator?.username || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => handleJoin(community._id)}
                      disabled={joining[community._id]}
                      className="px-4 py-2 text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50"
                    >
                      {joining[community._id] ? '...' : 'Join'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  }

  // Sidebar view (original behavior)
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">Popular Communities</h3>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">Loading communities...</div>
        ) : (
          (communities || []).length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">No communities yet</div>
          ) : (
            (communities || []).slice(0, 5).map((community) => (
              <div key={community._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center space-x-3">
                  {community.iconUrl ? (
                    <img
                      src={community.iconUrl}
                      alt={community.displayName}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs">g</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/community/${community._id}`}
                      className="font-semibold text-gray-900 dark:text-white hover:text-orange-500 block truncate"
                    >
                      g/{community.name}
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {community.memberCount || 0} members
                    </p>
                  </div>
                  <button
                    onClick={() => handleJoin(community._id)}
                    disabled={joining[community._id]}
                    className="px-3 py-1 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-full disabled:opacity-50"
                  >
                    {joining[community._id] ? '...' : 'Join'}
                  </button>
                </div>
              </div>
            ))
          )
        )}
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <Link
          to="/communities"
          className="text-sm text-orange-500 hover:text-orange-600 font-semibold block text-center"
        >
          View All Communities
        </Link>
      </div>
    </div>
  );
}


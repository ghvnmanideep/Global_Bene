import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AdminSpamManagement = () => {
  const [spamPosts, setSpamPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSpamPosts, setUserSpamPosts] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    fetchSpamPosts();
  }, [page, search]);

  const fetchSpamPosts = async () => {
    try {
      setLoading(true);
      const response = await authService.admin.getSpamPosts({
        page,
        limit: 20,
        search: search.trim() || undefined
      });
      setSpamPosts(response.data.spamPosts);
      setPagination(response.data.pagination);
    } catch (err) {
      setError('Failed to load spam posts');
      console.error('Spam posts fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSpamPosts = async (userId) => {
    try {
      const response = await authService.admin.getUserSpamPosts(userId);
      setUserSpamPosts(response.data.spamPosts);
      setShowUserModal(true);
    } catch (err) {
      console.error('User spam posts fetch error:', err);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    fetchUserSpamPosts(user._id);
  };

  const handleRestorePost = async (spamPostId) => {
    if (!confirm('Are you sure you want to restore this post? It will be re-published to the platform.')) {
      return;
    }

    try {
      await authService.admin.restoreSpamPost(spamPostId);
      // Refresh the spam posts list
      fetchSpamPosts();
      alert('Post restored successfully');
    } catch (err) {
      alert('Failed to restore post');
      console.error('Restore post error:', err);
    }
  };

  const handleBanUser = async (userId, isBanned) => {
    try {
      await authService.admin.toggleUserBan(userId, {
        ban: !isBanned,
        reason: isBanned ? '' : 'Manual ban by admin'
      });
      // Refresh the spam posts to update user status
      fetchSpamPosts();
      alert(`User ${!isBanned ? 'banned' : 'unbanned'} successfully`);
    } catch (err) {
      alert('Failed to update user ban status');
      console.error('Ban user error:', err);
    }
  };

  if (loading && page === 1) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Spam Management</h1>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          Back to Dashboard
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Search and Stats */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Automatic Spam Detection</h2>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Search spam posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <button
              onClick={fetchSpamPosts}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Search
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{pagination?.total || 0}</div>
            <div className="text-sm text-gray-600">Total Spam Posts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">
              {spamPosts.filter(post => post.author?.isBanned).length}
            </div>
            <div className="text-sm text-gray-600">Banned Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">
              {new Set(spamPosts.map(post => post.author?._id)).size}
            </div>
            <div className="text-sm text-gray-600">Unique Spammers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">
              {spamPosts.reduce((sum, post) => sum + (post.author?.spamPostCount || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Spam Count</div>
          </div>
        </div>
      </div>

      {/* Spam Posts List */}
      <div className="space-y-4">
        {spamPosts.map((spamPost) => (
          <div key={spamPost._id} className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 mr-3">{spamPost.title}</h3>
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                    Auto-Deleted
                  </span>
                </div>

                <div className="text-sm text-gray-600 mb-2">
                  By <button
                    onClick={() => handleViewUser(spamPost.author)}
                    className="font-medium text-orange-600 hover:text-orange-800 underline"
                  >
                    {spamPost.author?.username}
                  </button>
                  {spamPost.community && (
                    <> in <span className="font-medium">{spamPost.community.name}</span></>
                  )}
                  <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                    {spamPost.type}
                  </span>
                  {spamPost.author?.isBanned && (
                    <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                      BANNED
                    </span>
                  )}
                </div>

                <p className="text-gray-700 line-clamp-3 mb-3">{spamPost.content}</p>

                {/* Spam Detection Details */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Detection Details</h4>
                  <div className="text-xs text-red-700">
                    <span className="font-medium">Reason:</span> {spamPost.spamReason} •
                    <span className="ml-2 font-medium">Detected:</span> {new Date(spamPost.detectedAt).toLocaleString()} •
                    <span className="ml-2 font-medium">User's Spam Count:</span> {spamPost.author?.spamPostCount || 0}
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Original Post ID: {spamPost.originalPostId} •
                  Deleted: {new Date(spamPost.deletedAt).toLocaleString()}
                </div>
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                <button
                  onClick={() => handleRestorePost(spamPost._id)}
                  className="px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                >
                  Restore Post
                </button>
                <button
                  onClick={() => handleViewUser(spamPost.author)}
                  className="px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                >
                  View User Details
                </button>
                <button
                  onClick={() => handleBanUser(spamPost.author._id, spamPost.author.isBanned)}
                  className={`px-3 py-2 text-white text-sm rounded ${
                    spamPost.author?.isBanned
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {spamPost.author?.isBanned ? 'Unban User' : 'Ban User'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
              Page {page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage(Math.min(pagination.pages, page + 1))}
              disabled={page === pagination.pages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {spamPosts.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🛡️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Spam Posts</h3>
          <p className="text-gray-500">The spam detection system is working well! No spam posts detected.</p>
        </div>
      )}

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">User Details: {selectedUser.username}</h2>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{selectedUser.spamPostCount}</div>
                  <div className="text-sm text-red-800">Spam Posts Created</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{selectedUser.isBanned ? 'Yes' : 'No'}</div>
                  <div className="text-sm text-orange-800">Account Banned</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{userSpamPosts.length}</div>
                  <div className="text-sm text-blue-800">Spam Posts Listed</div>
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-4">All Spam Posts by {selectedUser.username}</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {userSpamPosts.map((post) => (
                  <div key={post._id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{post.title}</h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{post.content?.text || post.content || 'No content'}</p>
                        <div className="text-xs text-gray-500 mt-2">
                          Detected: {new Date(post.detectedAt).toLocaleString()} •
                          Reason: {post.spamReason}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => handleBanUser(selectedUser._id, selectedUser.isBanned)}
                  className={`px-4 py-2 text-white rounded-lg ${
                    selectedUser.isBanned
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {selectedUser.isBanned ? 'Unban User' : 'Ban User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSpamManagement;
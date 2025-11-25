import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AdminCommunityManagement = () => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [isPrivateFilter, setIsPrivateFilter] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState(null);
  const [editForm, setEditForm] = useState({
    displayName: '',
    description: '',
    isPrivate: false,
    rules: []
  });

  useEffect(() => {
    fetchCommunities();
  }, [page, search, isPrivateFilter]);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const response = await authService.admin.getAllCommunities({
        page,
        limit: 20,
        search: search.trim() || undefined,
        isPrivate: isPrivateFilter !== 'all' ? isPrivateFilter : undefined
      });
      setCommunities(response.data.communities);
      setPagination(response.data.pagination);
    } catch (err) {
      setError('Failed to load communities');
      console.error('Communities fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCommunity = async (communityId, communityName) => {
    if (!confirm(`Are you sure you want to delete the community "${communityName}"? This will delete all posts and comments in the community. This action cannot be undone.`)) {
      return;
    }

    try {
      await authService.admin.deleteCommunity(communityId);
      alert('Community deleted successfully');
      fetchCommunities();
    } catch (err) {
      alert('Failed to delete community');
      console.error('Delete community error:', err);
    }
  };

  const handleEditCommunity = (community) => {
    setEditingCommunity(community);
    setEditForm({
      displayName: community.displayName,
      description: community.description || '',
      isPrivate: community.isPrivate,
      rules: community.rules || []
    });
    setShowEditModal(true);
  };

  const handleUpdateCommunity = async () => {
    try {
      await authService.admin.updateCommunity(editingCommunity._id, editForm);
      alert('Community updated successfully');
      setShowEditModal(false);
      setEditingCommunity(null);
      fetchCommunities();
    } catch (err) {
      alert('Failed to update community');
      console.error('Update community error:', err);
    }
  };

  const handleRemoveMember = async (communityId, userId, username, communityName) => {
    if (!confirm(`Are you sure you want to remove ${username} from ${communityName}?`)) {
      return;
    }

    try {
      await authService.admin.removeCommunityMember(communityId, userId);
      alert('Member removed successfully');
      fetchCommunities();
    } catch (err) {
      alert('Failed to remove member');
      console.error('Remove member error:', err);
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
        <h1 className="text-3xl font-bold text-gray-900">Community Management</h1>
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

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">All Communities</h2>
          <div className="flex items-center space-x-4">
            <select
              value={isPrivateFilter}
              onChange={(e) => setIsPrivateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Communities</option>
              <option value="false">Public Only</option>
              <option value="true">Private Only</option>
            </select>
            <input
              type="text"
              placeholder="Search communities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <button
              onClick={fetchCommunities}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Search
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{pagination?.total || 0}</div>
            <div className="text-sm text-gray-600">Total Communities</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">
              {communities.filter(c => !c.isPrivate).length}
            </div>
            <div className="text-sm text-gray-600">Public Communities</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">
              {communities.filter(c => c.isPrivate).length}
            </div>
            <div className="text-sm text-gray-600">Private Communities</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500">
              {communities.reduce((sum, c) => sum + (c.memberCount || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Members</div>
          </div>
        </div>
      </div>

      {/* Communities List */}
      <div className="space-y-4">
        {communities.map((community) => (
          <div key={community._id} className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 mr-3">{community.displayName}</h3>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    r/{community.name}
                  </span>
                  {community.isPrivate && (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full ml-2">
                      PRIVATE
                    </span>
                  )}
                </div>

                <div className="text-sm text-gray-600 mb-2">
                  Created by <span className="font-medium">{community.creator?.username}</span>
                  <span className="mx-2">•</span>
                  {community.memberCount || 0} members
                  <span className="mx-2">•</span>
                  {community.postCount || 0} posts
                </div>

                {community.description && (
                  <p className="text-gray-700 mb-3 line-clamp-2">{community.description}</p>
                )}

                <div className="text-xs text-gray-500">
                  Created: {new Date(community.createdAt).toLocaleString()}
                  {community.moderators && community.moderators.length > 0 && (
                    <>
                      <span className="mx-2">•</span>
                      Moderators: {community.moderators.map(mod => mod.username).join(', ')}
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                <button
                  onClick={() => handleEditCommunity(community)}
                  className="px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteCommunity(community._id, community.displayName)}
                  className="px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                >
                  Delete Community
                </button>
              </div>
            </div>

            {/* Members Preview */}
            {community.members && community.members.length > 0 && (
              <div className="border-t pt-3">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Members ({community.members.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {community.members.slice(0, 5).map((member) => (
                    <div key={member._id} className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                      <span className="text-sm text-gray-700">{member.username}</span>
                      <button
                        onClick={() => handleRemoveMember(community._id, member._id, member.username, community.displayName)}
                        className="ml-2 text-red-500 hover:text-red-700"
                        title="Remove member"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {community.members.length > 5 && (
                    <span className="text-sm text-gray-500 px-3 py-1">
                      +{community.members.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
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

      {communities.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏘️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Communities Found</h3>
          <p className="text-gray-500">No communities match your search criteria.</p>
        </div>
      )}

      {/* Edit Community Modal */}
      {showEditModal && editingCommunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Community: {editingCommunity.displayName}</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-y"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Community Rules (one per line)
                  </label>
                  <textarea
                    value={editForm.rules.join('\n')}
                    onChange={(e) => setEditForm({ ...editForm, rules: e.target.value.split('\n').filter(rule => rule.trim()) })}
                    rows={4}
                    placeholder="1. Be respectful&#10;2. No spam&#10;3. Follow community guidelines"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-y"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editForm.isPrivate}
                    onChange={(e) => setEditForm({ ...editForm, isPrivate: e.target.checked })}
                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Private community (members only)
                  </label>
                </div>
              </div>

              <div className="flex justify-end mt-6 space-x-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateCommunity}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Update Community
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCommunityManagement;
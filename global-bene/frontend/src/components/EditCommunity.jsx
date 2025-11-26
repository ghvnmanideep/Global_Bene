import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { communityService } from '../services/communityService';
import { postService } from '../services/postService';

export default function EditCommunity() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('settings');
  const [community, setCommunity] = useState(null);
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    displayName: '',
    description: '',
    rules: '',
    isPrivate: false,
    iconUrl: '',
    bannerUrl: ''
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Get current user
      const userStr = sessionStorage.getItem('user');
      if (!userStr) {
        setError('User not authenticated');
        return;
      }

      const user = JSON.parse(userStr);
      setCurrentUser(user);

      // Load community details
      const communityRes = await communityService.getCommunityById(id);
      if (!communityRes.data) {
        setError('Community not found');
        return;
      }

      const communityData = communityRes.data;
      setCommunity(communityData);

      // Initialize settings form
      setSettingsForm({
        displayName: communityData.displayName || '',
        description: communityData.description || '',
        rules: Array.isArray(communityData.rules) ? communityData.rules.join('\n') : communityData.rules || '',
        isPrivate: communityData.isPrivate || false,
        iconUrl: communityData.iconUrl || '',
        bannerUrl: communityData.bannerUrl || ''
      });

      // Load members
      try {
        const membersRes = await communityService.getCommunityMembers(id);
        setMembers(membersRes.data.members || []);
      } catch (membersErr) {
        console.error('Error loading members:', membersErr);
        // Don't fail completely if members can't be loaded
      }

      // Load posts
      try {
        const postsRes = await postService.getAllPosts({ communityId: id, limit: 50 });
        setPosts(postsRes.data.posts || []);
      } catch (postsErr) {
        console.error('Error loading posts:', postsErr);
        // Don't fail completely if posts can't be loaded
      }

    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.response?.data?.message || 'Failed to load community data');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        ...settingsForm,
        rules: settingsForm.rules.split('\n').filter(rule => rule.trim())
      };

      await communityService.updateCommunity(id, updateData);
      alert('Community updated successfully!');
      loadData(); // Refresh data
    } catch (err) {
      console.error('Error updating community:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update community';
      alert(errorMessage);
    }
  };

  const handleRemoveMember = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to remove ${username} from this community?`)) {
      return;
    }

    try {
      await communityService.removeMember(id, userId);
      alert('Member removed successfully');
      loadData(); // Refresh data
    } catch (err) {
      console.error('Error removing member:', err);
      const errorMessage = err.response?.data?.message || 'Failed to remove member';
      alert(errorMessage);
    }
  };

  const handleDeletePost = async (postId, postTitle) => {
    if (!window.confirm(`Are you sure you want to delete the post "${postTitle}"?`)) {
      return;
    }

    try {
      await communityService.deletePost(postId);
      alert('Post deleted successfully');
      loadData(); // Refresh data
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post');
    }
  };

  const handleDeleteCommunity = async () => {
    if (!window.confirm('Are you sure you want to delete this community? This action cannot be undone.')) {
      return;
    }

    try {
      await communityService.deleteCommunity(id);
      alert('Community deleted successfully');
      navigate('/communities');
    } catch (err) {
      console.error('Error deleting community:', err);
      alert('Failed to delete community');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!community || !currentUser) return <div className="p-8 text-center">Access denied</div>;

  const isCreator = currentUser._id === community.creator._id || currentUser._id === community.creator;

  if (!isCreator) {
    return <div className="p-8 text-center">Only community creators can edit communities</div>;
  }

  return (
    <div className="max-w-6xl mx-auto my-10 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Edit Community: r/{community.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your community settings, members, and posts
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-3 font-semibold ${
            activeTab === 'settings'
              ? 'border-b-2 border-orange-500 text-orange-500'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Settings
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`px-6 py-3 font-semibold ${
            activeTab === 'members'
              ? 'border-b-2 border-orange-500 text-orange-500'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Members ({members.length})
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-6 py-3 font-semibold ${
            activeTab === 'posts'
              ? 'border-b-2 border-orange-500 text-orange-500'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Posts ({posts.length})
        </button>
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Community Settings</h2>

          <form onSubmit={handleSettingsSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={settingsForm.displayName}
                onChange={(e) => setSettingsForm({...settingsForm, displayName: e.target.value})}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={settingsForm.description}
                onChange={(e) => setSettingsForm({...settingsForm, description: e.target.value})}
                rows={4}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Community Rules (one per line)
              </label>
              <textarea
                value={settingsForm.rules}
                onChange={(e) => setSettingsForm({...settingsForm, rules: e.target.value})}
                rows={6}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="1. Be respectful&#10;2. No spam&#10;3. Follow community guidelines"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Icon URL
              </label>
              <input
                type="url"
                value={settingsForm.iconUrl}
                onChange={(e) => setSettingsForm({...settingsForm, iconUrl: e.target.value})}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Banner URL
              </label>
              <input
                type="url"
                value={settingsForm.bannerUrl}
                onChange={(e) => setSettingsForm({...settingsForm, bannerUrl: e.target.value})}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPrivate"
                checked={settingsForm.isPrivate}
                onChange={(e) => setSettingsForm({...settingsForm, isPrivate: e.target.checked})}
                className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="isPrivate" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Private community (members only)
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={handleDeleteCommunity}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold"
              >
                Delete Community
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Community Members</h2>

          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.user._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <img
                    src={member.user.profile?.avatarUrl || 'https://www.gravatar.com/avatar/?d=mp'}
                    alt={member.user.username}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{member.user.username}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{member.role}</div>
                  </div>
                </div>

                {member.role !== 'creator' && (
                  <button
                    onClick={() => handleRemoveMember(member.user._id, member.user.username)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Community Posts</h2>

          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post._id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{post.title}</h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      By u/{post.author?.username} • {new Date(post.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {post.upvotes || 0} upvotes • {post.commentCount || 0} comments
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeletePost(post._id, post.title)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold ml-4"
                  >
                    Delete Post
                  </button>
                </div>
              </div>
            ))}

            {posts.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No posts in this community yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
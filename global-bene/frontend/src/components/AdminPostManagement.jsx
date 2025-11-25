import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AdminPostManagement = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [spamFilter, setSpamFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, [search, authorFilter, typeFilter, spamFilter, page]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (authorFilter) params.author = authorFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (spamFilter !== 'all') params.spamStatus = spamFilter;

      const response = await authService.admin.getAllPosts(params);
      setPosts(response.data.posts);
      setPagination(response.data.pagination);
    } catch (err) {
      setError('Failed to load posts');
      console.error('Posts fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId, title) => {
    if (!window.confirm(`Are you sure you want to delete the post "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await authService.admin.deletePost(postId);
      setPosts(posts.filter(post => post._id !== postId));
    } catch (err) {
      alert('Failed to delete post');
      console.error('Delete post error:', err);
    }
  };

  const handleReportPost = async (postId) => {
    const reason = prompt('Enter reason for reporting this post as spam:');
    if (!reason) return;

    try {
      await authService.admin.reportPost(postId, reason);
      alert('Post reported successfully');
    } catch (err) {
      alert('Failed to report post');
      console.error('Report post error:', err);
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
        <h1 className="text-3xl font-bold text-gray-900">Post Management</h1>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
            <input
              type="text"
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              placeholder="Author username"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All Types</option>
              <option value="text">Text</option>
              <option value="image">Image</option>
              <option value="link">Link</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Spam Status</label>
            <select
              value={spamFilter}
              onChange={(e) => setSpamFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All</option>
              <option value="not_spam">Not Spam</option>
              <option value="might_be_spam">Might Be Spam</option>
              <option value="spam">Spam</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setPage(1); fetchPosts(); }}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post._id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                <div className="text-sm text-gray-600 mb-2">
                  By <span className="font-medium">{post.author?.username}</span> in{' '}
                  <span className="font-medium">{post.community?.name || 'General'}</span>
                  <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                    {post.type}
                  </span>
                  <span className={`ml-2 text-xs px-2 py-1 rounded ${
                    post.spamStatus === 'spam' ? 'bg-red-100 text-red-800' :
                    post.spamStatus === 'might_be_spam' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {post.spamStatus === 'not_spam' ? 'Clean' :
                     post.spamStatus === 'might_be_spam' ? 'Suspicious' : 'Spam'}
                  </span>
                </div>
                <p className="text-gray-700 line-clamp-3">{post.content?.text || post.content || 'No content'}</p>
                <div className="mt-2 text-xs text-gray-500">
                  {new Date(post.createdAt).toLocaleDateString()} •
                  {post.upvotes} upvotes • {post.commentCount} comments
                </div>
              </div>
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => handleReportPost(post._id)}
                  className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
                >
                  Report Spam
                </button>
                <button
                  onClick={() => handleDeletePost(post._id, post.title)}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                >
                  Delete
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

      {posts.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No posts found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default AdminPostManagement;
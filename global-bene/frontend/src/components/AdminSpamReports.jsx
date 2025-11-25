import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AdminSpamReports = () => {
  const [reportedPosts, setReportedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchReportedPosts();
  }, [page]);

  const fetchReportedPosts = async () => {
    try {
      setLoading(true);
      const response = await authService.admin.getReportedPosts({ page, limit: 20 });
      setReportedPosts(response.data.posts);
      setPagination(response.data.pagination);
    } catch (err) {
      setError('Failed to load reported posts');
      console.error('Reported posts fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId, title) => {
    if (!window.confirm(`Are you sure you want to delete the reported post "${title}"?`)) {
      return;
    }

    try {
      await authService.admin.deletePost(postId);
      setReportedPosts(reportedPosts.filter(post => post._id !== postId));
    } catch (err) {
      alert('Failed to delete post');
      console.error('Delete post error:', err);
    }
  };

  const handleDismissReport = async (postId) => {
    // In a real implementation, you'd have an endpoint to dismiss reports
    // For now, we'll just remove it from the local state
    if (window.confirm('Are you sure you want to dismiss this spam report?')) {
      setReportedPosts(reportedPosts.filter(post => post._id !== postId));
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
        <h1 className="text-3xl font-bold text-gray-900">Spam Reports</h1>
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

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Spam Report Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{reportedPosts.length}</div>
            <div className="text-sm text-gray-600">Reported Posts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">
              {reportedPosts.reduce((sum, post) => sum + (post.spamReports?.length || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Reports</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">
              {reportedPosts.filter(post => post.isHidden).length}
            </div>
            <div className="text-sm text-gray-600">Auto-Hidden Posts</div>
          </div>
        </div>
      </div>

      {/* Reported Posts */}
      <div className="space-y-4">
        {reportedPosts.map((post) => (
          <div key={post._id} className={`bg-white rounded-lg shadow p-6 ${post.isHidden ? 'border-l-4 border-red-500' : ''}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 mr-3">{post.title}</h3>
                  {post.isHidden && (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                      Hidden
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  By <span className="font-medium">{post.author?.username}</span> in{' '}
                  <span className="font-medium">{post.community?.name || 'General'}</span>
                  <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                    {post.type}
                  </span>
                </div>
                <p className="text-gray-700 line-clamp-3 mb-3">{post.content?.text || post.content || 'No content'}</p>

                {/* Spam Reports Details */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Spam Reports ({post.spamReports?.length || 0})</h4>
                  <div className="space-y-2">
                    {post.spamReports?.slice(0, 3).map((report, index) => (
                      <div key={index} className="text-xs text-red-700">
                        <span className="font-medium">Reason:</span> {report.reason} •
                        <span className="ml-2 font-medium">Reported:</span> {new Date(report.reportedAt).toLocaleDateString()}
                      </div>
                    ))}
                    {post.spamReports?.length > 3 && (
                      <div className="text-xs text-red-600 font-medium">
                        +{post.spamReports.length - 3} more reports
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  Posted: {new Date(post.createdAt).toLocaleDateString()} •
                  {post.upvotes} upvotes • {post.commentCount} comments
                </div>
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                <button
                  onClick={() => handleDeletePost(post._id, post.title)}
                  className="px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                >
                  Delete Post
                </button>
                <button
                  onClick={() => handleDismissReport(post._id)}
                  className="px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                >
                  Dismiss Report
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

      {reportedPosts.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Spam Reports</h3>
          <p className="text-gray-500">All posts are clean! No spam reports to review.</p>
        </div>
      )}
    </div>
  );
};

export default AdminSpamReports;
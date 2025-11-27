import { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import { authService } from '../services/authService';

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [statusFilter, setStatusFilter] = useState('open');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchReports();
  }, [page, statusFilter, typeFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await reportService.getReports({
        page,
        limit: 20,
        status: statusFilter,
        targetType: typeFilter
      });
      setReports(response.data.reports);
      setPagination(response.data.pagination);
    } catch (err) {
      setError('Failed to load reports');
      console.error('Reports fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      await reportService.updateReportStatus(reportId, newStatus);
      setReports(reports.map(report =>
        report._id === reportId ? { ...report, status: newStatus } : report
      ));
    } catch (err) {
      alert('Failed to update report status');
      console.error('Update report status error:', err);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      await reportService.deleteReport(reportId);
      setReports(reports.filter(report => report._id !== reportId));
    } catch (err) {
      alert('Failed to delete report');
      console.error('Delete report error:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Post': return 'bg-blue-100 text-blue-800';
      case 'Comment': return 'bg-purple-100 text-purple-800';
      case 'User': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
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
        <h1 className="text-3xl font-bold text-gray-900">User Reports</h1>
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All Types</option>
              <option value="Post">Posts</option>
              <option value="Comment">Comments</option>
              <option value="User">Users</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Report Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{pagination?.total || 0}</div>
            <div className="text-sm text-gray-600">Total Reports</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">
              {reports.filter(r => r.status === 'open').length}
            </div>
            <div className="text-sm text-gray-600">Open Reports</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">
              {reports.filter(r => r.status === 'resolved').length}
            </div>
            <div className="text-sm text-gray-600">Resolved Reports</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500">
              {reports.filter(r => r.target_type === 'Post').length}
            </div>
            <div className="text-sm text-gray-600">Post Reports</div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.map((report) => (
          <div key={report._id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(report.target_type)}`}>
                    {report.target_type}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                    {report.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    Reported {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Reporter:</span> {report.reporter_id?.username || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Reason:</span> {report.reason}
                  </p>
                </div>

                {/* Target Details */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-800 mb-2">Reported Content</h4>
                  {report.target_details ? (
                    <div className="text-sm text-gray-700">
                      {report.target_type === 'Post' && (
                        <div>
                          <p className="font-medium">{report.target_details.title}</p>
                          <p className="text-xs text-gray-600">
                            By {report.target_details.author} in {report.target_details.community}
                          </p>
                        </div>
                      )}
                      {report.target_type === 'Comment' && (
                        <div>
                          <p className="font-medium">"{report.target_details.content}"</p>
                          <p className="text-xs text-gray-600">
                            By {report.target_details.author} on post: {report.target_details.post_title}
                          </p>
                        </div>
                      )}
                      {report.target_type === 'User' && (
                        <div>
                          <p className="font-medium">{report.target_details.username}</p>
                          <p className="text-xs text-gray-600">{report.target_details.email}</p>
                          {report.target_details.isBanned && (
                            <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full ml-2">
                              Banned
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Content details not available</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                {report.status === 'open' && (
                  <button
                    onClick={() => handleUpdateStatus(report._id, 'resolved')}
                    className="px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                  >
                    Mark Resolved
                  </button>
                )}
                {report.status === 'resolved' && (
                  <button
                    onClick={() => handleUpdateStatus(report._id, 'open')}
                    className="px-3 py-2 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
                  >
                    Reopen
                  </button>
                )}
                <button
                  onClick={() => handleDeleteReport(report._id)}
                  className="px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                >
                  Delete Report
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

      {reports.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reports Found</h3>
          <p className="text-gray-500">No user reports match the current filters.</p>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await authService.admin.getDashboardStats();
      setStats(response.data.stats);
    } catch (err) {
      setError('Failed to load dashboard stats');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-orange-500">{stats?.totalUsers || 0}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Posts</h3>
          <p className="text-3xl font-bold text-blue-500">{stats?.totalPosts || 0}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Communities</h3>
          <p className="text-3xl font-bold text-green-500">{stats?.totalCommunities || 0}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Comments</h3>
          <p className="text-3xl font-bold text-purple-500">{stats?.totalComments || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Admin Users</h3>
          <p className="text-2xl font-bold text-red-500">{stats?.adminUsers || 0}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">New Users (30d)</h3>
          <p className="text-2xl font-bold text-indigo-500">{stats?.recentUsers || 0}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">New Posts (7d)</h3>
          <p className="text-2xl font-bold text-teal-500">{stats?.recentPosts || 0}</p>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => window.location.href = '/admin/users'}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Manage Users
          </button>
          <button
            onClick={() => window.location.href = '/admin/posts'}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Manage Posts
          </button>
          <button
            onClick={() => window.location.href = '/admin/notifications'}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Send Notifications
          </button>
          <button
            onClick={() => window.location.href = '/admin/spam'}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            View Reported Posts
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
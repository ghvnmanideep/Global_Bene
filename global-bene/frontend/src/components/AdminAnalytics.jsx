import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const AdminAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await authService.admin.getAnalyticsDashboard();
      setStats(response.data.stats);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', err);
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
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  // Sample data for pie charts
  const userRoleData = {
    labels: ['Regular Users', 'Admin Users', 'Banned Users'],
    datasets: [{
      data: [
        (stats?.totalUsers || 0) - (stats?.adminUsers || 0) - (stats?.bannedUsers || 0),
        stats?.adminUsers || 0,
        stats?.bannedUsers || 0
      ],
      backgroundColor: ['#3B82F6', '#10B981', '#EF4444'],
      borderColor: ['#2563EB', '#059669', '#DC2626'],
      borderWidth: 1,
    }],
  };

  const contentData = {
    labels: ['Posts', 'Comments', 'Communities'],
    datasets: [{
      data: [stats?.totalPosts || 0, stats?.totalComments || 0, stats?.totalCommunities || 0],
      backgroundColor: ['#8B5CF6', '#F59E0B', '#06B6D4'],
      borderColor: ['#7C3AED', '#D97706', '#0891B2'],
      borderWidth: 1,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics Dashboard</h1>

      {/* Basic Platform Stats */}
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

      {/* Interaction Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Upvotes</h3>
          <p className="text-3xl font-bold text-green-500">{stats?.totalUpvotes || 0}</p>
          <p className="text-sm text-gray-600 mt-1">👍 Positive engagement</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Downvotes</h3>
          <p className="text-3xl font-bold text-red-500">{stats?.totalDownvotes || 0}</p>
          <p className="text-sm text-gray-600 mt-1">👎 Negative feedback</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Views</h3>
          <p className="text-3xl font-bold text-blue-500">{stats?.totalViews || 0}</p>
          <p className="text-sm text-gray-600 mt-1">👁️ Content visibility</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Shares</h3>
          <p className="text-3xl font-bold text-indigo-500">{stats?.totalShares || 0}</p>
          <p className="text-sm text-gray-600 mt-1">🔗 Content sharing</p>
        </div>
      </div>

      {/* User Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Community Joins</h3>
          <p className="text-3xl font-bold text-teal-500">{stats?.totalJoins || 0}</p>
          <p className="text-sm text-gray-600 mt-1">🤝 New memberships</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Profile Views</h3>
          <p className="text-3xl font-bold text-pink-500">{stats?.totalProfileViews || 0}</p>
          <p className="text-sm text-gray-600 mt-1">👤 User interest</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Search Queries</h3>
          <p className="text-3xl font-bold text-yellow-500">{stats?.totalSearches || 0}</p>
          <p className="text-sm text-gray-600 mt-1">🔍 Discovery activity</p>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Engagement Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Engagement Rate</span>
              <span className="font-bold text-lg text-green-600">{stats?.engagementRate || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Interaction Rate</span>
              <span className="font-bold text-lg text-blue-600">{stats?.interactionRate || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Upvote Ratio</span>
              <span className="font-bold text-lg text-orange-600">
                {stats?.totalUpvotes && stats?.totalDownvotes ?
                  ((stats.totalUpvotes / (stats.totalUpvotes + stats.totalDownvotes)) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Content Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Avg Views per Post</span>
              <span className="font-bold text-lg text-purple-600">
                {stats?.totalPosts && stats?.totalViews ?
                  (stats.totalViews / stats.totalPosts).toFixed(1) : 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Avg Comments per Post</span>
              <span className="font-bold text-lg text-indigo-600">
                {stats?.totalPosts && stats?.totalComments ?
                  (stats.totalComments / stats.totalPosts).toFixed(1) : 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Share Rate</span>
              <span className="font-bold text-lg text-pink-600">
                {stats?.totalViews && stats?.totalShares ?
                  ((stats.totalShares / stats.totalViews) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">User Distribution</h3>
          <div className="h-64">
            <Pie data={userRoleData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Content Distribution</h3>
          <div className="h-64">
            <Pie data={contentData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Banned Users</h3>
          <p className="text-3xl font-bold text-red-500">{stats?.bannedUsers || 0}</p>
          <p className="text-sm text-gray-600 mt-2">
            {stats?.totalUsers ? ((stats.bannedUsers / stats.totalUsers) * 100).toFixed(1) : 0}% of total users
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">New Users (30d)</h3>
          <p className="text-3xl font-bold text-indigo-500">{stats?.recentUsers || 0}</p>
          <p className="text-sm text-gray-600 mt-2">Recent registrations</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">New Posts (7d)</h3>
          <p className="text-3xl font-bold text-teal-500">{stats?.recentPosts || 0}</p>
          <p className="text-sm text-gray-600 mt-2">Recent content creation</p>
        </div>
      </div>

      {/* Analytics Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Analytics Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2 flex items-center">
              📊 Mixpanel Integration
              <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">Active</span>
            </h3>
            <p className="text-blue-800 text-sm">
              All user interactions are automatically tracked and sent to Mixpanel for detailed analytics and user behavior insights.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-900 mb-2 flex items-center">
              ⏰ Nightly Analytics Jobs
              <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-1 rounded">Running</span>
            </h3>
            <p className="text-green-800 text-sm">
              Automated jobs run daily at 2 AM to calculate user interests, rank posts using Reddit-style algorithms, and identify trending communities.
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-medium text-purple-900 mb-2 flex items-center">
              📈 User Behavior Tracking
              <span className="ml-2 text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded">Enabled</span>
            </h3>
            <p className="text-purple-800 text-sm">
              Every user action (views, likes, comments, community joins, searches) is logged with timestamps, session data, and metadata.
            </p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-medium text-orange-900 mb-2 flex items-center">
              🎯 Recommendation Engine
              <span className="ml-2 text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded">Active</span>
            </h3>
            <p className="text-orange-800 text-sm">
              Personalized recommendations are generated based on user interests calculated from interaction patterns, improving content discovery.
            </p>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Platform Health Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-700">
              {stats?.totalPosts && stats?.totalUsers ? (stats.totalPosts / stats.totalUsers).toFixed(1) : 0}
            </p>
            <p className="text-sm text-gray-600">Posts per User</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-700">
              {stats?.totalComments && stats?.totalPosts ? (stats.totalComments / stats.totalPosts).toFixed(1) : 0}
            </p>
            <p className="text-sm text-gray-600">Comments per Post</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-700">
              {stats?.totalUsers && stats?.totalCommunities ? (stats.totalUsers / stats.totalCommunities).toFixed(1) : 0}
            </p>
            <p className="text-sm text-gray-600">Users per Community</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-700">
              {stats?.adminUsers && stats?.totalUsers ? ((stats.adminUsers / stats.totalUsers) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-sm text-gray-600">Admin Ratio</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
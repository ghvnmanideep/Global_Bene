import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AdminNotifications = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [notificationType, setNotificationType] = useState('admin_message');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchUser, setSearchUser] = useState('');

  useEffect(() => {
    if (searchUser.length > 2) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [searchUser]);

  const searchUsers = async () => {
    try {
      const response = await authService.searchUsers(searchUser);
      setUsers(response.data.users.slice(0, 10)); // Limit to 10 results
    } catch (err) {
      console.error('User search error:', err);
    }
  };

  const handleSendToUser = async () => {
    if (!selectedUser || !message.trim()) {
      alert('Please select a user and enter a message');
      return;
    }

    setLoading(true);
    try {
      await authService.admin.sendNotificationToUser(selectedUser, {
        type: notificationType,
        message: message.trim(),
      });
      alert('Notification sent successfully!');
      setMessage('');
      setSelectedUser('');
      setSearchUser('');
    } catch (err) {
      alert('Failed to send notification');
      console.error('Send notification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendToAll = async () => {
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    if (!window.confirm('Are you sure you want to send this notification to ALL users?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await authService.admin.sendNotificationToAll({
        type: notificationType,
        message: message.trim(),
      });
      alert(`Notification sent to ${response.data.message.match(/\d+/)[0]} users!`);
      setMessage('');
    } catch (err) {
      alert('Failed to send notifications');
      console.error('Send to all error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Send Notifications</h1>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send to Specific User */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Send to Specific User</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search User</label>
              <input
                type="text"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                placeholder="Type username or email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              />
              {users.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                  {users.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => {
                        setSelectedUser(user._id);
                        setSearchUser(user.username);
                        setUsers([]);
                      }}
                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium">{user.username}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notification Type</label>
              <select
                value={notificationType}
                onChange={(e) => setNotificationType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="admin_message">Admin Message</option>
                <option value="announcement">Announcement</option>
                <option value="warning">Warning</option>
                <option value="info">Information</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message here..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <button
              onClick={handleSendToUser}
              disabled={loading || !selectedUser || !message.trim()}
              className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send to User'}
            </button>
          </div>
        </div>

        {/* Send to All Users */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Send to All Users</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notification Type</label>
              <select
                value={notificationType}
                onChange={(e) => setNotificationType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="announcement">Platform Announcement</option>
                <option value="maintenance">Maintenance Notice</option>
                <option value="update">Feature Update</option>
                <option value="warning">Important Warning</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message to all users..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> This will send the notification to ALL registered users.
                    Use this feature carefully.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSendToAll}
              disabled={loading || !message.trim()}
              className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send to All Users'}
            </button>
          </div>
        </div>
      </div>

      {/* Notification Types Guide */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Types Guide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Individual Messages:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><strong>Admin Message:</strong> Direct communication from admin</li>
              <li><strong>Announcement:</strong> Important updates or news</li>
              <li><strong>Warning:</strong> Policy violations or issues</li>
              <li><strong>Info:</strong> General information</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Broadcast Messages:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><strong>Platform Announcement:</strong> Major updates</li>
              <li><strong>Maintenance Notice:</strong> System downtime</li>
              <li><strong>Feature Update:</strong> New features released</li>
              <li><strong>Important Warning:</strong> Critical alerts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;
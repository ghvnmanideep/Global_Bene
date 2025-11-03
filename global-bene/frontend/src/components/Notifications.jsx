import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notificationsService } from '../services/notificationsService';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, [page]);

  const loadNotifications = async () => {
    try {
      const res = await notificationsService.getNotifications({ page, limit: 20 });
      const newNotifications = res.data.notifications || [];
      if (page === 1) {
        setNotifications(newNotifications);
      } else {
        setNotifications(prev => [...prev, ...newNotifications]);
      }
      setHasMore(newNotifications.length === 20);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const res = await notificationsService.getUnreadCount();
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diff = now - notifDate;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'comment': return '💬';
      case 'upvote': return '⬆️';
      case 'downvote': return '⬇️';
      case 'follow': return '👤';
      case 'mention': return '@';
      case 'reply': return '↩️';
      default: return '🔔';
    }
  };

  const getNotificationLink = (notification) => {
    if (notification.relatedPost) {
      return `/post/${notification.relatedPost._id}`;
    }
    if (notification.relatedUser) {
      return `/profile/${notification.relatedUser._id}`;
    }
    if (notification.relatedCommunity) {
      return `/community/${notification.relatedCommunity._id}`;
    }
    return '#';
  };

  if (loading && page === 1) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 bg-orange-500 text-white text-sm px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h1>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-3 md:px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-semibold text-sm transition w-full sm:w-auto"
                >
                  Mark All as Read
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.length === 0 ? (
              <div className="px-4 md:px-6 py-8 text-center">
                <div className="text-4xl mb-4">🔔</div>
                <p className="text-gray-600 dark:text-gray-400">No notifications yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  When someone interacts with your posts or follows you, you'll see it here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`px-4 md:px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                    !notification.isRead ? 'bg-orange-50 dark:bg-orange-900/10' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-xl md:text-2xl">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={getNotificationLink(notification)}
                        onClick={() => !notification.isRead && markAsRead(notification._id)}
                        className="block"
                      >
                        <p className="text-gray-900 dark:text-white text-sm md:text-base">
                          {notification.message}
                        </p>
                      </Link>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification._id)}
                        className="text-orange-500 hover:text-orange-600 text-xs md:text-sm font-medium whitespace-nowrap"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {hasMore && (
            <div className="px-4 md:px-6 py-4 border-t border-gray-200 dark:border-gray-700 text-center">
              <button
                onClick={() => setPage(prev => prev + 1)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full font-semibold text-sm transition w-full md:w-auto"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

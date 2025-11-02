import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { communityService } from '../services/communityService';

export default function UserCommunities() {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserCommunities = async () => {
      try {
        const res = await communityService.getUserCommunities();
        setCommunities(res.data.communities || []);
      } catch (err) {
        console.error('Error fetching user communities:', err);
        setError('Failed to load your communities');
      } finally {
        setLoading(false);
      }
    };

    fetchUserCommunities();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-700 dark:text-gray-200">Loading your communities...</div>;
  if (error) return <div className="p-8 text-center text-red-600 dark:text-red-400">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto my-10">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Your Communities</h1>

      {communities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-300 mb-4">You haven't joined any communities yet.</p>
          <Link
            to="/communities"
            className="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold"
          >
            Browse Communities
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {communities.map((community) => (
            <div
              key={community._id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3 mb-4">
                {community.iconUrl ? (
                  <img
                    src={community.iconUrl}
                    alt={community.displayName}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">g</span>
                  </div>
                )}
                <div>
                  <Link
                    to={`/community/${community._id}`}
                    className="font-semibold text-gray-900 dark:text-white hover:text-orange-500 block"
                  >
                    g/{community.name}
                  </Link>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {community.memberCount || 0} members
                  </p>
                </div>
              </div>
              {community.description && (
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                  {community.description}
                </p>
              )}
              <Link
                to={`/community/${community._id}`}
                className="inline-block w-full text-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded font-semibold"
              >
                View Community
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

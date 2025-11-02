import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { communityService } from '../services/communityService';

export default function CommunityList({ communities: propCommunities, onJoin = () => {} }) {
  const [communities, setCommunities] = useState(propCommunities || []);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState({});

  React.useEffect(() => {
    if (!propCommunities) {
      setLoading(true);
      communityService.getAllCommunities()
        .then(res => setCommunities(res.data.communities || []))
        .catch(() => setCommunities([]))
        .finally(() => setLoading(false));
    }
  }, [propCommunities]);

  const handleJoin = async (communityId) => {
    setJoining({ ...joining, [communityId]: true });
    try {
      await communityService.toggleJoinCommunity(communityId);
      // Refresh communities list after join/leave
      const res = await communityService.getAllCommunities();
      setCommunities(res.data.communities || []);
      onJoin();
    } catch (err) {
      console.error('Error joining community:', err);
    } finally {
      setJoining({ ...joining, [communityId]: false });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">Popular Communities</h3>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">Loading communities...</div>
        ) : (
          (communities || []).length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">No communities yet</div>
          ) : (
            (communities || []).slice(0, 5).map((community) => (
              <div key={community._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center space-x-3">
                  {community.iconUrl ? (
                    <img
                      src={community.iconUrl}
                      alt={community.displayName}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs">g</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/community/${community._id}`}
                      className="font-semibold text-gray-900 dark:text-white hover:text-orange-500 block truncate"
                    >
                      g/{community.name}
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {community.memberCount || 0} members
                    </p>
                  </div>
                  <button
                    onClick={() => handleJoin(community._id)}
                    disabled={joining[community._id]}
                    className="px-3 py-1 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-full disabled:opacity-50"
                  >
                    {joining[community._id] ? '...' : 'Join'}
                  </button>
                </div>
              </div>
            ))
          )
        )}
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <Link
          to="/communities"
          className="text-sm text-orange-500 hover:text-orange-600 font-semibold block text-center"
        >
          View All Communities
        </Link>
      </div>
    </div>
  );
}


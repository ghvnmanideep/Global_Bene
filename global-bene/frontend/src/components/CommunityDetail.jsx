import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PostCard from './PostCard';
import CreatePost from './CreatePost';
import { communityService } from '../services/communityService';

export default function CommunityDetail() {
  const { id } = useParams();
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [communities, setCommunities] = useState([]);

  useEffect(() => {
    setLoading(true);
    communityService.getCommunityById(id)
      .then(res => {
        setCommunity(res.data);
        // Check if current user is a member
        const user = sessionStorage.getItem('user') ? JSON.parse(sessionStorage.getItem('user')) : null;
        if (user && res.data.members) {
          setIsMember(res.data.members.includes(user._id));
        }
      })
      .catch(() => setError('Could not load community'))
      .finally(() => setLoading(false));

    // Load communities for create post
    communityService.getUserCommunities()
      .then(res => setCommunities(res.data.communities || []))
      .catch(() => setCommunities([]));
  }, [id, isMember]); // Re-fetch when membership changes

  const handleJoinLeave = async () => {
    setJoining(true);
    try {
      await communityService.toggleJoinCommunity(id);
      setIsMember(!isMember);
      // Update member count
      setCommunity(prev => ({
        ...prev,
        memberCount: isMember ? prev.memberCount - 1 : prev.memberCount + 1
      }));
    } catch (err) {
      console.error('Error toggling membership:', err);
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-700 dark:text-gray-200">Loading…</div>;
  if (error) return <div className="p-8 text-center text-red-600 dark:text-red-400">{error}</div>;
  if (!community) return null;

  return (
    <div className="max-w-4xl mx-auto my-10">
      {community.bannerUrl && <img src={community.bannerUrl} alt="community banner" className="w-full rounded-xl mb-6 max-h-56 object-cover" />}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <img src={community.iconUrl || 'https://www.gravatar.com/avatar/?d=mp'} alt={community.displayName} className="w-16 h-16 rounded-full object-cover border-2 border-orange-500" />
          <span>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">r/{community.name}</h1>
            <div className="text-gray-600 dark:text-gray-300">{community.displayName}</div>
            <div className="text-xs text-gray-500">{community.memberCount || 0} members</div>
          </span>
        </div>
        {sessionStorage.getItem('accessToken') && (
          <button
            onClick={handleJoinLeave}
            disabled={joining}
            className={`px-6 py-2 rounded-lg font-semibold ${
              isMember
                ? 'bg-gray-500 hover:bg-gray-600 text-white'
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            } disabled:opacity-50`}
          >
            {joining ? '...' : isMember ? 'Leave' : 'Join'}
          </button>
        )}
      </div>
      {community.description && <p className="text-gray-800 dark:text-gray-100 mb-8">{community.description}</p>}

      {/* Create Post Button */}
      {sessionStorage.getItem('accessToken') && isMember && (
        <div className="mb-6">
          <button
            onClick={() => setShowCreatePost(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold"
          >
            Create Post
          </button>
        </div>
      )}

      <h3 className="font-bold text-lg mb-2">Posts</h3>
      <div className="space-y-4">
        {(community.posts || []).length === 0 ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-300 rounded">No posts in this community yet.</div>
        ) : (
          community.posts.map(post => <PostCard post={post} key={post._id} onUpdate={() => {}} />)
        )}
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePost
          onClose={() => setShowCreatePost(false)}
          onSuccess={() => {
            setShowCreatePost(false);
            // Refresh community data
            communityService.getCommunityById(id).then(res => setCommunity(res.data));
          }}
          communities={communities}
        />
      )}
    </div>
  );
}

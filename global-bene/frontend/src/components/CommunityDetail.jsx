import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PostCard from './PostCard';
import CreatePost from './CreatePost';
import { communityService } from '../services/communityService';
import { authService } from '../services/authService';

export default function CommunityDetail() {
  const { id } = useParams();
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [members, setMembers] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [managing, setManaging] = useState(false);

  useEffect(() => {
    loadCurrentUser();
    setLoading(true);
    communityService.getCommunityById(id)
      .then(res => {
        setCommunity(res.data);
        // Check if current user is a member
        const user = sessionStorage.getItem('user') ? JSON.parse(sessionStorage.getItem('user')) : null;
        if (user && res.data.members) {
          setIsMember(res.data.members.some(member => member._id === user._id));
        }
      })
      .catch(() => setError('Could not load community'))
      .finally(() => setLoading(false));

    // Load communities for create post
    communityService.getUserCommunities()
      .then(res => setCommunities(res.data.communities || []))
      .catch(() => setCommunities([]));
  }, [id, isMember]); // Re-fetch when membership changes

  const loadCurrentUser = async () => {
    try {
      const res = await authService.getMe();
      setCurrentUser(res.data);
    } catch (err) {
      console.error('Error loading current user:', err);
    }
  };

  const loadMembers = async () => {
    try {
      const res = await communityService.getCommunityMembers(id);
      setMembers(res.data.members || []);
    } catch (err) {
      console.error('Error loading members:', err);
    }
  };

  const handleJoinLeave = async () => {
    setJoining(true);
    try {
      await communityService.toggleJoinCommunity(id);
      // Refresh community data to get updated member list and count
      const res = await communityService.getCommunityById(id);
      setCommunity(res.data);
      // Update membership status
      const user = sessionStorage.getItem('user') ? JSON.parse(sessionStorage.getItem('user')) : null;
      if (user && res.data.members) {
        setIsMember(res.data.members.some(member => member._id === user._id));
      }
    } catch (err) {
      console.error('Error toggling membership:', err);
    } finally {
      setJoining(false);
    }
  };

  const handleDeleteCommunity = async () => {
    if (!window.confirm('Are you sure you want to delete this community? This action cannot be undone.')) {
      return;
    }

    setManaging(true);
    try {
      await communityService.deleteCommunity(id);
      alert('Community deleted successfully');
      window.location.href = '/communities';
    } catch (err) {
      console.error('Error deleting community:', err);
      alert('Failed to delete community');
    } finally {
      setManaging(false);
    }
  };

  const handleRemoveMember = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to remove ${username} from this community?`)) {
      return;
    }

    try {
      await communityService.removeMember(id, userId);
      await loadMembers();
      // Refresh community data
      const res = await communityService.getCommunityById(id);
      setCommunity(res.data);
    } catch (err) {
      console.error('Error removing member:', err);
      alert('Failed to remove member');
    }
  };

  const handleDeletePost = async (postId, postTitle) => {
    if (!window.confirm(`Are you sure you want to delete the post "${postTitle}"?`)) {
      return;
    }

    try {
      await communityService.deletePost(postId);
      // Refresh community data
      const res = await communityService.getCommunityById(id);
      setCommunity(res.data);
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post');
    }
  };

  const isCreator = currentUser && community && currentUser._id === community.creator._id;
  const isModerator = currentUser && community && community.moderators && community.moderators.some(mod => mod._id === currentUser._id);
  const canManage = isCreator || isModerator;

  if (loading) return <div className="p-8 text-center text-gray-700 dark:text-gray-200">Loading…</div>;
  if (error) return <div className="p-8 text-center text-red-600 dark:text-red-400">{error}</div>;
  if (!community) return null;

  return (
    <div className="max-w-4xl mx-auto my-10">
      {community.bannerUrl && <img src={community.bannerUrl} alt="community banner" className="w-full rounded-xl mb-6 max-h-56 object-cover" />}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
       <div className="flex items-center gap-4">
         <img src={community.iconUrl || 'https://www.gravatar.com/avatar/?d=mp'} alt={community.displayName} className="w-16 h-16 rounded-full object-cover border-2 border-orange-500" />
         <span>
           <h1 className="text-3xl font-bold text-gray-900 dark:text-white">r/{community.name}</h1>
           <div className="text-gray-600 dark:text-gray-300">{community.displayName}</div>
           <div className="text-xs text-gray-500">{community.memberCount || 0} members</div>
         </span>
       </div>
       <div className="flex flex-wrap gap-2">
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

         {/* Community Management Buttons */}
         {canManage && (
           <>
             <button
               onClick={() => {
                 setShowMembers(true);
                 loadMembers();
               }}
               className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold"
             >
               Members
             </button>

             {isCreator && (
               <>
                 <Link
                   to={`/community/${community._id}/edit`}
                   className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold"
                 >
                   Edit Community
                 </Link>
                 <button
                   onClick={handleDeleteCommunity}
                   disabled={managing}
                   className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold disabled:opacity-50"
                 >
                   {managing ? 'Deleting...' : 'Delete Community'}
                 </button>
               </>
             )}
           </>
         )}
       </div>
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

      {/* Members Modal */}
      {showMembers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Community Members ({members.length})
                </h2>
                <button
                  onClick={() => setShowMembers(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.user._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <img
                        src={member.user.profile?.avatarUrl || 'https://www.gravatar.com/avatar/?d=mp'}
                        alt={member.user.username}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <Link
                          to={`/profile/${member.user._id}`}
                          className="font-medium text-gray-900 dark:text-white hover:text-orange-500"
                          onClick={() => setShowMembers(false)}
                        >
                          {member.user.username}
                        </Link>
                        <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {member.role}
                        </div>
                      </div>
                    </div>

                    {canManage && member.role !== 'creator' && member.user._id !== currentUser._id && (
                      <button
                        onClick={() => handleRemoveMember(member.user._id, member.user.username)}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

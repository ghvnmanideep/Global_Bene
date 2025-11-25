import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { postService } from '../services/postService';
import { communityService } from '../services/communityService';
import { authService } from '../services/authService';
import CommentSection from './CommentSection';

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [community, setCommunity] = useState(null);
  const [communityMembers, setCommunityMembers] = useState([]);
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPostAndCommunity = async () => {
      try {
        setLoading(true);
        const postRes = await postService.getPostById(id);
        setPost(postRes.data);

        // If post belongs to a community, fetch community data
        if (postRes.data.community && postRes.data.community._id) {
          const communityRes = await communityService.getCommunityById(postRes.data.community._id);
          setCommunity(communityRes.data);

          // Check if current user is a member
          const user = sessionStorage.getItem('user') ? JSON.parse(sessionStorage.getItem('user')) : null;
          if (user && communityRes.data.members) {
            setIsMember(communityRes.data.members.some(member => member._id === user._id));
          }

          // Load some community members (first 10)
          try {
            const membersRes = await communityService.getCommunityMembers(postRes.data.community._id);
            setCommunityMembers(membersRes.data.members.slice(0, 10)); // Show first 10 members
          } catch (membersErr) {
            console.error('Error loading community members:', membersErr);
          }
        }
      } catch (err) {
        console.error('Error loading post:', err);
        setError('Could not load post');
      } finally {
        setLoading(false);
      }
    };

    loadPostAndCommunity();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-700 dark:text-gray-200">Loading…</div>;
  if (error) return <div className="p-8 text-center text-red-600 dark:text-red-400">{error}</div>;
  if (!post) return null;

  const formatTime = (date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diff = now - postDate;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  const handleJoinLeave = async () => {
    if (!community) return;

    setJoining(true);
    try {
      await communityService.toggleJoinCommunity(community._id);
      // Refresh community data
      const res = await communityService.getCommunityById(community._id);
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

  return (
    <div className="max-w-7xl mx-auto my-10 px-4">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Post Content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        {/* Post Header */}
        <div className="flex items-center space-x-2 text-sm mb-4">
          {post.community ? (
            <span className="bg-green-600/15 text-green-900 dark:bg-green-400/10 dark:text-green-200 rounded px-2 font-semibold">Community: g/{post.community.name || post.community.displayName}</span>
          ) : (
            <span className="bg-blue-600/15 text-blue-900 dark:bg-blue-400/10 dark:text-blue-100 rounded px-2 font-semibold">User Post</span>
          )}
          <span className="bg-orange-500/15 text-orange-900 dark:text-orange-300/20 dark:text-orange-100 rounded px-2 font-semibold ml-2">{post.category ? post.category.charAt(0).toUpperCase() + post.category.slice(1) : 'General'}</span>
          <span className="text-gray-600 dark:text-gray-300">•</span>
          <span className="font-medium text-slate-700 dark:text-slate-200">Posted by u/{post.author?.username || 'Anonymous'}</span>
          <span className="text-gray-600 dark:text-gray-400">•</span>
          <span className="font-light text-slate-700 dark:text-slate-300">{formatTime(post.createdAt)}</span>
        </div>

        {/* Post Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{post.title}</h1>

        {/* Post Image */}
        {post.imageUrl && (
          <img src={post.imageUrl} alt={post.title} className="w-full rounded-lg mb-4 max-h-96 object-cover" />
        )}

        {/* Post Link */}
        {post.linkUrl && (
          <div className="flex items-center mb-4">
            <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7a5 5 0 0 1 0 10H7a5 5 0 0 1 0-10h2" />
            </svg>
            <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline break-words">
              {post.linkUrl}
            </a>
          </div>
        )}

        {/* Post Content */}
        {post.content?.text && (
          <p className="text-gray-700 dark:text-gray-300 mb-6 whitespace-pre-wrap">{post.content.text}</p>
        )}

        {/* Post Images */}
        {post.content?.images && post.content.images.length > 0 && (
          <div className="mb-6 space-y-2">
            {post.content.images.map((image, index) => (
              <div key={index} className="rounded-lg overflow-hidden shadow-md">
                <img
                  src={image.secure_url}
                  alt={post.title}
                  className="w-full h-auto max-h-96 object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {/* Post Links */}
        {post.content?.links && post.content.links.length > 0 && (
          <div className="mb-6 space-y-2">
            {post.content.links.map((link, index) => (
              <div key={index} className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <svg className="w-5 h-5 mr-2 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7a5 5 0 0 1 0 10H7a5 5 0 0 1 0-10h2" />
                </svg>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline break-words font-medium"
                >
                  {link.title || link.url}
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Legacy support for old format */}
        {post.imageUrl && !post.content?.images && (
          <div className="mb-6 rounded-lg overflow-hidden shadow-md">
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-auto max-h-96 object-cover"
              loading="lazy"
            />
          </div>
        )}

        {post.linkUrl && !post.content?.links && (
          <div className="flex items-center mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <svg className="w-5 h-5 mr-2 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7a5 5 0 0 1 0 10H7a5 5 0 0 1 0-10h2" />
            </svg>
            <a
              href={post.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline break-words font-medium"
            >
              {post.linkUrl}
            </a>
          </div>
        )}

        {/* Post Stats */}
        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
          <span>{post.upvotes || 0} upvotes</span>
          <span>{post.downvotes || 0} downvotes</span>
          <span>{post.commentCount || 0} comments</span>
        </div>

        {/* Comments Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Comments</h3>
          <CommentSection postId={post._id} onCommentUpdate={() => {}} />
        </div>
          </div>
        </div>

        {/* Community Sidebar */}
        {community && (
          <div className="w-full lg:w-80">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 sticky top-4">
              {/* Community Header */}
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={community.iconUrl || 'https://www.gravatar.com/avatar/?d=mp'}
                  alt={community.displayName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-orange-500"
                />
                <div>
                  <Link
                    to={`/community/${community.name}`}
                    className="text-lg font-bold text-gray-900 dark:text-white hover:text-orange-500 transition-colors"
                  >
                    g/{community.name}
                  </Link>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{community.displayName}</p>
                </div>
              </div>

              {/* Community Description */}
              {community.description && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{community.description}</p>
              )}

              {/* Community Stats */}
              <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-center">
                  <div className="font-bold text-gray-900 dark:text-white">{community.members?.length || 0}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Members</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-gray-900 dark:text-white">{community.postCount || 0}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Posts</div>
                </div>
              </div>

              {/* Join/Leave Button */}
              {sessionStorage.getItem('accessToken') && (
                <button
                  onClick={handleJoinLeave}
                  disabled={joining}
                  className={`w-full mb-4 px-4 py-2 rounded-lg font-semibold ${
                    isMember
                      ? 'bg-gray-500 hover:bg-gray-600 text-white'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  } disabled:opacity-50`}
                >
                  {joining ? '...' : isMember ? 'Leave Community' : 'Join Community'}
                </button>
              )}

              {/* Community Members */}
              {communityMembers.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Members</h4>
                  <div className="space-y-2">
                    {communityMembers.slice(0, 5).map((member) => (
                      <div key={member.user._id} className="flex items-center gap-2">
                        <img
                          src={member.user.profile?.avatarUrl || 'https://www.gravatar.com/avatar/?d=mp'}
                          alt={member.user.username}
                          className="w-6 h-6 rounded-full"
                        />
                        <Link
                          to={`/profile/${member.user._id}`}
                          className="text-sm text-gray-700 dark:text-gray-300 hover:text-orange-500 transition-colors"
                        >
                          {member.user.username}
                        </Link>
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">({member.role})</span>
                      </div>
                    ))}
                    {communityMembers.length > 5 && (
                      <Link
                        to={`/community/${community.name}`}
                        className="text-sm text-orange-500 hover:text-orange-600 transition-colors"
                      >
                        View all {community.members?.length || 0} members →
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

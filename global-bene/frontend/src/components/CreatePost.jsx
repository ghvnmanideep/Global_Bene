import React, { useState, useEffect } from 'react';
import { postService } from '../services/postService';

export default function CreatePost({ onClose, onSuccess, communities, editPost }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    communityId: '',
    type: 'text',
    linkUrl: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEditing = !!editPost;

  // Initialize form data for editing
  useEffect(() => {
    if (editPost) {
      setFormData({
        title: editPost.title || '',
        content: editPost.content || '',
        communityId: editPost.community?._id || '',
        type: editPost.type || 'text',
        linkUrl: editPost.linkUrl || '',
      });
      setPostType(editPost.community ? 'community' : 'user');
      setCategory(editPost.category || 'general');
    }
  }, [editPost]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let response;
      if (isEditing) {
        // Update existing post
        if (formData.type === 'image') {
          const fd = new FormData();
          fd.append('title', formData.title);
          fd.append('type', formData.type);
          fd.append('content', formData.content || '');
          fd.append('category', category);
          if (imageFile) fd.append('image', imageFile);
          response = await postService.updatePost(editPost._id, fd);
        } else if (formData.type === 'link') {
          response = await postService.updatePost(editPost._id, {
            title: formData.title,
            type: formData.type,
            linkUrl: formData.linkUrl,
            content: '',
            category,
          });
        } else {
          response = await postService.updatePost(editPost._id, {
            title: formData.title,
            type: 'text',
            content: formData.content,
            category,
          });
        }
      } else {
        // Create new post
        if (formData.type === 'image') {
          const fd = new FormData();
          fd.append('title', formData.title);
          if (postType === 'community' && formData.communityId) {
            fd.append('communityId', formData.communityId);
          }
          fd.append('type', formData.type);
          fd.append('content', ''); // Always send content for backend validation
          fd.append('category', category);
          if (imageFile) fd.append('image', imageFile);
          response = await postService.createPost(fd);
        } else if (formData.type === 'link') {
          response = await postService.createPost({
            title: formData.title,
            communityId: postType === 'community' ? formData.communityId : undefined,
            type: formData.type,
            linkUrl: formData.linkUrl,
            content: '', // Always send content
            category,
          });
        } else {
          response = await postService.createPost({
            title: formData.title,
            communityId: postType === 'community' ? formData.communityId : undefined,
            type: 'text',
            content: formData.content,
            category,
          });
        }

        // Check for spam warning that requires user confirmation
        if (response.data?.requiresConfirmation && response.data?.spamWarning) {
          const confirmPost = window.confirm(
            `This post might be considered spam and may be flagged. Do you want to proceed? Proceeding may cause restrictions or admin review.\n\nReason: ${response.data.spamReason}\nConfidence: ${(response.data.spamConfidence * 100).toFixed(1)}%`
          );
          if (!confirmPost) {
            setLoading(false);
            return;
          }
          // If user confirms, we need to proceed with posting (this would require a separate endpoint or flag)
          // For now, we'll show a message that the post needs manual review
          alert('Your post has been flagged for review. It will be visible after admin approval.');
          setLoading(false);
          return;
        }
      }

      onSuccess();
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.spamDetected) {
        setError(`Spam detected: ${errorData.spamReason}. Your post cannot be created.`);
      } else {
        setError(errorData?.message || err.message || `Error ${isEditing ? 'updating' : 'creating'} post`);
      }
    } finally {
      setLoading(false);
    }
  };

  const CATEGORY_OPTIONS = [
    { label: 'General', value: 'general' },
    { label: 'Tech', value: 'tech' },
    { label: 'Sports', value: 'sports' },
    { label: 'Political', value: 'political' },
    { label: 'Entertainment', value: 'entertainment' },
    { label: 'News', value: 'news' },
    { label: 'Health', value: 'health' },
    { label: 'Other', value: 'other' },
  ];

  // Add postType: 'community' | 'user'
  const [postType, setPostType] = useState('community');
  // ADD: category state
  const [category, setCategory] = useState('general');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-300 dark:border-gray-700 shadow-xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{isEditing ? 'Edit Post' : 'Create Post'}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Post type switch - only show for new posts */}
            {!isEditing && (
              <div className="flex items-center gap-8 mb-4">
                  <label><input type="radio" name="postType" value="community" checked={postType === 'community'} onChange={() => setPostType('community')} /> Community Post</label>
                  <label><input type="radio" name="postType" value="user" checked={postType === 'user'} onChange={() => setPostType('user')} /> User Post</label>
              </div>
            )}

            {/* Content type tabs */}
            <div className="flex items-center gap-2 mb-2">
              <button type="button" onClick={() => setFormData({ ...formData, type: 'text' })} className={`px-3 py-1.5 rounded ${formData.type === 'text' ? 'bg-orange-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100'}`}>Text</button>
              <button type="button" onClick={() => setFormData({ ...formData, type: 'image' })} className={`px-3 py-1.5 rounded ${formData.type === 'image' ? 'bg-orange-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100'}`}>Image</button>
              <button type="button" onClick={() => setFormData({ ...formData, type: 'link' })} className={`px-3 py-1.5 rounded ${formData.type === 'link' ? 'bg-orange-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100'}`}>Link</button>
            </div>

            {/* Community select - only if community post and not editing */}
            {postType === 'community' && !isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Community *
                </label>
                <select
                  name="communityId"
                  value={formData.communityId}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-400 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 shadow"
                >
                  <option value="">Select a community</option>
                  {communities.map((community) => (
                    <option key={community._id} value={community._id}>
                      g/{community.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Category select (always show) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={category}
                onChange={e => setCategory(e.target.value)}
                required
                className="w-full p-2 border border-gray-400 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 shadow"
              >
                {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                maxLength={300}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Post title"
              />
            </div>

            {formData.type === 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Content *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  placeholder="What's on your mind?"
                />
              </div>
            )}

            {formData.type === 'link' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Link URL *
                </label>
                <input
                  type="url"
                  name="linkUrl"
                  value={formData.linkUrl}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="https://example.com"
                />
              </div>
            )}

            {formData.type === 'image' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Image {isEditing ? '(leave empty to keep current)' : '*'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  required={!isEditing}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-orange-600 dark:bg-orange-400 text-white dark:text-slate-900 rounded-lg font-semibold disabled:opacity-50 shadow hover:bg-orange-700 dark:hover:bg-orange-300 transition"
              >
                {loading ? (isEditing ? 'Updating...' : 'Posting...') : (isEditing ? 'Update' : 'Post')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


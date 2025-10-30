import React, { useState } from 'react';
import { communityService } from '../services/communityService';

export default function CreateCommunity({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    iconUrl: '',
    bannerUrl: '',
    isPrivate: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [iconFile, setIconFile] = useState(null);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate name format
    const nameRegex = /^[a-z0-9]+$/;
    if (!nameRegex.test(formData.name)) {
      setError('Community name must be lowercase alphanumeric only (no spaces or special characters)');
      setLoading(false);
      return;
    }

    try {
      await communityService.createCommunity(formData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating community');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Community</h2>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name (lowercase, no spaces) *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                pattern="[a-z0-9]+"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="communityname"
              />
              <p className="text-xs text-gray-500 mt-1">r/{formData.name || 'communityname'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display Name *
              </label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                required
                maxLength={50}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Community Display Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                maxLength={500}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                placeholder="What is this community about?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Icon URL (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={async e => {
                  const file = e.target.files[0];
                  if (file) {
                    // Upload to backend/cloudinary
                    const data = new FormData();
                    data.append('image', file);
                    const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/uploads/community-image', {
                      method: 'POST',
                      body: data
                    });
                    const json = await res.json();
                    if (json.url) setFormData(f => ({ ...f, iconUrl: json.url }));
                  }
                  setIconFile(file);
                }}
                className="w-full border mt-2 p-2"
              />
              {formData.iconUrl && (
                <div className="mt-2 flex items-center">
                  <img src={formData.iconUrl} alt="Community Icon" className="w-10 h-10 rounded-full mr-2" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{formData.iconUrl}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Banner URL (optional)
              </label>
              <input
                type="url"
                name="bannerUrl"
                value={formData.bannerUrl}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="https://example.com/banner.jpg"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={handleChange}
                className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Private community (members only)
              </label>
            </div>

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
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Community'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


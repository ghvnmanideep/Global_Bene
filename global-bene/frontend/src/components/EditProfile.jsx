import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export default function EditProfile() {
  const [user, setUser] = useState(null);
  const [preview, setPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [formData, setFormData] = useState({ username: '', bio: '', mobile: '', gender: '', dob: '' });
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    authService
      .getMe()
      .then((res) => {
        const data = res.data;
        setUser(data);
        setFormData({
          username: data.username || '',
          bio: data.profile?.bio || '',
          mobile: data.profile?.mobile || '',
          gender: data.profile?.gender || '',
          dob: data.profile?.dob ? data.profile.dob.slice(0, 10) : '', // yyyy-mm-dd
        });
        setPreview(data.profile?.avatarUrl || '');
      })
      .catch(() => navigate('/login'));
  }, [navigate]);

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    setAvatarFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');

    try {
      const uploadData = new FormData();
      uploadData.append('username', formData.username);
      uploadData.append('bio', formData.bio);
      uploadData.append('mobile', formData.mobile);
      uploadData.append('gender', formData.gender);
      uploadData.append('dob', formData.dob);
      if (avatarFile) uploadData.append('avatar', avatarFile);

      await authService.updateProfile(uploadData);
      setMsg('✅ Profile updated successfully!');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setMsg(err.response?.data?.message || err.response?.data?.error || 'Error updating profile');
    }
  };

  if (!user)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700 dark:text-gray-300 dark:bg-gray-900 bg-gray-100">
        Loading profile...
      </div>
    );

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white dark:bg-gray-800 shadow rounded border border-gray-300 dark:border-gray-700">
      <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">Edit Profile</h1>
      {user && user.googleId && (
        <div className="bg-blue-100 text-blue-800 px-2 py-1 mb-6 rounded text-sm">
          Password cannot be set/changed for accounts created with Google login.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center space-x-6">
          <img
            src={preview || 'https://www.gravatar.com/avatar/?d=mp'}
            alt="Avatar Preview"
            className="w-24 h-24 rounded-full object-cover border-2 border-blue-500"
          />
          <label className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold shadow">
            Upload Avatar
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </label>
        </div>

        <div>
          <label htmlFor="username" className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            placeholder="Enter your username"
          />
        </div>

        <div>
          <label htmlFor="bio" className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows="3"
            value={formData.bio}
            onChange={handleInputChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            placeholder="Tell us about yourself"
          />
        </div>

        <div>
          <label htmlFor="mobile" className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
            Mobile
          </label>
          <input
            type="tel"
            id="mobile"
            name="mobile"
            value={formData.mobile}
            onChange={handleInputChange}
            placeholder="+1 234 567 8900"
            className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>

        <div>
          <label htmlFor="gender" className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
            Gender
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">Prefer not to say</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="dob" className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
            Date of Birth
          </label>
          <input
            type="date"
            id="dob"
            name="dob"
            value={formData.dob}
            onChange={handleInputChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded shadow transition"
        >
          Save Changes
        </button>

        {msg && (
          <p
            className={`mt-4 text-center rounded px-3 py-1 ${
              msg.includes('✅') ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
            }`}
          >
            {msg}
          </p>
        )}
      </form>
    </div>
  );
}

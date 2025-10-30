import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [msg, setMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const { data } = await authService.login(form);
      sessionStorage.setItem('accessToken', data.accessToken || data.token);
      // Store user data
      sessionStorage.setItem('user', JSON.stringify({ _id: data._id, username: data.username }));
      setMsg('✅ Logged in successfully!');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-md p-8">
        <h1 className="text-2xl font-semibold text-center text-gray-900 dark:text-gray-100 mb-6">
          Log In to Global Bene
        </h1>

        {msg && (
          <div
            className={`mb-4 p-3 rounded text-center ${
              msg.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800 animate-pulse'
            }`}
          >
            {msg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-gray-700 dark:text-gray-300 font-medium mb-1">
              Email address
            </label>
            <input
              type="email"
              id="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              placeholder="you@example.com"
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-700 dark:text-gray-300 font-medium mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                placeholder="••••••••"
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-blue-600 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md shadow-sm transition"
          >
            Log In
          </button>
        </form>

        <div className="mt-4 flex justify-between text-sm text-blue-600 dark:text-blue-400">
          <Link to="/forgot" className="hover:underline">
            Forgot password?
          </Link>
          <Link to="/register" className="hover:underline">
            Create an account
          </Link>
        </div>

        <a
          href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`}
          className="block w-full text-center py-3 bg-red-600 hover:bg-red-700 text-white rounded font-semibold mt-6"
        >
          Sign in with Google
        </a>
      </div>
    </div>
  );
}

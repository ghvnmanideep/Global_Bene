import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import VerifyEmail from './components/VerifyEmail';
import Profile from './components/Profile';
import EditProfile from './components/EditProfile';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Logout from './components/Logout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/Dashboard';
import CommunityList from './components/CommunityList';
import Search from './components/Search';
import CommunityDetail from './components/CommunityDetail';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleTheme = () => setDarkMode((prev) => !prev);

  return (
    <BrowserRouter>
      <div className={`min-h-screen font-sans transition-colors duration-500 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
        <nav className="sticky top-0 z-50 flex justify-between items-center px-8 py-4 bg-white/90 dark:bg-gray-900/90 shadow-md">
          <Link to="/" className="text-3xl font-bold text-blue-600 dark:text-blue-400 hover:underline">Global Bene</Link>

          {/* Determine login state */}
          {(() => {
            const isLoggedIn = !!sessionStorage.getItem('accessToken');
            const user = sessionStorage.getItem('user') ? JSON.parse(sessionStorage.getItem('user')) : null;
            if (isLoggedIn) {
              return (
                <div className="space-x-6 flex items-center">
                  <Link to="/" className="hover:underline">Home</Link>
                  <Link to="/communities" className="hover:underline">Communities</Link>
                  <Link to="/dashboard" className="hover:underline">Dashboard</Link>
                  <Link to="/profile" className="hover:underline">{user?.username || 'Profile'}</Link>
                  <Link to="/search" className="hover:underline">Search</Link>
                  <button
                    onClick={() => {
                      sessionStorage.clear();
                      window.location.href = '/home';
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded shadow font-semibold"
                  >Logout</button>
                  <button onClick={toggleTheme} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white" title="Toggle theme">
                    {darkMode ? '🌞 Light' : '🌙 Dark'}
                  </button>
                </div>
              );
            } else {
              return (
                <div className="space-x-6 flex items-center">
                  <Link to="/" className="hover:underline">Home</Link>
                  <Link to="/communities" className="hover:underline">Communities</Link>
                  <Link to="/login" className="hover:underline">Login</Link>
                  <Link to="/register" className="hover:underline">Register</Link>
                  <button onClick={toggleTheme} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white" title="Toggle theme">
                    {darkMode ? '🌞 Light' : '🌙 Dark'}
                  </button>
                </div>
              );
            }
          })()}
        </nav>

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home darkMode={darkMode} />} />
          <Route path="/home" element={<Home darkMode={darkMode} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/reset/:token" element={<ResetPassword />} />
          <Route path="/verify/:token" element={<VerifyEmail />} />
          <Route path="/communities" element={<CommunityList />} />
          <Route path="/search" element={<Search />} />
          <Route path="/community/:id" element={<CommunityDetail />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/logout" element={<Logout />} />
          </Route>

          {/* 404 Fallback */}
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center h-[70vh] text-center p-4">
              <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
              <p className="mb-4">Page Not Found</p>
              <Link to="/" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Go Home</Link>
            </div>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

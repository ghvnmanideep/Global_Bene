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
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './components/Dashboard';
import CommunityList from './components/CommunityList';
import Search from './components/Search';
import CommunityDetail from './components/CommunityDetail';
import PostDetail from './components/PostDetail';
import CreatePost from './components/CreatePost';
import CreateCommunity from './components/CreateCommunity';
import UserCommunities from './components/UserCommunities';
import ContactUs from './components/ContactUs';
import GLogin from './components/GLogin';
import { communityService } from './services/communityService';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [communities, setCommunities] = useState([]);
  const [sidebarOpen] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const res = await communityService.getAllCommunities();
        setCommunities(res.data.communities || []);
      } catch (err) {
        console.error('Error fetching communities:', err);
      }
    };
    fetchCommunities();
  }, []);

  const toggleTheme = () => setDarkMode((prev) => !prev);

  return (
    <BrowserRouter>
      <div className={`min-h-screen font-sans transition-colors duration-500 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} flex`}>
        {/* Left Sidebar */}
        <aside className={`min-h-screen bg-white/90 dark:bg-gray-900/90 shadow-md flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0'}`}>
          <div className="px-8 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <Link to="/" className={`text-3xl font-bold text-blue-600 dark:text-blue-400 hover:underline ${sidebarOpen ? '' : 'hidden'}`}>Global Bene</Link>
          </div>
          <nav className={`flex-1 py-4 space-y-4 ${sidebarOpen ? 'px-8' : 'px-4'}`}>
            {/* Determine login state */}
            {(() => {
              const isLoggedIn = !!sessionStorage.getItem('accessToken');
              const user = sessionStorage.getItem('user') ? JSON.parse(sessionStorage.getItem('user')) : null;
              if (isLoggedIn) {
                return (
                  <>
                    {/* Profile Section */}
                    <Link to="/profile" className={`border-b border-gray-200 dark:border-gray-700 pb-4 mb-4 block hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-2 py-1 ${sidebarOpen ? '' : 'justify-center'}`}>
                      <div className={`flex items-center ${sidebarOpen ? 'space-x-3' : 'justify-center'}`}>
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        {sidebarOpen && (
                          <div>
                            <p className="font-semibold text-sm">{user?.username || 'User'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || 'user@example.com'}</p>
                          </div>
                        )}
                      </div>
                    </Link>
                    <Link to="/" className={`block hover:underline ${sidebarOpen ? '' : 'text-center'}`}>Home</Link>
                    <Link to="/communities" className={`block hover:underline ${sidebarOpen ? '' : 'text-center'}`}>Communities</Link>
                    <Link to="/my-communities" className={`block hover:underline ${sidebarOpen ? '' : 'text-center'}`}>Your Communities</Link>
                    <Link to="/create-post" className={`block hover:underline ${sidebarOpen ? '' : 'text-center'}`}>Create Post</Link>
                    <Link to="/create-community" className={`block hover:underline ${sidebarOpen ? '' : 'text-center'}`}>Create Community</Link>
                    <Link to="/dashboard" className={`block hover:underline ${sidebarOpen ? '' : 'text-center'}`}>Dashboard</Link>
                    <Link to="/profile" className={`block hover:underline ${sidebarOpen ? '' : 'text-center'}`}>{sidebarOpen ? (user?.username || 'Profile') : '👤'}</Link>
                    <Link to="/search" className={`block hover:underline ${sidebarOpen ? '' : 'text-center'}`}>Search</Link>
                    <Link to="/contact" className={`block hover:underline ${sidebarOpen ? '' : 'text-center'}`}>Contact Us</Link>
                    <button
                      onClick={() => {
                        sessionStorage.clear();
                        window.location.href = '/home';
                      }}
                      className={`w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow font-semibold ${sidebarOpen ? '' : 'px-2 text-sm'}`}
                    >{sidebarOpen ? 'Logout' : '🚪'}</button>
                    <button onClick={toggleTheme} className={`w-full px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white ${sidebarOpen ? '' : 'px-2 text-sm'}`} title="Toggle theme">
                      {sidebarOpen ? (darkMode ? '🌞 Light' : '🌙 Dark') : (darkMode ? '🌞' : '🌙')}
                    </button>
                  </>
                );
              } else {
                return (
                  <>
                    <Link to="/" className={`block hover:underline ${sidebarOpen ? '' : 'text-center'}`}>Home</Link>
                    <Link to="/communities" className={`block hover:underline ${sidebarOpen ? '' : 'text-center'}`}>Communities</Link>
                    <Link to="/contact" className={`block hover:underline ${sidebarOpen ? '' : 'text-center'}`}>Contact Us</Link>
                    <Link to="/login" className={`block hover:underline ${sidebarOpen ? '' : 'text-center'}`}>Login</Link>
                    <Link to="/register" className={`block hover:underline ${sidebarOpen ? '' : 'text-center'}`}>Register</Link>
                    <button onClick={toggleTheme} className={`w-full px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white ${sidebarOpen ? '' : 'px-2 text-sm'}`} title="Toggle theme">
                      {sidebarOpen ? (darkMode ? '🌞 Light' : '🌙 Dark') : (darkMode ? '🌞' : '🌙')}
                    </button>
                  </>
                );
              }
            })()}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home darkMode={darkMode} />} />
          <Route path="/home" element={<Home darkMode={darkMode} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/reset/:token" element={<ResetPassword />} />
          <Route path="/verify/:token" element={<VerifyEmail />} />
          <Route path="/auth/callback" element={<GLogin />} />
          <Route path="/communities" element={<CommunityList />} />
          <Route path="/search" element={<Search />} />
          <Route path="/contact" element={<ContactUs darkMode={darkMode} />} />
          <Route path="/community/:id" element={<CommunityDetail />} />
          <Route path="/post/:id" element={<PostDetail />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/my-communities" element={<UserCommunities />} />
            <Route path="/create-post" element={<CreatePost communities={communities} onClose={() => window.history.back()} onSuccess={() => window.location.href = '/dashboard'} />} />
            <Route path="/create-community" element={<CreateCommunity onClose={() => window.history.back()} onSuccess={() => window.location.href = '/communities'} />} />
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
        </main>
      </div>
    </BrowserRouter>
  );
}

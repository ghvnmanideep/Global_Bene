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
import AdminUserManagement from './components/AdminUserManagement';
import AdminPostManagement from './components/AdminPostManagement';
import AdminNotifications from './components/AdminNotifications';
import AdminSpamReports from './components/AdminSpamReports';
import AdminSpamManagement from './components/AdminSpamManagement';
import AdminDashboard from './components/AdminDashboard';
import { communityService } from './services/communityService';

import Notifications from './components/Notifications';
import Header from './components/Header';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [communities, setCommunities] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!sessionStorage.getItem('accessToken'));

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

  // Listen for login/logout events to update sidebar
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = sessionStorage.getItem('user');
      const token = sessionStorage.getItem('accessToken');
      setUser(storedUser ? JSON.parse(storedUser) : null);
      setIsLoggedIn(!!token);
    };

    window.addEventListener('storage', handleStorageChange);

    // Custom event for immediate updates
    const handleAuthChange = () => {
      const storedUser = sessionStorage.getItem('user');
      const token = sessionStorage.getItem('accessToken');
      setUser(storedUser ? JSON.parse(storedUser) : null);
      setIsLoggedIn(!!token);
    };

    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleTheme = () => setDarkMode((prev) => !prev);
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <BrowserRouter>
      <div className={`min-h-screen font-sans transition-colors duration-500 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} flex`}>
        {/* Mobile Overlay */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={toggleSidebar}
          ></div>
        )}

        {/* Left Sidebar */}
        <aside className={`min-h-screen bg-white/90 dark:bg-gray-900/90 shadow-md flex flex-col transition-all duration-300 z-50 ${sidebarOpen ? 'w-64' : 'w-0'} ${isMobile ? 'fixed' : 'relative'}`}>
          <div className="px-8 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <Link to="/" className={`text-3xl font-bold text-blue-600 dark:text-blue-400 hover:underline ${sidebarOpen ? '' : 'hidden'}`}>Global Bene</Link>
            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                ✕
              </button>
            )}
          </div>
          <nav className={`flex-1 py-4 space-y-4 ${sidebarOpen ? 'px-8' : 'px-4'}`}>
            {/* Determine login state */}
            {(() => {
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
                    <Link to="/" className={`block hover:underline ${sidebarOpen ? '' : 'text-center'}`} onClick={isMobile ? toggleSidebar : undefined}>Home</Link>
                    <Link to="/communities" className={`block hover:underline ${sidebarOpen ? '' : 'text-center'}`} onClick={isMobile ? toggleSidebar : undefined}>Communities</Link>
                    <Link to="/my-communities" className={`block hover:underline ${sidebarOpen ? '' : 'text-center'}`} onClick={isMobile ? toggleSidebar : undefined}>Your Communities</Link>
                    <Link to="/create-post" className={`block hover:underline ${sidebarOpen ? '' : 'text-center'}`} onClick={isMobile ? toggleSidebar : undefined}>Create Post</Link>
                    <Link to="/create-community" className={`block hover:underline ${sidebarOpen ? '' : 'text-center'}`} onClick={isMobile ? toggleSidebar : undefined}>Create Community</Link>
                    <Link to="/dashboard" className={`block hover:underline ${sidebarOpen ? '' : 'text-center'}`} onClick={isMobile ? toggleSidebar : undefined}>Dashboard</Link>
                    {user?.role === 'admin' && (
                      <Link to="/admin" className={`block hover:underline ${sidebarOpen ? '' : 'text-center'}`} onClick={isMobile ? toggleSidebar : undefined}>Admin Panel</Link>
                    )}
                    <Link to="/notifications" className={`block hover:underline ${sidebarOpen ? '' : 'text-center'}`} onClick={isMobile ? toggleSidebar : undefined}>Notifications</Link>
                    <Link to="/profile" className={`block hover:underline ${sidebarOpen ? '' : 'text-center'}`} onClick={isMobile ? toggleSidebar : undefined}>{sidebarOpen ? (user?.username || 'Profile') : '👤'}</Link>
                    <Link to="/search" className={`block hover:underline ${sidebarOpen ? '' : 'text-center'}`} onClick={isMobile ? toggleSidebar : undefined}>Search</Link>
                    <Link to="/contact" className={`block hover:underline ${sidebarOpen ? '' : 'text-center'}`} onClick={isMobile ? toggleSidebar : undefined}>Contact Us</Link>
                    <button
                      onClick={() => {
                        sessionStorage.clear();
                        // Dispatch custom event to update sidebar immediately
                        window.dispatchEvent(new Event('authChange'));
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
                    <Link to="/" className={`block hover:underline ${sidebarOpen ? '' : 'text-center'}`} onClick={isMobile ? toggleSidebar : undefined}>Home</Link>
                    <Link to="/communities" className={`block hover:underline ${sidebarOpen ? '' : 'text-center'}`} onClick={isMobile ? toggleSidebar : undefined}>Communities</Link>
                    <Link to="/contact" className={`block hover:underline ${sidebarOpen ? '' : 'text-center'}`} onClick={isMobile ? toggleSidebar : undefined}>Contact Us</Link>
                    <Link to="/login" className={`block hover:underline ${sidebarOpen ? '' : 'text-center'}`} onClick={isMobile ? toggleSidebar : undefined}>Login</Link>
                    <Link to="/register" className={`block hover:underline ${sidebarOpen ? '' : 'text-center'}`} onClick={isMobile ? toggleSidebar : undefined}>Register</Link>
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
          {/* Mobile Header */}
          {isMobile && (
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between md:hidden">
              <button
                onClick={toggleSidebar}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                ☰
              </button>
              <Link to="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">Global Bene</Link>
              <div className="w-6"></div> {/* Spacer for centering */}
            </header>
          )}
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
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUserManagement />} />
            <Route path="/admin/posts" element={<AdminPostManagement />} />
            <Route path="/admin/notifications" element={<AdminNotifications />} />
            <Route path="/admin/spam" element={<AdminSpamReports />} />
            <Route path="/admin/spam-management" element={<AdminSpamManagement />} />
            <Route path="/notifications" element={<Notifications />} />
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

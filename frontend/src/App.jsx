import React, {useEffect, useState} from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { useLocation, useRoutes, Navigate } from 'react-router-dom';
import { ModalProvider } from './context/ModalContext';
import GlobalModals from './GlobalModals';
import ModalBodyScrollLock from './ModalBodyScrollLock';

import socket from './socket';
import Cookies from 'js-cookie';

import Home from './user/Home';
import Login from './auth/Login';
import Register from './auth/Register';
import OneOnOne from './user/OneOnOne';
import Discuss from './user/Discuss';
import Interview from './user/Interview';
import Sessions from './user/Sessions';
import Testimonial from './user/Testimonial';
import Profile from './user/Profile';
import CreateSession from './user/createSession';
import HistoryPage from './user/HistoryPage';
import HelpSupportPage from './user/HelpSupportPage';
import GoPro from './user/HomeSection/GoPro';
import AccountSettings from './user/AccountSettings';
import Package from './user/Package';
import privateProfileRoutes from './user/privateProfile/privateProfileRoutes';
import PrivateProfile from './user/PrivateProfile';
import PublicProfile from './user/PublicProfile';
import publicProfileRoutes from './user/publicProfile/publicProfileRoutes';
import StartSkillSwap from './user/StartSkillSwap';
import accountSettingsRoutes from './user/settings/AccountSettingsRoutes';
import ReportPage from './user/privateProfile/Report';
import TeachingHistory from './user/TeachingHistory';

// Import the backend URL
import { BACKEND_URL } from './config.js';

function useRegisterSocket() {
  useEffect(() => {
    const userCookie = Cookies.get('user');
    let user = null;
    if (userCookie && userCookie !== 'undefined') {
      try {
        user = JSON.parse(userCookie);
      } catch (e) {
        user = null;
      }
    }
    if (user && user._id) {
      console.log('[Socket Register] Emitting register for user', user._id, user);
      socket.emit('register', user._id);
    } else {
      console.log('[Socket Register] No user found in cookie');
    }
  }, []);
}


// Define all routes in a single array for useRoutes
const appRoutes = [
  { path: '/', element: <Navigate to="/home" replace /> },
  { path: '/home', element: <Home /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/one-on-one', element: <OneOnOne /> },
  { path: '/discuss', element: <Discuss /> },
  { path: '/interview', element: <Interview /> },
  { path: '/session', element: <Sessions /> },
  { path: '/testimonials', element: <Testimonial showAll={true} /> },
  { path: '/your-profile', element: <Profile /> },
  { path: '/createSession', element: <CreateSession /> },
  { path: '/package', element: <Package /> },
  { path: '/learning-history', element: <HistoryPage /> },
  { path: '/help', element: <HelpSupportPage /> },
  { path: '/pro', element: <GoPro /> },
  { path: '/accountSettings', element: <AccountSettings /> },
  { path: '/StartSkillSwap', element: <StartSkillSwap /> },
  { path: '/report', element: <ReportPage/>},
  { path: '/teaching-history', element: <TeachingHistory/>},

   ...accountSettingsRoutes,
  
  // Private profile routes (nested under /profile)
  {
    path: '/profile',
    element: <PrivateProfile />,
    children: privateProfileRoutes,
  },
  {
    path: '/public-profile',
    element: <PublicProfile />,
    children: publicProfileRoutes,
  },
];

function CompleteProfileModal({ user, onComplete }) {
  const [username, setUsername] = useState(user?.username || '');
  const [skillsToTeach, setSkillsToTeach] = useState((user?.skillsToTeach || []).join(', '));
  const [skillsToLearn, setSkillsToLearn] = useState((user?.skillsToLearn || []).join(', '));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return setError('Username is required');
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username,
          skillsToTeach: skillsToTeach.split(',').map(s => s.trim()).filter(Boolean),
          skillsToLearn: skillsToLearn.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        onComplete();
      } else {
        setError('Failed to update profile');
      }
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Complete Your Profile</h2>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <label className="block mb-2">
          Username
          <input value={username} onChange={e => setUsername(e.target.value)} className="w-full border p-2 rounded" />
        </label>
        <label className="block mb-2">
          What I Can Teach (comma separated)
          <input value={skillsToTeach} onChange={e => setSkillsToTeach(e.target.value)} className="w-full border p-2 rounded" />
        </label>
        <label className="block mb-2">
          What I Want to Learn (comma separated)
          <input value={skillsToLearn} onChange={e => setSkillsToLearn(e.target.value)} className="w-full border p-2 rounded" />
        </label>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded mt-4" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
      </form>
    </div>
  );
}

function App() {
  useRegisterSocket();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const element = useRoutes(appRoutes);

  // --- Complete Profile Modal Logic ---
  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);
  const [userForModal, setUserForModal] = useState(null);

  useEffect(() => {
    // Try to get user from cookie
    const userCookie = Cookies.get('user');
    let user = null;
    if (userCookie && userCookie !== 'undefined') {
      try {
        user = JSON.parse(userCookie);
      } catch (e) {
        user = null;
      }
    }
    // If user is missing username or skills, show modal
    if (user && (!user.username || user.username.startsWith('user') || !(user.skillsToTeach && user.skillsToTeach.length) || !(user.skillsToLearn && user.skillsToLearn.length))) {
      setUserForModal(user);
      setShowCompleteProfileModal(true);
    }
  }, []);

  return (
    <ModalProvider>
      <ModalBodyScrollLock />
      <GlobalModals />
      {!isAuthPage && <Navbar />}
      <div className={location.pathname === '/home' ? '' : 'pt-8'}>
        {element}
      </div>
      {!isAuthPage && <Footer />}
      {showCompleteProfileModal && userForModal && (
        <CompleteProfileModal user={userForModal} onComplete={() => setShowCompleteProfileModal(false)} />
      )}
    </ModalProvider>
  );
}

export default App;
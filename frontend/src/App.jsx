import React, { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { useLocation, useRoutes, Navigate } from 'react-router-dom';
import { ModalProvider } from './context/ModalContext';
import GlobalModals from './GlobalModals';
import ModalBodyScrollLock from './ModalBodyScrollLock';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

import socket from './socket';
import Cookies from 'js-cookie';

import Home from './user/Home';
import Login from './auth/Login';
import Register from './auth/Register'; // Fixed case to match common convention
import OneOnOne from './user/OneOnOne';
import Discuss from './user/Discuss';
import Interview from './user/Interview';
import Sessions from './user/Sessions';
import Testimonial from './user/Testimonial';
import Profile from './user/Profile';
import CreateSession from './user/CreateSession'; // Fixed case (createSession to CreateSession)
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
import SessionRequests from './user/SessionRequests';
import accountSettingsRoutes from './user/settings/AccountSettingsRoutes';
import ReportPage from './user/privateProfile/Report';
import TeachingHistory from './user/TeachingHistory';
import CompleteProfile from './user/myprofile/CompleteProfile';
import Blog from './user/company/Blog';
import SearchPage from './user/SearchPage';
import AdminPanel from './admin/AdminPanel'; // Fixed case (adminpanel to AdminPanel)

// Define all routes in a single array for useRoutes
const appRoutes = [
  { path: '/', element: <Navigate to="/home" replace /> },
  { path: '/home', element: <Home /> }, // Public route
  { path: '/login', element: <Login /> }, // Public route
  { path: '/register', element: <Register /> }, // Public route
  { 
    path: '/one-on-one', 
    element: <ProtectedRoute><OneOnOne /></ProtectedRoute> 
  },
  { 
    path: '/discuss', 
    element: <ProtectedRoute><Discuss /></ProtectedRoute> 
  },
  { 
    path: '/interview', 
    element: <ProtectedRoute><Interview /></ProtectedRoute> 
  },
  { 
    path: '/session', 
    element: <ProtectedRoute><Sessions /></ProtectedRoute> 
  },
  { 
    path: '/session-requests', 
    element: <ProtectedRoute><SessionRequests /></ProtectedRoute> 
  },
  { 
    path: '/testimonials', 
    element: <ProtectedRoute><Testimonial showAll={true} /></ProtectedRoute> 
  },
  { 
    path: '/your-profile', 
    element: <ProtectedRoute><Profile /></ProtectedRoute> 
  },
  { 
    path: '/createSession', 
    element: <ProtectedRoute><CreateSession /></ProtectedRoute> 
  },
  { 
    path: '/package', 
    element: <ProtectedRoute><Package /></ProtectedRoute> 
  },
  { 
    path: '/learning-history', 
    element: <ProtectedRoute><HistoryPage /></ProtectedRoute> 
  },
  { 
    path: '/help', 
    element: <ProtectedRoute><HelpSupportPage /></ProtectedRoute> 
  },
  { 
    path: '/pro', 
    element: <ProtectedRoute><GoPro /></ProtectedRoute> 
  },
  { 
    path: '/accountSettings', 
    element: <ProtectedRoute><AccountSettings /></ProtectedRoute> 
  },
  { 
    path: '/StartSkillSwap', 
    element: <ProtectedRoute><StartSkillSwap /></ProtectedRoute> 
  },
  { 
    path: '/report', 
    element: <ProtectedRoute><ReportPage /></ProtectedRoute> 
  },
  { 
    path: '/teaching-history', 
    element: <ProtectedRoute><TeachingHistory /></ProtectedRoute> 
  },
  { 
    path: '/blog', 
    element: <ProtectedRoute><Blog /></ProtectedRoute> 
  },
  { 
    path: '/search', 
    element: <ProtectedRoute><SearchPage /></ProtectedRoute> 
  },
  { 
    path: '/admin', 
    element: <ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute> 
  },
  ...accountSettingsRoutes.map(route => ({
    ...route,
    element: <ProtectedRoute>{route.element}</ProtectedRoute>
  })),
  {
    path: '/profile',
    element: <ProtectedRoute><PrivateProfile /></ProtectedRoute>,
    children: privateProfileRoutes.map(route => ({
      ...route,
      element: <ProtectedRoute>{route.element}</ProtectedRoute>
    })),
  },
  {
    path: '/public-profile',
    element: <ProtectedRoute><PublicProfile /></ProtectedRoute>,
    children: publicProfileRoutes.map(route => ({
      ...route,
      element: <ProtectedRoute>{route.element}</ProtectedRoute>
    })),
  },
  {
    path: '/profile/:username',
    element: <ProtectedRoute><PublicProfile /></ProtectedRoute>,
  },
];

function App() {
  const { user, loading } = useAuth(); // Added loading to handle auth initialization
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const element = useRoutes(appRoutes);

  // Register socket for authenticated users only
  useEffect(() => {
    if (loading) {
      console.info('[DEBUG] App: Auth context is still loading');
      return;
    }
    if (user && user._id) {
      console.info('[DEBUG] App: User changed:', user._id);
      socket.emit('register', user._id);
      console.info('[DEBUG] Socket register emitted for user:', user._id);
    } else {
      console.info('[DEBUG] App: No user found in context');
    }
  }, [user, loading]);

  // Render loading state while auth is initializing
  if (loading) {
    return <div>Loading...</div>; // Simple loading state, customize as needed
  }

  return (
    <ModalProvider>
      <ModalBodyScrollLock />
      <GlobalModals />
      {!isAuthPage && <Navbar />}
      <div className={location.pathname === '/home' ? '' : 'pt-8'}>
        {element}
        {user && location.pathname !== '/login' && location.pathname !== '/register' && <CompleteProfile />}
      </div>
      {!isAuthPage && <Footer />}
    </ModalProvider>
  );
}

export default App;
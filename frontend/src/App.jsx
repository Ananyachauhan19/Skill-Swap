import React, { useEffect } from 'react';
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
import SessionRequests from './user/SessionRequests';
import accountSettingsRoutes from './user/settings/AccountSettingsRoutes';
import ReportPage from './user/privateProfile/Report';
import TeachingHistory from './user/TeachingHistory';
import CompleteProfile from './user/myprofile/CompleteProfile';
import { useAuth } from './context/AuthContext';
import Blog from "./user/company/Blog";

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
  { path: '/session-requests', element: <SessionRequests /> },
  { path: '/testimonials', element: <Testimonial showAll={true} /> },
  { path: '/your-profile', element: <Profile /> },
  { path: '/createSession', element: <CreateSession /> },
  { path: '/package', element: <Package /> },
  { path: '/learning-history', element: <HistoryPage /> },
  { path: '/help', element: <HelpSupportPage /> },
  { path: '/pro', element: <GoPro /> },
  { path: '/accountSettings', element: <AccountSettings /> },
  { path: '/StartSkillSwap', element: <StartSkillSwap /> },
  { path: '/report', element: <ReportPage /> },
  { path: '/teaching-history', element: <TeachingHistory /> },
  { path: '/blog', element: <Blog /> }, // Added Blog route
  ...accountSettingsRoutes,
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
  {
    path: '/profile/:username',
    element: <PublicProfile />,
  },
];

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
      socket.emit('register', user._id);
    } else {
      // No user found in cookie
    }
  }, []);
}

function App() {
  const { user } = useAuth();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const element = useRoutes(appRoutes);

  // Register socket whenever user changes
  React.useEffect(() => {
    console.info('[DEBUG] App: User changed:', user && user._id);
    if (user && user._id) {
      socket.emit('register', user._id);
      console.info('[DEBUG] Socket register emitted for user:', user && user._id);
    } else {
      console.info('[DEBUG] App: No user found in context');
    }
  }, [user]);

  return (
    <ModalProvider>
      <ModalBodyScrollLock />
      <GlobalModals />
      {!isAuthPage && <Navbar />}
      <div className={location.pathname === '/home' ? '' : 'pt-8'}>
        {element}
        <CompleteProfile /> {/* Render the CompleteProfile component */}
      </div>
      {!isAuthPage && <Footer />}
    </ModalProvider>
  );
}

export default App;
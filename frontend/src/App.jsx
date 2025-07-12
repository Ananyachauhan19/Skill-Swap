import React, {useEffect} from 'react';
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

function App() {
  useRegisterSocket();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const element = useRoutes(appRoutes);

  return (
    <ModalProvider>
      <ModalBodyScrollLock />
      <GlobalModals />
      {!isAuthPage && <Navbar />}
      <div className={location.pathname === '/home' ? '' : 'pt-8'}>
        {element}
      </div>
      {!isAuthPage && <Footer />}
    </ModalProvider>
  );
}

export default App;
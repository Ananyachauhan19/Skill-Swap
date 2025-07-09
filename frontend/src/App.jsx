import React from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ModalProvider } from './context/ModalContext';
import GlobalModals from './GlobalModals';
import ModalBodyScrollLock from './ModalBodyScrollLock';

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
import Edit_Profile from './user/sections/Edit_Profile';
import HelpSupportPage from './user/HelpSupportPage';
import GoPro from './user/HomeSection/GoPro';
import AccountSettings from './user/AccountSettings';
import AccountSettingsRoutes from './user/settings/AccountSettingsRoutes';
import UploadRecordedSession from './user/SessionsFolder/UploadRecordedSession';
import Package from './user/Package';
import socket from './socket';
import Cookies from 'js-cookie';
import { useEffect } from 'react';

function useRegisterSocket() {
  useEffect(() => {
    const userCookie = Cookies.get('user');
    const user = userCookie ? JSON.parse(userCookie) : null;
    if (user && user._id) {
      console.log('[Socket Register] Emitting register for user', user._id, user);
      socket.emit('register', user._id);
    } else {
      console.log('[Socket Register] No user found in cookie');
    }
  }, []);
}

function App() {
  useRegisterSocket();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <ModalProvider>
      <ModalBodyScrollLock />
      <GlobalModals />
      {!isAuthPage && <Navbar />}
      <div className={location.pathname === '/home' ? '' : 'pt-8'}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/one-on-one" element={<OneOnOne />} />
          <Route path="/discuss" element={<Discuss />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/session" element={<Sessions />} />
          <Route path="/testimonials" element={<Testimonial showAll={true} />} />
          <Route path="/profile" element={<Profile/>} />
          <Route path="/edit-profile" element={<Edit_Profile/>} />
          <Route path="/createSession" element={<CreateSession/>} />
          <Route path="/package" element={<Package/>} />
          <Route path="/uploaded" element={<UploadRecordedSession/>} />
          <Route path="/history" element={<HistoryPage/>} />
          <Route path="/help" element={<HelpSupportPage/>} />
          <Route path="/pro" element={<GoPro/>} />
          <Route path="/accountSettings" element={<AccountSettings/>} />
          {AccountSettingsRoutes()}
        </Routes>
      </div>
      {!isAuthPage && <Footer />}
    </ModalProvider>
  );
}

export default App;
import React from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Home from './user/Home';
import Login from './auth/Login';
import Register from './auth/Register';
import OneOnOne from './user/OneOnOne';
import Discuss from './user/Discuss';
import Interview from './user/Interview';
import Profile from './user/Profile';

function App() {
  const isRegistered = localStorage.getItem('isRegistered') === 'true';
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <>
      {!isLoginPage && <Navbar />}
      <div className={location.pathname === '/home' ? '' : 'pt-8'}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/one-on-one" element={<OneOnOne />} />
          <Route path="/discuss" element={<Discuss />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/profile" element={<Profile/>} />
        </Routes>
      </div>
      {!isLoginPage && <Footer />}
    </>
  );
}

export default App;
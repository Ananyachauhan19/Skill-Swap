import React from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Home from './user/Home';

function App() {
  const isRegistered = localStorage.getItem('isRegistered') === 'true';
  const location = useLocation();

  return (
    <>
      <Navbar />
      <div className={location.pathname === '/home' ? '' : 'pt-8'}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<div className='min-h-screen flex items-center justify-center text-2xl font-bold'>Profile Page (Coming Soon)</div>} />
        </Routes>
      </div>
      <Footer />
    </>
  );
}

export default App;
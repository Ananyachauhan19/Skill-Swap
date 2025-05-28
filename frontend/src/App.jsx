import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Register from './auth/Register';
import Login from './auth/Login';
import Home from './user/Home';

const App = () => {
  return (
    <div className="flex flex-col min-h-screen font-inter text-gray-900 bg-white">
      <Navbar />
      <main className="flex-grow p-6">
        <Routes>
          <Route path="/" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;

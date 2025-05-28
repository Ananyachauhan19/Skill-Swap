import React from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="flex justify-between items-center bg-white text-gray-800 px-8 py-3 shadow-sm border-b border-gray-200">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => navigate('/')}
      >
        <img
          src="/skillswap-logo.png"
          alt="SkillSwap Logo"
          className="h-8 w-8 object-contain"
        />
        <span className="text-lg font-semibold tracking-wide">SkillSwap</span>
      </div>

      <div className="flex gap-3">
        <button
          className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-md hover:bg-gray-200 transition"
          onClick={() => navigate('/home')}
        >
          Home
        </button>
        <button
          className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-md hover:bg-blue-100 transition"
          onClick={() => navigate('/login')}
        >
          Login
        </button>  
      </div>
    </nav>
  );
};

export default Navbar;

import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProfileDropdown from './ProfileDropdown';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = localStorage.getItem('isRegistered') === 'true' || localStorage.getItem('isLoggedIn') === 'true';
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="flex items-center bg-white text-gray-800 px-8 py-3 shadow-sm border-b border-gray-200">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => navigate('/')}
      >
        <img
          src="/skillswap-logo.jpg"
          alt="SkillSwap Logo"
          className="h-8 w-8 object-contain"
        />
        <span className="text-xl font-bold tracking-wide ml-2">SkillSwapHub</span>
      </div>
      <div className="flex-1 flex justify-center gap-8 ml-8">
        <button
          className={`text-base font-medium px-3 py-1 rounded transition ${isActive('/home') ? 'shadow-lg bg-blue-100 text-blue-700' : 'hover:bg-blue-50'}`}
          onClick={() => navigate('/')}
        >
          Home
        </button>
        <button
          className={`text-base font-medium px-3 py-1 rounded transition ${isActive('/one-on-one') ? 'shadow-lg bg-blue-100 text-blue-700' : 'hover:bg-blue-50'}`}
          onClick={() => navigate('/one-on-one')}
        >
          1-on-1
        </button>
        <button
          className={`text-base font-medium px-3 py-1 rounded transition ${isActive('/discuss') ? 'shadow-lg bg-blue-100 text-blue-700' : 'hover:bg-blue-50'}`}
          onClick={() => navigate('/discuss')}
        >
          Discuss
        </button>
        <button
          className={`text-base font-medium px-3 py-1 rounded transition ${isActive('/interview') ? 'shadow-lg bg-blue-100 text-blue-700' : 'hover:bg-blue-50'}`}
          onClick={() => navigate('/interview')}
        >
          Interview
        </button>
      </div>
      <div className="flex items-center gap-4">
        {!isLoggedIn ? (
          <button
            className="bg-blue-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-600 transition"
            onClick={() => navigate('/login')}
          >
            Login
          </button>
        ) : (
          <div className="relative">
            <button
              className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg border-2 border-blue-300 hover:bg-blue-200 transition"
              onClick={() => setShowProfileMenu((v) => !v)}
              title="Profile"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
            <ProfileDropdown show={showProfileMenu} onClose={() => setShowProfileMenu(false)} navigate={navigate} menuRef={menuRef} />
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

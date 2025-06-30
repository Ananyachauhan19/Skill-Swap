import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProfileDropdown from './ProfileDropdown';
import MobileMenu from './MobileMenu';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = localStorage.getItem('isRegistered') === 'true' || localStorage.getItem('isLoggedIn') === 'true';
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  const isActive = (path) => location.pathname === path;

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <nav className="flex items-center bg-white text-gray-800 px-4 sm:px-8 py-3 shadow-sm border-b border-gray-200 relative">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => navigate('/')}
      >
        <img
          src="/assets/skillswap-logo.jpg"
          alt="SkillSwap Logo"
          className="h-8 w-8 object-contain"
        />
        <span className="text-xl font-bold tracking-wide ml-2">SkillSwapHub</span>
      </div>
      {/* Hamburger for mobile */}
      <button
        className="sm:hidden ml-auto p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {/* Main nav links */}
      <div className={`flex-1 sm:flex justify-center gap-4 sm:gap-8 ml-0 sm:ml-8 ${menuOpen ? 'flex flex-col absolute top-full left-0 w-full bg-white z-20 shadow-md border-t border-gray-200 p-4' : 'hidden sm:flex'} transition-all`}>
        {/* Desktop nav links */}
        <div className="hidden sm:flex gap-4 sm:gap-8 w-full justify-center">
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
        {/* Mobile menu links */}
        {menuOpen && (
          <div className="sm:hidden">
            <MobileMenu
              isLoggedIn={isLoggedIn}
              navigate={navigate}
              setShowProfileMenu={setShowProfileMenu}
              showProfileMenu={showProfileMenu}
              menuRef={menuRef}
              setMenuOpen={setMenuOpen}
              ProfileDropdown={ProfileDropdown}
            />
          </div>
        )}
      </div>
      {/* Desktop login/profile */}
      <div className="hidden sm:flex items-center gap-4">
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

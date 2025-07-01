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
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef();

  const isActive = (path) => location.pathname === path;

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-gradient-to-br from-blue-50 to-blue-100 text-blue-800 px-4 sm:px-8 py-4 shadow-lg border-b border-blue-200 z-50">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo Section */}
        <div
          className="flex items-center gap-3 cursor-pointer transition-transform duration-300 hover:scale-105"
          onClick={() => navigate('/')}
        >
          <img
            src="/assets/skillswap-logo.jpg"
            alt="SkillSwapHub Logo"
            className="h-10 w-10 object-contain rounded-full border-2 border-blue-200 shadow-sm"
          />
          <span className="text-2xl font-extrabold text-blue-900 tracking-tight">SkillSwapHub</span>
        </div>

        {/* Right Side Nav Links (after logo) */}
        <div className="hidden lg:flex items-center gap-8">
          <div className="flex gap-6">
            {[
              { path: '/home', label: 'Home' },
              { path: '/one-on-one', label: '1-on-1' },
              { path: '/discuss', label: 'Discuss' },
              { path: '/interview', label: 'Interview' },
            ].map(({ path, label }) => (
              <button
                key={path}
                className={`text-base font-semibold px-4 py-2 rounded-full transition-all duration-300 ${
                  isActive(path)
                    ? 'bg-blue-200 text-blue-900 shadow-md border-b-2 border-blue-700'
                    : 'text-blue-800 hover:bg-blue-100 hover:text-blue-900 hover:shadow-sm hover:scale-105'
                }`}
                onClick={() => navigate(path)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <form onSubmit={handleSearch}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skills..."
                className="pl-10 pr-4 py-2 text-sm rounded-full bg-white border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 placeholder-blue-600 w-48 transition-all duration-300 hover:shadow-md"
              />
              <button
                type="submit"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* Desktop Login/Profile */}
        <div className="hidden lg:flex items-center gap-6">
          {!isLoggedIn ? (
            <button
              className="bg-gradient-to-r from-blue-700 to-blue-500 text-white px-6 py-2 rounded-full font-semibold transition-all duration-300 hover:from-blue-800 hover:to-blue-600 hover:scale-105 hover:shadow-lg"
              onClick={() => navigate('/login')}
            >
              Login
            </button>
          ) : (
            <div className="relative">
              <button
                className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border-2 border-blue-200 transition-all duration-300 hover:bg-blue-200 hover:text-blue-800 hover:shadow-lg hover:scale-110"
                onClick={() => setShowProfileMenu((v) => !v)}
                title="Profile"
                aria-label="Profile"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
              </button>
              <ProfileDropdown
                show={showProfileMenu}
                onClose={() => setShowProfileMenu(false)}
                navigate={navigate}
                menuRef={menuRef}
              />
            </div>
          )}
        </div>

        {/* Hamburger for Mobile */}
        <button
          className="lg:hidden p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition-transform duration-300 hover:scale-110"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg className="w-7 h-7 text-blue-600 hover:text-blue-800" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-gradient-to-br from-blue-50 to-blue-100 shadow-xl border-t border-blue-200 p-6 mt-1 z-40">
            <MobileMenu
              isLoggedIn={isLoggedIn}
              navigate={navigate}
              setShowProfileMenu={setShowProfileMenu}
              showProfileMenu={showProfileMenu}
              menuRef={menuRef}
              setMenuOpen={setMenuOpen}
              ProfileDropdown={ProfileDropdown}
            />
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mt-6">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search skills..."
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-full bg-white border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 placeholder-blue-600 transition-all duration-300 hover:shadow-md"
                />
                <button
                  type="submit"
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
import React from 'react';
import Notifications from './Navbar/Notifications';

const navLinks = [
  { path: '/home', label: 'Home' },
  { path: '/one-on-one', label: '1-on-1' },
  { path: '/session', label: 'Session' },
  { path: '/session-requests', label: 'Requests' },
  { path: '/discuss', label: 'Discuss' },
  { path: '/interview', label: 'Interview' },
];

const MobileMenu = ({
  isOpen,
  isLoggedIn,
  navigate,
  setShowProfileMenu,
  showProfileMenu,
  menuRef,
  setMenuOpen,
  ProfileDropdown,
  goldenCoins,
  silverCoins,
  notifications,
  setNotifications,
  handleLoginClick,
  searchQuery,
  setSearchQuery,
  handleSearch,
  isActive,
}) => (
  <div
    className={`sm:hidden fixed top-[2.5rem] right-0 z-50 transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}
  >
    <div
      className="relative w-[80vw] max-w-[320px] h-screen bg-gradient-to-b from-[#f0f4ff] to-[#e2eafc] shadow-xl rounded-l-2xl flex flex-col p-0 border-l-2 border-blue-300 overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
      ref={menuRef}
    >
      {/* Header with Logo and Close Button */}
      <div className="flex items-center justify-between px-3 pt-5 pb-2 border-b border-blue-100">
        <div className="flex items-center gap-2">
          <img
            src="/assets/skillswap-logo.webp"
            alt="SkillSwapHub Logo"
            className="h-7 w-7 object-cover rounded-full shadow border-2 border-blue-900"
          />
          <span className="text-base font-bold text-blue-900 tracking-tight font-lora">
            SkillSwapHub
          </span>
        </div>
        <button
          className="p-1 rounded-full text-blue-800 bg-white shadow hover:bg-blue-100 transition"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-2 px-4 py-2 border-b border-blue-100 bg-white">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SkillMate..."
              className="pl-8 pr-3 py-1.5 text-sm rounded-full border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-blue-800 placeholder-blue-700 w-full font-nunito"
            />
            <button
              type="submit"
              className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-blue-800 hover:text-blue-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Navigation Links */}
      <nav className="flex flex-col px-4 pt-2 pb-3 space-y-1">
        {navLinks.map(({ path, label }) => (
          <button
            key={path}
            className={`w-full text-left text-sm font-medium px-3 py-1.5 rounded-lg transition duration-200 ${
              isActive(path)
                ? 'bg-blue-100 text-blue-800 font-semibold border-l-4 border-blue-800 shadow-sm'
                : 'text-blue-800 hover:bg-blue-50 hover:border-l-4 hover:border-blue-800'
            }`}
            onClick={() => {
              navigate(path);
              setMenuOpen(false);
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Coins Section */}
      {isLoggedIn && (
        <div className="px-4 py-2 border-t border-blue-100">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#f59e0b', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#d97706', stopOpacity: 1 }} />
                  </linearGradient>
                  <filter id="coin-shadow">
                    <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#1e3a8a" floodOpacity="0.3" />
                  </filter>
                </defs>
                <circle cx="12" cy="12" r="11" fill="url(#gold-gradient)" filter="url(#coin-shadow)" />
                <circle cx="12" cy="12" r="9" fill="none" stroke="#1e3a8a" strokeWidth="1" />
                <path
                  d="M12 7c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.24-5-5 2.24-5 5-5z"
                  fill="none"
                  stroke="#1e3a8a"
                  strokeWidth="1"
                />
                <text x="12" y="15" fontSize="8" fill="#1e3a8a" textAnchor="middle" fontWeight="bold">S</text>
              </svg>
              <span className="text-xs font-semibold text-blue-800">Golden Coins: {goldenCoins}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="silver-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#d1d5db', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#9ca3af', stopOpacity: 1 }} />
                  </linearGradient>
                  <filter id="coin-shadow">
                    <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#1e3a8a" floodOpacity="0.3" />
                  </filter>
                </defs>
                <circle cx="12" cy="12" r="11" fill="url(#silver-gradient)" filter="url(#coin-shadow)" />
                <circle cx="12" cy="12" r="9" fill="none" stroke="#1e3a8a" strokeWidth="1" />
                <path
                  d="M12 7c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.24-5-5 2.24-5 5-5z"
                  fill="none"
                  stroke="#1e3a8a"
                  strokeWidth="1"
                />
                <text x="12" y="15" fontSize="8" fill="#1e3a8a" textAnchor="middle" fontWeight="bold">S</text>
              </svg>
              <span className="text-xs font-semibold text-blue-800">Silver Coins: {silverCoins}</span>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="px-2 py-2 border-t border-blue-100 max-h-40 overflow-y-auto">
        <Notifications notifications={notifications} setNotifications={setNotifications} iconSize="w-6 h-6" />
      </div>

      {/* Profile Dropdown or Login Button */}
      <div className="px-4 py-3 mt-auto border-t border-blue-100">
        {isLoggedIn ? (
          <>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-full flex items-center justify-center gap-2 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full font-medium text-sm shadow-sm hover:bg-blue-200 hover:text-blue-900 transition hover:scale-[1.02]"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
              </svg>
              Profile
            </button>
            {showProfileMenu && (
              <div className="mt-2">
                <ProfileDropdown
                  show={showProfileMenu}
                  onClose={() => {
                    setShowProfileMenu(false);
                    setMenuOpen(false);
                  }}
                  navigate={navigate}
                  menuRef={menuRef}
                />
              </div>
            )}
          </>
        ) : (
          <button
            onClick={() => {
              handleLoginClick();
              setMenuOpen(false);
            }}
            className="w-full bg-blue-800 text-white px-5 py-2 rounded-full font-medium text-sm shadow-sm hover:bg-blue-900 transition hover:scale-[1.02]"
          >
            Login
          </button>
        )}
      </div>
    </div>
  </div>
);

export default MobileMenu;
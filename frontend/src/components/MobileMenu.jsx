import React from 'react';
import Notifications from './Navbar/Notifications';

const navLinks = [
  { path: '/home', label: 'Home' },
  { path: '/one-on-one', label: '1-on-1' },
  { path: '/session', label: 'Session' },
  { path: '/session-requests', label: 'Requests' },
  // { path: '/discuss', label: 'Discuss' },
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
    className={`fixed top-0 right-0 h-full w-full sm:w-[85vw] sm:max-w-[360px] z-50 transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}
  >
    <div
      className="w-full h-full bg-[#F5F9FF] shadow-xl sm:rounded-l-2xl flex flex-col overflow-y-auto border-l-2 border-gray-300"
      onClick={(e) => e.stopPropagation()}
      ref={menuRef}
    >
      {/* Header with Logo and Close Button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <img
            src="/assets/skillswap-logo.webp"
            alt="SkillSwapHub Logo"
            className="h-8 w-8 object-cover rounded-full shadow border-2 border-blue-900 flex-shrink-0"
          />
          <span className="text-base font-bold text-blue-900 tracking-tight font-lora whitespace-nowrap">
            SkillSwapHub
          </span>
        </div>
        <button
          className="w-10 h-10 rounded-full text-blue-800 bg-white shadow hover:bg-blue-50 transition flex items-center justify-center touch-manipulation flex-shrink-0"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search - Only show when logged in */}
      {isLoggedIn && (
        <div className="px-4 py-3 border-b border-gray-200 bg-white/80 flex-shrink-0">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SkillMate..."
                className="w-full pl-10 pr-3 py-2 text-sm rounded-full border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-blue-800 placeholder-blue-400 font-nunito"
              />
              <button
                type="submit"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-800 hover:text-blue-900"
                aria-label="Search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Navigation Links */}
      <nav className="flex flex-col px-4 py-3 space-y-2 flex-shrink-0">
        {navLinks.map(({ path, label }) => (
          <button
            key={path}
            className={`w-full text-left text-sm font-medium px-4 py-2.5 rounded-lg transition-all duration-200 touch-manipulation ${
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
        <div className="px-4 py-3 border-t border-blue-100 flex-shrink-0">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 p-2 rounded-md hover:bg-blue-50 transition">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 shadow-md flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-blue-900">G</span>
              </div>
              <span className="text-sm font-semibold text-blue-800">Golden: {goldenCoins}</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-md hover:bg-blue-50 transition">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 shadow-md flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-blue-900">S</span>
              </div>
              <span className="text-sm font-semibold text-blue-800">Silver: {silverCoins}</span>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="px-4 py-3 border-t border-blue-100 max-h-64 overflow-y-auto flex-shrink-0">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Notifications</h3>
        <Notifications notifications={notifications} setNotifications={setNotifications} iconSize="w-6 h-6" />
      </div>

      {/* Profile Dropdown or Login Button */}
      <div className="px-4 py-4 mt-auto border-t border-blue-100 flex-shrink-0">
        {isLoggedIn ? (
          <>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-full flex items-center justify-center gap-2 bg-blue-100 text-blue-800 px-4 py-2.5 rounded-full font-medium text-sm shadow-sm hover:bg-blue-200 hover:text-blue-900 transition hover:scale-[1.02] touch-manipulation"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
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
            className="w-full bg-blue-800 text-white px-5 py-2.5 rounded-full font-medium text-sm shadow-sm hover:bg-blue-900 transition hover:scale-[1.02] touch-manipulation"
          >
            Login
          </button>
        )}
      </div>
    </div>
  </div>
);

export default MobileMenu;
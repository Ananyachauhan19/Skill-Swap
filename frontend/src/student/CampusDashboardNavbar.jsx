import React, { useState } from 'react';
import Notifications from '../components/Navbar/Notifications';

const CampusDashboardNavbar = ({
  navigate,
  activeTab,
  setActiveTab,
  isActive,
  isLoggedIn,
  handleLoginClick,
  goldenCoins,
  silverCoins,
  showCoinsDropdown,
  setShowCoinsDropdown,
  fetchCoins,
  coinsRef,
  notifications,
  setNotifications,
  menuOpen,
  setMenuOpen,
}) => {
  const [backToSkillSwapOn, setBackToSkillSwapOn] = useState(false);

  return (
    <>
      {/* Custom Navbar - Same style as main website */}
      <nav className="fixed top-0 left-0 w-full h-[64px] sm:h-[72px] bg-[#F5F9FF] text-blue-900 px-3 sm:px-4 shadow-md border-b border-gray-200/50 z-50 backdrop-blur-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto h-full">
          {/* Logo */}
          <div
            className="flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-transform duration-300 hover:scale-105 flex-shrink-0"
            onClick={() => navigate('/')}
          >
            <img
              src="https://res.cloudinary.com/dbltazdsa/image/upload/v1766589377/webimages/skillswap-logo.png"
              alt="SkillSwapHub Logo"
              className="h-9 w-9 md:h-10 md:w-10 lg:h-12 lg:w-12 object-contain rounded-full shadow-md border-2 border-blue-900"
            />
            <span className="text-sm md:text-base lg:text-lg font-extrabold text-blue-900 font-lora tracking-wide drop-shadow-md">
              SkillSwapHub
            </span>
          </div>

          {/* Desktop Navigation - Different tabs (Hidden on mobile/tablet) */}
          <div className="hidden lg:flex items-center gap-1.5 lg:gap-3 xl:gap-4">
            {[
              { id: 'dashboard', label: 'Dashboard', path: '/campus-dashboard' },
              { id: 'oneonone', label: 'One on One', path: '/campus/one-on-one' },
              { id: 'assessment', label: 'Assessment', path: '/campus/assessment' },
              { id: 'requests', label: 'Requests', path: '/campus/requests' },
            ].map(({ id, label, path }) => (
              <button
                key={id}
                className={`text-[11px] lg:text-xs xl:text-sm font-bold px-2 md:px-2.5 lg:px-3 py-1.5 rounded-full text-blue-900 bg-blue-100/50 shadow-sm transition-all duration-300 whitespace-nowrap ${
                  isActive(id)
                    ? 'bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-md'
                    : 'hover:bg-gradient-to-r hover:from-blue-900 hover:to-blue-800 hover:text-white hover:shadow-md hover:scale-105'
                } touch-manipulation`}
                onClick={() => {
                  setActiveTab(id);
                  navigate(path);
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Right Side: Icons and Search */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 overflow-visible">
            {isLoggedIn ? (
              <>
                {/* SkillCoin - Visible on all devices */}
                <div className="relative flex-shrink-0">
                  <button
                    className="w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] min-h-[32px] sm:min-w-[36px] sm:min-h-[36px] lg:w-10 lg:h-10 rounded-full bg-blue-800 text-white flex items-center justify-center shadow-md border border-blue-700 hover:scale-105 transition duration-300 touch-manipulation"
                    onClick={() => setShowCoinsDropdown((prev) => !prev)}
                    title="SkillCoin"
                    ref={coinsRef}
                    aria-label="View SkillCoin balance"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" viewBox="0 0 24 24" fill="none">
                      <defs>
                        <radialGradient id="3d-coin-gold" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#fff9c4" />
                          <stop offset="30%" stopColor="#fdd835" />
                          <stop offset="60%" stopColor="#fbc02d" />
                          <stop offset="100%" stopColor="#f57f17" />
                        </radialGradient>
                        <linearGradient id="coin-edge" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ffecb3" />
                          <stop offset="100%" stopColor="#ffa000" />
                        </linearGradient>
                      </defs>
                      <circle cx="12" cy="12" r="10" fill="url(#3d-coin-gold)" stroke="url(#coin-edge)" strokeWidth="2" />
                      <circle cx="12" cy="12" r="8" stroke="#fff8dc" strokeWidth="1" opacity="0.7" />
                      <text
                        x="12"
                        y="14"
                        fontSize="10"
                        fill="#1e3a8a"
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        S
                      </text>
                    </svg>
                  </button>
                  {showCoinsDropdown && (
                    <div className="absolute right-0 mt-2 w-44 bg-white border border-blue-200 rounded-lg shadow-xl animate-fade-in-down backdrop-blur-sm z-50">
                      <div className="p-3 space-y-2 text-xs font-medium text-gray-700">
                        <div className="flex items-center gap-2 p-2 rounded-md hover:bg-blue-50 transition">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 shadow-inner flex items-center justify-center">
                            <span className="text-[10px] font-bold text-blue-900">G</span>
                          </div>
                          <span className="text-gray-800">Golden: {goldenCoins}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-md hover:bg-blue-50 transition">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 shadow-inner flex items-center justify-center">
                            <span className="text-[10px] font-bold text-blue-900">S</span>
                          </div>
                          <span className="text-gray-800">Silver: {silverCoins}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchCoins();
                          }}
                          className="w-full mt-1 p-2 text-xs text-blue-600 hover:bg-blue-50 rounded-md transition flex items-center justify-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          Refresh
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notifications */}
                <div className="flex flex-shrink-0">
                  <Notifications
                    notifications={notifications}
                    setNotifications={setNotifications}
                    iconSize="w-5 h-5"
                    className="relative flex items-center justify-center"
                    dropdownClassName="absolute right-0 mt-2 w-64 bg-white border border-blue-200 rounded-lg shadow-xl animate-fade-in-down backdrop-blur-sm z-50"
                  />
                </div>

                {/* Back to SkillSwap (toggle) - Hidden on mobile/tablet */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={backToSkillSwapOn}
                  className="hidden lg:inline-flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-white/80 border border-blue-200 shadow-sm hover:shadow-md transition"
                  onClick={() => {
                    setBackToSkillSwapOn(true);
                    localStorage.removeItem('campusValidated');
                    localStorage.removeItem('campusId');
                    navigate('/');
                  }}
                >
                  <span className="text-[11px] sm:text-xs font-bold text-blue-900 whitespace-nowrap">
                    Back to SkillSwaphub
                  </span>
                  <span
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                      backToSkillSwapOn ? 'bg-blue-800' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                        backToSkillSwapOn ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </span>
                </button>
              </>
            ) : (
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-blue-800 rounded-full shadow-md hover:bg-blue-700 hover:scale-105 transition-all duration-300 font-nunito touch-manipulation"
                onClick={handleLoginClick}
                aria-label="Login to SkillSwapHub"
              >
                Login
              </button>
            )}

            {/* Hamburger (visible on mobile and tablet) */}
            <button
              className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] min-h-[32px] sm:min-w-[36px] sm:min-h-[36px] rounded-full bg-blue-100 text-blue-900 flex items-center justify-center border border-blue-300 shadow-md hover:bg-blue-200 hover:scale-105 transition-all duration-300 touch-manipulation flex-shrink-0 ml-1 sm:ml-2"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Toggle mobile menu"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile/Tablet Menu (Campus-only) */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 lg:hidden"
          onClick={() => setMenuOpen(false)}
          role="button"
          tabIndex={-1}
        >
          <div
            className="absolute top-0 right-0 h-full w-[85vw] max-w-[360px] bg-[#F5F9FF] shadow-xl border-l-2 border-gray-300 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-blue-200 bg-gradient-to-r from-blue-50 to-white sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <img
                  src="https://res.cloudinary.com/dbltazdsa/image/upload/v1766589377/webimages/skillswap-logo.png"
                  alt="SkillSwapHub Logo"
                  className="h-8 w-8 object-cover rounded-full shadow border-2 border-blue-900 flex-shrink-0"
                />
                <span className="text-base font-bold text-blue-900 tracking-tight font-lora whitespace-nowrap">
                  Campus Dashboard
                </span>
              </div>
              <button
                className="w-10 h-10 rounded-full text-blue-800 bg-white shadow hover:bg-blue-50 transition flex items-center justify-center flex-shrink-0"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-4 py-4 space-y-2">
              {isLoggedIn && (
                <>
                  {/* SkillCoin Details in Menu */}
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-200 mb-3">
                    <div className="text-xs font-semibold text-gray-600 mb-3">Your SkillCoin Balance</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 rounded-lg hover:bg-blue-50 transition">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 shadow-inner flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-900">G</span>
                          </div>
                          <span className="text-sm font-medium text-gray-800">Golden Coins</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{goldenCoins}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg hover:bg-blue-50 transition">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 shadow-inner flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-900">S</span>
                          </div>
                          <span className="text-sm font-medium text-gray-800">Silver Coins</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{silverCoins}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchCoins();
                      }}
                      className="w-full mt-3 p-2 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center justify-center gap-1 font-medium"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Refresh Balance
                    </button>
                  </div>
                </>
              )}

              <button
                className="w-full px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-900 to-blue-800 rounded-xl shadow hover:from-blue-800 hover:to-blue-700 transition"
                onClick={() => {
                  setMenuOpen(false);
                  localStorage.removeItem('campusValidated');
                  localStorage.removeItem('campusId');
                  navigate('/');
                }}
              >
                Back to SkillSwap
              </button>

              {[
                { id: 'dashboard', label: 'Dashboard', path: '/campus-dashboard' },
                { id: 'oneonone', label: 'One on One', path: '/campus/one-on-one' },
                { id: 'assessment', label: 'Assessment', path: '/campus/assessment' },
                { id: 'requests', label: 'Requests', path: '/campus/requests' },
              ].map(({ id, label, path }) => (
                <button
                  key={id}
                  className={`w-full text-left text-sm font-bold px-4 py-3 rounded-xl transition-all ${
                    activeTab === id
                      ? 'bg-blue-100 text-blue-900 border-l-4 border-blue-800 shadow-sm'
                      : 'bg-white/70 text-blue-900 hover:bg-blue-50 shadow-sm'
                  }`}
                  onClick={() => {
                    setActiveTab(id);
                    if (id === 'dashboard' || id === 'assessment') {
                      navigate('/campus-dashboard');
                    } else {
                      navigate(path);
                    }
                    setMenuOpen(false);
                  }}
                >
                  {label}
                </button>
              ))}

              {!isLoggedIn && (
                <button
                  className="w-full px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-900 to-blue-800 rounded-xl shadow hover:from-blue-800 hover:to-blue-700 transition mt-3"
                  onClick={() => {
                    setMenuOpen(false);
                    handleLoginClick();
                  }}
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CampusDashboardNavbar;

import React from 'react';
import Notifications from './Navbar/Notifications';

const navLinks = [
  { path: '/home', label: 'Home' },
  { path: '/one-on-one', label: '1-on-1' },
  { path: '/session-requests', label: 'Requests' },
  // { path: '/discuss', label: 'Discuss' },
  { path: '/interview', label: 'Interview' },
  { path: '/quizement', label: 'Quizement' },
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
  silverCoins,
  bronzeCoins,
  notifications,
  setNotifications,
  handleLoginClick,
  searchQuery,
  setSearchQuery,
  handleSearch,
  isActive,
  user,
  isAvailable,
  handleToggleAvailability,
  isToggling,
  isInterviewAvailable,
  handleToggleInterviewAvailability,
  isTogglingInterview,
  interviewerStatus,
  searchRef,
  suggestions,
  showSuggestions,
  setShowSuggestions,
  searchLoading,
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
      <div className="flex items-center justify-between px-4 py-4 border-b-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white flex-shrink-0 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <img
            src="https://res.cloudinary.com/dbltazdsa/image/upload/v1766589377/webimages/skillswap-logo.png"
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

      {/* SkillCoin Balance */}
      {isLoggedIn && (
        <div className="px-4 py-3 border-b border-blue-100 flex-shrink-0 bg-gradient-to-r from-blue-50/50 to-transparent">
          <h3 className="text-xs font-bold text-blue-900 mb-3 uppercase tracking-wide">SkillCoin Balance</h3>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-300 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 via-gray-400 to-gray-600 shadow-md flex items-center justify-center flex-shrink-0 border-2 border-gray-300">
                  <span className="text-xs font-bold text-gray-800">S</span>
                </div>
                <span className="text-sm font-bold text-gray-800">Silver Coins</span>
              </div>
              <span className="text-lg font-bold text-gray-700">{silverCoins}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 shadow-md flex items-center justify-center flex-shrink-0 border-2 border-amber-600">
                  <span className="text-xs font-bold text-white">B</span>
                </div>
                <span className="text-sm font-bold text-gray-800">Bronze Coins</span>
              </div>
              <span className="text-lg font-bold text-amber-800">{bronzeCoins}</span>
            </div>
          </div>
        </div>
      )}

      {/* Search - Only show when logged in */}
      {isLoggedIn && (
        <div className="px-4 py-3 border-b border-gray-200 bg-white/80 flex-shrink-0">
          <form onSubmit={handleSearch}>
            <div className="relative" ref={searchRef}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SkillMate..."
                className="w-full pl-10 pr-3 py-2.5 text-sm rounded-full border-2 border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-blue-800 placeholder-blue-400 font-nunito shadow-sm"
              />
              <button
                type="submit"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-800 hover:text-blue-900 transition"
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
              
              {/* Search Suggestions Dropdown */}
              {(showSuggestions || searchLoading) && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-white border-2 border-blue-300 rounded-xl shadow-2xl overflow-hidden z-[9999] max-h-80 overflow-y-auto">
                  {searchLoading && (
                    <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                      Searching...
                    </div>
                  )}
                  {!searchLoading && suggestions.length === 0 && searchQuery.trim().length >= 2 && (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      No users found
                    </div>
                  )}
                  {!searchLoading && suggestions.length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 sticky top-0">
                        <p className="text-xs font-semibold text-blue-900">
                          Found {suggestions.length} user{suggestions.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      {suggestions.map((u) => (
                        <button
                          key={u._id}
                          type="button"
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-50 text-left transition-colors border-b border-gray-100 last:border-0 touch-manipulation"
                          onClick={() => {
                            setShowSuggestions(false);
                            setSearchQuery('');
                            setMenuOpen(false);
                            navigate(`/profile/${encodeURIComponent(u.username)}`);
                          }}
                        >
                          {u.profilePic ? (
                            <img src={u.profilePic} alt={u.username} className="w-12 h-12 rounded-full object-cover border-2 border-blue-300 shadow-sm flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-base font-bold shadow-sm flex-shrink-0">
                              {(u.firstName?.[0] || u.username?.[0] || 'U').toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username}
                            </div>
                            <div className="text-xs text-gray-500 truncate">@{u.username}</div>
                            {u.role && (
                              <div className="text-xs text-blue-600 mt-0.5">{u.role}</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
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
    </div>
  </div>
);

export default MobileMenu;
import React from 'react';
import Notifications from "./Navbar/Notifications";

const navLinks = [
  { path: "/home", label: "Home" },
  { path: "/one-on-one", label: "1-on-1" },
  { path: "/session", label: "Session" },
  { path: "/discuss", label: "Discuss" },
  { path: "/interview", label: "Interview" },
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
  notifications,
  setNotifications,
  handleLoginClick,
  searchQuery,
  setSearchQuery,
  handleSearch,
  isActive,
}) => (
  <div
    className={`sm:hidden fixed top-0 right-0 z-50 transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}
  >
    <div
      className="relative w-[80vw] max-w-[320px] h-screen bg-gradient-to-b from-[#f0f4ff] to-[#e2eafc] shadow-xl rounded-l-2xl flex flex-col p-0 border-l-2 border-blue-300 overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
      ref={menuRef}
    >
      {/* Header with Logo and Close Button */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-blue-100">
        <div className="flex items-center gap-2">
          <img
            src="/assets/skillswap-logo.webp"
            alt="SkillSwapHub Logo"
            className="h-8 w-8 object-cover rounded-full shadow"
          />
          <span className="text-lg font-bold text-blue-900 tracking-tight font-lora">
            SkillSwapHub
          </span>
        </div>
        <button
          className="p-1.5 rounded-full text-blue-800 bg-white shadow hover:bg-blue-100 transition"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-3 px-4 py-3 border-b border-blue-100 bg-white">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search skills..."
              className="pl-8 pr-3 py-1.5 text-sm rounded-full border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-blue-900 placeholder-blue-700 w-full font-nunito"
            />
            <button
              type="submit"
              className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <nav className="flex flex-col px-4 pt-3 pb-4 space-y-1.5">
        {navLinks.map(({ path, label }) => (
          <button
            key={path}
            className={`w-full text-left text-sm font-medium px-3 py-2 rounded-lg transition duration-200 ${
              isActive(path)
                ? "bg-blue-100 text-blue-900 font-semibold border-l-4 border-blue-700 shadow-sm"
                : "text-blue-900 hover:bg-blue-50 hover:border-l-4 hover:border-blue-700"
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

      {/* Notifications */}
      <div className="px-4 py-3 border-t border-blue-100 max-h-48 overflow-y-auto">
        <Notifications notifications={notifications} setNotifications={setNotifications} />
      </div>

      {/* Profile Dropdown or Login Button */}
      <div className="px-4 py-4 mt-auto">
        {isLoggedIn ? (
          <>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-full bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full font-medium text-sm shadow-sm hover:bg-blue-200 hover:text-blue-800 transition hover:scale-[1.02]"
            >
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
            className="w-full bg-blue-700 text-white px-4 py-1.5 rounded-full font-medium text-sm shadow-sm hover:bg-blue-800 transition hover:scale-[1.02]"
          >
            Login
          </button>
        )}
      </div>
    </div>
  </div>
);

export default MobileMenu;
import React from 'react';
import Credits from "./Navbar/Credits";
import Notifications from "./Navbar/Notifications";

const navLinks = [
  { path: "/home", label: "Home" },
  { path: "/one-on-one", label: "1-on-1" },
  { path: "/session", label: "Session" },
  { path: "/discuss", label: "Discuss" },
  { path: "/interview", label: "Interview" }
];

const MobileMenu = ({
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
  handleSearch
}) => (
  <div className="sm:hidden fixed inset-0 z-50 bg-black bg-opacity-40 flex justify-end">
    <div
      className="relative w-[85vw] max-w-sm h-full bg-gradient-to-b from-[#f0f4ff] to-[#e2eafc] shadow-xl rounded-l-3xl p-0 flex flex-col animate-slideIn border-l-2 border-blue-300 overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header with Logo and Close Button */}
      <div className="flex items-center justify-between px-5 pt-6 pb-3 border-b border-blue-100">
        <div className="flex items-center gap-3">
          <img src="/assets/skillswap-logo.webp" alt="SkillSwapHub Logo" className="h-9 w-9 object-cover rounded-full shadow" />
          <span className="text-xl font-bold text-blue-900 tracking-tight">SkillSwapHub</span>
        </div>
        <button
          className="p-2 rounded-full text-blue-800 bg-white shadow hover:bg-blue-100 transition"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search + Credits */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-blue-100 bg-white">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search skills..."
              className="pl-9 pr-3 py-2 text-sm rounded-full border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-blue-900 placeholder-blue-700 w-full"
            />
            <button
              type="submit"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>
        <Credits
          goldenCoins={goldenCoins}
          silverCoins={silverCoins}
          isLoggedIn={isLoggedIn}
        />
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col px-5 pt-4 space-y-2">
        {navLinks.map(({ path, label }) => {
          const isActive = window.location.pathname === path;
          return (
            <button
              key={path}
              className={`w-full text-left text-base font-medium px-4 py-2 rounded-lg transition duration-200 ${
                isActive
                  ? "bg-blue-100 text-blue-900 font-semibold border-l-4 border-blue-700 shadow"
                  : "text-blue-900 hover:bg-blue-50 hover:border-l-4 hover:border-blue-700"
              }`}
              onClick={() => {
                navigate(path);
                setMenuOpen(false);
              }}
            >
              {label}
            </button>
          );
        })}
      </nav>

      {/* Notifications */}
      <div className="px-5 py-4">
        <Notifications notifications={notifications} setNotifications={setNotifications} />
      </div>

      {/* Login or Profile Button */}
      <div className="px-5 py-6 mt-auto">
        {!isLoggedIn ? (
          <button
            onClick={handleLoginClick}
            className="w-full bg-blue-700 text-white px-6 py-2 rounded-full font-semibold shadow hover:bg-blue-800 transition hover:scale-[1.02]"
          >
            Login
          </button>
        ) : (
          <button
            onClick={() => {
              setShowProfileMenu(true);
              setMenuOpen(false);
            }}
            className="w-full bg-blue-100 text-blue-700 px-6 py-2 rounded-full font-semibold shadow hover:bg-blue-200 hover:text-blue-800 transition hover:scale-[1.02]"
          >
            Profile
          </button>
        )}
      </div>
    </div>
  </div>
);

export default MobileMenu;

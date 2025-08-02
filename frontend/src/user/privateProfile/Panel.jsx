


import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiMenu
} from "react-icons/fi";
import {
  FaFileAlt,
  FaRegFileAlt,
  FaChartBar,
  FaArchive,
  FaRegSave,
  FaHistory,
  FaUserCircle,
  FaTimes
} from "react-icons/fa";

const Panel = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrollOffset(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const activeTab = "border-b-2 border-blue-600 text-blue-800 font-semibold";
  const normalTab = "text-gray-700 hover:text-blue-700 transition duration-200";

  const navItems = [
    { path: "panel", icon: FaFileAlt, label: "Panel", title: "Go to Profile Panel", route: "/profile/panel" },
    { path: "drafts", icon: FaRegFileAlt, label: "Drafts", title: "View Drafts", route: "/profile/drafts" },
    { path: "analytics", icon: FaChartBar, label: "Analytics", title: "View Analytics", route: "/profile/analytics" },
    { path: "archived", icon: FaArchive, label: "Archive", title: "View Archived Items", route: "/profile/archived" },
    { path: "saved", icon: FaRegSave, label: "Saved", title: "View Saved Items", route: "/profile/saved" },
    { path: "history", icon: FaHistory, label: "History", title: "View History", route: "/profile/history" },
    { path: "account", icon: FaUserCircle, label: "Account", title: "Account Settings", route: "/accountSettings" },
  ];

  return (
    <div className="flex flex-col w-full min-h-screen p-4 sm:p-6 bg-[#f7fbfd]">
      {/* Sticky Top Navigation */}
        <div className="flex items-center justify-between gap-4 border-b mb-6 px-4 py-3 rounded-lg bg-[#f0f6fa] sticky top-[8.5%] z-30 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
          <NavLink to="your-home" className={({ isActive }) => `pb-2 text-sm sm:text-base ${isActive ? activeTab : normalTab}`}>
            Home
          </NavLink>
          <NavLink to="live" className={({ isActive }) => `pb-2 text-sm sm:text-base ${isActive ? activeTab : normalTab}`}>
            Live
          </NavLink>
          <NavLink to="videos" className={({ isActive }) => `pb-2 text-sm sm:text-base ${isActive ? activeTab : normalTab}`}>
            Videos
          </NavLink>
        </div>

        {/* Right Section: Search Bar + Icons */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div
            className={`flex items-center transition-all duration-300 ease-in-out ${
              showSearch ? "w-24 sm:w-48 opacity-100" : "w-0 opacity-0"
            } overflow-hidden`}
          >
            <div className="flex items-center px-2 py-1 bg-white rounded border-b-2 border-blue-800">
              <input
                type="text"
                placeholder="Search"
                className="w-full bg-transparent outline-none text-xs sm:text-sm text-black text-opacity-70 placeholder:text-black placeholder:text-opacity-50"
              />
            </div>
          </div>

          <FiSearch
            onClick={() => setShowSearch(!showSearch)}
            className="text-lg sm:text-xl text-blue-900 cursor-pointer hover:text-blue-700 transition duration-300 flex-shrink-0"
            aria-label="Toggle search"
          />
          <FiMenu
            onClick={() => setShowMobileMenu(true)}
            className="text-lg sm:text-xl text-blue-900 cursor-pointer hover:text-blue-700 transition duration-300 sm:hidden flex-shrink-0"
            aria-label="Open menu"
          />
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {showMobileMenu && (
        <div
          className="fixed inset-x-0 mx-2 top-[calc(4rem)] z-50 bg-white shadow-lg rounded-xl p-4 transition-all duration-300 sm:hidden max-w-[calc(100%-1rem)]"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-blue-900">Menu</h3>
            <button
              onClick={() => setShowMobileMenu(false)}
              className="text-blue-900"
              aria-label="Close menu"
            >
              <FaTimes className="text-lg" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {navItems.map(({ path, icon: Icon, label, title, route }) => (
              <button
                key={path}
                onClick={() => {
                  navigate(route);
                  setShowMobileMenu(false);
                }}
                className="flex items-center gap-3 p-3 rounded-lg text-blue-900 hover:bg-blue-100 hover:text-blue-700 transition-all duration-300"
                title={title}
                aria-label={title}
              >
                <Icon className="text-lg" />
                <span className="text-sm">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Panel Content */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default Panel;
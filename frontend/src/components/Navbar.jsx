import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useModal } from '../context/ModalContext';
import ProfileDropdown from "./ProfileDropdown";
import Notifications from "./Navbar/Notifications";
import Credits from "./Navbar/Credits";
import MobileMenu from "./MobileMenu";

const Navbar = () => {
  const { openLogin } = useModal();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isRegistered") === "true" ||
      localStorage.getItem("isLoggedIn") === "true" ||
      (localStorage.getItem("token") && localStorage.getItem("user"))
  );
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [goldenCoins, setGoldenCoins] = useState(0);
  const [silverCoins, setSilverCoins] = useState(0);
  const menuRef = useRef();

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    setIsLoggedIn(
      localStorage.getItem("isRegistered") === "true" ||
        localStorage.getItem("isLoggedIn") === "true" ||
        (localStorage.getItem("token") && localStorage.getItem("user"))
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleAuthChange() {
      setIsLoggedIn(
        localStorage.getItem("isRegistered") === "true" ||
          localStorage.getItem("isLoggedIn") === "true" ||
          (localStorage.getItem("token") && localStorage.getItem("user"))
      );
    }
    window.addEventListener("storage", handleAuthChange);
    window.addEventListener("authChanged", handleAuthChange);
    return () => {
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("authChanged", handleAuthChange);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!showProfileMenu) return;
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileMenu]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const handleLoginClick = () => {
    openLogin();
  };

  // Listen for request sent (from OneOnOne)
  React.useEffect(() => {
    function handleRequestSent(e) {
      setNotifications((prev) => [
        {
          type: 'request',
          tutor: e.detail.tutor,
          onCancel: e.detail.onCancel
        },
        ...prev
      ]);
    }
    function handleAddSessionRequestNotification(e) {
      setNotifications((prev) => [
        {
          type: 'session',
          tutor: e.detail.tutor,
          onAccept: e.detail.onAccept,
          onReject: e.detail.onReject
        },
        ...prev
      ]);
    }
    function handleSessionRequestResponse(e) {
      setNotifications((prev) => [
        {
          type: 'text',
          message: `Your request to ${e.detail.tutor.name} has been ${e.detail.status}.`,
        },
        ...prev.filter(n => !(n.type === 'request' && n.tutor && n.tutor.name === e.detail.tutor.name) && !(n.type === 'session' && n.tutor && n.tutor.name === e.detail.tutor.name))
      ]);
    }
    window.addEventListener('requestSent', handleRequestSent);
    window.addEventListener('addSessionRequestNotification', handleAddSessionRequestNotification);
    window.addEventListener('sessionRequestResponse', handleSessionRequestResponse);
    return () => {
      window.removeEventListener('requestSent', handleRequestSent);
      window.removeEventListener('addSessionRequestNotification', handleAddSessionRequestNotification);
      window.removeEventListener('sessionRequestResponse', handleSessionRequestResponse);
    };
  }, []);

  // Fetch coin balances from backend 
  useEffect(() => {
    if (!isLoggedIn) return;
    fetch('/api/user/coins', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setGoldenCoins(data.golden || 0);
        setSilverCoins(data.silver || 0);
      })
      .catch(() => {
        setGoldenCoins(0);
        setSilverCoins(0);
      });
  }, [isLoggedIn]);

  // Handle mobile menu toggle
  const handleMobileMenu = () => setMenuOpen((open) => !open);

  return (
    <nav className="fixed top-0 left-0 w-full bg-gradient-to-br from-[#e8f1ff] to-[#dbeaff] text-blue-800 px-1 xs:px-2 sm:px-4 md:px-8 py-2 sm:py-3 md:py-4 shadow-lg border-b-2 border-blue-200 z-30 animate-fadeIn">
      <div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-full md:max-w-7xl mx-auto gap-1 xs:gap-2 sm:gap-4 md:gap-0">
        {/* Left: Logo & Main Nav */}
        <div className="flex flex-col sm:flex-row items-center w-full sm:w-auto">
          <div
            className="flex items-center gap-1 xs:gap-2 sm:gap-3 cursor-pointer transition-transform duration-300 hover:scale-105 ml-0 sm:ml-[-10px] md:ml-[-24px] mr-1 xs:mr-2 sm:mr-4 md:mr-8"
            onClick={() => navigate("/")}
            style={{ minWidth: 80 }}
          >
            <img
              src="/assets/skillswap-logo.webp"
              alt="SkillSwapHub Logo"
              className="h-8 w-8 xs:h-9 xs:w-9 sm:h-12 sm:w-12 object-contain rounded-full shadow-md"
            />
            <span className="text-base xs:text-lg sm:text-2xl font-bold text-blue-900 tracking-tight">
              SkillSwapHub
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center flex-1">
            <div className="flex gap-0.5 xs:gap-1 sm:gap-2 md:gap-3 lg:gap-4">
              {/* Main Nav Links */}
              {[
                { path: "/home", label: "Home" },
                { path: "/one-on-one", label: "1-on-1" },
                { path: "/session", label: "Session" },
                { path: "/discuss", label: "Discuss" },
                { path: "/interview", label: "Interview" }
              ].map(({ path, label }) => (
                <button
                  key={path}
                  className={`text-xs xs:text-sm sm:text-base font-medium px-1.5 xs:px-2 sm:px-3 py-1 sm:py-2 mx-0.5 md:mx-1 rounded-md transition-all duration-300 transform ${
                    isActive(path)
                      ? "bg-blue-100 text-blue-900 font-semibold border-b-2 border-blue-900 shadow-md"
                      : "text-blue-900 hover:bg-blue-50 hover:text-blue-900 hover:border-b-2 hover:border-blue-900 hover:scale-105"
                  }`}
                  onClick={() => navigate(path)}
                  style={{ minWidth: 48, minHeight: 32 }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="sm:hidden ml-auto p-2 rounded-md text-blue-800 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={handleMobileMenu}
            aria-label="Open menu"
          >
            <svg className="w-6 h-6 xs:w-7 xs:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 flex justify-center w-full sm:w-auto order-3 sm:order-none my-1 sm:my-0">
          <form onSubmit={handleSearch} className="w-full max-w-[180px] xs:max-w-xs md:max-w-sm">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skills..."
                className="pl-8 pr-2 py-1.5 xs:pl-9 xs:pr-3 xs:py-2 text-xs xs:text-sm sm:text-base rounded-full bg-white border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-800 placeholder-blue-800 w-full opacity-80"
              />
              <button
                type="submit"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-700"
              >
                <svg
                  className="w-4 h-4 xs:w-5 xs:h-5"
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

        {/* Right: Coins, Notifications, Auth/Profile */}
        <div className="flex items-center gap-1 xs:gap-2 sm:gap-4 md:gap-6 w-full sm:w-auto justify-end">
          {/* Coins */}
          <Credits goldenCoins={goldenCoins} silverCoins={silverCoins} isLoggedIn={isLoggedIn} />

          {/* Notifications */}
          <Notifications notifications={notifications} setNotifications={setNotifications} />

          {/* Auth/Profile */}
          {!isLoggedIn ? (
            <button
              className="bg-blue-700 text-white px-3 xs:px-4 sm:px-6 py-1.5 sm:py-2 rounded-md font-medium tracking-wide transition-all duration-300 hover:bg-blue-800 hover:shadow-md hover:scale-105 text-xs xs:text-sm sm:text-base"
              onClick={handleLoginClick}
            >
              Login
            </button>
          ) : (
            <div className="relative">
              <button
                className="w-8 xs:w-10 sm:w-12 h-8 xs:h-10 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border-2 border-blue-300 transition-all duration-300 hover:bg-blue-200 hover:text-blue-700 hover:shadow-md hover:scale-110"
                onClick={() => setShowProfileMenu((v) => !v)}
                title="Profile"
                aria-label="Profile"
              >
                <svg
                  className="w-6 xs:w-7 sm:w-8 h-6 xs:h-7 sm:h-8"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
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
      </div>

      {/* Mobile Menu Drawer */}
      {menuOpen && (
        <MobileMenu
          isLoggedIn={isLoggedIn}
          navigate={navigate}
          setShowProfileMenu={setShowProfileMenu}
          showProfileMenu={showProfileMenu}
          menuRef={menuRef}
          setMenuOpen={setMenuOpen}
          ProfileDropdown={ProfileDropdown}
          goldenCoins={goldenCoins}
          silverCoins={silverCoins}
          notifications={notifications}
          setNotifications={setNotifications}
          handleLoginClick={handleLoginClick}
        />
      )}
    </nav>
  );
};

export default Navbar;
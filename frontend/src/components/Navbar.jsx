import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useModal } from '../context/ModalContext';
import ProfileDropdown from "./ProfileDropdown";
import Notifications from "./Navbar/Notifications";
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
  const [showCoinsDropdown, setShowCoinsDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [goldenCoins, setGoldenCoins] = useState(0);
  const [silverCoins, setSilverCoins] = useState(0);
  const menuRef = useRef();
  const coinsRef = useRef();

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
    if (!showProfileMenu && !showCoinsDropdown) return;
    function handleClickOutside(event) {
      if (
        (menuRef.current && !menuRef.current.contains(event.target)) &&
        (coinsRef.current && !coinsRef.current.contains(event.target))
      ) {
        setShowProfileMenu(false);
        setShowCoinsDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileMenu, showCoinsDropdown]);

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

  useEffect(() => {
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

  const handleMobileMenu = () => setMenuOpen((open) => !open);

  return (
 <nav className="fixed top-0 left-0 w-full bg-gradient-to-br from-[#e8f1ff] to-[#dbeaff] text-blue-800 px-2 xs:px-3 sm:px-6 md:px-10 py-[0.5%] sm:py-[1%] md:py-[1.5%] shadow-lg border-b-2 border-blue-200 z-30 animate-fadeIn">
      <div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-full md:max-w-7xl mx-auto gap-1.5 xs:gap-2 sm:gap-5 md:gap-7">
        {/* Left: Logo & Main Nav */}
        <div className="flex flex-col sm:flex-row items-center w-full sm:w-auto">
          <div
            className="flex items-center gap-2 xs:gap-2.5 sm:gap-3.5 cursor-pointer transition-transform duration-300 hover:scale-105 ml-0 sm:ml-[-12px] md:ml-[-28px] mr-2 xs:mr-2.5 sm:mr-5 md:mr-9"
            onClick={() => navigate("/")}
            style={{ minWidth: 85 }}
          >
            <img
              src="/assets/skillswap-logo.webp"
              alt="SkillSwapHub Logo"
              className="h-7 xs:h-8 sm:h-11 sm:w-11 object-contain rounded-full shadow-md"
            />
            <span className="text-sm xs:text-base sm:text-xl font-bold text-blue-900 tracking-tight font-lora">
              SkillSwapHub
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center flex-1">
            <div className="flex gap-1 xs:gap-1.5 sm:gap-2.5 md:gap-3.5">
              {[
                { path: "/home", label: "Home" },
                { path: "/one-on-one", label: "1-on-1" },
                { path: "/session", label: "Session" },
                { path: "/discuss", label: "Discuss" },
                { path: "/interview", label: "Interview" }
              ].map(({ path, label }) => (
                <button
                  key={path}
                  className={`text-xs xs:text-sm sm:text-base font-medium px-1.5 xs:px-2.5 sm:px-3.5 py-1 xs:py-2 sm:py-2 mx-0.5 md:mx-1 rounded-md transition-all duration-300 transform ${
                    isActive(path)
                      ? "bg-blue-100 text-blue-900 font-semibold border-b-2 border-blue-900 shadow-md"
                      : "text-blue-900 hover:bg-blue-50 hover:text-blue-900 hover:border-b-2 hover:border-blue-900 hover:scale-105"
                  }`}
                  onClick={() => navigate(path)}
                  style={{ minWidth: 55, minHeight: 32 }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="sm:hidden ml-auto p-1.5 rounded-md text-blue-800 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={handleMobileMenu}
            aria-label="Open menu"
          >
            <svg className="w-5 xs:w-6 sm:w-7 h-5 xs:h-6 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 flex justify-center w-full sm:w-auto order-3 sm:order-none my-1.5 sm:my-0">
          <form onSubmit={handleSearch} className="w-full max-w-[190px] xs:max-w-[240px] md:max-w-[360px]">
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skills..."
                className="pl-8 xs:pl-9 sm:pl-11 pr-2 xs:pr-3 sm:pr-4 py-1.5 xs:py-2 sm:py-2.5 text-xs xs:text-sm sm:text-base rounded-full bg-white border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-800 placeholder-blue-800 w-full opacity-80 font-nunito"
              />
              <button
                type="submit"
                className="absolute left-1.5 xs:left-2 sm:left-2.5 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-700"
              >
                <svg
                  className="w-4 xs:w-5 sm:w-6 h-4 xs:h-5 sm:h-6"
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

        {/* Right: SkillCoin, Notifications, Auth/Profile */}
        <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-5 md:gap-7 w-full sm:w-auto justify-end">
          {/* SkillCoin */}
          {isLoggedIn && (
            <div className="relative">
              <button
                className="flex items-center gap-1.5 text-white bg-gradient-to-r from-blue-700 to-blue-900 font-nunito font-semibold px-3 xs:px-4 sm:px-5 py-1.5 xs:py-2 sm:py-2.5 rounded-lg border border-blue-300 shadow-md text-sm xs:text-base sm:text-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-800 hover:shadow-lg hover:scale-110"
                onClick={() => setShowCoinsDropdown((v) => !v)}
                title="SkillCoin"
                aria-label="SkillCoin"
                ref={coinsRef}
              >
                <svg
                  className="w-5 xs:w-6 sm:w-7 h-5 xs:h-6 sm:h-7"
                  fill="url(#coin-gradient)"
                  viewBox="0 0 24 24"
                >
                  <defs>
                    <linearGradient id="coin-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#1e3a8a', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-13h2v2h-2V7zm0 4h2v6h-2v-6z" />
                  <circle cx="12" cy="12" r="8" fill="none" stroke="url(#coin-gradient)" strokeWidth="1" />
                  <path d="M12 4.5c-4.14 0-7.5 3.36-7.5 7.5s3.36 7.5 7.5 7.5 7.5-3.36 7.5-7.5-3.36-7.5-7.5-7.5z" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.3" />
                </svg>
                SkillCoin
              </button>
              {showCoinsDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-gradient-to-br from-blue-50 to-gray-50 border border-blue-200 rounded-xl shadow-lg z-40 animate-slide-up">
                  <div className="p-3 space-y-2.5 font-nunito text-gray-600">
                    <div className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-blue-100 hover:shadow-sm transition-all duration-200">
                      <svg className="w-5 h-5" fill="url(#gold-gradient)" viewBox="0 0 24 24">
                        <defs>
                          <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#f59e0b', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: '#d97706', stopOpacity: 1 }} />
                          </linearGradient>
                        </defs>
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                        <circle cx="12" cy="12" r="8" fill="none" stroke="url(#gold-gradient)" strokeWidth="1" />
                      </svg>
                      <span className="text-xs xs:text-sm font-semibold text-gray-700">Golden Coins: {goldenCoins}</span>
                    </div>
                    <div className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-blue-100 hover:shadow-sm transition-all duration-200">
                      <svg className="w-5 h-5" fill="url(#silver-gradient)" viewBox="0 0 24 24">
                        <defs>
                          <linearGradient id="silver-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#d1d5db', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: '#9ca3af', stopOpacity: 1 }} />
                          </linearGradient>
                        </defs>
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                        <circle cx="12" cy="12" r="8" fill="none" stroke="url(#silver-gradient)" strokeWidth="1" />
                      </svg>
                      <span className="text-xs xs:text-sm font-semibold text-gray-700">Silver Coins: {silverCoins}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notifications */}
          <Notifications notifications={notifications} setNotifications={setNotifications} />

          {/* Auth/Profile */}
          {!isLoggedIn ? (
            <button
              className="bg-blue-700 text-white px-3 xs:px-4 sm:px-5 py-1.5 xs:py-2 sm:py-2.5 rounded-md font-medium tracking-wide transition-all duration-300 hover:bg-blue-800 hover:shadow-md hover:scale-105 text-xs xs:text-sm sm:text-base font-nunito"
              onClick={handleLoginClick}
            >
              Login
            </button>
          ) : (
            <div className="relative">
              <button
                className="w-7 xs:w-9 sm:w-11 h-7 xs:h-9 sm:h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border-2 border-blue-300 transition-all duration-300 hover:bg-blue-200 hover:text-blue-700 hover:shadow-md hover:scale-110"
                onClick={() => setShowProfileMenu((v) => !v)}
                title="Profile"
                aria-label="Profile"
                ref={menuRef}
              >
                <svg
                  className="w-5 xs:w-6 sm:w-7 h-5 xs:h-6 sm:h-7"
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

     
    </nav>
  );
};

export default Navbar;
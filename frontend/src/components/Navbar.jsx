import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useModal } from '../context/ModalContext';
import ProfileDropdown from "./ProfileDropdown";
import MobileMenu from "./MobileMenu";
import NotificationSection from "./NotificationSection";
import RequestSentNotification from '../user/oneononeSection/RequestSentModal';
import SessionRequestNotification from '../user/oneononeSection/SessionRequestModal';

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

  return (
    <nav className="fixed top-0 left-0 w-full bg-gradient-to-br from-[#e8f1ff] to-[#dbeaff] text-blue-800 px-6 sm:px-12 py-4 shadow-lg border-b-2 border-blue-200 z-30 animate-fadeIn">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-8">
          <div
            className="flex items-center gap-3 cursor-pointer transition-transform duration-300 hover:scale-105"
            onClick={() => navigate("/")}
          >
            <img
              src="/assets/skillswap-logo.webp
              "
              alt="SkillSwapHub Logo"
              className="h-12 w-12 object-contain rounded-full shadow-md"
            />
            <span className="text-2xl font-bold text-blue-900 tracking-tight">
              SkillSwapHub
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-8">
            <div className="flex gap-8">
              {[
                { path: "/home", label: "Home" },
                { path: "/one-on-one", label: "1-on-1" },
                { path: "/discuss", label: "Discuss" },
                { path: "/interview", label: "Interview" },
              ].map(({ path, label }) => (
                <button
                  key={path}
                  className={`text-base font-medium px-4 py-2 rounded-md transition-all duration-300 transform ${
                    isActive(path)
                      ? "bg-blue-100 text-blue-900 font-semibold border-b-2 border-blue-900 shadow-md"
                      : "text-blue-900 hover:bg-blue-50 hover:text-blue-900 hover:border-b-2 hover:border-blue-900 hover:scale-105"
                  }`}
                  onClick={() => navigate(path)}
                >
                  {label}
                </button>
              ))}
              {isLoggedIn && (
                <div
                  className="flex items-center gap-2 text-base font-medium px-4 py-2 rounded-md bg-gray-900 text-white transition-all duration-300 hover:bg-gray-800 hover:shadow-lg hover:scale-105"
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92c-.25.25-.43.59-.43.92v.33h-2v-.33c0-.33.18-.67.43-.92l1.14-1.16c.36-.36.36-.94 0-1.3-.36-.36-.94-.36-1.3 0l-1.57 1.59c-.59.59-.59 1.54 0 2.13l.43.43H9v2h1.67l.43.43c.59.59 1.54.59 2.13 0l1.57-1.59c-.59-.59-.59-1.54 0-2.13z"/>
                  </svg>
                  <span>100 Credits</span>
                </div>
              )}
            </div>

            <div className="relative">
              <form onSubmit={handleSearch}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search skills..."
                  className="pl-10 pr-4 py-2 text-base rounded-full bg-white border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-800 placeholder-blue-800 w-48 opacity-80"
                />
                <button
                  type="submit"
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-700"
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
        </div>

        <div className="flex items-center gap-6">
          <button
            className="sm:hidden p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition-transform duration-300 hover:scale-110"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-8 h-8 text-blue-600 hover:text-blue-700"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>

          {menuOpen && (
            <div className="sm:hidden absolute top-full left-0 w-full bg-gradient-to-br from-[#e8f1ff] to-[#dbeaff] shadow-xl border-t border-blue-200 p-6 mt-1 z-20">
              <MobileMenu
                isLoggedIn={isLoggedIn}
                navigate={navigate}
                setShowProfileMenu={setShowProfileMenu}
                showProfileMenu={showProfileMenu}
                menuRef={menuRef}
                setMenuOpen={setMenuOpen}
                ProfileDropdown={ProfileDropdown}
                additionalItems={isLoggedIn ? [{ path: null, label: "100 Credits", isDisplay: true }] : []}
              />
              <form onSubmit={handleSearch} className="mt-6">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search skills..."
                    className="w-full pl-10 pr-4 py-2 text-base rounded-full bg-white border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-800 placeholder-blue-800 opacity-80"
                  />
                  <button
                    type="submit"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-700"
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

          <div className="hidden sm:flex items-center gap-6">
            <NotificationSection
              notifications={notifications.map((n, idx) =>
                n.type === 'request' ? (
                  <RequestSentNotification key={idx} tutor={n.tutor} onCancel={n.onCancel} />
                ) : n.type === 'session' ? (
                  <SessionRequestNotification
                    key={idx}
                    tutor={n.tutor}
                    fromUser={n.fromUser}
                    onAccept={n.onAccept}
                    onReject={n.onReject}
                  />
                ) : n.type === 'response' ? (
                  n.content
                ) : (
                  n.message
                )
              )}
              onClear={() => setNotifications([])}
              onUpdate={setNotifications}
            />
            {!isLoggedIn ? (
              <button
                className="bg-blue-700 text-white px-6 py-2 rounded-md font-medium tracking-wide transition-all duration-300 hover:bg-blue-800 hover:shadow-md hover:scale-105"
                onClick={handleLoginClick}
              >
                Login
              </button>
            ) : (
              <div className="relative">
                <button
                  className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border-2 border-blue-300 transition-all duration-300 hover:bg-blue-200 hover:text-blue-700 hover:shadow-md hover:scale-110"
                  onClick={() => setShowProfileMenu((v) => !v)}
                  title="Profile"
                  aria-label="Profile"
                >
                  <svg
                    className="w-8 h-8"
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
      </div>
    </nav>
  );
};

export default Navbar;
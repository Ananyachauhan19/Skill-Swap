import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useModal } from '../context/ModalContext';
import MobileMenu from './MobileMenu';
import ProfileDropdown from './ProfileDropdown';
import Notifications from './Navbar/Notifications';
import VideoCall from "./VideoCall";
import { BACKEND_URL } from '../config.js';
import socket from '../socket.js';

function useSessionSocketNotifications(setNotifications) {
  useEffect(() => {
    const userCookie = Cookies.get('user');
    const user = userCookie ? JSON.parse(userCookie) : null;
    
    if (user && user._id) {
      socket.emit('register', user._id);
    }

    // Listen for session request received (for tutors)
    socket.on('session-request-received', (data) => {
      const { sessionRequest, requester } = data;
      setNotifications((prev) => [
        {
          type: 'session-request',
          sessionRequest,
          requester,
          message: `New session request from ${requester.firstName} ${requester.lastName}`,
          timestamp: Date.now(),
          read: false,
          onAccept: async () => {
            try {
              const response = await fetch(`${BACKEND_URL}/api/session-requests/approve/${sessionRequest._id}`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
              });
              if (response.ok) {
                // Send socket notification to requester
                socket.emit('session-request-response', {
                  requestId: sessionRequest._id,
                  action: 'approve'
                });
                return true;
              }
            } catch (error) {
              console.error('Error approving request:', error);
              return false;
            }
          },
          onReject: async () => {
            try {
              const response = await fetch(`${BACKEND_URL}/api/session-requests/reject/${sessionRequest._id}`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
              });
              if (response.ok) {
                // Send socket notification to requester
                socket.emit('session-request-response', {
                  requestId: sessionRequest._id,
                  action: 'reject'
                });
                return true;
              }
            } catch (error) {
              console.error('Error rejecting request:', error);
              return false;
            }
          }
        },
        ...prev,
      ]);
    });

    // Listen for session request updated (for requesters)
    socket.on('session-request-updated', (data) => {
      const { sessionRequest, action } = data;
      setNotifications((prev) => [
        {
          type: 'session-request-response',
          sessionRequest,
          action,
          message: `Your session request was ${action}ed by ${sessionRequest.tutor.firstName} ${sessionRequest.tutor.lastName}`,
          timestamp: Date.now(),
          read: false,
        },
        ...prev,
      ]);
    });

    // Listen for session-requested (for creators)
    socket.on('session-requested', (session) => {
      setNotifications((prev) => [
        {
          type: 'session-requested',
          session,
          sessionId: session._id, // Add sessionId for approve/reject functionality
          message: `You have a new session request from ${session.requester?.name || session.requester?.firstName || 'a user'}.`,
          timestamp: Date.now(),
          read: false,
        },
        ...prev,
      ]);
    });

    // Listen for session-approved (for requesters)
    socket.on('session-approved', (session) => {
      setNotifications((prev) => [
        {
          type: 'session-approved',
          session,
          message: `Your session request was approved by ${session.creator?.firstName || 'the tutor'}.`,
          timestamp: Date.now(),
          read: false,
        },
        ...prev,
      ]);
    });

    // Listen for session-rejected (for requesters)
    socket.on('session-rejected', (session) => {
      setNotifications((prev) => [
        {
          type: 'session-rejected',
          session,
          message: `Your session request was rejected by ${session.creator?.firstName || 'the tutor'}.`,
          timestamp: Date.now(),
          read: false,
        },
        ...prev,
      ]);
    });

    // Listen for session-started (for approved users)
    socket.on('session-started', (data) => {
      console.log('Received session-started notification:', data);
      const newNotification = {
        type: 'session-started',
        session: data,
        message: data.message || 'Your session has started! Click Join to start the video call or Cancel to decline.',
        timestamp: Date.now(),
        read: false,
        onJoin: () => {
          // Handle joining the video call
          console.log('User joined session, starting video call...');
          console.log('Setting activeVideoCall to:', data.sessionId);
          setActiveVideoCall(data.sessionId);
        },
        onCancel: () => {
          // Handle canceling the session
          console.log('User cancelled session');
          // Call the cancel API
          fetch(`${BACKEND_URL}/api/sessions/${data.sessionId}/cancel`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          })
          .then(response => {
            if (response.ok) {
              console.log('Session cancelled successfully');
            } else {
              console.error('Failed to cancel session');
            }
          })
          .catch(error => {
            console.error('Error cancelling session:', error);
          });
        }
      };
      console.log('Adding new notification:', newNotification);
      setNotifications((prev) => {
        console.log('Previous notifications:', prev);
        const updated = [newNotification, ...prev];
        console.log('Updated notifications:', updated);
        return updated;
      });
    });

    // Listen for session-cancelled (for creators)
    socket.on('session-cancelled', (data) => {
      console.log('Received session-cancelled notification:', data);
      setNotifications((prev) => [
        {
          type: 'session-cancelled',
          session: data,
          message: data.message || 'The user has cancelled the session.',
          timestamp: Date.now(),
          read: false,
        },
        ...prev,
      ]);
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off('session-request-received');
      socket.off('session-request-updated');
      socket.off('session-requested');
      socket.off('session-approved');
      socket.off('session-rejected');
      socket.off('session-started');
      socket.off('session-cancelled');
    };
  }, [setNotifications]);
}

const Navbar = () => {
  const { openLogin } = useModal();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(!!Cookies.get('user'));
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCoinsDropdown, setShowCoinsDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [goldenCoins, setGoldenCoins] = useState(0);
  const [silverCoins, setSilverCoins] = useState(0);
  const [activeVideoCall, setActiveVideoCall] = useState(null);
  const menuRef = useRef();
  const coinsRef = useRef();

  // Load notifications from localStorage on component mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed);
      } catch (error) {
        console.error('Error parsing saved notifications:', error);
        localStorage.removeItem('notifications');
      }
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Clean up old notifications (older than 24 hours)
  useEffect(() => {
    const cleanupOldNotifications = () => {
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
      const now = Date.now();
      
      const filteredNotifications = notifications.filter(notification => {
        if (!notification.timestamp) return true; // Keep notifications without timestamp
        return (now - notification.timestamp) < TWENTY_FOUR_HOURS;
      });
      
      if (filteredNotifications.length !== notifications.length) {
        console.log('Cleaning up old notifications:', notifications.length - filteredNotifications.length, 'removed');
        setNotifications(filteredNotifications);
      }
    };

    // Clean up every hour
    const interval = setInterval(cleanupOldNotifications, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [notifications]);

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    setIsLoggedIn(!!Cookies.get('user'));
  }, [location.pathname]);

  useEffect(() => {
    const handleAuthChange = () => {
      setIsLoggedIn(!!Cookies.get('user'));
    };
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
    const handleClickOutside = (event) => {
      if (
        (menuRef.current && !menuRef.current.contains(event.target)) &&
        (coinsRef.current && !coinsRef.current.contains(event.target))
      ) {
        setShowProfileMenu(false);
        setShowCoinsDropdown(false);
      }
    };
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
    const handleRequestSent = (e) => {
      setNotifications((prev) => [
        { type: 'request', tutor: e.detail.tutor, onCancel: e.detail.onCancel },
        ...prev,
      ]);
    };
    const handleAddSessionRequestNotification = (e) => {
      setNotifications((prev) => [
        {
          type: 'session',
          tutor: e.detail.tutor,
          onAccept: e.detail.onAccept,
          onReject: e.detail.onReject,
        },
        ...prev,
      ]);
    };
    const handleSessionRequestResponse = (e) => {
      setNotifications((prev) => [
        {
          type: 'text',
          message: `Your request to ${e.detail.tutor.name} has been ${e.detail.status}.`,
        },
        ...prev.filter(
          (n) =>
            !(n.type === 'request' && n.tutor && n.tutor.name === e.detail.tutor.name) &&
            !(n.type === 'session' && n.tutor && n.tutor.name === e.detail.tutor.name)
        ),
      ]);
    };
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
    fetch(`${BACKEND_URL}/api/auth/coins`, {
      credentials: 'include'
    })
      .then((res) => res.json())
      .then((data) => {
        setGoldenCoins(data.golden || 0);
        setSilverCoins(data.silver || 0);
      })
      .catch(() => {
        setGoldenCoins(0);
        setSilverCoins(0);
      });
  }, [isLoggedIn]);

  useSessionSocketNotifications(setNotifications);

  const handleMobileMenu = () => setMenuOpen((open) => !open);

  return (
    <>
    <nav className="fixed top-0 left-0 w-full bg-gradient-to-br from-[#e8f1ff] to-[#dbeaff] text-blue-800 px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 shadow-lg border-b-2 border-blue-200 z-50 animate-fadeIn">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left: Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer transition-transform duration-300 hover:scale-105"
          onClick={() => navigate("/")}
        >
          <img
            src="/assets/skillswap-logo.webp"
            alt="SkillSwapHub Logo"
            className="h-8 sm:h-10 w-8 sm:w-10 object-contain rounded-full shadow-md"
          />
          <span className="text-sm sm:text-lg font-bold text-blue-900 font-lora">
            SkillSwapHub
          </span>
        </div>

        {/* Right: Mobile Menu Button, Search, Auth/Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Menu Button */}
          <button
            className="sm:hidden p-2 rounded-md text-blue-800 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={handleMobileMenu}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>

          {/* Desktop Search Bar */}
          <div className="hidden sm:flex flex-1 max-w-xs">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search skills..."
                  className="pl-10 pr-4 py-2 text-sm rounded-full bg-white border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-800 placeholder-blue-800 w-full font-nunito"
                />
                <button
                  type="submit"
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-700"
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

          {/* Desktop Navigation Links */}
          <div className="hidden sm:flex items-center gap-3">
            {[
              { path: "/home", label: "Home" },
              { path: "/one-on-one", label: "1-on-1" },
              { path: "/session", label: "Session" },
              { path: "/session-requests", label: "Requests" },
              { path: "/discuss", label: "Discuss" },
              { path: "/interview", label: "Interview" },
            ].map(({ path, label }) => (
              <button
                key={path}
                className={`text-sm font-medium px-3 py-2 rounded-md transition-all duration-300 ${
                  isActive(path)
                    ? "bg-blue-100 text-blue-900 font-semibold border-b-2 border-blue-900"
                    : "text-blue-900 hover:bg-blue-50 hover:text-blue-900 hover:border-b-2 hover:border-blue-900 hover:scale-105"
                }`}
                onClick={() => navigate(path)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* SkillCoin - Visible on all screens when logged in */}
          {isLoggedIn && (
            <div className="relative">
              <button
                className="flex items-center gap-1.5 text-white bg-gradient-to-r from-blue-700 to-blue-900 font-nunito font-semibold px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm rounded-lg border border-blue-300 shadow-md transition-all duration-300 hover:from-blue-600 hover:to-blue-800 hover:shadow-lg hover:scale-105"
                onClick={() => setShowCoinsDropdown((v) => !v)}
                title="SkillCoin"
                ref={coinsRef}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="url(#coin-gradient)" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="coin-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#1e3a8a', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-13h2v2h-2V7zm0 4h2v6h-2v-6z" />
                  <circle cx="12" cy="12" r="8" fill="none" stroke="url(#coin-gradient)" strokeWidth="1" />
                </svg>
                <span className="hidden xs:inline">SkillCoin</span>
              </button>
              {showCoinsDropdown && (
                <div className="absolute right-0 mt-2 w-40 bg-gradient-to-br from-blue-50 to-gray-50 border border-blue-200 rounded-xl shadow-lg z-40 animate-slide-up">
                  <div className="p-3 space-y-2 font-nunito text-gray-600">
                    <div className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-blue-100">
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
                      <span className="text-sm font-semibold text-gray-700">Golden Coins: {goldenCoins}</span>
                    </div>
                    <div className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-blue-100">
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
                      <span className="text-sm font-semibold text-gray-700">Silver Coins: {silverCoins}</span>
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
              className="bg-blue-700 text-white px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm rounded-md font-medium transition-all duration-300 hover:bg-blue-800 hover:scale-105 font-nunito"
              onClick={handleLoginClick}
            >
              Login
            </button>
          ) : (
            <div className="relative">
              <button
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border-2 border-blue-300 transition-all duration-300 hover:bg-blue-200 hover:scale-105"
                onClick={() => setShowProfileMenu((v) => !v)}
                title="Profile"
                ref={menuRef}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
              </button>
              {showProfileMenu && (
                <ProfileDropdown
                  show={showProfileMenu}
                  onClose={() => setShowProfileMenu(false)}
                  navigate={navigate}
                  menuRef={menuRef}
                />
              )}
            </div>
          )}
        </div>
      </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <MobileMenu
          isOpen={menuOpen}
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
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearch={handleSearch}
          isActive={isActive}
        />
      )}

      {/* Video Call Overlay */}
      {activeVideoCall && (
        <VideoCall
          sessionId={activeVideoCall}
          onEndCall={() => {
            console.log('Ending video call');
            setActiveVideoCall(null);
          }}
          userRole="Participant"
        />
      )}
    </>
  );
};

export default Navbar;
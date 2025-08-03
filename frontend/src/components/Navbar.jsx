import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useModal } from '../context/ModalContext';
import MobileMenu from './MobileMenu';
import ProfileDropdown from './ProfileDropdown';
import Notifications from './Navbar/Notifications';
import VideoCall from './VideoCall';
import { BACKEND_URL } from '../config.js';
import socket from '../socket.js';

// useSessionSocketNotifications remains unchanged
function useSessionSocketNotifications(setNotifications) {
  useEffect(() => {
    const userCookie = Cookies.get('user');
    const user = userCookie ? JSON.parse(userCookie) : null;

    if (user && user._id) {
      socket.emit('register', user._id);
    }

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
                headers: { 'Content-Type': 'application/json' },
              });
              if (response.ok) {
                socket.emit('session-request-response', {
                  requestId: sessionRequest._id,
                  action: 'approve',
                });
                return true;
              }
            } catch (error) {
              return false;
            }
          },
          onReject: async () => {
            try {
              const response = await fetch(`${BACKEND_URL}/api/session-requests/reject/${sessionRequest._id}`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
              });
              if (response.ok) {
                socket.emit('session-request-response', {
                  requestId: sessionRequest._id,
                  action: 'reject',
                });
                return true;
              }
            } catch (error) {
              return false;
            }
          },
        },
        ...prev,
      ]);
    });

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

    socket.on('session-requested', (session) => {
      setNotifications((prev) => [
        {
          type: 'session-requested',
          session,
          sessionId: session._id,
          message: `You have a new session request from ${session.requester?.name || session.requester?.firstName || 'a user'}.`,
          timestamp: Date.now(),
          read: false,
        },
        ...prev,
      ]);
    });

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

    socket.on('session-started', (data) => {
      const newNotification = {
        type: 'session-started',
        session: data,
        message: data.message || 'Your session has started! Click Join to start the video call or Cancel to decline.',
        timestamp: Date.now(),
        read: false,
        onJoin: () => {
          setActiveVideoCall(data.sessionId);
        },
        onCancel: () => {
          fetch(`${BACKEND_URL}/api/sessions/${data.sessionId}/cancel`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          })
            .then((response) => {
              if (response.ok) {
                // Handle success if needed
              } else {
                // Handle error if needed
              }
            })
            .catch((error) => {
              // Handle error if needed
            });
        },
      };
      setNotifications((prev) => {
        const updated = [newNotification, ...prev];
        return updated;
      });
    });

    socket.on('session-cancelled', (data) => {
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

    socket.on('skillmate-request-received', (data) => {
      const { skillMateRequest, requester } = data;
      setNotifications((prev) => [
        {
          type: 'skillmate',
          subtype: 'request',
          requestId: skillMateRequest._id,
          requesterName: `${requester.firstName} ${requester.lastName}`,
          requesterUsername: requester.username,
          message: `${requester.firstName} ${requester.lastName} wants to be your SkillMate.`,
          timestamp: Date.now(),
          read: false,
        },
        ...prev,
      ]);
    });

    socket.on('skillmate-request-sent', (data) => {
      const { skillMateRequest, recipient } = data;
      setNotifications((prev) => [
        {
          type: 'skillmate',
          subtype: 'sent',
          requestId: skillMateRequest._id,
          recipientName: `${recipient.firstName} ${recipient.lastName}`,
          recipientUsername: recipient.username,
          message: `You sent a SkillMate request to ${recipient.firstName} ${recipient.lastName}.`,
          timestamp: Date.now(),
          read: false,
        },
        ...prev,
      ]);
    });

    socket.on('skillmate-request-approved', (data) => {
      const { skillMateRequest, approver, requester } = data;
      const isRequester = user && user._id === requester._id;
      const otherUser = isRequester ? approver : requester;

      setNotifications((prev) => [
        {
          type: 'skillmate',
          subtype: 'approved',
          requestId: skillMateRequest._id,
          otherUserName: `${otherUser.firstName} ${otherUser.lastName}`,
          otherUserUsername: otherUser.username,
          message: isRequester
            ? `${approver.firstName} ${approver.lastName} accepted your SkillMate request.`
            : `You accepted the SkillMate request from ${requester.firstName} ${requester.lastName}.`,
          timestamp: Date.now(),
          read: false,
        },
        ...prev.filter((n) => !(n.type === 'skillmate' && n.subtype === 'request' && n.requestId === skillMateRequest._id)),
      ]);
    });

    socket.on('skillmate-request-rejected', (data) => {
      const { skillMateRequest, rejecter, requester } = data;
      const isRequester = user && user._id === requester._id;
      const otherUser = isRequester ? rejecter : requester;

      setNotifications((prev) => [
        {
          type: 'skillmate',
          subtype: 'rejected',
          requestId: skillMateRequest._id,
          otherUserName: `${otherUser.firstName} ${otherUser.lastName}`,
          otherUserUsername: otherUser.username,
          message: isRequester
            ? `${rejecter.firstName} ${rejecter.lastName} declined your SkillMate request.`
            : `You declined the SkillMate request from ${requester.firstName} ${requester.lastName}.`,
          timestamp: Date.now(),
          read: false,
        },
        ...prev.filter((n) => !(n.type === 'skillmate' && n.subtype === 'request' && n.requestId === skillMateRequest._id)),
      ]);
    });

    return () => {
      socket.off('session-request-received');
      socket.off('session-request-updated');
      socket.off('session-requested');
      socket.off('session-approved');
      socket.off('session-rejected');
      socket.off('session-started');
      socket.off('session-cancelled');
      socket.off('skillmate-request-received');
      socket.off('skillmate-request-sent');
      socket.off('skillmate-request-approved');
      socket.off('skillmate-request-rejected');
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
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [goldenCoins, setGoldenCoins] = useState(0);
  const [silverCoins, setSilverCoins] = useState(0);
  const [activeVideoCall, setActiveVideoCall] = useState(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const menuRef = useRef();
  const coinsRef = useRef();

  // Load notifications from localStorage
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed);
      } catch (error) {
        localStorage.removeItem('notifications');
      }
    }
  }, []);

  // Save notifications to localStorage
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Clean up old notifications
  useEffect(() => {
    const cleanupOldNotifications = () => {
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
      const now = Date.now();

      const filteredNotifications = notifications.filter((notification) => {
        if (!notification.timestamp) return true;
        return now - notification.timestamp < TWENTY_FOUR_HOURS;
      });

      if (filteredNotifications.length !== notifications.length) {
        setNotifications(filteredNotifications);
      }
    };

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
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('authChanged', handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('authChanged', handleAuthChange);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setShowMobileSearch(false);
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu, showCoinsDropdown]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const username = searchQuery.trim();
      if (location.pathname.startsWith('/profile/')) {
        navigate(`/profile/${username}`, { replace: true });
      } else {
        navigate(`/profile/${username}`);
      }
      setSearchQuery('');
      setShowMobileSearch(false);
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
            !(n.type === 'session' && n.tutor && n.tutor.name === e.detail.tutor.name),
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
      credentials: 'include',
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
      <nav className="fixed top-0 left-0 w-full h-[60px] sm:h-[64px] bg-gradient-to-br from-blue-50 to-blue-100 text-blue-900 px-2 sm:px-4 py-2 sm:py-3 shadow-lg border-b border-blue-200 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto h-full">
          {/* Mobile View */}
          <div className="flex items-center justify-between w-full md:hidden">
            {/* Logo */}
            <div
              className="flex items-center gap-1 sm:gap-2 cursor-pointer transition-transform duration-300 hover:scale-105"
              onClick={() => navigate('/')}
            >
              <img
                src="/assets/skillswap-logo.webp"
                alt="SkillSwapHub Logo"
                className="h-8 w-8 sm:h-9 sm:w-9 object-contain rounded-full shadow-md border-2 border-blue-900"
              />
              <span className="text-sm sm:text-base font-extrabold text-blue-900 font-lora tracking-wide drop-shadow-md">
                SkillSwapHub
              </span>
            </div>

            {/* Right Side: Icons */}
            <div className="flex items-center gap-1">
              {isLoggedIn ? (
                <>
                  {/* SkillCoin */}
                  <div className="relative">
                    <button
                      className="min-w-[28px] h-[28px] rounded-full bg-blue-800 text-white flex items-center justify-center shadow-md border border-blue-700 hover:scale-105 transition duration-300"
                      onClick={() => setShowCoinsDropdown((prev) => !prev)}
                      title="SkillCoin"
                      ref={coinsRef}
                      aria-label="View SkillCoin balance"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
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
                      <div className="absolute right-0 mt-2 w-40 bg-white border border-blue-200 rounded-lg shadow-xl animate-fade-in-down backdrop-blur-sm z-50">
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
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notifications - enlarged */}
                  <div className="mt-[2px]">
                    <Notifications
                      notifications={notifications}
                      setNotifications={setNotifications}
                      iconSize="w-5 h-5"
                    />
                  </div>

                  {/* Profile */}
                  <div className="relative">
                    <button
                      className="min-w-[28px] h-[28px] rounded-full bg-blue-100 text-blue-900 flex items-center justify-center border border-blue-300 shadow-md hover:bg-blue-200 hover:scale-105 transition-all duration-300"
                      onClick={() => setShowProfileMenu((v) => !v)}
                      title="Profile"
                      ref={menuRef}
                      aria-label="Open profile menu"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
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
                </>
              ) : (
                <button
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-800 rounded-full shadow-md hover:bg-blue-700 hover:scale-105 transition-all duration-300 font-nunito"
                  onClick={handleLoginClick}
                  aria-label="Login to SkillSwapHub"
                >
                  Login
                </button>
              )}

              {/* Hamburger */}
              <button
                className="min-w-[28px] h-[28px] rounded-full bg-blue-100 text-blue-900 flex items-center justify-center border border-blue-300 shadow-md hover:bg-blue-200 hover:scale-105 transition-all duration-300"
                onClick={handleMobileMenu}
                aria-label="Toggle mobile menu"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* Desktop/Tablet View */}
          <div className="hidden md:flex items-center justify-between w-full h-full">
            {/* Left: Logo and Navigation */}
            <div className="flex items-center gap-4 lg:gap-6">
              <div
                className="flex items-center gap-2 lg:gap-3 cursor-pointer transition-transform duration-300 hover:scale-105"
                onClick={() => navigate('/')}
              >
                <img
                  src="/assets/skillswap-logo.webp"
                  alt="SkillSwapHub Logo"
                  className="h-9 w-9 lg:h-10 lg:w-10 object-contain rounded-full shadow-md border-2 border-blue-900"
                />
                <span className="text-base lg:text-xl font-extrabold text-blue-900 font-lora tracking-wide drop-shadow-md">
                  SkillSwapHub
                </span>
              </div>

              <div className="flex items-center gap-1 lg:gap-2">
                {[
                  { path: '/home', label: 'Home' },
                  { path: '/one-on-one', label: '1-on-1' },
                  { path: '/discuss', label: 'Discuss' },
                  { path: '/interview', label: 'Interview' },
                  { path: '/session', label: 'Session' },
                  { path: '/session-requests', label: 'Requests' },
                ].map(({ path, label }) => (
                  <button
                    key={path}
                    className={`text-xs lg:text-sm font-bold px-2 lg:px-3 py-1.5 rounded-full text-blue-900 bg-blue-100/50 shadow-sm transition-all duration-300 ${
                      isActive(path)
                        ? 'bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-md'
                        : 'hover:bg-gradient-to-r hover:from-blue-900 hover:to-blue-800 hover:text-white hover:shadow-md hover:scale-105'
                    }`}
                    onClick={() => navigate(path)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Search, SkillCoin, Notifications, Auth/Profile */}
            <div className="flex items-center gap-3 lg:gap-6 flex-1 justify-end">
              <div className="flex-1 max-w-md lg:max-w-xl ml-[1%] lg:ml-[2%]">
                <form onSubmit={handleSearch} className="w-full">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search SkillMate..."
                      className="w-full pl-8 lg:pl-10 pr-4 py-1.5 lg:py-2 text-xs lg:text-sm rounded-full bg-white border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-900 placeholder-blue-400 font-nunito shadow-sm"
                    />
                    <button
                      type="submit"
                      className="absolute left-2 lg:left-3 top-1/2 transform -translate-y-1/2 text-blue-900"
                      aria-label="Search"
                    >
                      <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

              {isLoggedIn && (
                <div className="relative z-50">
                  <button
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-800 to-blue-600 text-white rounded-full shadow-md border border-blue-700 hover:scale-105 hover:shadow-lg transition duration-300"
                    onClick={() => setShowCoinsDropdown((prev) => !prev)}
                    title="SkillCoin"
                    ref={coinsRef}
                  >
                    <svg
                      className="w-5 h-5 lg:w-6 lg:h-6"
                      viewBox="0 0 64 64"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <defs>
                        <radialGradient id="outer-coin" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#fff9c4" />
                          <stop offset="30%" stopColor="#fdd835" />
                          <stop offset="60%" stopColor="#fbc02d" />
                          <stop offset="100%" stopColor="#f57f17" />
                        </radialGradient>
                        <linearGradient id="coin-edge" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ffecb3" />
                          <stop offset="100%" stopColor="#ffa000" />
                        </linearGradient>
                        <radialGradient id="inner-coin" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#fff8dc" />
                          <stop offset="100%" stopColor="#f6b500" />
                        </radialGradient>
                      </defs>
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="url(#outer-coin)"
                        stroke="url(#coin-edge)"
                        strokeWidth="4"
                      />
                      <circle cx="32" cy="32" r="18" fill="url(#inner-coin)" />
                      <text
                        x="32"
                        y="40"
                        fontSize="24"
                        fill="#1e3a8a"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        S
                      </text>
                    </svg>
                    <span className="font-semibold text-xs lg:text-sm font-nunito hidden lg:inline">
                      SkillCoin
                    </span>
                  </button>

                  {showCoinsDropdown && (
                    <div className="absolute right-0 mt-2 w-44 lg:w-48 bg-white border border-blue-200 rounded-lg shadow-xl animate-fade-in-down backdrop-blur-sm z-50">
                      <div className="p-3 lg:p-4 space-y-3 text-xs lg:text-sm font-medium text-gray-700">
                        <div className="flex items-center gap-2 p-2 rounded-md hover:bg-blue-50 transition">
                          <div className="w-4 h-4 lg:w-5 lg:h-5 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 shadow-inner flex items-center justify-center">
                            <span className="text-[10px] lg:text-xs font-bold text-blue-900">G</span>
                          </div>
                          <span className="text-gray-800">Golden: {goldenCoins}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-md hover:bg-blue-50 transition">
                          <div className="w-4 h-4 lg:w-5 lg:h-5 rounded-full bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 shadow-inner flex items-center justify-center">
                            <span className="text-[10px] lg:text-xs font-bold text-blue-900">S</span>
                          </div>
                          <span className="text-gray-800">Silver: {silverCoins}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Notifications notifications={notifications} setNotifications={setNotifications} iconSize="w-5 h-5 lg:w-6 lg:h-6" />

              {!isLoggedIn ? (
                <button
                  className="bg-blue-800 text-white px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm rounded-lg font-medium transition-all duration-300 hover:bg-blue-700 hover:scale-105 font-nunito shadow-sm"
                  onClick={handleLoginClick}
                  aria-label="Login to SkillSwapHub"
                >
                  Login
                </button>
              ) : (
                <div className="relative">
                  <button
                    className="min-w-[40px] h-[40px] lg:min-w-[44px] lg:h-[44px] rounded-full bg-blue-100 flex items-center justify-center text-blue-900 border border-blue-300 shadow-md transition-all duration-300 hover:bg-blue-200 hover:scale-105"
                    onClick={() => setShowProfileMenu((v) => !v)}
                    title="Profile"
                    ref={menuRef}
                    aria-label="Open profile menu"
                  >
                    <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="currentColor" viewBox="0 0 24 24">
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
        </div>
      </nav>

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

      {activeVideoCall && (
        <VideoCall
          sessionId={activeVideoCall}
          onEndCall={() => {
            setActiveVideoCall(null);
          }}
          userRole="Participant"
        />
      )}
    </>
  );
};

export default Navbar;
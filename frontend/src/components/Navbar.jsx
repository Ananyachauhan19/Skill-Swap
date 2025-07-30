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
                socket.emit('session-request-response', {
                  requestId: sessionRequest._id,
                  action: 'approve'
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
                headers: { 'Content-Type': 'application/json' }
              });
              if (response.ok) {
                socket.emit('session-request-response', {
                  requestId: sessionRequest._id,
                  action: 'reject'
                });
                return true;
              }
            } catch (error) {
              return false;
            }
          }
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
          .then(response => {
            if (response.ok) {
            } else {
            }
          })
          .catch(error => {
          });
        }
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
        ...prev.filter(n => !(n.type === 'skillmate' && n.subtype === 'request' && n.requestId === skillMateRequest._id)),
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
        ...prev.filter(n => !(n.type === 'skillmate' && n.subtype === 'request' && n.requestId === skillMateRequest._id)),
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
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [goldenCoins, setGoldenCoins] = useState(0);
  const [silverCoins, setSilverCoins] = useState(0);
  const [activeVideoCall, setActiveVideoCall] = useState(null);
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
      
      const filteredNotifications = notifications.filter(notification => {
        if (!notification.timestamp) return true;
        return (now - notification.timestamp) < TWENTY_FOUR_HOURS;
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
    window.addEventListener("storage", handleAuthChange);
    window.addEventListener("authChanged", handleAuthChange);
    return () => {
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("authChanged", handleUser);
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
      const username = searchQuery.trim();
      if (location.pathname.startsWith("/profile/")) {
        navigate(`/profile/${username}`, { replace: true });
      } else {
        navigate(`/profile/${username}`);
      }
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
      <nav className="fixed top-0 left-0 w-full bg-gradient-to-br from-[#e8f1ff] to-[#dbeaff] text-blue-800 px-2 sm:px-4 md:px-6 lg:px-8 py-1.5 sm:py-2 shadow-md border-b border-blue-200 z-50 animate-fadeIn">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left: Logo */}
          <div
            className="flex items-center gap-1 cursor-pointer transition-transform duration-300 hover:scale-105"
            onClick={() => navigate("/")}
          >
            <img
              src="/assets/skillswap-logo.webp"
              alt="SkillSwapHub Logo"
              className="h-7 sm:h-8 w-7 sm:w-8 object-contain rounded-full shadow-md border-2 border-blue-800"
            />
            <span className="text-xs sm:text-base font-bold text-blue-800 font-lora">
              SkillSwapHub
            </span>
          </div>

          {/* Right: Mobile Menu Button, Desktop Search, Auth/Profile */}
          <div className="flex items-center gap-1 sm:gap-3">
            {/* Desktop Search Bar */}
            <div className="hidden sm:flex flex-1 max-w-[200px] md:max-w-xs">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search SkillMate..."
                    className="pl-8 pr-3 py-1.5 text-xs md:text-sm rounded-full bg-white border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-800 placeholder-blue-800 w-full font-nunito"
                  />
                  <button
                    type="submit"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 text-blue-800"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="hidden sm:flex items-center gap-2 md:gap-3">
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
                  className={`text-xs md:text-sm font-medium px-2 md:px-3 py-1 md:py-1.5 rounded-md transition-all duration-300 ${
                    isActive(path)
                      ? "bg-blue-100 text-blue-800 font-semibold border-b-2 border-blue-800"
                      : "text-blue-800 hover:bg-blue-50 hover:text-blue-800 hover:border-b-2 hover:border-blue-800 hover:scale-105"
                  }`}
                  onClick={() => navigate(path)}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* SkillCoin */}
            {isLoggedIn && (
              <div className="relative z-50">
                <button
                  className="flex items-center gap-2 px-2 py-1 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white rounded-2xl shadow-md border border-blue-600 hover:scale-105 hover:shadow-lg transition duration-300"
                  onClick={() => setShowCoinsDropdown((prev) => !prev)}
                  title="SkillCoin"
                  ref={coinsRef}
                >
                  <svg className="w-5 h-5" viewBox="0 0 64 64" fill="none">
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
                    <circle cx="32" cy="32" r="28" fill="url(#3d-coin-gold)" stroke="url(#coin-edge)" strokeWidth="4" />
                    <circle cx="32" cy="32" r="22" stroke="#fff8dc" strokeWidth="1.5" opacity="0.7" />
                    <text
                      x="32"
                      y="40"
                      fontSize="24"
                      fill="#1e3a8a"
                      fontWeight="bold"
                      textAnchor="middle"
                      filter="url(#coin-glow)"
                    >
                      S
                    </text>
                  </svg>
                  <span className="font-semibold text-xs font-nunito hidden md:inline">SkillCoin</span>
                </button>

                {showCoinsDropdown && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-blue-200 rounded-xl shadow-xl animate-fade-in-down backdrop-blur-sm">
                    <div className="p-3 space-y-2 text-sm font-medium text-gray-700">
                      <div className="flex items-center gap-2 p-1 rounded-md hover:bg-blue-50 transition">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 shadow-inner flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-900">G</span>
                        </div>
                        <span className="text-gray-800">Golden: {goldenCoins}</span>
                      </div>
                      <div className="flex items-center gap-2 p-1 rounded-md hover:bg-blue-50 transition">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 shadow-inner flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-900">S</span>
                        </div>
                        <span className="text-gray-800">Silver: {silverCoins}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notifications */}
            <Notifications notifications={notifications} setNotifications={setNotifications} iconSize="w-5 h-5" />

            {/* Auth/Profile */}
            {!isLoggedIn ? (
              <button
                className="bg-blue-800 text-white px-1.5 py-0.5 text-xs md:px-2 md:py-1 md:text-sm rounded-md font-medium transition-all duration-300 hover:bg-blue-700 hover:scale-105 font-nunito"
                onClick={handleLoginClick}
              >
                Login
              </button>
            ) : (
              <div className="relative">
               <button
  className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 border border-blue-300 shadow-sm transition-all duration-300 hover:bg-blue-200 hover:scale-105"
  onClick={() => setShowProfileMenu((v) => !v)}
  title="Profile"
  ref={menuRef}
>
  <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
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

            {/* Mobile Menu Button */}
            <button
              className="sm:hidden p-1.5 rounded-md text-blue-800 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
            setActiveVideoCall(null);
          }}
          userRole="Participant"
        />
      )}
    </>
  );
};

export default Navbar;
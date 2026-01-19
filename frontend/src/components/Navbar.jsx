import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useModal } from '../context/ModalContext';
import { useAuth } from '../context/AuthContext';
import MobileMenu from './MobileMenu';
import ProfileDropdown from './ProfileDropdown';
import Notifications from './Navbar/Notifications';
import VideoCall from './VideoCall';
import { BACKEND_URL } from '../config.js';
import socket from '../socket.js';

// useSessionSocketNotifications hook for handling socket notifications
function useSessionSocketNotifications(setNotifications, setActiveVideoCall, setSilverCoins, setBronzeCoins) {
  useEffect(() => {
    const userCookie = Cookies.get('user');
    const user = userCookie ? JSON.parse(userCookie) : null;

    if (user && user._id) {
      socket.emit('register', user._id);
    }

    socket.on('session-request-received', (data) => {
      const { sessionRequest, requester } = data;
      setNotifications((prev) => {
        const updated = [
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
              } catch {
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
              } catch {
                return false;
              }
            },
          },
          ...prev,
        ];
        localStorage.setItem('notifications', JSON.stringify(updated));
        return updated;
      });
    });

    socket.on('session-request-updated', (data) => {
      const { sessionRequest, action } = data;
      setNotifications((prev) => {
        const updated = [
          {
            type: 'session-request-response',
            sessionRequest,
            action,
            message: `Your session request was ${action}ed by ${sessionRequest.tutor.firstName} ${sessionRequest.tutor.lastName}`,
            timestamp: Date.now(),
            read: false,
          },
          ...prev,
        ];
        localStorage.setItem('notifications', JSON.stringify(updated));
        return updated;
      });
    });

    socket.on('session-requested', (session) => {
      setNotifications((prev) => {
        const updated = [
          {
            type: 'session-requested',
            session,
            sessionId: session._id,
            message: `You have a new session request from ${session.requester?.name || session.requester?.firstName || 'a user'}.`,
            timestamp: Date.now(),
            read: false,
          },
          ...prev,
        ];
        localStorage.setItem('notifications', JSON.stringify(updated));
        return updated;
      });
    });

    socket.on('session-approved', (session) => {
      setNotifications((prev) => {
        const updated = [
          {
            type: 'session-approved',
            session,
            message: `Your session request was approved by ${session.creator?.firstName || 'the tutor'}.`,
            timestamp: Date.now(),
            read: false,
          },
          ...prev,
        ];
        localStorage.setItem('notifications', JSON.stringify(updated));
        return updated;
      });
    });

    socket.on('session-rejected', (session) => {
      setNotifications((prev) => {
        const updated = [
          {
            type: 'session-rejected',
            session,
            message: `Your session request was rejected by ${session.creator?.firstName || 'the tutor'}.`,
            timestamp: Date.now(),
            read: false,
          },
          ...prev,
        ];
        localStorage.setItem('notifications', JSON.stringify(updated));
        return updated;
      });
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
            .catch(() => {
              // Handle error if needed
            });
        },
      };
      setNotifications((prev) => {
        const updated = [newNotification, ...prev];
        localStorage.setItem('notifications', JSON.stringify(updated));
        return updated;
      });
    });

    socket.on('session-cancelled', (data) => {
      setNotifications((prev) => {
        const updated = [
          {
            type: 'session-cancelled',
            session: data,
            message: data.message || 'The user has cancelled the session.',
            timestamp: Date.now(),
            read: false,
          },
          ...prev,
        ];
        localStorage.setItem('notifications', JSON.stringify(updated));
        return updated;
      });
    });

    socket.on('skillmate-request-received', (data) => {
      const { skillMateRequest, requester } = data;
      setNotifications((prev) => {
        const updated = [
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
        ];
        localStorage.setItem('notifications', JSON.stringify(updated));
        return updated;
      });
    });

    socket.on('skillmate-request-sent', (data) => {
      const { skillMateRequest, recipient } = data;
      setNotifications((prev) => {
        const updated = [
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
        ];
        localStorage.setItem('notifications', JSON.stringify(updated));
        return updated;
      });
    });

    socket.on('skillmate-request-approved', (data) => {
      const { skillMateRequest, approver, requester } = data;
      const userCookie = Cookies.get('user');
      const user = userCookie ? JSON.parse(userCookie) : null;
      const isRequester = user && user._id === requester._id;
      const otherUser = isRequester ? approver : requester;

      setNotifications((prev) => {
        const updated = [
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
        ];
        localStorage.setItem('notifications', JSON.stringify(updated));
        return updated;
      });
    });

    socket.on('skillmate-request-rejected', (data) => {
      const { skillMateRequest, rejecter, requester } = data;
      const userCookie = Cookies.get('user');
      const user = userCookie ? JSON.parse(userCookie) : null;
      const isRequester = user && user._id === requester._id;
      const otherUser = isRequester ? rejecter : requester;

      setNotifications((prev) => {
        const updated = [
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
        ];
        localStorage.setItem('notifications', JSON.stringify(updated));
        return updated;
      });
    });

    // Listen for coin balance updates
    if (typeof setSilverCoins === 'function') {
      socket.on('coins-updated', (data) => {
        if (data && typeof data.silver === 'number') {
          setSilverCoins(data.silver);
          if (typeof setBronzeCoins === 'function' && typeof data.bronze === 'number') {
            setBronzeCoins(data.bronze);
          }
        }
      });
    }

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
      if (typeof setSilverCoins === 'function') {
        socket.off('coins-updated');
      }
    };
  }, [setNotifications, setActiveVideoCall, setSilverCoins]);
}

const Navbar = () => {
  const { openLogin } = useModal();
  const { user: authUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(!!Cookies.get('user'));
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCoinsDropdown, setShowCoinsDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [silverCoins, setSilverCoins] = useState(0);
  const [bronzeCoins, setBronzeCoins] = useState(0);
  const [user, setUser] = useState(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [isInterviewAvailable, setIsInterviewAvailable] = useState(true); // Interview availability
  const [isTogglingInterview, setIsTogglingInterview] = useState(false);
  const [interviewerStatus, setInterviewerStatus] = useState(null); // approved, pending, null
  const [activeVideoCall, setActiveVideoCall] = useState(null);
  const [pendingRequestCounts, setPendingRequestCounts] = useState({
    session: 0,
    expert: 0,
    skillmate: 0,
    interview: 0,
    campus: 0,
  });
  const menuRef = useRef();
  const coinsRef = useRef();
  const searchRef = useRef();
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Sync user from cookie and set availability
  useEffect(() => {
    const userCookie = Cookies.get('user');
    if (userCookie) {
      try {
        const parsedUser = JSON.parse(userCookie);
        setUser(parsedUser);
        setIsAvailable(parsedUser.isAvailableForSessions ?? true);
        setIsInterviewAvailable(parsedUser.isAvailableForInterviews ?? true);
      } catch (e) {
        console.error('Failed to parse user cookie:', e);
      }
    }
  }, []);

  // Listen for availability updates via Socket.IO
  useEffect(() => {
    if (!user) return;

    const handleAvailabilityUpdate = (data) => {
      console.log('[Navbar Availability] Received update:', data);
      setIsAvailable(data.isAvailableForSessions);
      // Update cookie
      const updatedUser = { ...user, isAvailableForSessions: data.isAvailableForSessions };
      setUser(updatedUser);
      Cookies.set('user', JSON.stringify(updatedUser));
      if (authUser && updateUser) {
        updateUser(updatedUser);
      }
    };

    const handleInterviewAvailabilityUpdate = (data) => {
      console.log('[Navbar Interview Availability] Received update:', data);
      setIsInterviewAvailable(data.isAvailableForInterviews);
      // Update cookie
      const updatedUser = { ...user, isAvailableForInterviews: data.isAvailableForInterviews };
      setUser(updatedUser);
      Cookies.set('user', JSON.stringify(updatedUser));
      if (authUser && updateUser) {
        updateUser(updatedUser);
      }
    };

    socket.on('availability-updated', handleAvailabilityUpdate);
    socket.on('interview-availability-updated', handleInterviewAvailabilityUpdate);

    return () => {
      socket.off('availability-updated', handleAvailabilityUpdate);
      socket.off('interview-availability-updated', handleInterviewAvailabilityUpdate);
    };
  }, [user, authUser, updateUser]);

  // Fetch interviewer status and availability
  useEffect(() => {
    const fetchInterviewerStatus = async () => {
      if (!user) {
        setInterviewerStatus(null);
        setIsInterviewAvailable(true);
        return;
      }
      
      try {
        const res = await fetch(`${BACKEND_URL}/api/interview/verification-status`, {
          credentials: 'include',
        });
        
        if (res.ok) {
          const data = await res.json();
          setInterviewerStatus(data.status);
          setIsInterviewAvailable(data.isAvailable ?? true);
        }
      } catch (error) {
        console.error('[Navbar] Failed to fetch interviewer status:', error);
      }
    };

    fetchInterviewerStatus();
  }, [user]);

  // Fetch coins from backend
  const fetchCoins = async () => {
    try {
      console.log('[Navbar] Fetching coins from:', `${BACKEND_URL}/api/auth/coins`);
      const response = await fetch(`${BACKEND_URL}/api/auth/coins`, {
        credentials: 'include',
      });
      console.log('[Navbar] Coins response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('[Navbar] Coins data received:', data);
        setSilverCoins(data.silver || 0);
        setBronzeCoins(data.bronze || 0);
        console.log('[Navbar] Coins state updated - Silver:', data.silver, 'Bronze:', data.bronze);
      } else {
        console.warn('[Navbar] Coins fetch failed with status:', response.status);
      }
    } catch (error) {
      console.error('[Navbar] Failed to fetch coins:', error);
    }
  };

  // Handle availability toggle
  const handleToggleAvailability = async () => {
    if (isToggling) return;
    
    // Optimistically update UI immediately
    const newAvailability = !isAvailable;
    setIsAvailable(newAvailability);
    setIsToggling(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/toggle-availability`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        // Socket will handle the real-time update, but we confirm here as fallback
        console.log('[Toggle] Session availability updated:', data.isAvailableForSessions);
      } else {
        // Revert on error
        setIsAvailable(!newAvailability);
        const errorData = await response.json();
        console.error('Failed to toggle availability:', errorData.message);
      }
    } catch (error) {
      // Revert on error
      setIsAvailable(!newAvailability);
      console.error('Error toggling availability:', error);
    } finally {
      setIsToggling(false);
    }
  };

  // Handle interview availability toggle
  const handleToggleInterviewAvailability = async () => {
    if (isTogglingInterview || interviewerStatus !== 'approved') return;
    
    // Optimistically update UI immediately
    const newAvailability = !isInterviewAvailable;
    setIsInterviewAvailable(newAvailability);
    setIsTogglingInterview(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/interview/toggle-availability`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        // Socket will handle the real-time update, but we confirm here as fallback
        console.log('[Toggle] Interview availability updated:', data.isAvailable);
      } else {
        // Revert on error
        setIsInterviewAvailable(!newAvailability);
        const errorData = await response.json();
        console.error('Failed to toggle interview availability:', errorData.error);
      }
    } catch (error) {
      // Revert on error
      setIsInterviewAvailable(!newAvailability);
      console.error('Error toggling interview availability:', error);
    } finally {
      setIsTogglingInterview(false);
    }
  };

  // Fetch pending request counts for Requests tab badge
  const fetchPendingRequestCounts = async () => {
    try {
      const userCookie = Cookies.get('user');
      if (!userCookie) {
        setPendingRequestCounts({ session: 0, expert: 0, skillmate: 0, interview: 0, campus: 0 });
        return;
      }

      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      const [sessionRes, expertRes, skillmateReceivedRes, skillmateSentRes, interviewRes, campusRes] = await Promise.allSettled([
        fetch(`${BACKEND_URL}/api/session-requests/all`, { credentials: 'include' }),
        fetch(`${BACKEND_URL}/api/session-requests/expert`, { credentials: 'include' }),
        fetch(`${BACKEND_URL}/api/skillmates/requests/received`, { credentials: 'include' }),
        fetch(`${BACKEND_URL}/api/skillmates/requests/sent`, { credentials: 'include' }),
        fetch(`${BACKEND_URL}/api/interview/requests`, { credentials: 'include' }),
        fetch(`${BACKEND_URL}/api/session-requests/campus`, { credentials: 'include' }),
      ]);

      let sessionPending = 0;
      if (sessionRes.status === 'fulfilled' && sessionRes.value.ok) {
        const data = await sessionRes.value.json();
        const received = Array.isArray(data.received) ? data.received : [];
        const sent = Array.isArray(data.sent) ? data.sent : [];
        const all = [...received, ...sent];
        // Match SessionRequests.jsx: only last 2 days are visible
        sessionPending = all.filter((r) => {
          const status = (r.status || '').toLowerCase();
          if (status !== 'pending') return false;
          const createdAt = new Date(r.createdAt || r.requestedAt);
          return !createdAt || isNaN(createdAt.getTime()) || createdAt >= twoDaysAgo;
        }).length;
      }

      let expertPending = 0;
      if (expertRes.status === 'fulfilled' && expertRes.value.ok) {
        const data = await expertRes.value.json();
        const received = Array.isArray(data.received) ? data.received : [];
        const sent = Array.isArray(data.sent) ? data.sent : [];
        const all = [...received, ...sent];
        // Match expertSessionRequests filter: last 2 days only
        expertPending = all.filter((r) => {
          const status = (r.status || '').toLowerCase();
          if (status !== 'pending') return false;
          const createdAt = new Date(r.createdAt || r.requestedAt);
          return !createdAt || isNaN(createdAt.getTime()) || createdAt >= twoDaysAgo;
        }).length;
      }

      let skillmatePending = 0;
      if (
        skillmateReceivedRes.status === 'fulfilled' &&
        skillmateReceivedRes.value.ok &&
        skillmateSentRes.status === 'fulfilled' &&
        skillmateSentRes.value.ok
      ) {
        const receivedData = await skillmateReceivedRes.value.json();
        const sentData = await skillmateSentRes.value.json();
        const receivedList = Array.isArray(receivedData) ? receivedData : [];
        const sentList = Array.isArray(sentData) ? sentData : [];
        const all = [...receivedList, ...sentList];
        skillmatePending = all.filter((r) => (r.status || '').toLowerCase() === 'pending').length;
      }

      let interviewPending = 0;
      if (interviewRes.status === 'fulfilled' && interviewRes.value.ok) {
        const data = await interviewRes.value.json();
        const received = Array.isArray(data.received) ? data.received : [];
        const sent = Array.isArray(data.sent) ? data.sent : [];
        const all = [...received, ...sent];

        // First apply the same visibility filter as SessionRequests.jsx:
        // - keep all 'scheduled' interviews regardless of age
        // - for others, only keep last 2 days
        const visible = all.filter((req) => {
          const status = (req.status || '').toLowerCase();
          if (status === 'scheduled') return true;
          const createdAt = new Date(req.createdAt || req.requestedAt);
          return !createdAt || isNaN(createdAt.getTime()) || createdAt >= twoDaysAgo;
        });

        // From the visible list, count items still pending to complete
        interviewPending = visible.filter((r) => {
          const status = (r.status || '').toLowerCase();
          return status === 'pending' || status === 'scheduled';
        }).length;
      }

      let campusPending = 0;
      if (campusRes.status === 'fulfilled' && campusRes.value.ok) {
        const data = await campusRes.value.json();
        const received = Array.isArray(data.received) ? data.received : [];
        const sent = Array.isArray(data.sent) ? data.sent : [];
        const all = [...received, ...sent];
        // Match campusRequests filter: last 2 days only
        campusPending = all.filter((r) => {
          const status = (r.status || '').toLowerCase();
          if (status !== 'pending') return false;
          const createdAt = new Date(r.createdAt || r.requestedAt);
          return !createdAt || isNaN(createdAt.getTime()) || createdAt >= twoDaysAgo;
        }).length;
      }

      setPendingRequestCounts({
        session: sessionPending,
        expert: expertPending,
        skillmate: skillmatePending,
        interview: interviewPending,
        campus: campusPending,
      });
    } catch (error) {
      console.error('[Navbar] Failed to fetch pending request counts:', error);
    }
  };

  // Verify login via backend (useful after OAuth redirects)
  const verifyLogin = async () => {
    try {
      const resp = await fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' });
      if (resp.ok) {
        const me = await resp.json();
        const userObj = me && me.user ? me.user : me;
        if (userObj && userObj._id) {
          setIsLoggedIn(true);
          try {
            Cookies.set('user', JSON.stringify(userObj), { sameSite: 'none', secure: true });
          } catch {}
          socket.emit('register', userObj._id);
          await fetchCoins();
          await fetchPendingRequestCounts();
        }
      }
    } catch {}
  };

  // Load notifications from localStorage and sync with socket
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed);
      } catch {
        localStorage.removeItem('notifications');
        setNotifications([]);
      }
    }
    // Trigger socket reconnect to ensure immediate notification sync
    const userCookie = Cookies.get('user');
    const user = userCookie ? JSON.parse(userCookie) : null;
    if (user && user._id) {
      socket.emit('register', user._id);
      // Fetch coins on mount if logged in
      fetchCoins();
      fetchPendingRequestCounts();
    } else {
      // Attempt to verify session from backend (handles OAuth callback flows)
      verifyLogin();
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

  // Enhanced login state detection with fast polling
  useEffect(() => {
    let lastCookie = Cookies.get('user');
    const checkLoginStatus = async () => {
      const userCookie = Cookies.get('user');
      if (userCookie !== lastCookie) {
        const newLoginState = !!userCookie;
        setIsLoggedIn(newLoginState);
        lastCookie = userCookie;
        if (newLoginState) {
          // Fetch coins on login
          fetchCoins();
          fetchPendingRequestCounts();
          // Re-register socket on login
          const user = userCookie ? JSON.parse(userCookie) : null;
          if (user && user._id) {
            socket.emit('register', user._id);
          }
        } else {
          setSilverCoins(0);
          setNotifications([]);
        }
      }
    };

    checkLoginStatus();
    const cookiePoll = setInterval(checkLoginStatus, 100); // Poll every 100ms
    const handleAuthChange = () => checkLoginStatus();

    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('authChanged', handleAuthChange);
    // Also try backend verification shortly after auth change
    const verifyTimer = setTimeout(() => verifyLogin(), 300);

    return () => {
      clearInterval(cookiePoll);
      clearTimeout(verifyTimer);
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('authChanged', handleAuthChange);
    };
  }, [isLoggedIn]);

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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      setShowSuggestions(false);
    }
  };

  const handleLoginClick = () => {
    openLogin();
    setTimeout(() => {
      window.dispatchEvent(new Event('authChanged'));
    }, 100);
  };

  useEffect(() => {
    const handleRequestSent = (e) => {
              setNotifications((prev) => {
                const updated = [
                  { type: 'request', tutor: e.detail.tutor, onCancel: e.detail.onCancel },
                  ...prev,
                ];
                localStorage.setItem('notifications', JSON.stringify(updated));
                return updated;
              });
    };
    const handleAddSessionRequestNotification = (e) => {
              setNotifications((prev) => {
                const updated = [
                  {
                    type: 'session',
                    tutor: e.detail.tutor,
                    onAccept: e.detail.onAccept,
                    onReject: e.detail.onReject,
                  },
                  ...prev,
                ];
                localStorage.setItem('notifications', JSON.stringify(updated));
                return updated;
              });
    };
    const handleSessionRequestResponse = (e) => {
              setNotifications((prev) => {
                const updated = [
                  {
                    type: 'text',
                    message: `Your request to ${e.detail.tutor.name} has been ${e.detail.status}.`,
                  },
                  ...prev.filter(
                    (n) =>
                      !(n.type === 'request' && n.tutor && n.tutor.name === e.detail.tutor.name) &&
                      !(n.type === 'session' && n.tutor && n.tutor.name === e.detail.tutor.name),
                  ),
                ];
                localStorage.setItem('notifications', JSON.stringify(updated));
                return updated;
              });
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

  useSessionSocketNotifications(setNotifications, setActiveVideoCall, setSilverCoins, setBronzeCoins);

  // Listen for request count updates from SessionRequests page (dual approach)
  useEffect(() => {
    // 1. CustomEvent listener - for same-page instant updates
    const handleRequestCountChanged = (event) => {
      console.log('[Navbar] 🎯 Received CustomEvent requestCountChanged:', event.detail);
      if (event.detail) {
        setPendingRequestCounts({
          session: event.detail.session || 0,
          expert: event.detail.expert || 0,
          skillmate: event.detail.skillmate || 0,
          interview: event.detail.interview || 0,
          campus: event.detail.campus || 0,
        });
        console.log('[Navbar] ✅ Updated counts via CustomEvent to:', event.detail);
      }
    };

    // 2. Socket.IO listener - for cross-page real-time updates
    const handleSocketCountUpdate = (data) => {
      console.log('[Navbar] 📡 Received socket request-count-update:', data);
      if (data && data.counts) {
        setPendingRequestCounts({
          session: data.counts.session || 0,
          expert: data.counts.expert || 0,
          skillmate: data.counts.skillmate || 0,
          interview: data.counts.interview || 0,
          campus: data.counts.campus || 0,
        });
        console.log('[Navbar] ✅ Updated counts via Socket to:', data.counts);
      }
    };

    window.addEventListener('requestCountChanged', handleRequestCountChanged);
    socket.on('request-count-update', handleSocketCountUpdate);
    console.log('[Navbar] 👂 Listening for request count updates (CustomEvent + Socket)');

    return () => {
      window.removeEventListener('requestCountChanged', handleRequestCountChanged);
      socket.off('request-count-update', handleSocketCountUpdate);
    };
  }, []);

  // Recompute pending request counts when notifications change (debounced via length)
  useEffect(() => {
    fetchPendingRequestCounts();
  }, [notifications.length]);

  // Live suggestions: fetch users from backend on query change (debounced)
  useEffect(() => {
    let timeout;
    let abortController;
    const run = async () => {
      const q = searchQuery.trim();
      if (q.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      setSearchLoading(true);
      abortController = new AbortController();
      const url = `${BACKEND_URL}/api/auth/search/users?q=${encodeURIComponent(q)}&limit=8`;
      
      try {
        const response = await fetch(url, { 
          signal: abortController.signal,
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const results = Array.isArray(data.results) ? data.results : [];
          console.log('[Navbar] Search results:', results);
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
        } else {
          console.error('[Navbar] Search failed with status:', response.status);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('[Navbar] Search error:', error);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } finally {
        setSearchLoading(false);
      }
    };

    timeout = setTimeout(run, 300); // debounce
    return () => {
      clearTimeout(timeout);
      if (abortController) abortController.abort();
    };
  }, [searchQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMobileMenu = () => setMenuOpen((open) => !open);

  const totalPendingRequests =
    pendingRequestCounts.session +
    pendingRequestCounts.expert +
    pendingRequestCounts.skillmate +
    pendingRequestCounts.interview +
    pendingRequestCounts.campus;

  return (
    <>
      <nav className="fixed top-0 left-0 w-full h-[64px] sm:h-[72px] bg-[#F5F9FF] text-blue-900 px-3 sm:px-4 shadow-md border-b border-gray-200/50 z-50 backdrop-blur-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto h-full">
          {/* Logo */}
          <div
            className="flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-transform duration-300 hover:scale-105 flex-shrink-0"
            onClick={() => navigate('/')}
          >
            <img
              src="https://res.cloudinary.com/dbltazdsa/image/upload/v1766589377/webimages/skillswap-logo.png"
              alt="SkillSwapHub Logo"
              className="h-9 w-9 md:h-10 md:w-10 lg:h-12 lg:w-12 object-contain rounded-full shadow-md border-2 border-blue-900"
            />
            <span className="text-sm md:text-base lg:text-lg font-extrabold text-blue-900 font-lora tracking-wide drop-shadow-md">
              SkillSwapHub
            </span>
          </div>

          {/* Desktop/Tablet Navigation */}
          <div className="hidden md:flex items-center gap-1.5 lg:gap-3 xl:gap-4">
            {[
              { path: '/home', label: 'Home' },
              { path: '/one-on-one', label: '1-on-1' },
              { path: '/interview', label: 'Interview' },
              { path: '/session-requests', label: 'Requests' },
              { path: '/quizement', label: 'Quizement' },
            ].map(({ path, label }) => (
              <button
                key={path}
                className={`text-[11px] lg:text-xs xl:text-sm font-bold px-2 md:px-2.5 lg:px-3 py-1.5 rounded-full text-blue-900 bg-blue-100/50 shadow-sm transition-all duration-300 whitespace-nowrap ${
                  isActive(path)
                    ? 'bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-md'
                    : 'hover:bg-gradient-to-r hover:from-blue-900 hover:to-blue-800 hover:text-white hover:shadow-md hover:scale-105'
                } touch-manipulation`}
                onClick={() => navigate(path)}
              >
                <span className="flex items-center gap-1">
                  <span>{label}</span>
                  {path === '/session-requests' && totalPendingRequests > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500 text-white">
                      {totalPendingRequests}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>

          {/* Right Side: Icons and Search */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 overflow-visible">
            {/* Search - only show when logged in and on large screens */}
            {isLoggedIn && <form onSubmit={handleSearch} className="hidden lg:flex items-center" ref={searchRef}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Skillmate..."
                  className="w-44 xl:w-56 2xl:w-64 pl-8 pr-3 py-1.5 text-xs rounded-full bg-white border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-900 placeholder-blue-400 font-nunito shadow-sm"
                />
                <button
                  type="submit"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 text-blue-900"
                  aria-label="Search"
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
                {(showSuggestions || searchLoading) && (
                  <div className="absolute top-full mt-2 left-0 w-80 bg-white border-2 border-blue-300 rounded-xl shadow-2xl overflow-hidden z-[9999]">
                    <div className="max-h-96 overflow-y-auto">
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
                          <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
                            <p className="text-xs font-semibold text-blue-900">
                              Found {suggestions.length} user{suggestions.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          {suggestions.map((u) => (
                            <button
                              key={u._id}
                              type="button"
                              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-50 text-left transition-colors border-b border-gray-100 last:border-0"
                              onClick={() => {
                                setShowSuggestions(false);
                                setSearchQuery('');
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
                  </div>
                )}
              </div>
            </form>}

            {isLoggedIn ? (
              <>
                {/* SkillCoin - Hidden on mobile */}
                <div className="hidden md:flex relative flex-shrink-0">
                  <button
                    className="w-9 h-9 min-w-[36px] min-h-[36px] lg:w-10 lg:h-10 rounded-full bg-blue-800 text-white flex items-center justify-center shadow-md border border-blue-700 hover:scale-105 transition duration-300 touch-manipulation"
                    onClick={() => setShowCoinsDropdown((prev) => !prev)}
                    title="SkillCoin"
                    ref={coinsRef}
                    aria-label="View SkillCoin balance"
                  >
                    <svg className="w-4 h-4 lg:w-5 lg:h-5" viewBox="0 0 24 24" fill="none">
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
                    <div className="absolute right-0 mt-2 w-44 bg-white border border-blue-200 rounded-lg shadow-xl animate-fade-in-down backdrop-blur-sm z-50">
                      <div className="p-3 space-y-2 text-xs font-medium text-gray-700">
                        <div className="flex items-center gap-2 p-2 rounded-md hover:bg-blue-50 transition">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 shadow-inner flex items-center justify-center">
                            <span className="text-[10px] font-bold text-blue-900">S</span>
                          </div>
                          <span className="text-gray-800">Silver: {silverCoins}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-md hover:bg-blue-50 transition">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-200 via-orange-400 to-orange-600 shadow-inner flex items-center justify-center">
                            <span className="text-[10px] font-bold text-blue-900">B</span>
                          </div>
                          <span className="text-gray-800">Bronze: {bronzeCoins}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchCoins();
                          }}
                          className="w-full mt-1 p-2 text-xs text-blue-600 hover:bg-blue-50 rounded-md transition flex items-center justify-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Refresh
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notifications - Now visible on mobile */}
                <div className="flex flex-shrink-0">
                  <Notifications
                    notifications={notifications}
                    setNotifications={setNotifications}
                    iconSize="w-5 h-5"
                    className="relative flex items-center justify-center"
                    dropdownClassName="absolute right-0 mt-2 w-64 bg-white border border-blue-200 rounded-lg shadow-xl animate-fade-in-down backdrop-blur-sm z-50"
                  />
                </div>

                {/* Profile - Now visible on mobile */}
                <div className="flex relative flex-shrink-0">
                  <button
                    className="w-9 h-9 min-w-[36px] min-h-[36px] lg:w-10 lg:h-10 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center border border-blue-300 shadow-md hover:bg-blue-200 hover:scale-105 transition-all duration-300 touch-manipulation"
                    onClick={() => setShowProfileMenu((v) => !v)}
                    title="Profile"
                    ref={menuRef}
                    aria-label="Open profile menu"
                  >
                    <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                    </svg>
                  </button>
                  {showProfileMenu && (
                    <ProfileDropdown
                      show={showProfileMenu}
                      onClose={() => setShowProfileMenu(false)}
                      navigate={navigate}
                      menuRef={menuRef}
                      isAvailable={isAvailable}
                      isToggling={isToggling}
                      handleToggleAvailability={handleToggleAvailability}
                      isInterviewAvailable={isInterviewAvailable}
                      isTogglingInterview={isTogglingInterview}
                      handleToggleInterviewAvailability={handleToggleInterviewAvailability}
                      interviewerStatus={interviewerStatus}
                    />
                  )}
                </div>
              </>
            ) : (
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-blue-800 rounded-full shadow-md hover:bg-blue-700 hover:scale-105 transition-all duration-300 font-nunito touch-manipulation"
                onClick={handleLoginClick}
                aria-label="Login to SkillSwapHub"
              >
                Login
              </button>
            )}

            {/* Hamburger (only visible on mobile) */}
            <button
              className="md:hidden w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-blue-100 text-blue-900 flex items-center justify-center border border-blue-300 shadow-md hover:bg-blue-200 hover:scale-105 transition-all duration-300 touch-manipulation flex-shrink-0 ml-2"
              onClick={handleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      </nav>

      {/* Mobile Menu (only rendered on mobile) */}
      {menuOpen && window.innerWidth < 768 && (
        <MobileMenu
          isOpen={menuOpen}
          isLoggedIn={isLoggedIn}
          navigate={navigate}
          setShowProfileMenu={setShowProfileMenu}
          showProfileMenu={showProfileMenu}
          menuRef={menuRef}
          setMenuOpen={setMenuOpen}
          ProfileDropdown={ProfileDropdown}
          silverCoins={silverCoins}
          bronzeCoins={bronzeCoins}
          notifications={notifications}
          setNotifications={setNotifications}
          handleLoginClick={handleLoginClick}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearch={handleSearch}
          isActive={isActive}
          user={user}
          isAvailable={isAvailable}
          handleToggleAvailability={handleToggleAvailability}
          isToggling={isToggling}
          isInterviewAvailable={isInterviewAvailable}
          handleToggleInterviewAvailability={handleToggleInterviewAvailability}
          isTogglingInterview={isTogglingInterview}
          interviewerStatus={interviewerStatus}
          searchRef={searchRef}
          suggestions={suggestions}
          showSuggestions={showSuggestions}
          setShowSuggestions={setShowSuggestions}
          searchLoading={searchLoading}
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
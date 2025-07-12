import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { BACKEND_URL } from '../config.js';

// Helper: Remove notifications older than 12 hours or completed
function filterNotifications(notifications) {
  const TWELVE_HOURS = 12 * 60 * 60 * 1000;
  const now = Date.now();
  return notifications.filter((n) => {
    if (n && n.completed) return false;
    if (n.timestamp && now - n.timestamp > TWELVE_HOURS) return false;
    return true;
  });
}

const NotificationSection = ({ notifications = [], onClear, onUpdate }) => {
  const [show, setShow] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const dropdownRef = useRef();
  const [loading, setLoading] = useState({});
  const location = useLocation();

  // Debug: Log incoming notifications and route
  useEffect(() => {
    console.log("Notifications received:", notifications);
    console.log("Current route:", location.pathname);
  }, [notifications, location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!show) return;
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShow(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show]);

  // Periodically clear old or completed notifications
  useEffect(() => {
    const interval = setInterval(() => {
      if (onUpdate) {
        const filtered = filterNotifications(notifications);
        if (filtered.length !== notifications.length) {
          console.log("Filtered old/completed notifications:", filtered);
          onUpdate(filtered);
        }
      }
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [notifications, onUpdate]);

  // Clear all notifications
  const handleClear = () => {
    console.log("Clearing all notifications");
    if (onClear) {
      onClear();
      localStorage.removeItem('notifications');
    }
  };

  // Mark notification as read
  const handleNotificationRead = (index) => {
    console.log("Marking notification as read at index:", index);
    const updatedNotifications = notifications.map((notification, i) => {
      if (i === index) {
        return { ...notification, read: true };
      }
      return notification;
    });
    if (onUpdate) {
      onUpdate(updatedNotifications);
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    }
  };

  // Handle approve session request
  const handleApproveSession = async (sessionId, index) => {
    console.log("Approving session:", sessionId, "at index:", index);
    setLoading((prev) => ({ ...prev, [`approve-${index}`]: true }));
    try {
      const response = await fetch(`${BACKEND_URL}/api/sessions/approve/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to approve session');
      }

      console.log('Session approved successfully');
      const updatedNotifications = notifications.filter((_, i) => i !== index);
      if (onUpdate) {
        onUpdate(updatedNotifications);
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      }
    } catch (error) {
      console.error('Error approving session:', error);
      alert('Failed to approve session. Please try again.');
    } finally {
      setLoading((prev) => ({ ...prev, [`approve-${index}`]: false }));
    }
  };

  // Handle reject session request
  const handleRejectSession = async (sessionId, index) => {
    console.log("Rejecting session:", sessionId, "at index:", index);
    setLoading((prev) => ({ ...prev, [`reject-${index}`]: true }));
    try {
      const response = await fetch(`${BACKEND_URL}/api/sessions/reject/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to reject session');
      }

      console.log('Session rejected successfully');
      const updatedNotifications = notifications.filter((_, i) => i !== index);
      if (onUpdate) {
        onUpdate(updatedNotifications);
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      }
    } catch (error) {
      console.error('Error rejecting session:', error);
      alert('Failed to reject session. Please try again.');
    } finally {
      setLoading((prev) => ({ ...prev, [`reject-${index}`]: false }));
    }
  };

  // Filter notifications based on route and tab
  const getFilteredNotifications = () => {
    const path = location.pathname.toLowerCase();
    let filtered = filterNotifications(notifications);

    const sessionRoutes = ['/one-on-one', '/discuss', '/interview', '/session'];
    const isSessionRoute = sessionRoutes.some((route) => path.includes(route));

    console.log("Active tab:", activeTab);
    console.log("Is session route:", isSessionRoute);

    // Route-based filtering
    if (isSessionRoute) {
      filtered = filtered.filter(
        (n) =>
          n.type === 'session-started' ||
          n.type === 'session-approved' ||
          n.type === 'session-rejected' ||
          n.type === 'session-cancelled' ||
          n.type === 'session-requested'
      );
    } else if (path.includes('/profile') || path.includes('/skillmate')) {
      filtered = filtered.filter((n) => n.type === 'skillmate');
    }

    // Tab-based filtering
    if (activeTab === 'session') {
      filtered = filtered.filter(
        (n) =>
          n.type === 'session-started' ||
          n.type === 'session-approved' ||
          n.type === 'session-rejected' ||
          n.type === 'session-cancelled' ||
          n.type === 'session-requested'
      );
    } else if (activeTab === 'skillmate') {
      filtered = filtered.filter((n) => n.type === 'skillmate');
    }

    console.log("Filtered notifications for display:", filtered);
    return filtered;
  };

  // Get session-specific message based on route
  const getSessionMessage = (notification, path) => {
    if (notification.message) return notification.message;
    if (path.includes('/one-on-one')) {
      return notification.type === 'session-started' ? 'One-on-One session started.' :
             notification.type === 'session-approved' ? 'Your One-on-One session request has been approved.' :
             notification.type === 'session-rejected' ? 'Your One-on-One session request has been rejected.' :
             notification.type === 'session-cancelled' ? 'Your One-on-One session has been cancelled.' :
             notification.type === 'session-requested' ? 'A new One-on-One session has been requested.' :
             'One-on-One session notification.';
    } else if (path.includes('/discuss')) {
      return notification.type === 'session-started' ? 'Group discussion session started.' :
             notification.type === 'session-approved' ? 'Your group discussion session request has been approved.' :
             notification.type === 'session-rejected' ? 'Your group discussion session request has been rejected.' :
             notification.type === 'session-cancelled' ? 'Your group discussion session has been cancelled.' :
             notification.type === 'session-requested' ? 'A new group discussion session has been requested.' :
             'Group discussion session notification.';
    } else if (path.includes('/interview')) {
      return notification.type === 'session-started' ? 'Interview session started.' :
             notification.type === 'session-approved' ? 'Your interview session request has been approved.' :
             notification.type === 'session-rejected' ? 'Your interview session request has been rejected.' :
             notification.type === 'session-cancelled' ? 'Your interview session has been cancelled.' :
             notification.type === 'session-requested' ? 'A new interview session has been requested.' :
             'Interview session notification.';
    } else {
      return notification.type === 'session-started' ? 'Session started.' :
             notification.type === 'session-approved' ? 'Your session request has been approved.' :
             notification.type === 'session-rejected' ? 'Your session request has been rejected.' :
             notification.type === 'session-cancelled' ? 'Your session has been cancelled.' :
             notification.type === 'session-requested' ? 'A new session has been requested.' :
             'Session notification.';
    }
  };

  // Calculate unread counts for each tab
  const getUnreadCounts = () => {
    const sessionTypes = ['session-started', 'session-approved', 'session-rejected', 'session-cancelled', 'session-requested'];
    const allUnread = notifications.filter((n) => n && !n.read).length;
    const sessionUnread = notifications.filter((n) => n && !n.read && sessionTypes.includes(n.type)).length;
    const skillmateUnread = notifications.filter((n) => n && !n.read && n.type === 'skillmate').length;
    return { all: allUnread, session: sessionUnread, skillmate: skillmateUnread };
  };

  const unreadCounts = getUnreadCounts();
  const filteredNotifications = getFilteredNotifications();

  return (
    <div className="relative">
      <button
        className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border-2 border-blue-300 transition-all duration-300 hover:bg-blue-200 hover:text-blue-700 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400"
        onClick={() => setShow((v) => !v)}
        title="Notifications"
        aria-label="Notifications"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCounts.all > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold animate-pulse">
            {unreadCounts.all}
          </span>
        )}
      </button>
      {show && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-[25vw] h-[100vh] bg-white border border-blue-200 rounded-xl shadow-2xl z-[2000] overflow-hidden transform transition-transform duration-300"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100 bg-blue-50">
            <span className="font-semibold text-lg text-blue-900">Notifications</span>
            <button
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              onClick={handleClear}
            >
              Clear All
            </button>
          </div>
          <div className="flex border-b border-blue-100 bg-blue-50">
            <button
              className={`flex-1 py-3 text-sm font-medium relative ${
                activeTab === 'all' ? 'bg-blue-100 text-blue-900 border-b-2 border-blue-500' : 'text-blue-600 hover:bg-blue-100'
              } transition-colors`}
              onClick={() => setActiveTab('all')}
            >
              All
              {unreadCounts.all > 0 && (
                <span className="absolute top-1 right-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold animate-pulse">
                  {unreadCounts.all}
                </span>
              )}
            </button>
            <button
              className={`flex-1 py-3 text-sm font-medium relative ${
                activeTab === 'session' ? 'bg-blue-100 text-blue-900 border-b-2 border-blue-500' : 'text-blue-600 hover:bg-blue-100'
              } transition-colors`}
              onClick={() => setActiveTab('session')}
            >
              Session
              {unreadCounts.session > 0 && (
                <span className="absolute top-1 right-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold animate-pulse">
                  {unreadCounts.session}
                </span>
              )}
            </button>
            <button
              className={`flex-1 py-3 text-sm font-medium relative ${
                activeTab === 'skillmate' ? 'bg-blue-100 text-blue-900 border-b-2 border-blue-500' : 'text-blue-600 hover:bg-blue-100'
              } transition-colors`}
              onClick={() => setActiveTab('skillmate')}
            >
              Skillmate
              {unreadCounts.skillmate > 0 && (
                <span className="absolute top-1 right-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold animate-pulse">
                  {unreadCounts.skillmate}
                </span>
              )}
            </button>
          </div>
          <ul className="h-[calc(100vh-120px)] overflow-y-auto divide-y divide-blue-50">
            {filteredNotifications.length === 0 ? (
              <li className="px-6 py-8 text-center text-gray-500 text-base">
                No {activeTab === 'all' ? '' : activeTab} notifications
              </li>
            ) : (
              filteredNotifications.map((n, idx) => (
                <li
                  key={idx}
                  className="px-6 py-4 text-blue-800 text-sm hover:bg-blue-50 cursor-pointer transition-colors duration-200"
                >
                  {n.type === 'session-started' ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="font-semibold text-green-700">Session Started</span>
                        {!n.read && (
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">NEW</span>
                        )}
                      </div>
                      <p className="text-gray-700">{getSessionMessage(n, location.pathname)}</p>
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => {
                            console.log('Join button clicked for session-started notification');
                            if (n.onJoin) n.onJoin();
                            handleNotificationRead(idx);
                          }}
                          className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors shadow-sm"
                        >
                          Join
                        </button>
                        <button
                          onClick={() => {
                            console.log('Cancel button clicked for session-started notification');
                            if (n.onCancel) n.onCancel();
                            handleNotificationRead(idx);
                          }}
                          className="px-4 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors shadow-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : n.type === 'session-approved' ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="font-semibold text-blue-700">Session Approved</span>
                      </div>
                      <p className="text-gray-700">{getSessionMessage(n, location.pathname)}</p>
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => handleNotificationRead(idx)}
                          className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          Mark as Read
                        </button>
                      </div>
                    </div>
                  ) : n.type === 'session-rejected' ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="font-semibold text-red-700">Session Rejected</span>
                      </div>
                      <p className="text-gray-700">{getSessionMessage(n, location.pathname)}</p>
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => handleNotificationRead(idx)}
                          className="px-4 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors shadow-sm"
                        >
                          Mark as Read
                        </button>
                      </div>
                    </div>
                  ) : n.type === 'session-cancelled' ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="font-semibold text-orange-700">Session Cancelled</span>
                        {!n.read && (
                          <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">NEW</span>
                        )}
                      </div>
                      <p className="text-gray-700">{getSessionMessage(n, location.pathname)}</p>
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => handleNotificationRead(idx)}
                          className="px-4 py-1.5 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 transition-colors shadow-sm"
                        >
                          Mark as Read
                        </button>
                      </div>
                    </div>
                  ) : n.type === 'session-requested' ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="font-semibold text-yellow-700">Session Request</span>
                        {!n.read && (
                          <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">NEW</span>
                        )}
                      </div>
                      <p className="text-gray-700">{getSessionMessage(n, location.pathname)}</p>
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => handleApproveSession(n.sessionId, idx)}
                          className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors shadow-sm"
                          disabled={loading[`approve-${idx}`]}
                        >
                          {loading[`approve-${idx}`] ? 'Approving...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => handleRejectSession(n.sessionId, idx)}
                          className="px-4 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors shadow-sm"
                          disabled={loading[`reject-${idx}`]}
                        >
                          {loading[`reject-${idx}`] ? 'Rejecting...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  ) : n.type === 'skillmate' ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="font-semibold text-purple-700">Skillmate Update</span>
                        {!n.read && (
                          <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">NEW</span>
                        )}
                      </div>
                      <p className="text-gray-700">{n.message || 'A new Skillmate update is available.'}</p>
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => handleNotificationRead(idx)}
                          className="px-4 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors shadow-sm"
                        >
                          Mark as Read
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                        <span className="font-semibold text-gray-700">General Notification</span>
                        {!n.read && (
                          <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">NEW</span>
                        )}
                      </div>
                      <p className="text-gray-700">{n.message || n.content || 'General notification.'}</p>
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => handleNotificationRead(idx)}
                          className="px-4 py-1.5 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors shadow-sm"
                        >
                          Mark as Read
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationSection;
import React, { useState, useRef, useEffect } from "react";
import { BACKEND_URL } from '../config.js';

// Helper: Remove notifications older than 12 hours or completed
function filterNotifications(notifications) {
  const TWELVE_HOURS = 12 * 60 * 60 * 1000;
  const now = Date.now();
  return notifications.filter((n) => {
    // If notification has a completed flag, remove it
    if (n.completed) return false;
    // If notification has a timestamp, remove if older than 12 hours
    if (n.timestamp && now - n.timestamp > TWELVE_HOURS) return false;
    return true;
  });
}

const NotificationSection = ({ notifications = [], onClear, onUpdate }) => {
  const [show, setShow] = useState(false);
  const dropdownRef = useRef();
  const [loading, setLoading] = useState({});

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

  // Periodically clear notifications older than 12 hours or completed
  useEffect(() => {
    const interval = setInterval(() => {
      if (onUpdate) {
        const filtered = filterNotifications(notifications);
        if (filtered.length !== notifications.length) {
          onUpdate(filtered);
        }
      }
    }, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, [notifications, onUpdate]);

  // Clear all notifications (manual clear)
  const handleClear = () => {
    if (onClear) {
      onClear();
      // Also clear localStorage
      localStorage.removeItem('notifications');
    }
  };

  // Mark notification as read
  const handleNotificationRead = (index) => {
    const updatedNotifications = notifications.map((notification, i) => {
      if (i === index) {
        return { ...notification, read: true };
      }
      return notification;
    });
    if (onUpdate) {
      onUpdate(updatedNotifications);
      // Also update localStorage
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    }
  };

  // Handle approve session request
  const handleApproveSession = async (sessionId, index) => {
    setLoading(prev => ({ ...prev, [`approve-${index}`]: true }));
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
      
      // Remove the notification
      const updatedNotifications = notifications.filter((_, i) => i !== index);
      if (onUpdate) {
        onUpdate(updatedNotifications);
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      }
    } catch (error) {
      console.error('Error approving session:', error);
      alert('Failed to approve session. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, [`approve-${index}`]: false }));
    }
  };

  // Handle reject session request
  const handleRejectSession = async (sessionId, index) => {
    setLoading(prev => ({ ...prev, [`reject-${index}`]: true }));
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
      
      // Remove the notification
      const updatedNotifications = notifications.filter((_, i) => i !== index);
      if (onUpdate) {
        onUpdate(updatedNotifications);
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      }
    } catch (error) {
      console.error('Error rejecting session:', error);
      alert('Failed to reject session. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, [`reject-${index}`]: false }));
    }
  };

  return (
    <div className="relative">
      <button
        className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border-2 border-blue-300 transition-all duration-300 hover:bg-blue-200 hover:text-blue-700 hover:shadow-md hover:scale-110"
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
        {notifications.filter(n => !n.read).length > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold animate-pulse">
            {notifications.filter(n => !n.read).length}
          </span>
        )}
      </button>
      {/* Dropdown notification panel*/}
      {show && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-80 bg-white border border-blue-200 rounded-xl shadow-lg z-50"
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-blue-100">
            <span className="font-semibold text-blue-900">Notifications</span>
            <button
              className="text-xs text-blue-600 hover:underline"
              onClick={handleClear}
            >
              Clear All
            </button>
          </div>
          <ul className="max-h-64 overflow-y-auto divide-y divide-blue-50">
            {notifications.length === 0 ? (
              <li className="px-4 py-6 text-center text-gray-500">
                No notifications
              </li>
            ) : (
              notifications.map((n, idx) => {
                console.log('Rendering notification:', n, 'at index:', idx);
                return (
                <li
                  key={idx}
                  className="px-4 py-3 text-blue-800 text-sm hover:bg-blue-50 cursor-pointer"
                >
                    {n.type === 'session-started' ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="font-semibold text-green-700">Session Started</span>
                          {!n.read && (
                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">NEW</span>
                          )}
                        </div>
                        <p className="text-gray-700">{n.message}</p>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => {
                              console.log('Join button clicked for session-started notification');
                              if (n.onJoin) {
                                console.log('Calling onJoin function');
                                n.onJoin();
                              }
                              // Remove this notification
                              handleNotificationRead(idx);
                            }}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                          >
                            Join
                          </button>
                          <button
                            onClick={() => {
                              console.log('Cancel button clicked for session-started notification');
                              if (n.onCancel) {
                                console.log('Calling onCancel function');
                                n.onCancel();
                              }
                              // Remove this notification
                              handleNotificationRead(idx);
                            }}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : n.type === 'session-approved' ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="font-semibold text-blue-700">Session Approved</span>
                        </div>
                        <p className="text-gray-700">{n.message}</p>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleNotificationRead(idx)}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                          >
                            Mark as Read
                          </button>
                        </div>
                      </div>
                    ) : n.type === 'session-rejected' ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="font-semibold text-red-700">Session Rejected</span>
                        </div>
                        <p className="text-gray-700">{n.message}</p>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleNotificationRead(idx)}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                          >
                            Mark as Read
                          </button>
                        </div>
                      </div>
                    ) : n.type === 'session-cancelled' ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="font-semibold text-orange-700">Session Cancelled</span>
                          {!n.read && (
                            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">NEW</span>
                          )}
                        </div>
                        <p className="text-gray-700">{n.message}</p>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleNotificationRead(idx)}
                            className="px-3 py-1 bg-orange-600 text-white text-xs rounded-md hover:bg-orange-700 transition-colors"
                          >
                            Mark as Read
                          </button>
                        </div>
                      </div>
                    ) : n.type === 'session-requested' ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="font-semibold text-yellow-700">Session Request</span>
                          {!n.read && (
                            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">NEW</span>
                          )}
                        </div>
                        <p className="text-gray-700">{n.message}</p>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleApproveSession(n.sessionId, idx)}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                            disabled={loading[`approve-${idx}`]}
                          >
                            {loading[`approve-${idx}`] ? 'Approving...' : 'Accept'}
                          </button>
                          <button
                            onClick={() => handleRejectSession(n.sessionId, idx)}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                            disabled={loading[`reject-${idx}`]}
                          >
                            {loading[`reject-${idx}`] ? 'Rejecting...' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>{n.content ? n.content : n}</div>
                    )}
                </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationSection;

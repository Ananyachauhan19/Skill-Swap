import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import socket from '../socket';
import { BACKEND_URL } from '../config.js';
import SessionRequestNotification from './SessionRequestNotification';

// Helper: Remove notifications older than 12 hours or completed
function filterNotifications(notifications) {
  const TWELVE_HOURS = 12 * 60 * 60 * 1000;
  const now = Date.now();
  return notifications.filter((n) => {
    if (n && n.completed) return false;
    if (n.timestamp && now - new Date(n.timestamp).getTime() > TWELVE_HOURS) return false;
    return true;
  });
}

const NotificationSection = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [show, setShow] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState({});
  const dropdownRef = useRef();
  const location = useLocation();

  // Fetch notifications on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/notifications`, {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch notifications');
        let data = await response.json();

        // Fetch SessionRequest details for session-requested notifications
        const sessionRequests = await Promise.all(
          data
            .filter((n) => n.type === 'session-requested' && n.sessionId)
            .map(async (n) => {
              const res = await fetch(`${BACKEND_URL}/api/session-requests/active`, {
                credentials: 'include',
              });
              if (res.ok) {
                const sessionRequest = await res.json();
                return { ...n, sessionRequest: sessionRequest.activeSession?.sessionRequest };
              }
              return n;
            })
        );

        // Fetch SkillMate request details for skillmate-requested notifications
        const skillMateRequests = await Promise.all(
          data
            .filter((n) => n.type === 'skillmate-requested' && n.requestId)
            .map(async (n) => {
              const res = await fetch(`${BACKEND_URL}/api/skillmates/requests/received`, {
                credentials: 'include',
              });
              if (res.ok) {
                const skillMateRequests = await res.json();
                const skillMateRequest = skillMateRequests.find((r) => r._id === n.requestId);
                return { ...n, skillMateRequest };
              }
              return n;
            })
        );

        // Merge session and skillmate request data back into notifications
        data = data.map((n) => {
          const matchingSession = sessionRequests.find((sr) => sr._id === n._id);
          const matchingSkillMate = skillMateRequests.find((sm) => sm._id === n._id);
          return {
            ...n,
            sessionRequest: matchingSession?.sessionRequest || n.sessionRequest,
            skillMateRequest: matchingSkillMate?.skillMateRequest || n.skillMateRequest
          };
        });

        setNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    fetchNotifications();
  }, []);

  // Join Socket.IO room and listen for notifications
  useEffect(() => {
    if (!userId) return;
    socket.emit('join', userId);
    socket.on('notification', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });
    return () => {
      socket.off('notification');
    };
  }, [userId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!show) return;
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShow(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [show]);

  // Periodically clear old or completed notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const filtered = filterNotifications(notifications);
      if (filtered.length !== notifications.length) {
        setNotifications(filtered);
        localStorage.setItem('notifications', JSON.stringify(filtered));
      }
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [notifications]);

  // Clear all notifications
  const handleClear = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/notifications/clear`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setNotifications([]);
      localStorage.removeItem('notifications');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  // Mark notification as read
  const handleNotificationRead = async (notificationId, index) => {
    try {
      await fetch(`${BACKEND_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include',
      });
      setNotifications((prev) =>
        prev.map((n, i) => (i === index ? { ...n, read: true } : n))
      );
      localStorage.setItem('notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle approve session request
  const handleApproveSession = async (sessionId, index) => {
    setLoading((prev) => ({ ...prev, [`approve-${index}`]: true }));
    try {
      const response = await fetch(`${BACKEND_URL}/api/session-requests/approve/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to approve session');
      setNotifications((prev) => prev.filter((_, i) => i !== index));
      localStorage.setItem('notifications', JSON.stringify(notifications.filter((_, i) => i !== index)));
    } catch (error) {
      console.error('Error approving session:', error);
      alert('Failed to approve session. Please try again.');
    } finally {
      setLoading((prev) => ({ ...prev, [`approve-${index}`]: false }));
    }
  };

  // Handle reject session request
  const handleRejectSession = async (sessionId, index) => {
    setLoading((prev) => ({ ...prev, [`reject-${index}`]: true }));
    try {
      const response = await fetch(`${BACKEND_URL}/api/session-requests/reject/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to reject session');
      setNotifications((prev) => prev.filter((_, i) => i !== index));
      localStorage.setItem('notifications', JSON.stringify(notifications.filter((_, i) => i !== index)));
    } catch (error) {
      console.error('Error rejecting session:', error);
      alert('Failed to reject session. Please try again.');
    } finally {
      setLoading((prev) => ({ ...prev, [`reject-${index}`]: false }));
    }
  };

  // Filter notifications based on tab
  const getFilteredNotifications = () => {
    let filtered = filterNotifications(notifications);

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
      filtered = filtered.filter(
        (n) =>
          n.type === 'skillmate-requested' ||
          n.type === 'skillmate-approved' ||
          n.type === 'skillmate-rejected' ||
          n.type === 'skillmate-removed'
      );
    }

    return filtered;
  };

  // Calculate unread counts for each tab
  const getUnreadCounts = () => {
    const sessionTypes = [
      'session-started',
      'session-approved',
      'session-rejected',
      'session-cancelled',
      'session-requested'
    ];
    const skillmateTypes = [
      'skillmate-requested',
      'skillmate-approved',
      'skillmate-rejected',
      'skillmate-removed'
    ];
    const allUnread = notifications.filter((n) => n && !n.read).length;
    const sessionUnread = notifications.filter((n) => n && !n.read && sessionTypes.includes(n.type)).length;
    const skillmateUnread = notifications.filter((n) => n && !n.read && skillmateTypes.includes(n.type)).length;
    return { all: allUnread, session: sessionUnread, skillmate: skillmateUnread };
  };

  const unreadCounts = getUnreadCounts();
  const filteredNotifications = getFilteredNotifications();

  return (
    <div className="relative font-sans">
      <button
        className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 border-2 border-blue-300 hover:bg-blue-200 hover:text-blue-700 hover:shadow-xl hover:scale-105 transform transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
        onClick={() => setShow((v) => !v)}
        title="Notifications"
        aria-label="Notifications"
      >
        <svg
          className="w-6 h-6 mx-auto"
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
          <span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold rounded-full px-2 py-1 shadow-md animate-pulse">
            {unreadCounts.all}
          </span>
        )}
      </button>
      {show && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-3 w-[90vw] max-w-md bg-white border border-blue-200 rounded-2xl shadow-2xl z-[2000] overflow-hidden transform transition-all duration-300 ease-in-out"
        >
          <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border-b border-blue-100">
            <span className="font-bold text-lg text-blue-900">Notifications</span>
            <button
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
              onClick={handleClear}
            >
              Clear All
            </button>
          </div>
          <div className="flex bg-blue-50 border-b border-blue-100">
            <button
              className={`flex-1 py-2.5 text-sm font-semibold relative transition-colors duration-200 ${
                activeTab === 'all'
                  ? 'bg-blue-100 text-blue-900 border-b-2 border-blue-500'
                  : 'text-blue-600 hover:bg-blue-100'
              }`}
              onClick={() => setActiveTab('all')}
            >
              All
              {unreadCounts.all > 0 && (
                <span className="absolute top-1 right-2 bg-red-600 text-white text-xs font-bold rounded-full px-2 py-0.5 shadow-sm animate-pulse">
                  {unreadCounts.all}
                </span>
              )}
            </button>
            <button
              className={`flex-1 py-2.5 text-sm font-semibold relative transition-colors duration-200 ${
                activeTab === 'session'
                  ? 'bg-blue-100 text-blue-900 border-b-2 border-blue-500'
                  : 'text-blue-600 hover:bg-blue-100'
              }`}
              onClick={() => setActiveTab('session')}
            >
              Session
              {unreadCounts.session > 0 && (
                <span className="absolute top-1 right-2 bg-red-600 text-white text-xs font-bold rounded-full px-2 py-0.5 shadow-sm animate-pulse">
                  {unreadCounts.session}
                </span>
              )}
            </button>
            <button
              className={`flex-1 py-2.5 text-sm font-semibold relative transition-colors duration-200 ${
                activeTab === 'skillmate'
                  ? 'bg-blue-100 text-blue-900 border-b-2 border-blue-500'
                  : 'text-blue-600 hover:bg-blue-100'
              }`}
              onClick={() => setActiveTab('skillmate')}
            >
              SkillMate
              {unreadCounts.skillmate > 0 && (
                <span className="absolute top-1 right-2 bg-red-600 text-white text-xs font-bold rounded-full px-2 py-0.5 shadow-sm animate-pulse">
                  {unreadCounts.skillmate}
                </span>
              )}
            </button>
          </div>
          <ul className="max-h-[75vh] overflow-y-auto divide-y divide-blue-50">
            {filteredNotifications.length === 0 ? (
              <li className="px-4 py-6 text-center text-gray-600 text-base font-medium">
                No {activeTab === 'all' ? '' : activeTab} notifications
              </li>
            ) : (
              filteredNotifications.map((n, idx) => (
                <li
                  key={n._id || idx}
                  className="px-4 py-4 text-blue-800 text-sm hover:bg-blue-50 cursor-pointer transition-colors duration-200"
                >
                  {n.type === 'session-requested' && n.sessionRequest ? (
                    <SessionRequestNotification
                      sessionRequest={{
                        _id: n.sessionRequest._id,
                        subject: n.sessionRequest.subject || 'Unknown Subject',
                        topic: n.sessionRequest.topic || 'Unknown Topic',
                        subtopic: n.sessionRequest.subtopic || 'N/A',
                        message: n.sessionRequest.message || '',
                        createdAt: n.timestamp,
                      }}
                      requester={{
                        _id: n.requesterId,
                        firstName: n.requesterName ? n.requesterName.split(' ')[0] : 'Unknown',
                        lastName: n.requesterName ? n.requesterName.split(' ')[1] || '' : '',
                      }}
                      onClose={() => handleNotificationRead(n._id, idx)}
                    />
                  ) : n.type === 'session-started' ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="font-semibold text-blue-700">Session Started</span>
                        {!n.read && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-sm">NEW</span>
                        )}
                      </div>
                      <p className="text-gray-700">{n.message || 'Session started.'}</p>
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => {
                            if (n.onJoin) n.onJoin();
                            handleNotificationRead(n._id, idx);
                          }}
                          className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          Join
                        </button>
                        <button
                          onClick={() => {
                            if (n.onCancel) n.onCancel();
                            handleNotificationRead(n._id, idx);
                          }}
                          className="px-4 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : n.type === 'session-approved' ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="font-semibold text-green-700">Session Approved</span>
                        {!n.read && (
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-sm">NEW</span>
                        )}
                      </div>
                      <p className="text-gray-700">{n.message || 'Your session request has been approved.'}</p>
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => handleNotificationRead(n._id, idx)}
                          className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
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
                        {!n.read && (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow-sm">NEW</span>
                        )}
                      </div>
                      <p className="text-gray-700">{n.message || 'Your session request has been rejected.'}</p>
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => handleNotificationRead(n._id, idx)}
                          className="px-4 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
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
                          <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full shadow-sm">NEW</span>
                        )}
                      </div>
                      <p className="text-gray-700">{n.message || 'Your session has been cancelled.'}</p>
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => handleNotificationRead(n._id, idx)}
                          className="px-4 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          Mark as Read
                        </button>
                      </div>
                    </div>
                  ) : n.type === 'skillmate-requested' && n.skillMateRequest ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="font-semibold text-blue-700">SkillMate Request</span>
                        {!n.read && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-sm">New</span>
                        )}
                      </div>
                      <p className="text-gray-700">{n.message || `${n.requesterName} has sent you a SkillMate request.`}</p>
                      <p className="text-xs text-gray-500">Check the request section to approve or reject.</p>
                    </div>
                  ) : n.type === 'skillmate-approved' ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="font-semibold text-green-700">SkillMate Approved</span>
                        {!n.read && (
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-sm">OK</span>
                        )}
                      </div>
                      <p className="text-gray-700">{n.message || 'Your SkillMate request has been approved.'}</p>
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => handleNotificationRead(n._id, idx)}
                          className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          Mark as read
                        </button>
                      </div>
                    </div>
                  ) : n.type === 'skillmate-rejected' ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="font-semibold text-red-700">SkillMate Rejected</span>
                        {!n.read && (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow-sm">Sorry</span>
                        )}
                      </div>
                      <p className="text-gray-700">{n.message || 'Your SkillMate request has been rejected.'}</p>
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => handleNotificationRead(n._id, idx)}
                          className="px-4 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          Mark as read
                        </button>
                      </div>
                    </div>
                  ) : n.type === 'skillmate-removed' ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="font-semibold text-orange-700">SkillMate Removed</span>
                        {!n.read && (
                          <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full shadow-sm">OK</span>
                        )}
                      </div>
                      <p className="text-gray-700">{n.message || 'You have been removed as a SkillMate.'}</p>
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => handleNotificationRead(n._id, idx)}
                          className="px-4 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          Mark as read
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                        <span className="font-semibold text-gray-700">General Notification</span>
                        {!n.read && (
                          <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full shadow-sm">NEW</span>
                        )}
                      </div>
                      <p className="text-gray-600">{n.message || 'General notification.'}</p>
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => handleNotificationRead(n._id, idx)}
                          className="px-4 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
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
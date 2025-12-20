import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const showRef = useRef(show);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Keep showRef in sync with show state
  useEffect(() => {
    showRef.current = show;
  }, [show]);

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
            .filter((n) => n.type === 'skillmate-requested')
            .map(async (n) => {
              // If requestId is missing, fetch all received requests and find by requesterId
              const res = await fetch(`${BACKEND_URL}/api/skillmates/requests/received`, {
                credentials: 'include',
              });
              if (res.ok) {
                const allRequests = await res.json();
                
                // Convert requesterId to string if it's an object
                const requesterIdStr = typeof n.requesterId === 'object' ? n.requesterId._id || n.requesterId.toString() : n.requesterId;
                
                // Find by requestId if available, otherwise by requesterId
                const skillMateRequest = n.requestId 
                  ? allRequests.find((r) => r._id === n.requestId)
                  : allRequests.find((r) => r.requester?._id === requesterIdStr && r.status === 'pending');
                
                // If request is not found or already approved/rejected, mark notification for removal
                if (!skillMateRequest || skillMateRequest.status !== 'pending') {
                  return null; // Mark for removal
                }
                
                // If we found a request and didn't have requestId, add it to the notification
                if (skillMateRequest && !n.requestId) {
                  return { ...n, requestId: skillMateRequest._id, skillMateRequest };
                }
                return { ...n, skillMateRequest };
              }
              return n;
            })
        ).then(results => results.filter(r => r !== null)); // Remove null entries

        // Fetch chat message details for chat-message notifications
        const chatMessages = await Promise.all(
          data
            .filter((n) => n.type === 'chat-message' && n.messageId)
            .map(async (n) => {
              const res = await fetch(`${BACKEND_URL}/api/chat/history/${n.senderId}`, {
                credentials: 'include',
              });
              if (res.ok) {
                const chatData = await res.json();
                return { ...n, chatMessage: chatData.messages.find((m) => m._id === n.messageId) };
              }
              return n;
            })
        );

        // Merge session, skillmate, and chat message data back into notifications
        data = data.map((n) => {
          const matchingSession = sessionRequests.find((sr) => sr._id === n._id);
          const matchingSkillMate = skillMateRequests.find((sm) => sm._id === n._id);
          const matchingChat = chatMessages.find((cm) => cm._id === n._id);
          
          // For SkillMate requests, the skillMateRequests array already has the updated notification
          // with requestId and skillMateRequest, so we use it directly
          if (matchingSkillMate) {
            return matchingSkillMate;
          }
          
          return {
            ...n,
            sessionRequest: matchingSession?.sessionRequest || n.sessionRequest,
            chatMessage: matchingChat?.chatMessage || n.chatMessage,
          };
        });

        setNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    fetchNotifications();
  }, []);

  // Listen for notifications from ToastSocketBridge via custom event
  useEffect(() => {
    if (!userId) return;
    
    const handleSocketNotification = async (event) => {
      const notification = event.detail;
      if (!notification) return;
      
      // Fetch additional details for specific notification types
      if (notification.type === 'session-requested' && notification.sessionId) {
        try {
          const res = await fetch(`${BACKEND_URL}/api/session-requests/active`, {
            credentials: 'include',
          });
          if (res.ok) {
            const sessionData = await res.json();
            if (sessionData.activeSession?.sessionRequest) {
              notification.sessionRequest = sessionData.activeSession.sessionRequest;
            }
          }
        } catch (error) {
          console.error('Error fetching session request for real-time notification:', error);
        }
      }
      
      // If it's a skillmate-requested notification, fetch the request details to get requestId
      if (notification.type === 'skillmate-requested') {
        try {
          const res = await fetch(`${BACKEND_URL}/api/skillmates/requests/received`, {
            credentials: 'include',
          });
          if (res.ok) {
            const allRequests = await res.json();
            
            // Convert requesterId to string if it's an object
            const requesterIdStr = typeof notification.requesterId === 'object' 
              ? notification.requesterId._id || notification.requesterId.toString() 
              : notification.requesterId;
            
            // Find by requestId if available, otherwise by requesterId
            const skillMateRequest = notification.requestId 
              ? allRequests.find((r) => r._id === notification.requestId)
              : allRequests.find((r) => r.requester?._id === requesterIdStr && r.status === 'pending');
            
            // Add requestId to the notification if found
            if (skillMateRequest) {
              notification.requestId = skillMateRequest._id;
              notification.skillMateRequest = skillMateRequest;
            }
          }
        } catch (error) {
          console.error('Error fetching SkillMate request for real-time notification:', error);
        }
      }
      
      console.log('[Socket.IO] Received notification:', {
        type: notification.type,
        message: notification.message,
        currentNotificationsCount: notifications.length,
        dropdownOpen: showRef.current
      });
      
      setNotifications((prev) => {
        const updated = [notification, ...prev];
        console.log('[Socket.IO] Updated notifications state. New count:', updated.length);
        // Also update localStorage to ensure persistence
        localStorage.setItem('notifications', JSON.stringify(updated));
        return updated;
      });
      
      // Force dropdown to refresh by toggling if it's open
      if (showRef.current) {
        console.log('[Socket.IO] Dropdown is open, forcing refresh...');
        setShow(false);
        setTimeout(() => {
          console.log('[Socket.IO] Reopening dropdown...');
          setShow(true);
        }, 50);
      }
      
      try {
        // If the notification implies the user's role changed (approved/rejected), trigger auth refresh
        if (notification && notification.type && ['interviewer-approved', 'interviewer-rejected'].includes(notification.type)) {
          // Dispatch a global event that AuthContext listens to and will refetch /api/auth/me
          window.dispatchEvent(new Event('authChanged'));
        }
      } catch (e) {
        console.error('Failed to trigger auth refresh from notification', e);
      }
    };
    
    window.addEventListener('socket-notification', handleSocketNotification);
    return () => {
      window.removeEventListener('socket-notification', handleSocketNotification);
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

  // Handle approve SkillMate request
  const handleApproveSkillMate = async (requestId, index) => {
    if (!requestId || requestId === 'undefined') {
      alert('Unable to approve: Request ID not found. Please refresh and try again.');
      return;
    }
    setLoading((prev) => ({ ...prev, [`approve-${index}`]: true }));
    try {
      const response = await fetch(`${BACKEND_URL}/api/skillmates/requests/approve/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to approve SkillMate request');
      
      // Delete the notification from backend
      const notificationId = notifications[index]._id;
      if (notificationId) {
        await fetch(`${BACKEND_URL}/api/notifications/${notificationId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
      }
      
      setNotifications((prev) => prev.filter((_, i) => i !== index));
      localStorage.setItem('notifications', JSON.stringify(notifications.filter((_, i) => i !== index)));
    } catch (error) {
      console.error('Error approving SkillMate:', error);
      alert('Failed to approve SkillMate request. Please try again.');
    } finally {
      setLoading((prev) => ({ ...prev, [`approve-${index}`]: false }));
    }
  };

  // Handle reject SkillMate request
  const handleRejectSkillMate = async (requestId, index) => {
    if (!requestId || requestId === 'undefined') {
      alert('Unable to reject: Request ID not found. Please refresh and try again.');
      return;
    }
    setLoading((prev) => ({ ...prev, [`reject-${index}`]: true }));
    try {
      const response = await fetch(`${BACKEND_URL}/api/skillmates/requests/reject/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to reject SkillMate request');
      
      // Delete the notification from backend
      const notificationId = notifications[index]._id;
      if (notificationId) {
        await fetch(`${BACKEND_URL}/api/notifications/${notificationId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
      }
      
      setNotifications((prev) => prev.filter((_, i) => i !== index));
      localStorage.setItem('notifications', JSON.stringify(notifications.filter((_, i) => i !== index)));
    } catch (error) {
      console.error('Error rejecting SkillMate:', error);
      alert('Failed to reject SkillMate request. Please try again.');
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
          n.type === 'session-requested' ||
          n.type === 'interview-requested' ||
          n.type === 'interview-approved' ||
          n.type === 'interview-rejected' ||
          n.type === 'interview-started' ||
          n.type === 'interview-cancelled'
      );
    } else if (activeTab === 'skillmate') {
      filtered = filtered.filter(
        (n) =>
          n.type === 'skillmate-requested' ||
          n.type === 'skillmate-approved' ||
          n.type === 'skillmate-rejected' ||
          n.type === 'skillmate-removed' ||
          n.type === 'chat-message'
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
      'session-requested',
      'interview-requested',
      'interview-approved',
      'interview-rejected',
      'interview-started',
      'interview-cancelled',
    ];
    const skillmateTypes = [
      'skillmate-requested',
      'skillmate-approved',
      'skillmate-rejected',
      'skillmate-removed',
      'chat-message',
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
    className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white border border-blue-300 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:scale-105 transform transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 flex-shrink-0"
    onClick={() => setShow((v) => !v)}
    title="Notifications"
    aria-label="Notifications"
  >
    <svg
      className="w-4 h-4 lg:w-5 lg:h-5 mx-auto"
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
      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 shadow-md animate-pulse min-w-[18px] text-center">
        {unreadCounts.all > 9 ? '9+' : unreadCounts.all}
      </span>
    )}
  </button>



      {show && (
        <div
          ref={dropdownRef}
          className="fixed sm:absolute left-0 sm:left-auto right-0 top-[60px] sm:top-auto sm:mt-3 w-full sm:w-[90vw] sm:max-w-md md:w-[28rem] bg-white sm:rounded-2xl rounded-b-2xl shadow-2xl z-[5100] overflow-hidden border-t sm:border border-gray-100 max-h-[calc(100vh-60px)] sm:max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex-shrink-0">
            <h3 className="font-semibold text-lg text-gray-900">Notifications</h3>
            <button
              className="text-xs text-gray-500 hover:text-blue-600 hover:underline transition-colors duration-200 font-medium"
              onClick={handleClear}
            >
              Clear All
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex bg-white border-b border-gray-100 px-1 sm:px-2 flex-shrink-0">
            <button
              className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium relative transition-all duration-200 ${
                activeTab === 'all'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('all')}
            >
              <span className="flex items-center justify-center gap-1 sm:gap-2">
                <span className="whitespace-nowrap">All</span>
                {unreadCounts.all > 0 && (
                  <span className="bg-blue-100 text-blue-600 text-[9px] sm:text-[10px] font-semibold rounded-full px-1.5 sm:px-2 py-0.5 min-w-[18px] sm:min-w-[20px] text-center">
                    {unreadCounts.all}
                  </span>
                )}
              </span>
              {activeTab === 'all' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
              )}
            </button>
            <button
              className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium relative transition-all duration-200 ${
                activeTab === 'session'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('session')}
            >
              <span className="flex items-center justify-center gap-1 sm:gap-2">
                <span className="whitespace-nowrap">Session</span>
                {unreadCounts.session > 0 && (
                  <span className="bg-blue-100 text-blue-600 text-[9px] sm:text-[10px] font-semibold rounded-full px-1.5 sm:px-2 py-0.5 min-w-[18px] sm:min-w-[20px] text-center">
                    {unreadCounts.session}
                  </span>
                )}
              </span>
              {activeTab === 'session' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
              )}
            </button>
            <button
              className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium relative transition-all duration-200 ${
                activeTab === 'skillmate'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('skillmate')}
            >
              <span className="flex items-center justify-center gap-1 sm:gap-2">
                <span className="whitespace-nowrap">SkillMate</span>
                {unreadCounts.skillmate > 0 && (
                  <span className="bg-blue-100 text-blue-600 text-[9px] sm:text-[10px] font-semibold rounded-full px-1.5 sm:px-2 py-0.5 min-w-[18px] sm:min-w-[20px] text-center">
                    {unreadCounts.skillmate}
                  </span>
                )}
              </span>
              {activeTab === 'skillmate' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
              )}
            </button>
          </div>
          
          {/* Notifications List */}
          <ul className="flex-1 overflow-y-auto bg-gray-50">
            {filteredNotifications.length === 0 ? (
              <li className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm font-medium">No {activeTab === 'all' ? '' : activeTab} notifications</p>
              </li>
            ) : (
              filteredNotifications.map((n, idx) => {
                return (
                <li
                  key={n._id || idx}
                  className="notification-item mx-2 sm:mx-3 my-2 sm:my-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden"
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
                      onAccept={() => handleApproveSession(n.sessionId, idx)}
                      onReject={() => handleRejectSession(n.sessionId, idx)}
                      onClose={() => handleNotificationRead(n._id, idx)}
                    />
                  ) : n.type === 'session-started' ? (
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">Session Started</h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {n.timestamp ? new Date(n.timestamp).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              }) : 'Just now'}
                            </p>
                          </div>
                        </div>
                        {!n.read && (
                          <span className="flex items-center justify-center w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-4">
                        {n.message || 'Session started.'}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (n.onJoin) n.onJoin();
                            handleNotificationRead(n._id, idx);
                          }}
                          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors duration-200"
                          disabled={loading[`approve-${idx}`]}
                        >
                          {loading[`approve-${idx}`] ? 'Joining...' : 'Join Session'}
                        </button>
                        <button
                          onClick={() => {
                            if (n.onCancel) n.onCancel();
                            handleNotificationRead(n._id, idx);
                          }}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors duration-200"
                          disabled={loading[`reject-${idx}`]}
                        >
                          {loading[`reject-${idx}`] ? 'Cancelling...' : 'Cancel'}
                        </button>
                        <button
                          onClick={() => handleNotificationRead(n._id, idx)}
                          className="ml-auto text-xs text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : n.type === 'session-approved' ? (
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">Session Approved</h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {n.timestamp ? new Date(n.timestamp).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              }) : 'Just now'}
                            </p>
                          </div>
                        </div>
                        {!n.read && (
                          <span className="flex items-center justify-center w-2 h-2 bg-green-600 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-3">
                        {n.message || 'Your session request has been approved.'}
                      </p>
                      <button
                        onClick={() => handleNotificationRead(n._id, idx)}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        Mark as Read
                      </button>
                    </div>
                  ) : n.type === 'session-rejected' ? (
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">Session Rejected</h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {n.timestamp ? new Date(n.timestamp).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              }) : 'Just now'}
                            </p>
                          </div>
                        </div>
                        {!n.read && (
                          <span className="flex items-center justify-center w-2 h-2 bg-red-600 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-3">
                        {n.message || 'Your session request has been rejected.'}
                      </p>
                      <button
                        onClick={() => handleNotificationRead(n._id, idx)}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        Mark as Read
                      </button>
                    </div>
                  ) : n.type === 'session-cancelled' ? (
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">Session Cancelled</h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {n.timestamp ? new Date(n.timestamp).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              }) : 'Just now'}
                            </p>
                          </div>
                        </div>
                        {!n.read && (
                          <span className="flex items-center justify-center w-2 h-2 bg-orange-600 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-3">
                        {n.message || 'Your session has been cancelled.'}
                      </p>
                      <button
                        onClick={() => handleNotificationRead(n._id, idx)}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        Mark as Read
                      </button>
                    </div>
                  ) : n.type === 'interview-requested' ? (
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">Interview Requested</h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {n.timestamp ? new Date(n.timestamp).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              }) : 'Just now'}
                            </p>
                          </div>
                        </div>
                        {!n.read && (
                          <span className="flex items-center justify-center w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-3">
                        {n.message || 'You have a new interview request.'}
                      </p>
                      <button
                        onClick={() => handleNotificationRead(n._id, idx)}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        Mark as Read
                      </button>
                    </div>
                  ) : n.type === 'interview-approved' ? (
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">Interview Approved</h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {n.timestamp ? new Date(n.timestamp).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              }) : 'Just now'}
                            </p>
                          </div>
                        </div>
                        {!n.read && (
                          <span className="flex items-center justify-center w-2 h-2 bg-green-600 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-3">
                        {n.message || 'Your interview request has been approved.'}
                      </p>
                      <button
                        onClick={() => handleNotificationRead(n._id, idx)}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        Mark as Read
                      </button>
                    </div>
                  ) : n.type === 'interview-rejected' ? (
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">Interview Rejected</h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {n.timestamp ? new Date(n.timestamp).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              }) : 'Just now'}
                            </p>
                          </div>
                        </div>
                        {!n.read && (
                          <span className="flex items-center justify-center w-2 h-2 bg-red-600 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-3">
                        {n.message || 'Your interview request has been rejected.'}
                      </p>
                      <button
                        onClick={() => handleNotificationRead(n._id, idx)}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        Mark as Read
                      </button>
                    </div>
                  ) : n.type === 'interview-started' ? (
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">Interview Started</h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {n.timestamp ? new Date(n.timestamp).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              }) : 'Just now'}
                            </p>
                          </div>
                        </div>
                        {!n.read && (
                          <span className="flex items-center justify-center w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-4">
                        {n.message || 'Your interview has started! Click Join to begin.'}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (n.interviewId) {
                              navigate(`/interview/${n.interviewId}`);
                              setShow(false);
                            }
                            handleNotificationRead(n._id, idx);
                          }}
                          className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors duration-200"
                        >
                          Join Interview
                        </button>
                        <button
                          onClick={() => handleNotificationRead(n._id, idx)}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors duration-200"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ) : n.type === 'interview-cancelled' ? (
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">Interview Cancelled</h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {n.timestamp ? new Date(n.timestamp).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              }) : 'Just now'}
                            </p>
                          </div>
                        </div>
                        {!n.read && (
                          <span className="flex items-center justify-center w-2 h-2 bg-orange-600 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-3">
                        {n.message || 'Your interview has been cancelled.'}
                      </p>
                      <button
                        onClick={() => handleNotificationRead(n._id, idx)}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        Mark as Read
                      </button>
                    </div>
                  ) : n.type === 'skillmate-requested' && n.skillMateRequest ? (
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">New SkillMate Request</h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {n.timestamp ? new Date(n.timestamp).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              }) : 'Just now'}
                            </p>
                          </div>
                        </div>
                        {!n.read && (
                          <span className="flex items-center justify-center w-2 h-2 bg-purple-600 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-3">
                        <span className="font-medium">{n.skillMateRequest.requester?.firstName} {n.skillMateRequest.requester?.lastName}</span> wants to connect with you as a SkillMate.
                      </p>
                      <div className="flex items-center gap-2 mb-3">
                        <button
                          onClick={() => handleApproveSkillMate(n.requestId || n.skillMateRequest._id, idx)}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-1"
                          disabled={loading[`approve-${idx}`]}
                        >
                          {loading[`approve-${idx}`] ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                              Approving...
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              Approve
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleRejectSkillMate(n.requestId || n.skillMateRequest._id, idx)}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-1"
                          disabled={loading[`reject-${idx}`]}
                        >
                          {loading[`reject-${idx}`] ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                              Rejecting...
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Reject
                            </>
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => {
                            navigate(`/profile/${n.skillMateRequest.requester?.username || n.skillMateRequest.requester?._id}`);
                            setShow(false);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => handleNotificationRead(n._id, idx)}
                          className="ml-auto text-xs text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        >
                          Mark as Read
                        </button>
                      </div>
                    </div>
                  ) : n.type === 'skillmate-approved' ? (
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">SkillMate Approved</h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {n.timestamp ? new Date(n.timestamp).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              }) : 'Just now'}
                            </p>
                          </div>
                        </div>
                        {!n.read && (
                          <span className="flex items-center justify-center w-2 h-2 bg-green-600 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-3">
                        {n.message || 'Your SkillMate request has been approved.'}
                      </p>
                      <button
                        onClick={() => handleNotificationRead(n._id, idx)}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        Mark as Read
                      </button>
                    </div>
                  ) : n.type === 'skillmate-rejected' ? (
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">SkillMate Rejected</h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {n.timestamp ? new Date(n.timestamp).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              }) : 'Just now'}
                            </p>
                          </div>
                        </div>
                        {!n.read && (
                          <span className="flex items-center justify-center w-2 h-2 bg-red-600 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-3">
                        {n.message || 'Your SkillMate request has been rejected.'}
                      </p>
                      <button
                        onClick={() => handleNotificationRead(n._id, idx)}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        Mark as Read
                      </button>
                    </div>
                  ) : n.type === 'skillmate-removed' ? (
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">SkillMate Removed</h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {n.timestamp ? new Date(n.timestamp).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              }) : 'Just now'}
                            </p>
                          </div>
                        </div>
                        {!n.read && (
                          <span className="flex items-center justify-center w-2 h-2 bg-orange-600 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-3">
                        {n.message || 'A SkillMate connection has been removed.'}
                      </p>
                      <button
                        onClick={() => handleNotificationRead(n._id, idx)}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        Mark as Read
                      </button>
                    </div>
                  ) : n.type === 'chat-message' && n.chatMessage ? (
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">New Message</h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              From {n.chatMessage.sender?.firstName} {n.chatMessage.sender?.lastName}
                            </p>
                          </div>
                        </div>
                        {!n.read && (
                          <span className="flex items-center justify-center w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                        {n.chatMessage.content}
                      </p>
                      <button
                        onClick={() => handleNotificationRead(n._id, idx)}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        Mark as Read
                      </button>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            n.message?.toLowerCase().includes('skillmate request') 
                              ? 'bg-purple-50' 
                              : 'bg-gray-50'
                          }`}>
                            <svg className={`w-5 h-5 ${
                              n.message?.toLowerCase().includes('skillmate request')
                                ? 'text-purple-600'
                                : 'text-gray-600'
                            }`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              {n.message?.toLowerCase().includes('skillmate request') ? (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              )}
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">
                              {n.message?.toLowerCase().includes('skillmate request') ? 'New SkillMate Request' : 'Notification'}
                            </h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {n.timestamp ? new Date(n.timestamp).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              }) : 'Just now'}
                            </p>
                          </div>
                        </div>
                        {!n.read && (
                          <span className={`flex items-center justify-center w-2 h-2 rounded-full flex-shrink-0 ${
                            n.message?.toLowerCase().includes('skillmate request')
                              ? 'bg-purple-600'
                              : 'bg-gray-600'
                          }`}></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-3">
                        {n.message || 'You have a new notification.'}
                      </p>
                      {(n.type === 'skillmate-requested' || n.message?.toLowerCase().includes('skillmate')) ? (
                        <>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                // Navigate to requester's profile using requesterId or requesterName
                                const profileId = n.requesterId || n.requesterName?.replace(/\s+/g, '').toLowerCase();
                                if (profileId) {
                                  navigate(`/profile/${profileId}`);
                                  setShow(false);
                                }
                              }}
                              className="flex-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-1 shadow-sm hover:shadow"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => {
                                const reqId = n.requestId || n.skillMateRequest?._id || n.skillMateId;
                                handleApproveSkillMate(reqId, idx);
                              }}
                              className="flex-1 px-2 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[11px] font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-1 shadow-sm hover:shadow disabled:opacity-70 disabled:cursor-not-allowed"
                              disabled={loading[`approve-${idx}`]}
                            >
                              {loading[`approve-${idx}`] ? (
                                <>
                                  <div className="animate-spin rounded-full h-2.5 w-2.5 border-2 border-white border-t-transparent"></div>
                                  <span>...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span>Approve</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                const reqId = n.requestId || n.skillMateRequest?._id || n.skillMateId;
                                handleRejectSkillMate(reqId, idx);
                              }}
                              className="flex-1 px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-1 shadow-sm hover:shadow disabled:opacity-70 disabled:cursor-not-allowed"
                              disabled={loading[`reject-${idx}`]}
                            >
                              {loading[`reject-${idx}`] ? (
                                <>
                                  <div className="animate-spin rounded-full h-2.5 w-2.5 border-2 border-white border-t-transparent"></div>
                                  <span>...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  <span>Reject</span>
                                </>
                              )}
                            </button>
                          </div>
                          <div className="flex items-center justify-end pt-2 mt-2 border-t border-gray-100">
                            <button
                              onClick={() => handleNotificationRead(n._id, idx)}
                              className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors duration-200 font-medium"
                            >
                              Mark as Read
                            </button>
                          </div>
                        </>
                      ) : (
                        <button
                          onClick={() => handleNotificationRead(n._id, idx)}
                          className="text-xs text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
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
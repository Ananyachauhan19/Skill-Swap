import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaCheck, 
  FaTimes, 
  FaClock, 
  FaUser, 
  FaPlay, 
  FaVideo, 
  FaUserFriends, 
  FaHandshake,
  FaHome,
  FaBars
} from 'react-icons/fa';
import { BACKEND_URL } from '../config.js';
import socket from '../socket';
import { useAuth } from '../context/AuthContext';
import VideoCall from '../components/VideoCall';
import SessionRatingModal from '../components/SessionRatingModal.jsx';

const SessionRequests = () => {
  const [interviewRequests, setInterviewRequests] = useState({ received: [], sent: [] });
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState({ received: [], sent: [] });
  const [skillMateRequests, setSkillMateRequests] = useState({ received: [], sent: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('received');
  const [requestType, setRequestType] = useState('session');
  const [readyToStartSession, setReadyToStartSession] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [cancelledMessage, setCancelledMessage] = useState('');
  const [interviewBanner, setInterviewBanner] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingContext, setRatingContext] = useState(null); // { sessionId, expertName, sessionType }

  useEffect(() => {
    const savedActiveSession = localStorage.getItem('activeSession');
    if (savedActiveSession) {
      try {
        const session = JSON.parse(savedActiveSession);
        if (session.status === 'active' || (session.sessionRequest && session.sessionRequest.status === 'active')) {
          setActiveSession(session);
        } else {
          localStorage.removeItem('activeSession');
        }
      } catch {
        localStorage.removeItem('activeSession');
      }
    }

    // If user clicked Join from a toast, open call immediately
    try {
      const pending = localStorage.getItem('pendingJoinSession');
      if (pending) {
        const { sessionId, role } = JSON.parse(pending);
        if (sessionId) {
          setActiveSession({ sessionId, role: role || 'student' });
          setShowVideoModal(true);
        }
        localStorage.removeItem('pendingJoinSession');
      }
    } catch {
      // ignore
    }
    checkActiveSessionFromBackend();
  }, []);

  const checkActiveSessionFromBackend = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/session-requests/active`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (
          data.activeSession &&
          ((data.activeSession.status && data.activeSession.status === 'active') ||
            (data.activeSession.sessionRequest && data.activeSession.sessionRequest.status === 'active'))
        ) {
          setActiveSession(data.activeSession);
        } else {
          setActiveSession(null);
          localStorage.removeItem('activeSession');
        }
      }
    } catch {
      // Silent fail
    }
  };

  useEffect(() => {
    fetchSessionRequests();
    fetchSkillMateRequests();
    fetchInterviewRequests();
  }, []);

  useEffect(() => {
    if (activeSession) {
      const sessionWithTimestamp = {
        ...activeSession,
        timestamp: Date.now(),
      };
      localStorage.setItem('activeSession', JSON.stringify(sessionWithTimestamp));
    } else {
      localStorage.removeItem('activeSession');
    }
  }, [activeSession]);

  useEffect(() => {
    if (!user || !user._id) return;

    socket.emit('register', user._id);

    socket.on('session-request-received', () => {
      fetchSessionRequests();
    });

    socket.on('skillmate-request-received', () => {
      fetchSkillMateRequests();
    });

    socket.on('skillmate-request-approved', () => {
      fetchSkillMateRequests();
    });

    socket.on('skillmate-request-rejected', () => {
      fetchSkillMateRequests();
    });

    socket.on('session-started', (data) => {
      let role = null;
      if (user && data.tutor && user._id === data.tutor._id) role = 'tutor';
      if (user && data.requester && user._id === data.requester._id) role = 'student';
      if (role) {
        const newActiveSession = {
          sessionId: data.sessionId,
          sessionRequest: data.sessionRequest,
          role,
        };
        setActiveSession(newActiveSession);
        setShowVideoModal(false);
        setReadyToStartSession(null);
      }
    });

    socket.on('session-cancelled', (data) => {
      setShowVideoModal(false);
      setActiveSession(null);
      setReadyToStartSession(null);
      localStorage.removeItem('activeSession');
      setCancelledMessage(data.message || 'Session was cancelled.');
      setTimeout(() => setCancelledMessage(''), 5000);
    });

    socket.on('end-call', ({ sessionId }) => {
      if (activeSession && activeSession.sessionId === sessionId) {
        setShowVideoModal(false);
        setActiveSession(null);
        setReadyToStartSession(null);
        localStorage.removeItem('activeSession');
      }
    });

    socket.on('session-completed', ({ sessionId }) => {
      // Close any active call UI
      if (activeSession && activeSession.sessionId === sessionId) {
        setShowVideoModal(false);
        setActiveSession(null);
        setReadyToStartSession(null);
        localStorage.removeItem('activeSession');
      }
        // Fallback: if no session-completed comes shortly, still open rating page
        if (sessionId) {
          setTimeout(() => {
            try {
              // If a rating redirect hasn't been triggered already, enforce it
              const pending = localStorage.getItem('pendingRatingSessionId');
              if (!pending) {
                localStorage.setItem('pendingRatingSessionId', String(sessionId));
                navigate(`/rate/${sessionId}`);
              }
            } catch {
              navigate(`/rate/${sessionId}`);
            }
          }, 1500);
        }
    });

    socket.on('notification', (notification) => {
      try {
        if (!notification) return;
        const t = notification.type || '';
        if (t.startsWith('interview') || notification.requestId) {
          fetchInterviewRequests();
          fetchSessionRequests();
        }
        if (t === 'interview-scheduled') {
          const notifUserId = String(notification.userId || notification.userId?._id || '');
          if (user && String(user._id) === notifUserId) {
            setInterviewBanner({
              message: notification.message || 'Your interview has been scheduled',
              requestId: notification.requestId,
            });
            setTimeout(() => setInterviewBanner(null), 12000);
          }
        }
      } catch {
        // Silent fail
      }
    });

    return () => {
      socket.off('session-request-received');
      socket.off('session-started');
      socket.off('session-cancelled');
      socket.off('end-call');
      socket.off('session-completed');
      socket.off('skillmate-request-received');
      socket.off('skillmate-request-approved');
      socket.off('skillmate-request-rejected');
      socket.off('notification');
    };
  }, [user, activeSession, navigate]);

  const fetchSessionRequests = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/session-requests/all`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        
        // Filter to show only requests from the last 2 days
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        
        const filterRecent = (requests) => {
          return requests.filter(req => {
            const requestDate = new Date(req.createdAt || req.requestedAt);
            return requestDate >= twoDaysAgo;
          });
        };
        
        setRequests({
          received: filterRecent(data.received || []),
          sent: filterRecent(data.sent || [])
        });
      } else {
        setError('Failed to fetch session requests');
      }
    } catch {
      setError('Failed to fetch session requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchSkillMateRequests = async () => {
    try {
      const receivedResponse = await fetch(`${BACKEND_URL}/api/skillmates/requests/received`, {
        credentials: 'include',
      });

      const sentResponse = await fetch(`${BACKEND_URL}/api/skillmates/requests/sent`, {
        credentials: 'include',
      });

      if (receivedResponse.ok && sentResponse.ok) {
        const receivedData = await receivedResponse.json();
        const sentData = await sentResponse.json();

        setSkillMateRequests({
          received: receivedData,
          sent: sentData,
        });
      }
    } catch {
      // Silent fail
    }
  };

  const fetchInterviewRequests = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/interview/requests`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        
        // Filter to show only requests from the last 2 days
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        
        const filterRecent = (requests) => {
          return requests.filter(req => {
            const requestDate = new Date(req.createdAt || req.requestedAt);
            return requestDate >= twoDaysAgo;
          });
        };
        
        setInterviewRequests({
          received: filterRecent(data.received || []),
          sent: filterRecent(data.sent || [])
        });
      }
    } catch {
      // Silent fail
    }
  };

  const handleApprove = async (requestId, type = 'session') => {
    try {
      if (type === 'session') {
        const response = await fetch(`${BACKEND_URL}/api/session-requests/approve/${requestId}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const approvedRequest = requests.received.find((req) => req._id === requestId);
          if (approvedRequest) {
            setReadyToStartSession(approvedRequest);
          }
          fetchSessionRequests();
        }
      } else if (type === 'skillmate') {
        socket.emit('approve-skillmate-request', { requestId });
        fetchSkillMateRequests();
      }
    } catch {
      setError(`Failed to approve ${type} request`);
    }
  };

  const handleReject = async (requestId, type = 'session') => {
    try {
      if (type === 'session') {
        const response = await fetch(`${BACKEND_URL}/api/session-requests/reject/${requestId}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          fetchSessionRequests();
        }
      } else if (type === 'skillmate') {
        socket.emit('reject-skillmate-request', { requestId });
        fetchSkillMateRequests();
      }
    } catch {
      setError(`Failed to reject ${type} request`);
    }
  };

  const handleStartSession = async () => {
    if (readyToStartSession) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/session-requests/start/${readyToStartSession._id}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          const data = await response.json();
          setActiveSession({
            sessionId: data.sessionRequest._id,
            sessionRequest: data.sessionRequest,
            role: 'tutor',
          });
          setShowVideoModal(true);
        }
      } catch {
        setError('Failed to start session');
      }
    }
  };

  const handleCancelSession = async () => {
    if (activeSession) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/session-requests/cancel/${activeSession.sessionId}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          setActiveSession(null);
          setReadyToStartSession(null);
          setShowVideoModal(false);
          localStorage.removeItem('activeSession');
        }
      } catch {
        setError('Failed to cancel session');
      }
    }
  };

  const handleEndCall = async (sid) => {
    const id = sid || (activeSession && activeSession.sessionId);
    if (id) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/session-requests/complete/${id}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          // Close UI
          setActiveSession(null);
          setReadyToStartSession(null);
          setShowVideoModal(false);
          localStorage.removeItem('activeSession');
          // Enforce rating redirect
          try {
            localStorage.setItem('pendingRatingSessionId', String(id));
          } catch { /* ignore */ }
          navigate(`/rate/${id}`);
        }
      } catch {
        setError('Failed to complete session');
      }
    } else {
      setShowVideoModal(false);
      setActiveSession(null);
      setReadyToStartSession(null);
      localStorage.removeItem('activeSession');
    }
  };

  const submitSessionRating = async ({ rating, feedback }) => {
    try {
      if (!ratingContext || !ratingContext.sessionId) return;
      const res = await fetch(`${BACKEND_URL}/api/session-requests/rate/${ratingContext.sessionId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to submit rating');
      setShowRatingModal(false);
      setRatingContext(null);
      // Refresh lists to reflect new rating in UIs that show it
      fetchSessionRequests();
    } catch (err) {
      alert(err.message || 'Failed to submit rating');
    }
  };

  const handleJoinInterview = (request) => {
    try {
      navigate(`/interview-call/${request._id}`);
    } catch (e) {
      console.error('Failed to join interview', e);
      alert('Failed to join interview');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return String(dateString);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDisplayName = (request, isReceived) => {
    if (isReceived) {
      const r = request.requester || request.requesterId || request.requesterDetails;
      if (r) return `${r.firstName || ''} ${r.lastName || ''}`.trim() || r.username || 'User';
      return 'User';
    } else {
      const t = request.tutor || request.recipient || request.assignedInterviewer || request.recipientDetails;
      if (t) return `${t.firstName || ''} ${t.lastName || ''}`.trim() || t.username || 'User';
      return 'User';
    }
  };

  const ScheduleInterviewInline = ({ request, onScheduled }) => {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [loadingSchedule, setLoadingSchedule] = useState(false);

    const submitSchedule = async () => {
      if (!date || !time) return alert('Select date and time');
      const dt = new Date(`${date}T${time}`);
      setLoadingSchedule(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/interview/schedule`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: request._id, scheduledAt: dt.toISOString() }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.message || 'Failed to schedule');
        alert('Interview scheduled');
        onScheduled && onScheduled();
      } catch (err) {
        console.error(err);
        alert(err.message || 'Error scheduling');
      } finally {
        setLoadingSchedule(false);
      }
    };

    return (
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="date"
          className="border-2 border-gray-200 px-3 py-2 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <input
          type="time"
          className="border-2 border-gray-200 px-3 py-2 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
        <button
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={submitSchedule}
          disabled={loadingSchedule}
        >
          {loadingSchedule ? 'Scheduling...' : 'Schedule'}
        </button>
      </div>
    );
  };

  const RequestCard = ({ request, isReceived, type }) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
            type === 'skillmate' 
              ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
              : 'bg-gradient-to-br from-blue-500 to-blue-600'
          }`}>
            {type === 'skillmate' ? (
              <FaUserFriends className="text-white text-xl" />
            ) : (
              <FaUser className="text-white text-xl" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{getDisplayName(request, isReceived)}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              {isReceived ? (
                <>
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Requested from you
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  Requested by you
                </>
              )}
            </p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm ${getStatusColor(request.status)}`}>
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </span>
      </div>

      {(request.subject || request.topic || type === 'skillmate') && (
        <div className="mb-4 p-4 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border border-gray-100">
          {type === 'skillmate' ? (
            <p className="text-sm text-gray-700 font-medium flex items-center gap-2">
              <FaHandshake className="text-purple-600" />
              Connection request for skill sharing
            </p>
          ) : (
            <div className="text-sm text-gray-700 space-y-2">
              {request.subject && (
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-blue-700 min-w-[60px]">Subject:</span>
                  <span className="text-gray-900">{request.subject}</span>
                </div>
              )}
              {request.topic && (
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-blue-700 min-w-[60px]">Topic:</span>
                  <span className="text-gray-900">{request.topic}</span>
                </div>
              )}
            </div>
          )}
          {request.message && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600 italic flex items-start gap-2">
                <span className="text-blue-500 text-lg">"</span>
                <span>{request.message}</span>
                <span className="text-blue-500 text-lg">"</span>
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <FaClock className="text-blue-600" size={14} />
          </div>
          <span className="font-medium">{formatDate(request.createdAt)}</span>
        </div>

        <div className="flex gap-2">
          {type === 'skillmate' && (
            <button
              onClick={() => {
                const otherUser = isReceived ? request.requester : request.recipient;
                navigate(`/profile/${otherUser?.username || otherUser?._id}`);
              }}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 shadow-md flex items-center gap-2"
            >
              <FaUser size={14} /> View Profile
            </button>
          )}
          {isReceived && request.status === 'pending' && (
            <>
              <button
                onClick={() => handleApprove(request._id, type)}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 shadow-md flex items-center gap-2"
              >
                <FaCheck size={14} /> Approve
              </button>
              <button
                onClick={() => handleReject(request._id, type)}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 shadow-md flex items-center gap-2"
              >
                <FaTimes size={14} /> Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const InterviewRequestCard = ({ request, isReceived }) => {
    const isPending = request.status === 'pending';
    const isAssignedInterviewer =
      user &&
      request.assignedInterviewer &&
      String(user._id) === String(request.assignedInterviewer._id || request.assignedInterviewer);

    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FaUser className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {isReceived
                  ? `${request.requester?.firstName || ''} ${request.requester?.lastName || ''}`.trim()
                  : `${request.assignedInterviewer?.firstName || ''} ${request.assignedInterviewer?.lastName || ''}`.trim()}
              </h3>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                {isReceived ? 'Interview requested' : 'Interview sent'}
              </p>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm ${getStatusColor(request.status)}`}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </span>
        </div>

        <div className="mb-4 p-4 bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-xl border border-gray-100 space-y-2">
          <div className="flex items-start gap-2">
            <span className="font-semibold text-indigo-700 min-w-[80px]">Company:</span>
            <span className="text-gray-900 font-medium">{request.company || '—'}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold text-indigo-700 min-w-[80px]">Position:</span>
            <span className="text-gray-900 font-medium">{request.position || '—'}</span>
          </div>
          {request.message && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600 italic flex items-start gap-2">
                <span className="text-indigo-500 text-lg">"</span>
                <span>{request.message}</span>
                <span className="text-indigo-500 text-lg">"</span>
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
              <FaClock className="text-indigo-600" size={14} />
            </div>
            <span className="font-medium">{formatDate(request.scheduledAt || request.createdAt)}</span>
          </div>

          <div className="flex gap-2">
            {isPending && isAssignedInterviewer && isReceived && (
              <ScheduleInterviewInline
                request={request}
                onScheduled={() => {
                  fetchInterviewRequests();
                  fetchSessionRequests();
                }}
              />
            )}
            {request.status === 'scheduled' && (
              <button
                onClick={() => handleJoinInterview(request)}
                className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 shadow-md flex items-center gap-2"
              >
                <FaVideo size={14} /> Join Interview
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const username = user ? user.username || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User' : 'User';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-700 mx-auto shadow-lg"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FaUserFriends className="text-blue-600 text-2xl animate-pulse" />
            </div>
          </div>
          <h3 className="mt-6 text-xl font-bold text-gray-900">Loading Requests</h3>
          <p className="text-gray-600 mt-2">Please wait while we fetch your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 pt-20">
      <div className="flex relative">
        {/* Sidebar - Sticky positioning (scrolls up when footer appears) */}
        <div
          className={`${
            sidebarOpen ? 'w-64' : 'w-0'
          } bg-white text-gray-800 transition-all duration-300 sticky top-20 self-start z-40 overflow-hidden shadow-lg border-r border-gray-200 hidden md:block`}
          style={{ 
            height: 'calc(100vh - 80px)',
            maxHeight: 'calc(100vh - 80px)'
          }}
        >
          {/* Sidebar Header - Fixed */}
          <div className="p-6 border-b border-gray-200 bg-white">
            <h2 className="text-lg font-semibold text-gray-900">
              Requests Hub
            </h2>
          </div>

          {/* Navigation Buttons - Fixed (No Scroll) */}
          <nav className="p-4 space-y-2">
            <button
              onClick={() => {
                setRequestType('session');
                setActiveTab('received');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                requestType === 'session'
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FaVideo className="text-sm" />
              <span className="font-medium text-sm">Session Requests</span>
              {requests.received.filter((req) => req.status === 'pending').length > 0 && (
                <span className="ml-auto bg-red-500 rounded-full h-5 w-5 flex items-center justify-center text-xs font-semibold text-white">
                  {requests.received.filter((req) => req.status === 'pending').length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setRequestType('skillmate');
                setActiveTab('received');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                requestType === 'skillmate'
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FaHandshake className="text-sm" />
              <span className="font-medium text-sm">SkillMate Requests</span>
              {skillMateRequests.received.filter((req) => req.status === 'pending').length > 0 && (
                <span className="ml-auto bg-red-500 rounded-full h-5 w-5 flex items-center justify-center text-xs font-semibold text-white">
                  {skillMateRequests.received.filter((req) => req.status === 'pending').length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setRequestType('interview');
                setActiveTab('received');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                requestType === 'interview'
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FaUser className="text-sm" />
              <span className="font-medium text-sm">Interview Requests</span>
              {(interviewRequests?.received || []).filter((req) => req.status === 'pending').length > 0 && (
                <span className="ml-auto bg-red-500 rounded-full h-5 w-5 flex items-center justify-center text-xs font-semibold text-white">
                  {(interviewRequests?.received || []).filter((req) => req.status === 'pending').length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Mobile Sidebar - Fixed overlay */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-60 md:hidden z-30 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            ></div>
            <div
              className="fixed left-0 top-20 bottom-0 w-64 bg-white text-gray-800 z-40 shadow-2xl border-r border-gray-200 md:hidden overflow-y-auto"
            >
              {/* Sidebar Header */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-xl font-bold flex items-center gap-3 text-gray-900">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                    <FaHome className="text-white" size={18} />
                  </div>
                  <span className="bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent">
                    Requests Hub
                  </span>
                </h2>
              </div>

              {/* Navigation Buttons */}
              <nav className="p-4 space-y-3">
                <button
                  onClick={() => {
                    setRequestType('session');
                    setActiveTab('received');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                    requestType === 'session'
                      ? 'bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg'
                      : 'hover:bg-gray-50 text-blue-900'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${requestType === 'session' ? 'bg-white/20' : 'bg-blue-900/10'}`}>
                    <FaVideo className={`text-base ${requestType === 'session' ? 'text-white' : 'text-blue-900'}`} />
                  </div>
                  <span className="font-medium text-sm">Session Requests</span>
                  {requests.received.filter((req) => req.status === 'pending').length > 0 && (
                    <span className="ml-auto bg-gradient-to-r from-red-500 to-red-600 rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold text-white">
                      {requests.received.filter((req) => req.status === 'pending').length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setRequestType('skillmate');
                    setActiveTab('received');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                    requestType === 'skillmate'
                      ? 'bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg'
                      : 'hover:bg-gray-50 text-blue-900'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${requestType === 'skillmate' ? 'bg-white/20' : 'bg-blue-900/10'}`}>
                    <FaHandshake className={`text-base ${requestType === 'skillmate' ? 'text-white' : 'text-blue-900'}`} />
                  </div>
                  <span className="font-medium text-sm">SkillMate Requests</span>
                  {skillMateRequests.received.filter((req) => req.status === 'pending').length > 0 && (
                    <span className="ml-auto bg-gradient-to-r from-red-500 to-red-600 rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold text-white">
                      {skillMateRequests.received.filter((req) => req.status === 'pending').length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setRequestType('interview');
                    setActiveTab('received');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                    requestType === 'interview'
                      ? 'bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg'
                      : 'hover:bg-gray-50 text-blue-900'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${requestType === 'interview' ? 'bg-white/20' : 'bg-blue-900/10'}`}>
                    <FaUser className={`text-base ${requestType === 'interview' ? 'text-white' : 'text-blue-900'}`} />
                  </div>
                  <span className="font-medium text-sm">Interview Requests</span>
                  {(interviewRequests?.received || []).filter((req) => req.status === 'pending').length > 0 && (
                    <span className="ml-auto bg-gradient-to-r from-red-500 to-red-600 rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold text-white">
                      {(interviewRequests?.received || []).filter((req) => req.status === 'pending').length}
                    </span>
                  )}
                </button>
              </nav>
            </div>
          </>
        )}

        {/* Main Content - Scrollable */}
        <div className="flex-1 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden mb-6 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-all"
          >
            <FaBars size={18} />
            <span className="font-medium">Menu</span>
          </button>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Manage Your Requests
            </h1>
            <p className="text-gray-600">
              View and manage all your session, skill mate, and interview requests
            </p>
          </div>          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-xl shadow-md flex items-center gap-3">
              <FaTimes className="text-red-500 text-xl" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Session Ready Banner */}
          {readyToStartSession && (
            <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 px-6 py-5 rounded-xl shadow-lg flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                  <FaCheck className="text-white text-xl" />
                </div>
                <div>
                  <p className="font-bold text-green-900 text-lg">Session Approved!</p>
                  <p className="text-green-700 text-sm mt-1">Your session is ready to start. Click the button to begin.</p>
                </div>
              </div>
              <button
                className="bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-950 hover:to-blue-900 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all transform hover:scale-105 shadow-lg"
                onClick={handleStartSession}
              >
                <FaPlay size={16} /> Start Session
              </button>
            </div>
          )}

          {/* Cancelled Message */}
          {cancelledMessage && (
            <div className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-fadeIn">
              <FaTimes className="text-red-500 text-2xl" />
              <span className="text-red-800 font-medium">{cancelledMessage}</span>
            </div>
          )}

          {/* Interview Banner */}
          {interviewBanner && (
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-900 px-6 py-5 rounded-xl shadow-lg flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center shadow-md">
                  <FaVideo className="text-white text-xl" />
                </div>
                <span className="text-blue-900 font-semibold text-lg">{interviewBanner.message}</span>
              </div>
              <button
                className="bg-white hover:bg-gray-50 text-blue-900 px-5 py-2 rounded-lg font-medium border border-blue-900 transition-all hover:shadow-md"
                onClick={() => setInterviewBanner(null)}
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Active Session Banner */}
          {activeSession && (
            <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 px-6 py-5 rounded-xl shadow-lg flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                    <FaVideo className="text-white text-xl" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse border-2 border-white"></div>
                </div>
                <div>
                  <p className="font-bold text-green-900 text-lg">Your session is live!</p>
                  <p className="text-green-700 text-sm mt-1">Join the video call to start your session</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  className="bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-950 hover:to-blue-900 text-white px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
                  onClick={() => setShowVideoModal(true)}
                >
                  <FaVideo size={16} /> Join Session
                </button>
                {activeSession.role === 'student' && (
                  <button
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
                    onClick={handleCancelSession}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}

          {showVideoModal && activeSession && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
              <VideoCall
                sessionId={activeSession.sessionId}
                userRole={activeSession.role}
                onEndCall={handleEndCall}
                username={username}
              />
            </div>
          )}

          {/* Mandatory Rating Modal for completed sessions (student only) */}
          <SessionRatingModal
            open={showRatingModal}
            onSubmit={submitSessionRating}
            sessionType={ratingContext?.sessionType || 'Session'}
            expertName={ratingContext?.expertName || ''}
          />

          {/* Tabs */}
          <div className="mb-8">
            <div className="inline-flex gap-1 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('received')}
                className={`px-6 py-3 font-medium transition-all ${
                  activeTab === 'received'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>Received</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    {requestType === 'session'
                      ? requests.received.length
                      : requestType === 'skillmate'
                        ? skillMateRequests.received.length
                        : (interviewRequests?.received || []).length}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`px-6 py-3 font-medium transition-all ${
                  activeTab === 'sent'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>Sent</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    {requestType === 'session'
                      ? requests.sent.length
                      : requestType === 'skillmate'
                        ? skillMateRequests.sent.length
                        : (interviewRequests?.sent || []).length}
                  </span>
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {requestType === 'session' ? (
              activeTab === 'received' ? (
                requests.received.length === 0 ? (
                  <div className="text-center py-20 bg-gradient-to-br from-white to-blue-50 rounded-2xl border-2 border-dashed border-blue-200 shadow-sm">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-lg mb-6">
                      <FaClock className="text-white text-4xl" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">No Received Session Requests</h3>
                    <p className="text-gray-600 text-lg">You haven't received any session requests yet.</p>
                    <p className="text-gray-500 text-sm mt-2">New requests will appear here when they arrive</p>
                  </div>
                ) : (
                  requests.received.map((request) => (
                    <RequestCard key={request._id} request={request} isReceived={true} type="session" />
                  ))
                )
              ) : requests.sent.length === 0 ? (
                <div className="text-center py-20 bg-gradient-to-br from-white to-blue-50 rounded-2xl border-2 border-dashed border-blue-200 shadow-sm">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-lg mb-6">
                    <FaVideo className="text-white text-4xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">No Sent Session Requests</h3>
                  <p className="text-gray-600 text-lg">You haven't sent any session requests yet.</p>
                  <p className="text-gray-500 text-sm mt-2">Start requesting sessions with tutors!</p>
                </div>
              ) : (
                requests.sent.map((request) => (
                  <RequestCard key={request._id} request={request} isReceived={false} type="session" />
                ))
              )
            ) : requestType === 'skillmate' ? (
              activeTab === 'received' ? (
                skillMateRequests.received.length === 0 ? (
                  <div className="text-center py-20 bg-gradient-to-br from-white to-purple-50 rounded-2xl border-2 border-dashed border-purple-200 shadow-sm">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg mb-6">
                      <FaUserFriends className="text-white text-4xl" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">No Received SkillMate Requests</h3>
                    <p className="text-gray-600 text-lg">You haven't received any SkillMate requests yet.</p>
                    <p className="text-gray-500 text-sm mt-2">Connect with others to share skills</p>
                  </div>
                ) : (
                  skillMateRequests.received.map((request) => (
                    <RequestCard key={request._id} request={request} isReceived={true} type="skillmate" />
                  ))
                )
              ) : skillMateRequests.sent.length === 0 ? (
                <div className="text-center py-20 bg-gradient-to-br from-white to-purple-50 rounded-2xl border-2 border-dashed border-purple-200 shadow-sm">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg mb-6">
                    <FaHandshake className="text-white text-4xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">No Sent SkillMate Requests</h3>
                  <p className="text-gray-600 text-lg">You haven't sent any SkillMate requests yet.</p>
                  <p className="text-gray-500 text-sm mt-2">Find SkillMates to connect with!</p>
                </div>
              ) : (
                skillMateRequests.sent.map((request) => (
                  <RequestCard key={request._id} request={request} isReceived={false} type="skillmate" />
                ))
              )
            ) : activeTab === 'received' ? (
              (interviewRequests?.received || []).length === 0 ? (
                <div className="text-center py-20 bg-gradient-to-br from-white to-indigo-50 rounded-2xl border-2 border-dashed border-indigo-200 shadow-sm">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-lg mb-6">
                    <FaUser className="text-white text-4xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">No Received Interview Requests</h3>
                  <p className="text-gray-600 text-lg">You haven't received any interview requests yet.</p>
                  <p className="text-gray-500 text-sm mt-2">Interview requests will appear here</p>
                </div>
              ) : (
                (interviewRequests?.received || []).map((request) => (
                  <InterviewRequestCard key={request._id} request={request} isReceived={true} />
                ))
              )
            ) : (interviewRequests?.sent || []).length === 0 ? (
              <div className="text-center py-20 bg-gradient-to-br from-white to-indigo-50 rounded-2xl border-2 border-dashed border-indigo-200 shadow-sm">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-lg mb-6">
                  <FaVideo className="text-white text-4xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No Sent Interview Requests</h3>
                <p className="text-gray-600 text-lg">You haven't sent any interview requests yet.</p>
                <p className="text-gray-500 text-sm mt-2">Request mock interviews to practice!</p>
              </div>
            ) : (
              (interviewRequests?.sent || []).map((request) => (
                <InterviewRequestCard key={request._id} request={request} isReceived={false} />
              ))
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default SessionRequests;

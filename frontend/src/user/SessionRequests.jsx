import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheck, FaTimes, FaClock, FaUser, FaBook, FaPlay, FaVideo, FaUserFriends, FaHandshake } from 'react-icons/fa';
import { BACKEND_URL } from '../config.js';
import socket from '../socket';
import { useAuth } from '../context/AuthContext';
import VideoCall from '../components/VideoCall';

const SessionRequests = () => {
  const [interviewRequests, setInterviewRequests] = useState({ received: [], sent: [] });
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState({ received: [], sent: [] });
  const [skillMateRequests, setSkillMateRequests] = useState({ received: [], sent: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('received');
  const [requestType, setRequestType] = useState('session'); // 'session' or 'skillmate'
  const [readyToStartSession, setReadyToStartSession] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [cancelledMessage, setCancelledMessage] = useState('');
  const [interviewBanner, setInterviewBanner] = useState(null); // { message, requestId }

  // Load active session from localStorage on component mount
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
      } catch (error) {
        localStorage.removeItem('activeSession');
      }
    }

      // Interview-specific card (separate from SessionRequestCard to avoid changing session logic)
      const InterviewRequestCard = ({ request, isReceived }) => {
        return (
          <div className="bg-white bg-opacity-80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="relative w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaUser className="text-blue-600 text-lg" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">{(request.requester && `${request.requester.firstName || ''} ${request.requester.lastName || ''}`) || (request.user && request.user.username) || 'User'}</h3>
                  <p className="text-sm text-gray-600">{isReceived ? 'Interview requested from you' : 'Interview requested by you'}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </span>
            </div>

            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-3">
                <FaBook className="text-blue-500" />
                <span className="font-semibold text-blue-900">Interview Details</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                <div><span className="font-medium">Company:</span> {request.company}</div>
                <div><span className="font-medium">Position:</span> {request.position}</div>
                <div><span className="font-medium">Interviewer:</span> {(request.assignedInterviewer && (request.assignedInterviewer.firstName || request.assignedInterviewer.username)) || 'TBD'}</div>
              </div>
              {request.message && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium text-blue-900">Message:</span>
                  <p className="text-sm text-gray-600 mt-1">{request.message}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <FaClock className="text-gray-400" />
                <span>{formatDate(request.createdAt)}</span>
              </div>

              <div>
                {request.status === 'assigned' && user && request.assignedInterviewer && (user._id === (request.assignedInterviewer._id || request.assignedInterviewer)) && (
                  <ScheduleInterviewInline request={request} onScheduled={() => { fetchInterviewRequests(); fetchSessionRequests(); }} />
                )}
                {request.status === 'scheduled' && (
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-gray-700">Scheduled: {request.scheduledAt ? formatDate(request.scheduledAt) : 'TBD'}</div>
                    {user && (String(user._id) === String(request.requester?._id || request.requester) || String(user._id) === String((request.assignedInterviewer && (request.assignedInterviewer._id || request.assignedInterviewer)) || '')) && (
                      <button className="bg-blue-900 text-white px-3 py-1 rounded" onClick={() => handleJoinInterview(request)}>Join Interview</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      };
    checkActiveSessionFromBackend();
  }, []);

  // Check for active sessions from backend
  const checkActiveSessionFromBackend = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/session-requests/active`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.activeSession &&
            ((data.activeSession.status && data.activeSession.status === 'active') ||
             (data.activeSession.sessionRequest && data.activeSession.sessionRequest.status === 'active'))
        ) {
          setActiveSession(data.activeSession);
        } else {
          setActiveSession(null);
          localStorage.removeItem('activeSession');
        }
      }
    } catch (error) {}
  };

  useEffect(() => {
  fetchSessionRequests();
  fetchSkillMateRequests();
  fetchInterviewRequests();
  }, []);

  // Save active session to localStorage whenever it changes
  // Fetch interview requests
  const fetchInterviewRequests = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/interview/requests`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        // Assume backend returns { received: [], sent: [] }
        setInterviewRequests(data);
      }
    } catch (error) {
      // ignore for now
    }
  };
  useEffect(() => {
    if (activeSession) {
      const sessionWithTimestamp = {
        ...activeSession,
        timestamp: Date.now()
      };
      localStorage.setItem('activeSession', JSON.stringify(sessionWithTimestamp));
      console.info('[DEBUG] SessionRequests: Saved active session to localStorage:', sessionWithTimestamp);
    } else {
      localStorage.removeItem('activeSession');
      console.info('[DEBUG] SessionRequests: Removed active session from localStorage');
    }
  }, [activeSession]);

  // Socket event handlers
  useEffect(() => {
    if (!user || !user._id) return;

    socket.emit('register', user._id);

    socket.on('session-request-received', (data) => {
      console.info('[DEBUG] SessionRequests: New request received:', data);
      fetchSessionRequests();
    });

    socket.on('skillmate-request-received', (data) => {
      console.info('[DEBUG] SessionRequests: New SkillMate request received:', data);
      fetchSkillMateRequests();
    });

    socket.on('skillmate-request-approved', (data) => {
      console.info('[DEBUG] SessionRequests: SkillMate request approved:', data);
      fetchSkillMateRequests();
    });

    socket.on('skillmate-request-rejected', (data) => {
      console.info('[DEBUG] SessionRequests: SkillMate request rejected:', data);
      fetchSkillMateRequests();
    });

    socket.on('session-started', (data) => {
      console.info('[DEBUG] SessionRequests: session-started event received:', data);
      let role = null;
      if (user && data.tutor && user._id === data.tutor._id) role = 'tutor';
      if (user && data.requester && user._id === data.requester._id) role = 'student';
      if (role) {
        const newActiveSession = {
          sessionId: data.sessionId,
          sessionRequest: data.sessionRequest,
          role
        };
        setActiveSession(newActiveSession);
        setShowVideoModal(false);
        setReadyToStartSession(null);
        console.info('[DEBUG] SessionRequests: activeSession set for role:', role);
      }
    });

    socket.on('session-cancelled', (data) => {
      setShowVideoModal(false);
      setActiveSession(null);
      setReadyToStartSession(null);
      localStorage.removeItem('activeSession');
      setCancelledMessage(data.message || 'Session was cancelled.');
      setTimeout(() => setCancelledMessage(""), 5000);
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
      if (activeSession && activeSession.sessionId === sessionId) {
        setShowVideoModal(false);
        setActiveSession(null);
        setReadyToStartSession(null);
        localStorage.removeItem('activeSession');
      }
    });

    // Listen for general notifications; if interview related, refresh interview requests
    socket.on('notification', (notification) => {
      try {
        if (!notification) return;
        const t = notification.type || '';
        if (t.startsWith('interview') || notification.requestId) {
          fetchInterviewRequests();
          fetchSessionRequests();
        }
        // Show inline banner to requester when their interview is scheduled/approved
        if (t === 'interview-scheduled') {
          // notification.userId is the recipient; ensure this notification is for this user
          const notifUserId = String(notification.userId || notification.userId?._id || '');
          if (user && String(user._id) === notifUserId) {
            setInterviewBanner({ message: notification.message || 'Your interview has been scheduled', requestId: notification.requestId });
            // auto-clear after 12 seconds
            setTimeout(() => setInterviewBanner(null), 12000);
          }
        }
      } catch (e) { /* ignore */ }
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
  }, [user, activeSession]);

  const fetchSessionRequests = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/session-requests/all`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else {
        setError('Failed to fetch session requests');
      }
    } catch (error) {
      setError('Failed to fetch session requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchSkillMateRequests = async () => {
    try {
      const receivedResponse = await fetch(`${BACKEND_URL}/api/skillmates/requests/received`, {
        credentials: 'include'
      });

      const sentResponse = await fetch(`${BACKEND_URL}/api/skillmates/requests/sent`, {
        credentials: 'include'
      });

      if (receivedResponse.ok && sentResponse.ok) {
        const receivedData = await receivedResponse.json();
        const sentData = await sentResponse.json();

        setSkillMateRequests({
          received: receivedData,
          sent: sentData
        });
      } else {
        console.error('Failed to fetch SkillMate requests');
      }
    } catch (error) {
      console.error('Error fetching SkillMate requests:', error);
    }
  };

  const handleApprove = async (requestId, type = 'session') => {
    try {
      if (type === 'session') {
        const response = await fetch(`${BACKEND_URL}/api/session-requests/approve/${requestId}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const approvedRequest = requests.received.find(req => req._id === requestId);
          if (approvedRequest) {
            setReadyToStartSession(approvedRequest);
          }
          fetchSessionRequests();
        } else {
          setError('Failed to approve session request');
        }
      } else if (type === 'skillmate') {
        socket.emit('approve-skillmate-request', { requestId });
        fetchSkillMateRequests();
      }
    } catch (error) {
      setError(`Failed to approve ${type} request`);
    }
  };

  const handleReject = async (requestId, type = 'session') => {
    try {
      if (type === 'session') {
        const response = await fetch(`${BACKEND_URL}/api/session-requests/reject/${requestId}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          fetchSessionRequests();
        } else {
          setError('Failed to reject session request');
        }
      } else if (type === 'skillmate') {
        socket.emit('reject-skillmate-request', { requestId });
        fetchSkillMateRequests();
      }
    } catch (error) {
      setError(`Failed to reject ${type} request`);
    }
  };

  const handleStartSession = async () => {
    if (readyToStartSession) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/session-requests/start/${readyToStartSession._id}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          const data = await response.json();
          setActiveSession({
            sessionId: data.sessionRequest._id,
            sessionRequest: data.sessionRequest,
            role: 'tutor'
          });
          setShowVideoModal(true);
        } else {
          setError('Failed to start session');
        }
      } catch (error) {
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
          headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          setActiveSession(null);
          setReadyToStartSession(null);
          setShowVideoModal(false);
          localStorage.removeItem('activeSession');
        } else {
          setError('Failed to cancel session');
        }
      } catch (error) {
        setError('Failed to cancel session');
      }
    }
  };

  const handleEndCall = async () => {
    if (activeSession) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/session-requests/complete/${activeSession.sessionId}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          setActiveSession(null);
          setReadyToStartSession(null);
          setShowVideoModal(false);
          localStorage.removeItem('activeSession');
        } else {
          setError('Failed to complete session');
        }
      } catch (error) {
        setError('Failed to complete session');
      }
    } else {
      setShowVideoModal(false);
      setActiveSession(null);
      setReadyToStartSession(null);
      localStorage.removeItem('activeSession');
    }
  };

  const handleJoinInterview = (request) => {
    try {
      const role = user && user._id === (request.assignedInterviewer?._id || request.assignedInterviewer) ? 'tutor' : 'student';
      navigate(`/interview-call/${request._id}`);
    } catch (e) {
      console.error('Failed to join interview', e);
      alert('Failed to join interview');
    }
  };

  function ScheduleInterviewInline({ request, onScheduled }) {
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
      <div className="flex items-center space-x-2">
        <input type="date" className="border px-2 py-1" value={date} onChange={e => setDate(e.target.value)} />
        <input type="time" className="border px-2 py-1" value={time} onChange={e => setTime(e.target.value)} />
        <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={submitSchedule} disabled={loadingSchedule}>{loadingSchedule ? 'Scheduling...' : 'Schedule'}</button>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return String(dateString);
    }
  };

  const SessionRequestCard = ({ request, isReceived }) => {
    // defensive: compute display names safely across different request shapes
    const getDisplayName = () => {
      if (isReceived) {
        // For received: requester is the person who requested (may be populated)
        const r = request.requester || request.requesterId || request.requesterDetails;
        if (r) return `${r.firstName || ''} ${r.lastName || ''}`.trim() || r.username || 'User';
        return 'User';
      } else {
        // For sent: may have tutor, recipient, assignedInterviewer
        const t = request.tutor || request.recipient || request.assignedInterviewer || request.recipientDetails;
        if (t) return `${t.firstName || ''} ${t.lastName || ''}`.trim() || t.username || 'User';
        return 'User';
      }
    };

    const displayName = getDisplayName();

    return (
    <div className="bg-white bg-opacity-80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="relative w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <FaUser className="text-blue-600 text-lg" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900">
              {displayName}
            </h3>
            <p className="text-sm text-gray-600">
              {isReceived ? 'Requested from you' : 'Requested by you'}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-3">
          <FaBook className="text-blue-500" />
          <span className="font-semibold text-blue-900">Subject Details</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
          <div>
            <span className="font-medium">Subject:</span> {request.subject}
          </div>
          <div>
            <span className="font-medium">Topic:</span> {request.topic}
          </div>
          <div>
            <span className="font-medium">Subtopic:</span> {request.subtopic}
          </div>
        </div>
        {request.message && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <span className="font-medium text-blue-900">Message:</span>
            <p className="text-sm text-gray-600 mt-1">{request.message}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <FaClock className="text-gray-400" />
          <span>{formatDate(request.createdAt)}</span>
        </div>

        {/* Interview-specific scheduling and join handling */}
        { (request.subject || request.topic || request.assignedInterviewer) && (
          <div className="flex items-center space-x-2">
            {request.status === 'assigned' && user && request.assignedInterviewer && (user._id === (request.assignedInterviewer._id || request.assignedInterviewer)) && (
              <ScheduleInterviewInline request={request} onScheduled={() => { fetchInterviewRequests(); fetchSessionRequests(); }} />
            )}
            {request.status === 'scheduled' && (
              <div className="flex space-x-2 items-center">
                <div className="text-sm text-gray-700">Scheduled: {request.scheduledAt ? formatDate(request.scheduledAt) : 'TBD'}</div>
                {user && (String(user._id) === String(request.requester?._id || request.requester) || String(user._id) === String((request.assignedInterviewer && (request.assignedInterviewer._id || request.assignedInterviewer)) || '')) && (
                  <button className="bg-blue-900 text-white px-3 py-1 rounded" onClick={() => handleJoinInterview(request)}>Join Interview</button>
                )}
              </div>
            )}
          </div>
        )}

        {isReceived && request.status === 'pending' && (
          <div className="flex space-x-3">
            <button
              onClick={() => handleApprove(request._id)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-1 transition-all duration-300"
            >
              <FaCheck className="text-xs" />
              <span>Approve</span>
            </button>
            <button
              onClick={() => handleReject(request._id)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-1 transition-all duration-300"
            >
              <FaTimes className="text-xs" />
              <span>Reject</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
  }

  const SkillMateRequestCard = ({ request, isReceived }) => (
    <div className="bg-white bg-opacity-80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="relative w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <FaUserFriends className="text-blue-600 text-lg" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900">
              {isReceived
                ? `${request.requester.firstName || ''} ${request.requester.lastName || ''}`
                : `${request.recipient.firstName || ''} ${request.recipient.lastName || ''}`
              }
            </h3>
            <p className="text-sm text-gray-600">
              {isReceived ? 'Wants to be your SkillMate' : 'SkillMate request sent'}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <FaClock className="text-gray-400" />
          <span>{formatDate(request.createdAt)}</span>
        </div>

        {isReceived && request.status === 'pending' && (
          <div className="flex space-x-3">
            <button
              onClick={() => handleApprove(request._id, 'skillmate')}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-1 transition-all duration-300"
            >
              <FaCheck className="text-xs" />
              <span>Approve</span>
            </button>
            <button
              onClick={() => handleReject(request._id, 'skillmate')}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-1 transition-all duration-300"
            >
              <FaTimes className="text-xs" />
              <span>Reject</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading requests...</p>
        </div>
      </div>
    );
  }

    // Interview request card (keeps UI simple and consistent with SessionRequestCard)
    const InterviewRequestCard = ({ request, isReceived }) => {
      const otherUser = isReceived
        ? `${request.requester?.firstName || ''} ${request.requester?.lastName || ''}`.trim()
        : `${request.assignedInterviewer?.firstName || ''} ${request.assignedInterviewer?.lastName || ''}`.trim();

      return (
        <div className="bg-white bg-opacity-80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="relative w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FaUser className="text-blue-600 text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">{otherUser || (isReceived ? 'Requester' : 'Interviewer')}</h3>
                <p className="text-sm text-gray-600">{isReceived ? 'Interview requested' : 'Interview sent'}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </span>
          </div>

          <div className="mb-3 text-sm text-gray-700">Company: <span className="font-medium">{request.company || '—'}</span> • Position: <span className="font-medium">{request.position || '—'}</span></div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <FaClock className="text-gray-400" />
              <span>{request.scheduledAt ? formatDate(request.scheduledAt) : formatDate(request.createdAt)}</span>
            </div>

            <div>
              {request.status === 'scheduled' && (
                <button
                  onClick={() => handleJoinInterview(request)}
                  className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
                >
                  <FaVideo className="text-xs" />
                  <span>Join Interview</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    };

  const username = user ? user.username || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User' : 'User';

  return (
    <div className="min-h-screen bg-cream-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-blue-900 mb-3">Manage Your Requests</h1>
          <p className="text-lg text-gray-600">View and manage your Session and SkillMate requests</p>
        </div>

        {error && (
          <div className="mb-8 bg-red-100 border border-red-300 text-red-800 px-6 py-4 rounded-lg text-center">
            {error}
          </div>
        )}

        {readyToStartSession && (
          <div className="mb-10 flex justify-center">
            <div className="bg-green-100 bg-opacity-80 backdrop-blur-sm border border-green-300 text-green-900 px-8 py-6 rounded-xl shadow-lg text-center max-w-md">
              <p className="text-lg font-semibold mb-4">Session Approved! Ready to start?</p>
              <button
                className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-300"
                onClick={handleStartSession}
              >
                <FaPlay className="text-sm" />
                <span>Start Session</span>
              </button>
            </div>
          </div>
        )}

        {cancelledMessage && (
          <div className="mb-8 bg-red-100 border border-red-300 text-red-800 px-6 py-4 rounded-lg text-center">
            {cancelledMessage}
          </div>
        )}

        {interviewBanner && (
          <div className="mb-8 bg-blue-100 border border-blue-300 text-blue-900 px-6 py-4 rounded-lg text-center flex items-center justify-between gap-4">
            <div className="text-left">{interviewBanner.message}</div>
            <div className="flex items-center gap-2">
              <button
                className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded"
                onClick={() => {
                  // find the request in interviewRequests or refetch
                  const req = ((interviewRequests?.sent || []).concat(interviewRequests?.received || [])).find(r => r._id === interviewBanner.requestId);
                  if (req) {
                    handleJoinInterview(req);
                  } else {
                    // fallback: refetch and then attempt join
                    fetchInterviewRequests().then(() => {
                      const r = ((interviewRequests?.sent || []).concat(interviewRequests?.received || [])).find(x => x._id === interviewBanner.requestId);
                      if (r) handleJoinInterview(r);
                      else alert('Unable to find scheduled interview yet, please check requests.');
                    });
                  }
                }}
              >
                Join Interview
              </button>
              <button className="px-3 py-2 rounded border" onClick={() => setInterviewBanner(null)}>Dismiss</button>
            </div>
          </div>
        )}

        {activeSession && (
          <div className="mb-10 flex justify-center">
            <div className="bg-green-100 bg-opacity-80 backdrop-blur-sm border border-green-300 text-green-900 px-8 py-6 rounded-xl shadow-lg text-center max-w-md">
              <p className="text-lg font-semibold mb-4">Your session is ready!</p>
              <div className="flex gap-4 justify-center">
                <button
                  className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all duration-300"
                  onClick={() => setShowVideoModal(true)}
                >
                  <FaVideo className="text-sm" />
                  <span>Join Session</span>
                </button>
                {activeSession.role === 'student' && (
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
                    onClick={handleCancelSession}
                  >
                    Cancel Session
                  </button>
                )}
              </div>
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

        <div className="mb-8">
          <div className="flex justify-center space-x-6 border-b-2 border-gray-200 pb-2">
            <button
              onClick={() => setRequestType('session')}
              className={`relative flex items-center space-x-2 py-3 px-6 text-lg font-semibold transition-all duration-300 ${
                requestType === 'session'
                  ? 'text-blue-900 border-b-4 border-blue-900'
                  : 'text-gray-600 hover:text-blue-900'
              }`}
            >
              <FaVideo className="text-lg" />
              <span>Session Requests</span>
              {requests.received.filter(req => req.status === 'pending').length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs animate-pulse">
                  {requests.received.filter(req => req.status === 'pending').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setRequestType('skillmate')}
              className={`relative flex items-center space-x-2 py-3 px-6 text-lg font-semibold transition-all duration-300 ${
                requestType === 'skillmate'
                  ? 'text-blue-900 border-b-4 border-blue-900'
                  : 'text-gray-600 hover:text-blue-900'
              }`}
            >
              <FaHandshake className="text-lg" />
              <span>SkillMate Requests</span>
              {skillMateRequests.received.filter(req => req.status === 'pending').length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs animate-pulse">
                  {skillMateRequests.received.filter(req => req.status === 'pending').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setRequestType('interview')}
              className={`relative flex items-center space-x-2 py-3 px-6 text-lg font-semibold transition-all duration-300 ${
                requestType === 'interview'
                  ? 'text-blue-900 border-b-4 border-blue-900'
                  : 'text-gray-600 hover:text-blue-900'
              }`}
            >
              <FaUser className="text-lg" />
              <span>Interview Requests</span>
              {(interviewRequests?.received || []).filter(req => req.status === 'pending').length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs animate-pulse">
                  {(interviewRequests?.received || []).filter(req => req.status === 'pending').length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-center space-x-6 border-b border-gray-200 pb-2">
            {(() => {
              const receivedCount = requestType === 'session'
                ? (requests.received || []).length
                : requestType === 'skillmate'
                  ? (skillMateRequests.received || []).length
                  : (interviewRequests?.received || []).length;

              const sentCount = requestType === 'session'
                ? (requests.sent || []).length
                : requestType === 'skillmate'
                  ? (skillMateRequests.sent || []).length
                  : (interviewRequests?.sent || []).length;

              return (
                <>
                  <button
                    onClick={() => setActiveTab('received')}
                    className={`relative py-2 px-4 text-base font-medium transition-all duration-300 ${
                      activeTab === 'received'
                        ? 'text-blue-900 border-b-2 border-blue-900'
                        : 'text-gray-600 hover:text-blue-900'
                    }`}
                  >
                    Received ({receivedCount})
                  </button>
                  <button
                    onClick={() => setActiveTab('sent')}
                    className={`relative py-2 px-4 text-base font-medium transition-all duration-300 ${
                      activeTab === 'sent'
                        ? 'text-blue-900 border-b-2 border-blue-900'
                        : 'text-gray-600 hover:text-blue-900'
                    }`}
                  >
                    Sent ({sentCount})
                  </button>
                </>
              );
            })()}
          </div>
        </div>

        <div className="space-y-6">
          {requestType === 'session' ? (
            activeTab === 'received' ? (
              requests.received.length === 0 ? (
                <div className="text-center py-16 bg-white bg-opacity-80 backdrop-blur-sm rounded-xl shadow-lg">
                  <FaClock className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-semibold text-blue-900">No Received Session Requests</h3>
                  <p className="mt-1 text-gray-600">You haven't received any session requests yet.</p>
                </div>
              ) : (
                requests.received.map((request) => (
                  <SessionRequestCard key={request._id} request={request} isReceived={true} />
                ))
              )
            ) : (
              requests.sent.length === 0 ? (
                <div className="text-center py-16 bg-white bg-opacity-80 backdrop-blur-sm rounded-xl shadow-lg">
                  <FaClock className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-semibold text-blue-900">No Sent Session Requests</h3>
                  <p className="mt-1 text-gray-600">You haven't sent any session requests yet.</p>
                </div>
              ) : (
                requests.sent.map((request) => (
                  <SessionRequestCard key={request._id} request={request} isReceived={false} />
                ))
              )
            )
          ) : requestType === 'skillmate' ? (
            activeTab === 'received' ? (
              skillMateRequests.received.length === 0 ? (
                <div className="text-center py-16 bg-white bg-opacity-80 backdrop-blur-sm rounded-xl shadow-lg">
                  <FaUserFriends className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-semibold text-blue-900">No Received SkillMate Requests</h3>
                  <p className="mt-1 text-gray-600">You haven't received any SkillMate requests yet.</p>
                </div>
              ) : (
                skillMateRequests.received.map((request) => (
                  <SkillMateRequestCard key={request._id} request={request} isReceived={true} />
                ))
              )
            ) : (
              skillMateRequests.sent.length === 0 ? (
                <div className="text-center py-16 bg-white bg-opacity-80 backdrop-blur-sm rounded-xl shadow-lg">
                  <FaUserFriends className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-semibold text-blue-900">No Sent SkillMate Requests</h3>
                  <p className="mt-1 text-gray-600">You haven't sent any SkillMate requests yet.</p>
                </div>
              ) : (
                skillMateRequests.sent.map((request) => (
                  <SkillMateRequestCard key={request._id} request={request} isReceived={false} />
                ))
              )
            )
          ) : requestType === 'interview' ? (
            activeTab === 'received' ? (
              (interviewRequests?.received || []).length === 0 ? (
                <div className="text-center py-16 bg-white bg-opacity-80 backdrop-blur-sm rounded-xl shadow-lg">
                  <FaUser className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-semibold text-blue-900">No Received Interview Requests</h3>
                  <p className="mt-1 text-gray-600">You haven't received any interview requests yet.</p>
                </div>
              ) : (
                (interviewRequests?.received || []).map((request) => (
                  <InterviewRequestCard key={request._id} request={request} isReceived={true} />
                ))
              )
            ) : (
              (interviewRequests?.sent || []).length === 0 ? (
                <div className="text-center py-16 bg-white bg-opacity-80 backdrop-blur-sm rounded-xl shadow-lg">
                  <FaUser className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-semibold text-blue-900">No Sent Interview Requests</h3>
                  <p className="mt-1 text-gray-600">You haven't sent any interview requests yet.</p>
                </div>
              ) : (
                (interviewRequests?.sent || []).map((request) => (
                  <InterviewRequestCard key={request._id} request={request} isReceived={false} />
                ))
              )
            )
          ) : null}
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={() => navigate('/')}
            className="bg-blue-900 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:bg-blue-800 transition-all duration-300 hover:scale-105"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

// Interview request card (keeps UI simple and consistent with SessionRequestCard)
const InterviewRequestCard = ({ request, isReceived }) => {
  const otherUser = isReceived
    ? `${request.requester?.firstName || ''} ${request.requester?.lastName || ''}`.trim()
    : `${request.assignedInterviewer?.firstName || ''} ${request.assignedInterviewer?.lastName || ''}`.trim();

  return (
    <div className="bg-white bg-opacity-80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="relative w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <FaUser className="text-blue-600 text-lg" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900">{otherUser || (isReceived ? 'Requester' : 'Interviewer')}</h3>
            <p className="text-sm text-gray-600">{isReceived ? 'Interview requested' : 'Interview sent'}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </span>
      </div>

      <div className="mb-3 text-sm text-gray-700">Company: <span className="font-medium">{request.company || '—'}</span> • Position: <span className="font-medium">{request.position || '—'}</span></div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 text-sm text-gray-600">
          <FaClock className="text-gray-400" />
          <span>{request.scheduledAt ? formatDate(request.scheduledAt) : formatDate(request.createdAt)}</span>
        </div>

        <div>
          {request.status === 'scheduled' && (
            <button
              onClick={() => handleJoinInterview(request)}
              className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
            >
              <FaVideo className="text-xs" />
              <span>Join Interview</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionRequests;
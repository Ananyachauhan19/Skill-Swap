import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheck, FaTimes, FaClock, FaUser, FaBook, FaPlay, FaVideo } from 'react-icons/fa';
import { BACKEND_URL } from '../config.js';
import socket from '../socket';
import { useAuth } from '../context/AuthContext';
import VideoCall from '../components/VideoCall';

const SessionRequests = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState({ received: [], sent: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('received');
  const [readyToStartSession, setReadyToStartSession] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [cancelledMessage, setCancelledMessage] = useState('');

  // Load active session from localStorage on component mount
  useEffect(() => {
    const savedActiveSession = localStorage.getItem('activeSession');
    if (savedActiveSession) {
      try {
        const session = JSON.parse(savedActiveSession);
        // Only restore if session is actually started (status 'active')
        if (session.status === 'active' || (session.sessionRequest && session.sessionRequest.status === 'active')) {
          setActiveSession(session);
        } else {
          localStorage.removeItem('activeSession');
        }
      } catch (error) {
        localStorage.removeItem('activeSession');
      }
    }
    // Also check for active sessions from backend as fallback
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
        // Only set activeSession if status is 'active'
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
  }, []);

  // Save active session to localStorage whenever it changes
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

    // Listen for new session requests
    socket.on('session-request-received', (data) => {
      console.info('[DEBUG] SessionRequests: New request received:', data);
      fetchSessionRequests(); // Refresh the list
    });

    // Listen for session-started events
    socket.on('session-started', (data) => {
      console.info('[DEBUG] SessionRequests: session-started event received:', data);
      let role = null;
      if (user && data.tutor && user._id === data.tutor._id) role = 'tutor';
      if (user && data.requester && user._id === data.requester._id) role = 'requester';
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
      // Clear from localStorage as well
      localStorage.removeItem('activeSession');
      setCancelledMessage(data.message || 'Session was cancelled.');
      setTimeout(() => setCancelledMessage(""), 5000);
    });

    // Hide session block when call ends or session is completed
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

    return () => {
      socket.off('session-request-received');
      socket.off('session-started');
      socket.off('session-cancelled');
      socket.off('end-call');
      socket.off('session-completed');
    };
  }, [user, activeSession]);

  const fetchSessionRequests = async () => {
    try {
      setLoading(true);
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

  const handleApprove = async (requestId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/session-requests/approve/${requestId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        // Find the approved request
        const approvedRequest = requests.received.find(req => req._id === requestId);
        if (approvedRequest) {
          setReadyToStartSession(approvedRequest);
        }
        fetchSessionRequests();
      } else {
        setError('Failed to approve request');
      }
    } catch (error) {
      setError('Failed to approve request');
    }
  };

  const handleReject = async (requestId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/session-requests/reject/${requestId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        fetchSessionRequests();
      } else {
        setError('Failed to reject request');
      }
    } catch (error) {
      setError('Failed to reject request');
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
          // Set activeSession with the returned sessionRequest
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const RequestCard = ({ request, isReceived }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <FaUser className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">
              {isReceived 
                ? `${request.requester.firstName} ${request.requester.lastName}`
                : `${request.tutor.firstName} ${request.tutor.lastName}`
              }
            </h3>
            <p className="text-sm text-gray-500">
              {isReceived ? 'Requested from you' : 'Requested by you'}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <FaBook className="text-blue-500" />
          <span className="font-medium text-gray-700">Subject Details</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
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
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-700">Message:</span>
            <p className="text-sm text-gray-600 mt-1">{request.message}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <FaClock className="text-gray-400" />
          <span>{formatDate(request.createdAt)}</span>
        </div>
        
        {isReceived && request.status === 'pending' && (
          <div className="flex space-x-2">
            <button
              onClick={() => handleApprove(request._id)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-1 transition-colors"
            >
              <FaCheck className="text-xs" />
              <span>Approve</span>
            </button>
            <button
              onClick={() => handleReject(request._id)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-1 transition-colors"
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Session Requests</h1>
          <p className="text-gray-600">Manage your session requests and responses</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Show Start Session button for tutor after approval */}
        {readyToStartSession && (
          <div className="mb-8 flex flex-col items-center">
            <div className="bg-green-100 border border-green-400 text-green-800 px-6 py-4 rounded-lg mb-2">
              Session approved! Click below to <b>Start Session</b>.<br />
              <button
                className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-semibold flex items-center space-x-2"
                onClick={handleStartSession}
              >
                <FaPlay className="text-xs" />
                <span>Start Session</span>
              </button>
            </div>
          </div>
        )}

        {cancelledMessage && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {cancelledMessage}
          </div>
        )}

        {/* Active Session Join Button - Shows for both users */}
        {activeSession && (
          <div className="mb-8 flex flex-col items-center">
            <div className="bg-green-100 border border-green-400 text-green-800 px-6 py-4 rounded-lg mb-2">
              Your session is ready! Click below to <b>Join Session</b>{activeSession.role === 'requester' && <> or <b>Cancel Session</b></>}.<br />
              <div className="flex gap-4 mt-3">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-semibold flex items-center space-x-2"
                  onClick={() => setShowVideoModal(true)}
                >
                  <FaVideo className="text-xs" />
                  <span>Join Session</span>
                </button>
                {activeSession.role === 'requester' && (
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-md font-semibold"
                    onClick={handleCancelSession}
                  >
                    Cancel Session
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Video Call Modal */}
        {showVideoModal && activeSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <VideoCall
              sessionId={activeSession.sessionId}
              userRole={activeSession.role}
              onEndCall={handleEndCall}
            />
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('received')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'received'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Received ({requests.received.length})
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'sent'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Sent ({requests.sent.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'received' ? (
            requests.received.length === 0 ? (
              <div className="text-center py-12">
                <FaClock className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No received requests</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You haven't received any session requests yet.
                </p>
              </div>
            ) : (
              requests.received.map((request) => (
                <RequestCard key={request._id} request={request} isReceived={true} />
              ))
            )
          ) : (
            requests.sent.length === 0 ? (
              <div className="text-center py-12">
                <FaClock className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No sent requests</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You haven't sent any session requests yet.
                </p>
              </div>
            ) : (
              requests.sent.map((request) => (
                <RequestCard key={request._id} request={request} isReceived={false} />
              ))
            )
          )}
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold text-lg shadow-md hover:bg-blue-700 transition-all duration-300 hover:scale-105"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionRequests; 
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/searchBar';
import TutorCard from './oneononeSection/TutorCard';
import socket from '../socket';
import { useAuth } from '../context/AuthContext';
import { BACKEND_URL } from '../config.js';
import VideoCall from '../components/VideoCall.jsx';

const StartSkillSwap = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courseValue, setCourseValue] = useState("");
  const [unitValue, setUnitValue] = useState("");
  const [topicValue, setTopicValue] = useState("");
  const [tutors, setTutors] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pendingRequests, setPendingRequests] = useState([]);
  const [readyToStartSession, setReadyToStartSession] = useState(null); // sessionRequest object
  const [activeSession, setActiveSession] = useState(null); // { sessionId, sessionRequest, role }
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [cancelledMessage, setCancelledMessage] = useState("");

  // Fetch pending session requests where user is tutor
  const fetchPendingRequests = async () => {
    if (!user || !user._id) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/session-requests/received`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setPendingRequests(data);
      }
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, [user]);

  // Listen for new session requests via socket
  useEffect(() => {
    if (user && user._id) {
      socket.emit('register', user._id);
    }
    socket.on('session-request-received', (data) => {
      setPendingRequests((prev) => [data.sessionRequest, ...prev]);
    });
    return () => {
      socket.off('session-request-received');
    };
  }, [user]);

  useEffect(() => {
    if (!user || !user._id) return; // Only register handlers if user is loaded

    socket.emit('register', user._id);

    // Listen for tutors found
    socket.on('tutors-found', (data) => {
      console.info('[DEBUG] StartSkillSwap: tutors-found event received:', data);
      setLoading(false);
      if (data.error) {
        setError(data.error);
        setTutors([]);
      } else {
        setError("");
        setTutors(data.tutors);
      }
      setSearched(true);
    });

    // Listen for session request responses
    socket.on('session-request-sent', (data) => {
      setSuccessMessage(data.message);
      setTimeout(() => setSuccessMessage(""), 3000);
    });

    socket.on('session-request-error', (data) => {
      setError(data.message);
      setTimeout(() => setError(""), 5000);
    });

    // Listen for session-started events
    socket.on('session-started', (data) => {
      console.info('[DEBUG] session-started event received:', data, 'Current user:', user && user._id);
      let role = null;
      if (user && data.tutor && user._id === data.tutor._id) role = 'tutor';
      if (user && data.requester && user._id === data.requester._id) role = 'requester';
      if (role) {
        setActiveSession({
          sessionId: data.sessionId,
          sessionRequest: data.sessionRequest,
          role
        });
        console.info('[DEBUG] activeSession set:', {
          sessionId: data.sessionId,
          role
        });
        setShowVideoModal(false); // Hide any previous modal
        setReadyToStartSession(null); // Clear the ready state
      }
    });

    socket.on('session-cancelled', (data) => {
      setShowVideoModal(false);
      setActiveSession(null);
      setReadyToStartSession(null);
      setCancelledMessage(data.message || 'Session was cancelled.');
      setTimeout(() => setCancelledMessage(""), 5000);
    });

    return () => {
      socket.off('tutors-found');
      socket.off('session-request-sent');
      socket.off('session-request-error');
      socket.off('session-started');
      socket.off('session-cancelled');
    };
  }, [user]);

  const handleFindTutor = () => {
    if (!courseValue || !unitValue || !topicValue) {
      setError("Please select all fields (Subject, Topic, and Subtopic)");
      return;
    }
    console.info('[DEBUG] StartSkillSwap: handleFindTutor called, user:', user && user._id);
    setLoading(true);
    setError("");
    socket.emit('find-tutors', {
      subject: courseValue,
      topic: unitValue,
      subtopic: topicValue
    });
  };

  // Approve/Reject handlers for pending requests
  const handleApprove = async (request) => {
    console.info('[DEBUG] StartSkillSwap: handleApprove called for request:', request._id);
    try {
      const res = await fetch(`${BACKEND_URL}/api/session-requests/approve/${request._id}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        console.info('[DEBUG] StartSkillSwap: Request approved successfully');
        setPendingRequests((prev) => prev.filter((r) => r._id !== request._id));
        setReadyToStartSession(request); // Show Start Session button for this request
      }
    } catch (err) {
      setError('Failed to approve request');
    }
  };
  const handleReject = async (request) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/session-requests/reject/${request._id}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        setPendingRequests((prev) => prev.filter((r) => r._id !== request._id));
      }
    } catch (err) {
      setError('Failed to reject request');
    }
  };

  const handleStartSession = () => {
    console.info('[DEBUG] StartSkillSwap: handleStartSession called, readyToStartSession:', readyToStartSession && readyToStartSession._id);
    if (readyToStartSession) {
      socket.emit('start-session', { sessionId: readyToStartSession._id });
      setShowVideoModal(true); // Open the video call for the tutor immediately
    }
  };

  const handleRequestSession = async (tutor) => {
    try {
      setError("");
      setSuccessMessage("");
      socket.emit('send-session-request', {
        tutorId: tutor.userId,
        subject: courseValue,
        topic: unitValue,
        subtopic: topicValue,
        message: `I would like to learn ${courseValue} - ${unitValue} - ${topicValue}`
      });
    } catch (error) {
      setError("Failed to send session request. Please try again.");
    }
  };

  const handleCancelSession = () => {
    if (activeSession) {
      socket.emit('cancel-session', { sessionId: activeSession.sessionId });
    }
  };

  return (
    <div className="min-h-screen w-full bg-blue-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-blue-900 mb-8 text-center animate-fadeIn">
          Find Tutors for Your Doubts
        </h1>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-10 text-center animate-fadeIn">
          Search for expert tutors by entering a topic/tutor related to your doubts. Connect with the perfect mentor to guide your learning journey.
        </p>

        {/* Pending Session Requests Section */}
        {pendingRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">Pending Session Requests</h2>
            <div className="space-y-4">
              {pendingRequests.map((req) => (
                <div key={req._id} className="bg-white border border-blue-200 rounded-lg p-4 shadow flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-semibold text-gray-800 mb-1">
                      {req.requester?.firstName} {req.requester?.lastName}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Subject:</span> {req.subject} | <span className="font-medium">Topic:</span> {req.topic} | <span className="font-medium">Subtopic:</span> {req.subtopic}
                    </div>
                    {req.message && <div className="text-sm text-gray-500 mb-1">{req.message}</div>}
                    <div className="text-xs text-gray-400">Requested at: {new Date(req.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2 mt-3 md:mt-0">
                    <button
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                      onClick={() => handleApprove(req)}
                    >
                      Approve
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                      onClick={() => handleReject(req)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show Start Session button for tutor after approval */}
        {readyToStartSession && (
          <div className="mb-8 flex flex-col items-center">
            <div className="bg-green-100 border border-green-400 text-green-800 px-6 py-4 rounded-lg mb-2">
              Session approved! Click below to <b>Start Session</b>.<br />
              <button
                className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-semibold"
                onClick={handleStartSession}
              >
                Start Session
              </button>
            </div>
          </div>
        )}

        {cancelledMessage && (
          <div className="mb-6 max-w-3xl mx-auto w-full">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {cancelledMessage}
            </div>
          </div>
        )}

        {/* Active Session Start/Join Button */}
        {activeSession && (
          <div className="mb-8 flex flex-col items-center">
            <div className="bg-green-100 border border-green-400 text-green-800 px-6 py-4 rounded-lg mb-2">
              {/* Both tutor and requester see Join Session. Requester also sees Cancel. */}
              <>
                Your session is ready! Click below to <b>Join Session</b>{activeSession.role === 'requester' && <> or <b>Cancel Session</b></>}.<br />
                <div className="flex gap-4 mt-3">
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-semibold"
                    onClick={() => setShowVideoModal(true)}
                  >
                    Join Session
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
              </>
            </div>
          </div>
        )}

        {showVideoModal && activeSession && (
          <>
            {console.info('[DEBUG] Rendering VideoCall for session:', activeSession.sessionId, 'role:', activeSession.role)}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <VideoCall
                sessionId={activeSession.sessionId}
                userRole={activeSession.role}
                onEndCall={() => setShowVideoModal(false)}
              />
            </div>
          </>
        )}

        <SearchBar
          courseValue={courseValue}
          setCourseValue={setCourseValue}
          unitValue={unitValue}
          setUnitValue={setUnitValue}
          topicValue={topicValue}
          setTopicValue={setTopicValue}
          onFindTutor={handleFindTutor}
        />
        
        {error && (
          <div className="mt-6 max-w-3xl mx-auto w-full">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mt-6 max-w-3xl mx-auto w-full">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
              {successMessage}
            </div>
          </div>
        )}

        {loading && (
          <div className="mt-10 max-w-3xl mx-auto w-full text-center">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-blue-700 text-lg">Finding online tutors...</span>
            </div>
          </div>
        )}

        {searched && !loading && (
          <div className="mt-10 max-w-3xl mx-auto w-full flex flex-col gap-6">
            {tutors.length === 0 ? (
              <div className="text-center text-blue-700 text-lg">
                No online tutors found for your search criteria. Try different subjects or topics.
              </div>
            ) : (
              <>
                <div className="text-center text-green-700 text-lg font-semibold">
                  Found {tutors.length} online tutor{tutors.length > 1 ? 's' : ''} for your search
                </div>
                {tutors.map((tutor, idx) => (
                  <TutorCard
                    key={idx}
                    tutor={{
                      name: `${tutor.firstName} ${tutor.lastName}`,
                      profilePic: tutor.profilePic || "",
                      status: tutor.status,
                      date: new Date().toISOString().split('T')[0],
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      skills: [courseValue, unitValue, topicValue].filter(Boolean),
                      rating: tutor.rating || 4.5,
                      userId: tutor.userId,
                      socketId: tutor.socketId
                    }}
                    onRequestSession={() => handleRequestSession(tutor)}
                  />
                ))}
              </>
            )}
          </div>
        )}
        
        <div className="mt-12 text-center">
          <button
            className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold text-lg shadow-md hover:bg-blue-700 transition-all duration-300 hover:scale-105"
            onClick={() => navigate('/')}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartSkillSwap;
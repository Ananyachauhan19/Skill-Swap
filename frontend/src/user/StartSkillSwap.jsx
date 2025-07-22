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
  const [questionValue, setQuestionValue] = useState("");
  const [questionPhoto, setQuestionPhoto] = useState(null);
  const [tutors, setTutors] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [cancelledMessage, setCancelledMessage] = useState("");
  const [sessionStarted, setSessionStarted] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [showSessionButtons, setShowSessionButtons] = useState(false);

  useEffect(() => {
    if (user && user._id) {
      socket.emit('register', user._id);
    }

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

    socket.on('session-request-sent', (data) => {
      setSuccessMessage(data.message);
      setTimeout(() => setSuccessMessage(""), 3000);
    });

    socket.on('session-request-error', (data) => {
      setError(data.message);
      setTimeout(() => setError(""), 5000);
    });

    socket.on('session-started', (data) => {
      setSessionStarted(true);
      setActiveSessionId(data.sessionId);
      setShowSessionButtons(true);
    });

    socket.on('end-call', ({ sessionId }) => {
      if (sessionId === activeSessionId) {
        setShowSessionButtons(false);
        setSessionStarted(false);
        setActiveSessionId(null);
      }
    });
    socket.on('session-completed', ({ sessionId }) => {
      if (sessionId === activeSessionId) {
        setShowSessionButtons(false);
        setSessionStarted(false);
        setActiveSessionId(null);
      }
    });

    return () => {
      socket.off('tutors-found');
      socket.off('session-request-sent');
      socket.off('session-request-error');
      socket.off('session-started');
      socket.off('end-call');
      socket.off('session-completed');
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
      subtopic: topicValue,
      question: questionValue,
      questionPhoto: questionPhoto ? questionPhoto.name : null,
    });
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
        question: questionValue,
        questionPhoto: questionPhoto ? questionPhoto.name : null,
        message: `I would like to learn ${courseValue} - ${unitValue} - ${topicValue}${questionValue ? `: ${questionValue}` : ''}`,
      });
    } catch (error) {
      setError("Failed to send session request. Please try again.");
    }
  };

  const handleFileChange = (e) => {
    setQuestionPhoto(e.target.files[0]);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-blue-50 to-blue-100 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl">
        <h1 className="text-4xl font-extrabold text-blue-900 mb-8 text-center animate-fade-in">
          Find Tutors for Your Doubts
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10 text-center animate-fade-in">
          Connect with expert tutors by entering your subject, topic, and specific question. Upload a photo if needed and start your learning journey.
        </p>

        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto">
          <SearchBar
            courseValue={courseValue}
            setCourseValue={setCourseValue}
            unitValue={unitValue}
            setUnitValue={setUnitValue}
            topicValue={topicValue}
            setTopicValue={setTopicValue}
            onFindTutor={handleFindTutor}
          />
          <div className="mt-6">
            <label htmlFor="question" className="block text-sm font-medium text-gray-700">
              Your Question
            </label>
            <textarea
              id="question"
              value={questionValue}
              onChange={(e) => setQuestionValue(e.target.value)}
              placeholder="Describe your question or doubt in detail..."
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 placeholder-gray-400"
              rows="4"
            />
          </div>
          <div className="mt-4">
            <label htmlFor="questionPhoto" className="block text-sm font-medium text-gray-700">
              Upload Question Photo (Optional)
            </label>
            <input
              id="questionPhoto"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <button
            onClick={handleFindTutor}
            className="mt-6 w-full bg-blue-800 text-white px-6 py-3 rounded-md font-semibold text-lg shadow-md transition-all duration-300 hover:bg-blue-900 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Find Tutors
          </button>
        </div>

        {error && (
          <div className="mt-6 max-w-3xl mx-auto w-full">
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg shadow-md">
              {error}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mt-6 max-w-3xl mx-auto w-full">
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg shadow-md">
              {successMessage}
            </div>
          </div>
        )}

        {loading && (
          <div className="mt-10 max-w-3xl mx-auto w-full text-center">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800"></div>
              <span className="ml-3 text-blue-800 text-lg font-medium">Finding online tutors...</span>
            </div>
          </div>
        )}

        {searched && !loading && (
          <div className="mt-10 max-w-3xl mx-auto w-full flex flex-col gap-6">
            {tutors.length === 0 ? (
              <div className="text-center text-blue-800 text-lg font-medium">
                No online tutors found for your search criteria. Try different subjects or topics.
              </div>
            ) : (
              <>
                <div className="text-center text-green-600 text-lg font-semibold">
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
                      socketId: tutor.socketId,
                    }}
                    onRequestSession={() => handleRequestSession(tutor)}
                  />
                ))}
              </>
            )}
          </div>
        )}

        {showSessionButtons && (
          <div className="mt-8 flex flex-col items-center gap-4">
            <button
              className="w-48 bg-blue-800 text-white px-6 py-2 rounded-md font-semibold shadow-md transition-all duration-300 hover:bg-blue-900 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => setShowVideoModal(true)}
            >
              Start Session
            </button>
            <button
              className="w-48 bg-blue-800 text-white px-6 py-2 rounded-md font-semibold shadow-md transition-all duration-300 hover:bg-blue-900 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => setShowVideoModal(true)}
            >
              Join Session
            </button>
          </div>
        )}

        <div className="mt-12 text-center">
          <button
            className="bg-blue-800 text-white px-6 py-3 rounded-full font-semibold text-lg shadow-md transition-all duration-300 hover:bg-blue-900 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
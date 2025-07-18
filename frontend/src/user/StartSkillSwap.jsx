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
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [cancelledMessage, setCancelledMessage] = useState("");

  useEffect(() => {
    // Register user with socket when component mounts
    if (user && user._id) {
      socket.emit('register', user._id);
    }

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

    return () => {
      socket.off('tutors-found');
      socket.off('session-request-sent');
      socket.off('session-request-error');
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

  return (
    <div className="min-h-screen w-full bg-blue-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-blue-900 mb-8 text-center animate-fadeIn">
          Find Tutors for Your Doubts
        </h1>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-10 text-center animate-fadeIn">
          Search for expert tutors by entering a topic/tutor related to your doubts. Connect with the perfect mentor to guide your learning journey.
        </p>

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
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TutorCard from './oneononeSection/TutorCard';
import SearchBar from './oneononeSection/serachBar';
import { motion as MotionComponent, AnimatePresence } from 'framer-motion';
import Fuse from 'fuse.js';
import socket from '../socket';
import { useAuth } from '../context/AuthContext';
import { BACKEND_URL } from '../config.js';
import VideoCall from '../components/VideoCall.jsx';
import { supabase, getPublicUrl } from '../lib/supabaseClient';

// Fetch data from Google Sheet via backend API instead of static JSON

const StartSkillSwap = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [questionValue, setQuestionValue] = useState("");
  const [questionPhoto, setQuestionPhoto] = useState(null);
  const [questionImageUrl, setQuestionImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [tutors, setTutors] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [, setShowVideoModal] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [showSessionButtons, setShowSessionButtons] = useState(false);

  useEffect(() => {
    if (user && user._id) {
      socket.emit('register', user._id);
    }

    socket.on('session-started', (data) => {
      setActiveSessionId(data.sessionId);
      setShowSessionButtons(true);
    });

    socket.on('end-call', ({ sessionId }) => {
      if (sessionId === activeSessionId) {
        setShowSessionButtons(false);
        setActiveSessionId(null);
      }
    });
    
    socket.on('session-completed', ({ sessionId }) => {
      if (sessionId === activeSessionId) {
        setShowSessionButtons(false);
        setActiveSessionId(null);
      }
    });

    return () => {
      socket.off('session-started');
      socket.off('end-call');
      socket.off('session-completed');
    };
  }, [user, activeSessionId]);

  const [course, setCourse] = useState('');
  const [unit, setUnit] = useState('');
  const [topic, setTopic] = useState('');
  const [showTutors, setShowTutors] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const { course, unit, topic } = location?.state || {};
    if (course || unit || topic) {
      setCourse(course || '');
      setUnit(unit || '');
      setTopic(topic || '');
      handleFindExpertSession(course, unit, topic);
    }
  }, [location?.state]);

  const handleFindExpertSession = async (courseParam, unitParam, topicParam) => {
    const searchCourse = courseParam || course;
    const searchUnit = unitParam || unit;
    const searchTopic = topicParam || topic;

    setSearchLoading(true);
    setShowTutors(true);

    try {
      const queryParams = new URLSearchParams();
      if (searchCourse) queryParams.append('subject', searchCourse);
      if (searchUnit) queryParams.append('topic', searchUnit);
      if (searchTopic) queryParams.append('subtopic', searchTopic);

      const token = localStorage.getItem('token');

      const res = await fetch(`${BACKEND_URL}/api/sessions/search?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Unauthorized or failed request');

      const data = await res.json();
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleRequestExpertSession = async (session) => {
    if (!session._id) {
      setError('Error: Missing sessionId in session data.');
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/sessions/request/${session._id}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Failed to send session request');

      setSuccessMessage('Session request sent successfully!');
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      setError('Failed to send session request.');
      setTimeout(() => setError(""), 5000);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-white pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 text-center mb-3 tracking-tight">
            Find Your Expert
          </h1>
          <p className="text-slate-500 text-center max-w-2xl mx-auto">
            Search by class, subject, and topic to find available expert sessions
          </p>
        </div>

        <div className="bg-gradient-to-br from-white to-slate-50/50 rounded-2xl p-8 sm:p-12 max-w-4xl mx-auto mb-8 border border-slate-200/50">
          <SearchBar
            courseValue={course}
            setCourseValue={setCourse}
            unitValue={unit}
            setUnitValue={setUnit}
            topicValue={topic}
            setTopicValue={setTopic}
            onFindTutor={() => handleFindExpertSession()}
            id="startskillswap-search-bar"
          />

          {showTutors && (
            <div className="flex flex-col gap-6 mt-8">
              {searchLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-900 border-t-transparent mb-4"></div>
                  <p className="text-slate-600 text-lg font-medium">Searching for experts...</p>
                </div>
              ) : Array.isArray(searchResults) && searchResults.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-blue-900/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-900"></div>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">No Sessions Found</h3>
                  <p className="text-slate-500 mb-6">Try adjusting your search criteria or create a new session</p>
                  <button
                    onClick={() => window.location.href = '/createSession'}
                    className="px-8 py-4 bg-blue-900 text-white rounded-xl font-semibold hover:bg-blue-800 transition-all hover:shadow-xl"
                  >
                    Create Session
                  </button>
                </div>
              ) : Array.isArray(searchResults) ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-slate-900 tracking-tight">
                      Found {searchResults.length} {searchResults.length === 1 ? 'Expert' : 'Experts'}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {searchResults.map((session, idx) => (
                      <TutorCard
                        key={idx}
                        tutor={{
                          name: `${session.creator?.firstName ?? ''} ${session.creator?.lastName ?? ''}`.trim() || 'Unknown',
                          profilePic: session.creator?.profilePic || '/default-user.png',
                          date: session.date,
                          time: session.time,
                          skills: [session.subject, session.topic, session.subtopic].filter(Boolean),
                          status: `${session.status}` === 'pending' ? 'Available' : `Busy (${session.status})`,
                          rating: session.creator?.rating || 4.5,
                        }}
                        onRequestSession={() => handleRequestExpertSession(session)}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-red-600 text-lg font-medium">Unexpected response format</p>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {successMessage}
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            className="bg-blue-900 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
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
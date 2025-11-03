import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TutorCard from './oneononeSection/TutorCard';
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
  const { user } = useAuth();
  const [courseValue, setCourseValue] = useState("");
  const [unitValue, setUnitValue] = useState("");
  const [topicValue, setTopicValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [highlightedCourseIdx, setHighlightedCourseIdx] = useState(-1);
  const [highlightedUnitIdx, setHighlightedUnitIdx] = useState(-1);
  const [highlightedTopicIdx, setHighlightedTopicIdx] = useState(-1);
  const courseInputRef = React.useRef();
  const unitInputRef = React.useRef();
  const topicInputRef = React.useRef();

  // Lists fetched from backend (Google Sheet)
  const [classes, setClasses] = useState([]); // was STATIC_COURSES
  const [subjectsByClass, setSubjectsByClass] = useState({}); // was STATIC_UNITS
  const [topicsBySubject, setTopicsBySubject] = useState({}); // was STATIC_TOPICS

  useEffect(() => {
    let aborted = false;
    const fetchLists = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/skills-list`);
        if (!res.ok) throw new Error('Failed to load skills list');
        const json = await res.json();
        if (aborted) return;
        console.log('✅ [StartSkillSwap] Loaded skills from Google Sheet:', json);
        setClasses(Array.isArray(json.classes) ? json.classes : []);
        setSubjectsByClass(json.subjectsByClass || {});
        setTopicsBySubject(json.topicsBySubject || {});
      } catch (e) {
        console.error('❌ [StartSkillSwap] Failed to fetch skills list:', e);
      }
    };
    fetchLists();
    return () => { aborted = true; };
  }, []);
  
  // Initialize Fuse.js instances for fuzzy search
  const fuseClasses = useMemo(() => {
    return new Fuse(classes, {
      threshold: 0.3,
      distance: 100,
      keys: ['']
    });
  }, [classes]);

  const fuseSubjects = useMemo(() => {
    const subjectList = courseValue ? (subjectsByClass[courseValue] || []) : [];
    return new Fuse(subjectList, {
      threshold: 0.3,
      distance: 100,
      keys: ['']
    });
  }, [courseValue, subjectsByClass]);

  const fuseTopics = useMemo(() => {
    const topicList = unitValue ? (topicsBySubject[unitValue] || []) : [];
    return new Fuse(topicList, {
      threshold: 0.3,
      distance: 100,
      keys: ['']
    });
  }, [unitValue, topicsBySubject]);

  // Filtered lists using Fuse.js fuzzy search
  const courseList = useMemo(() => {
    if ((courseValue || '').trim() === '') return classes;
    const results = fuseClasses.search(courseValue);
    return results.map(result => result.item);
  }, [courseValue, classes, fuseClasses]);

  // Base lists for enabling/disabling inputs
  const unitList = useMemo(() => {
    return courseValue ? (subjectsByClass[courseValue] || []) : [];
  }, [courseValue, subjectsByClass]);

  const topicList = useMemo(() => {
    return unitValue ? (topicsBySubject[unitValue] || []) : [];
  }, [unitValue, topicsBySubject]);

  const unitDropdownList = useMemo(() => {
    if ((unitValue || '').trim() === '') return unitList;
    const results = fuseSubjects.search(unitValue);
    return results.map(result => result.item);
  }, [unitValue, unitList, fuseSubjects]);

  const topicDropdownList = useMemo(() => {
    if ((topicValue || '').trim() === '') return topicList;
    const results = fuseTopics.search(topicValue);
    return results.map(result => result.item);
  }, [topicValue, topicList, fuseTopics]);

  // Filtered lists for dropdowns - OLD CODE REMOVED

  // Animation variants for dropdown
  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } },
  };

  // Keyboard navigation for course
  const handleCourseKeyDown = (e) => {
    if (!showDropdown || courseList.length === 0) return;
    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      setHighlightedCourseIdx(idx => (idx + 1) % courseList.length);
    } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault();
      setHighlightedCourseIdx(idx => (idx - 1 + courseList.length) % courseList.length);
    } else if (e.key === 'Enter') {
      if (highlightedCourseIdx >= 0 && highlightedCourseIdx < courseList.length) {
        setCourseValue(courseList[highlightedCourseIdx]);
        setShowDropdown(false);
        setHighlightedCourseIdx(-1);
        setUnitValue('');
        setTopicValue('');
        setTimeout(() => unitInputRef.current && unitInputRef.current.focus(), 0);
      }
    }
  };

  // Keyboard navigation for unit
  const handleUnitKeyDown = (e) => {
    if (!showUnitDropdown || unitDropdownList.length === 0) return;
    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      setHighlightedUnitIdx(idx => (idx + 1) % unitDropdownList.length);
    } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault();
      setHighlightedUnitIdx(idx => (idx - 1 + unitDropdownList.length) % unitDropdownList.length);
    } else if (e.key === 'Enter') {
      if (highlightedUnitIdx >= 0 && highlightedUnitIdx < unitDropdownList.length) {
        setUnitValue(unitDropdownList[highlightedUnitIdx]);
        setShowUnitDropdown(false);
        setHighlightedUnitIdx(-1);
        setTopicValue('');
        setTimeout(() => topicInputRef.current && topicInputRef.current.focus(), 0);
      }
    }
  };

  // Keyboard navigation for topic
  const handleTopicKeyDown = (e) => {
    if (!showTopicDropdown || topicDropdownList.length === 0) return;
    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      setHighlightedTopicIdx(idx => (idx + 1) % topicDropdownList.length);
    } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault();
      setHighlightedTopicIdx(idx => (idx - 1 + topicDropdownList.length) % topicDropdownList.length);
    } else if (e.key === 'Enter') {
      if (highlightedTopicIdx >= 0 && highlightedTopicIdx < topicDropdownList.length) {
        setTopicValue(topicDropdownList[highlightedTopicIdx]);
        setShowTopicDropdown(false);
        setHighlightedTopicIdx(-1);
      }
    }
  };
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
      socket.off('tutors-found');
      socket.off('session-request-sent');
      socket.off('session-request-error');
      socket.off('session-started');
      socket.off('end-call');
      socket.off('session-completed');
    };
  }, [user, activeSessionId]);

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
        subject: unitValue,      // Subject (Math, Physics, etc.)
        topic: topicValue,       // Topic (Algebra, Mechanics, etc.)
        question: questionValue,
        questionImageUrl: questionImageUrl || '',
        questionPhoto: questionPhoto ? questionPhoto.name : null,
        message: `I would like to learn ${unitValue} - ${topicValue}${questionValue ? `: ${questionValue}` : ''}`,
      });
    } catch {
      setError("Failed to send session request. Please try again.");
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0] || null;
    setQuestionPhoto(file);
    setQuestionImageUrl("");
    if (!file) return;
    try {
      setUploading(true);
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const safeBase = file.name.replace(/\.[^/.]+$/, '').slice(0, 40).replace(/[^a-zA-Z0-9_-]/g, '_');
      const ts = Date.now();
      const uid = (user && user._id) ? user._id : 'anonymous';
      const path = `${uid}/${ts}-${safeBase}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('questions')
  .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const publicUrl = getPublicUrl('questions', path);
      setQuestionImageUrl(publicUrl || "");
    } catch (err) {
      console.error('Supabase upload failed:', err);
      const msg = (err && (err.message || err.error_description)) || '';
      if (/row-level security/i.test(msg) || /RLS/i.test(msg)) {
        setError('Upload blocked by Supabase policy. Please add an INSERT policy for bucket "questions" (public insert).');
      } else if (/Bucket not found/i.test(msg)) {
        setError('Supabase bucket "questions" not found. Check bucket name and case.');
      } else {
        setError('Failed to upload image. You can still proceed without it.');
      }
      setQuestionImageUrl("");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-blue-50 to-blue-100 flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8 transition-all duration-500">
      <div className="w-full max-w-6xl">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-900 mb-6 text-center animate-fade-in transition-all duration-300">
          Find Tutors for Your Doubts
        </h1>
        <p className="text-base sm:text-lg text-gray-600 max-w-xl sm:max-w-2xl mx-auto mb-8 text-center animate-fade-in transition-all duration-300 opacity-90">
          Connect with expert tutors by entering your subject, topic, and specific question. Upload a photo if needed and start your learning journey.
        </p>

        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-xl sm:max-w-3xl mx-auto transition-all duration-300 hover:shadow-2xl">
          {/* Inline Search Bar with Dropdowns (like serachBar.jsx) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Class/Course Dropdown */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <input
                ref={courseInputRef}
                type="text"
                value={courseValue}
                onChange={e => {
                  setCourseValue(e.target.value);
                  setShowDropdown(true);
                  setUnitValue('');
                  setTopicValue('');
                  setHighlightedCourseIdx(-1);
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => { setShowDropdown(false); setHighlightedCourseIdx(-1); }, 120)}
                onKeyDown={handleCourseKeyDown}
                placeholder="Search Class..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-300 text-sm"
                autoComplete="off"
              />
              <AnimatePresence>
                {showDropdown && (
                  <MotionComponent.ul
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute z-10 left-0 right-0 bg-white border border-blue-200 rounded-xl shadow-xl max-h-48 overflow-y-auto mt-2"
                  >
                    {courseList.map((s, idx) => (
                      <MotionComponent.li
                        key={idx}
                        className={`px-4 py-2.5 text-gray-600 hover:bg-blue-100/80 cursor-pointer text-base font-medium transition-all duration-300 ${highlightedCourseIdx === idx ? 'bg-blue-100/80' : ''}`}
                        onMouseDown={() => {
                          setCourseValue(s);
                          setShowDropdown(false);
                          setHighlightedCourseIdx(-1);
                          setUnitValue('');
                          setTopicValue('');
                          setTimeout(() => unitInputRef.current && unitInputRef.current.focus(), 0);
                        }}
                        whileHover={{ scale: 1.02 }}
                      >
                        {s}
                      </MotionComponent.li>
                    ))}
                  </MotionComponent.ul>
                )}
              </AnimatePresence>
            </div>
            {/* Subject Dropdown */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                ref={unitInputRef}
                type="text"
                value={unitValue}
                onChange={e => {
                  setUnitValue(e.target.value);
                  setShowUnitDropdown(true);
                  setHighlightedUnitIdx(-1);
                  setTopicValue('');
                }}
                onFocus={() => setShowUnitDropdown(true)}
                onBlur={() => setTimeout(() => { setShowUnitDropdown(false); setHighlightedUnitIdx(-1); }, 120)}
                onKeyDown={handleUnitKeyDown}
                placeholder="Search Subject..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-300 text-sm"
                autoComplete="off"
                disabled={!courseValue || !unitList.length}
              />
              <AnimatePresence>
                {showUnitDropdown && courseValue && unitList.length > 0 && (
                  <MotionComponent.ul
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute z-10 left-0 right-0 bg-white border border-blue-200 rounded-xl shadow-xl max-h-48 overflow-y-auto mt-2"
                  >
                    {unitDropdownList.map((u, idx) => (
                      <MotionComponent.li
                        key={idx}
                        className={`px-4 py-2.5 text-gray-600 hover:bg-blue-100/80 cursor-pointer text-base font-medium transition-all duration-300 ${highlightedUnitIdx === idx ? 'bg-blue-100/80' : ''}`}
                        onMouseDown={() => {
                          setUnitValue(u);
                          setShowUnitDropdown(false);
                          setHighlightedUnitIdx(-1);
                          setTopicValue('');
                          setTimeout(() => topicInputRef.current && topicInputRef.current.focus(), 0);
                        }}
                        whileHover={{ scale: 1.02 }}
                      >
                        {u}
                      </MotionComponent.li>
                    ))}
                  </MotionComponent.ul>
                )}
              </AnimatePresence>
            </div>
            {/* Topic Dropdown */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
              <input
                ref={topicInputRef}
                type="text"
                value={topicValue}
                onChange={e => {
                  setTopicValue(e.target.value);
                  setShowTopicDropdown(true);
                  setHighlightedTopicIdx(-1);
                }}
                onFocus={() => setShowTopicDropdown(true)}
                onBlur={() => setTimeout(() => { setShowTopicDropdown(false); setHighlightedTopicIdx(-1); }, 150)}
                onKeyDown={handleTopicKeyDown}
                placeholder="Search Topic..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-300 text-sm"
                autoComplete="off"
                disabled={!unitValue || !topicList.length}
              />
              <AnimatePresence>
                {showTopicDropdown && unitValue && topicList.length > 0 && (
                  <MotionComponent.ul
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute z-10 left-0 right-0 bg-white border border-blue-200 rounded-xl shadow-xl max-h-48 overflow-y-auto mt-2"
                  >
                    {topicDropdownList.map((t, idx) => (
                      <MotionComponent.li
                        key={idx}
                        className={`px-4 py-2.5 text-gray-600 hover:bg-blue-100/80 cursor-pointer text-base font-medium transition-all duration-300 ${highlightedTopicIdx === idx ? 'bg-blue-100/80' : ''}`}
                        onMouseDown={e => {
                          e.preventDefault();
                          setTopicValue(t);
                          setShowTopicDropdown(false);
                          setHighlightedTopicIdx(-1);
                        }}
                        whileHover={{ scale: 1.02 }}
                      >
                        {t}
                      </MotionComponent.li>
                    ))}
                  </MotionComponent.ul>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="mt-6 transition-all duration-300">
            <label htmlFor="question" className="block text-sm font-medium text-gray-700 opacity-90">
              Your Question
            </label>
            <textarea
              id="question"
              value={questionValue}
              onChange={(e) => setQuestionValue(e.target.value)}
              placeholder="Describe your question or doubt in detail..."
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 placeholder-gray-400 transition-all duration-300"
              rows="4"
            />
          </div>
          <div className="mt-4 transition-all duration-300">
            <label htmlFor="questionPhoto" className="block text-sm font-medium text-gray-700 opacity-90">
              Upload Question Photo (Optional)
            </label>
            <input
              id="questionPhoto"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all duration-300"
            />
            {uploading && (
              <p className="mt-2 text-sm text-blue-700">Uploading image…</p>
            )}
            {!uploading && questionImageUrl && (
              <p className="mt-2 text-sm text-green-700 truncate">Image ready to share</p>
            )}
          </div>
          <button
            onClick={handleFindTutor}
            className="mt-6 w-full bg-blue-800 text-white px-6 py-3 rounded-md font-semibold text-base sm:text-lg shadow-md transition-all duration-300 hover:bg-blue-900 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Find Tutors
          </button>
        </div>

        {error && (
          <div className="mt-6 max-w-xl sm:max-w-3xl mx-auto w-full transition-all duration-300">
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg shadow-md">
              {error}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mt-6 max-w-xl sm:max-w-3xl mx-auto w-full transition-all duration-300">
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg shadow-md">
              {successMessage}
            </div>
          </div>
        )}

        {loading && (
          <div className="mt-8 sm:mt-10 max-w-xl sm:max-w-3xl mx-auto w-full text-center transition-all duration-300">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-800"></div>
              <span className="ml-3 text-blue-800 text-base sm:text-lg font-medium">Finding online tutors...</span>
            </div>
          </div>
        )}

        {searched && !loading && (
          <div className="mt-8 sm:mt-10 max-w-xl sm:max-w-3xl mx-auto w-full flex flex-col gap-4 sm:gap-6 transition-all duration-300">
            {tutors.length === 0 ? (
              <div className="text-center text-blue-800 text-base sm:text-lg font-medium opacity-90">
                No online tutors found for your search criteria. Try different subjects or topics.
              </div>
            ) : (
              <>
                <div className="text-center text-green-600 text-base sm:text-lg font-semibold opacity-90">
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
          <div className="mt-6 sm:mt-8 flex flex-col items-center gap-4 transition-all duration-300">
            <button
              className="w-40 sm:w-48 bg-blue-800 text-white px-4 sm:px-6 py-2 rounded-md font-semibold shadow-md transition-all duration-300 hover:bg-blue-900 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => setShowVideoModal(true)}
            >
              Start Session
            </button>
            <button
              className="w-40 sm:w-48 bg-blue-800 text-white px-4 sm:px-6 py-2 rounded-md font-semibold shadow-md transition-all duration-300 hover:bg-blue-900 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => setShowVideoModal(true)}
            >
              Join Session
            </button>
          </div>
        )}

        <div className="mt-10 sm:mt-12 text-center transition-all duration-300">
          <button
            className="bg-blue-800 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold text-base sm:text-lg shadow-md transition-all duration-300 hover:bg-blue-900 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
import React, { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import VideoCall from '../components/VideoCall';
import { BACKEND_URL } from '../config.js';
import socket from '../socket.js';

// Static data 
const STATIC_COURSES = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English',
  'Economics', 'History', 'Geography', 'Psychology', 'Business Studies',
  'Political Science', 'Sociology', 'Accountancy', 'Statistics',
];
const STATIC_UNITS = {
  Mathematics: ['Algebra', 'Calculus', 'Geometry', 'Trigonometry', 'Probability', 'Statistics'],
  Physics: ['Mechanics', 'Optics', 'Thermodynamics', 'Electromagnetism', 'Modern Physics'],
  Chemistry: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Analytical Chemistry'],
  Biology: ['Botany', 'Zoology', 'Genetics', 'Ecology', 'Cell Biology'],
  'Computer Science': ['Data Structures', 'Algorithms', 'Operating Systems', 'Databases', 'Networking'],
  English: ['Grammar', 'Literature', 'Writing Skills', 'Comprehension'],
  Economics: ['Microeconomics', 'Macroeconomics', 'International Economics', 'Econometrics'],
  History: ['Ancient History', 'Medieval History', 'Modern History', 'World History'],
  Geography: ['Physical Geography', 'Human Geography', 'Cartography', 'GIS'],
  Psychology: ['Cognitive Psychology', 'Developmental Psychology', 'Clinical Psychology'],
  'Business Studies': ['Business Environment', 'Management', 'Marketing', 'Finance'],
  'Political Science': ['Political Theory', 'Comparative Politics', 'International Relations'],
  Sociology: ['Social Structure', 'Social Change', 'Research Methods'],
  Accountancy: ['Financial Accounting', 'Cost Accounting', 'Auditing'],
  Statistics: ['Descriptive Statistics', 'Inferential Statistics', 'Probability Theory'],
};
const STATIC_TOPICS = {
  Algebra: ['Linear Equations', 'Quadratic Equations', 'Polynomials'],
  Calculus: ['Limits', 'Derivatives', 'Integrals'],
  Geometry: ['Triangles', 'Circles', 'Polygons'],
  Trigonometry: ['Sine', 'Cosine', 'Tangent'],
  Probability: ['Permutations', 'Combinations', 'Probability Distributions'],
  Statistics: ['Mean', 'Median', 'Mode'],
  Mechanics: ['Kinematics', 'Dynamics', 'Work & Energy'],
  Optics: ['Reflection', 'Refraction', 'Lenses'],
  Thermodynamics: ['Laws of Thermodynamics', 'Heat Transfer'],
  Electromagnetism: ['Electric Fields', 'Magnetism', 'Circuits'],
  'Modern Physics': ['Relativity', 'Quantum Mechanics'],
  'Organic Chemistry': ['Hydrocarbons', 'Alcohols', 'Amines', 'Aldehydes', 'Ketones', 'Carboxylic Acids'],
  'Inorganic Chemistry': ['Periodic Table', 'Coordination Compounds', 'Metals', 'Non-metals', 'Acids & Bases'],
  'Physical Chemistry': ['Thermodynamics', 'Electrochemistry', 'Chemical Kinetics', 'Surface Chemistry'],
  'Analytical Chemistry': ['Spectroscopy', 'Chromatography', 'Titration'],
  Botany: ['Plant Physiology', 'Plant Anatomy'],
  Zoology: ['Animal Physiology', 'Animal Classification'],
  Genetics: ['Mendelian Genetics', 'DNA Structure'],
  Ecology: ['Ecosystems', 'Biodiversity'],
  'Cell Biology': ['Cell Structure', 'Cell Division'],
  'Data Structures': ['BST', 'Heap', 'Trie', 'Hash Table', 'Stack', 'Queue', 'Graph'],
  Algorithms: ['Dijkstra', 'Floyd Warshall', 'A* Search', 'Kruskal', 'Prim', 'Bellman-Ford', 'DFS', 'BFS'],
  'Operating Systems': ['Processes', 'Threads', 'Deadlock', 'Memory Management'],
  Databases: ['SQL', 'Normalization', 'Transactions', 'Indexing'],
  Networking: ['OSI Model', 'TCP/IP', 'Routing'],
  Grammar: ['Tenses', 'Parts of Speech', 'Voice'],
  Literature: ['Poetry', 'Drama', 'Prose'],
  'Writing Skills': ['Essay', 'Letter', 'Report'],
  Comprehension: ['Passage Analysis', 'Summary'],
  Microeconomics: ['Demand', 'Supply', 'Elasticity'],
  Macroeconomics: ['GDP', 'Inflation', 'Unemployment'],
  'International Economics': ['Trade', 'Exchange Rates'],
  Econometrics: ['Regression', 'Time Series'],
  'Ancient History': ['Indus Valley', 'Egyptian Civilization'],
  'Medieval History': ['Delhi Sultanate', 'Mughal Empire'],
  'Modern History': ['World Wars', 'Indian Independence'],
  'World History': ['Renaissance', 'Industrial Revolution'],
  'Physical Geography': ['Landforms', 'Climate'],
  'Human Geography': ['Population', 'Urbanization'],
  Cartography: ['Map Projections', 'GIS Basics'],
  GIS: ['Remote Sensing', 'Spatial Analysis'],
  'Cognitive Psychology': ['Memory', 'Perception'],
  'Developmental Psychology': ['Child Development', 'Adolescence'],
  'Clinical Psychology': ['Disorders', 'Therapies'],
  'Business Environment': ['Business Types', 'Business Ethics'],
  Management: ['Leadership', 'Motivation'],
  Marketing: ['Market Research', 'Branding'],
  Finance: ['Accounting', 'Investment'],
  'Political Theory': ['Democracy', 'Justice'],
  'Comparative Politics': ['Political Systems', 'Constitutions'],
  'International Relations': ['UN', 'Globalization'],
  'Social Structure': ['Family', 'Caste'],
  'Social Change': ['Modernization', 'Social Movements'],
  'Research Methods': ['Surveys', 'Fieldwork'],
  'Financial Accounting': ['Balance Sheet', 'Ledger'],
  'Cost Accounting': ['Cost Sheet', 'Budgeting'],
  Auditing: ['Internal Audit', 'External Audit'],
  'Descriptive Statistics': ['Mean', 'Variance'],
  'Inferential Statistics': ['Hypothesis Testing', 'Confidence Intervals'],
  'Probability Theory': ['Random Variables', 'Probability Distributions'],
};

const CreateSession = () => {
  const cardRef = useRef(null);
  const [form, setForm] = useState({
    subject: '',
    topic: '',
    subtopic: '',
    description: '',
    date: '',
    time: '',
  });
  const [scheduled, setScheduled] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showSubtopicDropdown, setShowSubtopicDropdown] = useState(false);
  const [highlightedCourseIdx, setHighlightedCourseIdx] = useState(-1);
  const [highlightedUnitIdx, setHighlightedUnitIdx] = useState(-1);
  const [highlightedSubtopicIdx, setHighlightedSubtopicIdx] = useState(-1);
  const [scheduledSessions, setScheduledSessions] = useState([]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [startingSession, setStartingSession] = useState(null);
  const [videoCall, setVideoCall] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Helper function to normalize user IDs for comparison
  const normalizeUserId = (userId) => {
    if (!userId) return null;
    return userId.toString();
  };

  // Helper function to check if current user is creator
  const isCurrentUserCreator = (session) => {
    if (!currentUser || !session) return false;
    const currentUserId = normalizeUserId(currentUser._id);
    const creatorId = normalizeUserId(session.creator?._id || session.creator);
    return currentUserId === creatorId;
  };

  // Helper function to check if current user is requester
  const isCurrentUserRequester = (session) => {
    if (!currentUser || !session) return false;
    const currentUserId = normalizeUserId(currentUser._id);
    const requesterId = normalizeUserId(session.requester?._id || session.requester);
    return currentUserId === requesterId;
  };

  // Get current user from cookies
  useEffect(() => {
    const userCookie = Cookies.get('user');
    if (userCookie) {
      try {
        const user = JSON.parse(userCookie);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error parsing user cookie:', error);
      }
    }
  }, []);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!currentUser) return;

    // Register socket
    socket.emit('register', currentUser._id);

    // Listen for session-started (for requesters)
    socket.on('session-started', (data) => {
      console.log('Session started notification received:', data);
      // Refresh sessions to show Join/Cancel buttons
      fetchUserSessions();
    });

    // Listen for session-cancelled (for creators)
    socket.on('session-cancelled', (data) => {
      console.log('Session cancelled notification received:', data);
      // Refresh sessions to update status
      fetchUserSessions();
    });

    return () => {
      socket.off('session-started');
      socket.off('session-cancelled');
    };
  }, [currentUser]);

  // Filtered lists for cascading dropdowns
  const filteredCourseSuggestions = STATIC_COURSES.filter(
    (s) => (form.subject || '').toLowerCase().includes((s || '').toLowerCase()) && (form.subject || '').trim() !== ''
  );
  const courseList = (form.subject || '').trim() === '' ? STATIC_COURSES : filteredCourseSuggestions;

  const unitList = form.subject ? (STATIC_UNITS[form.subject] || []) : [];
  const filteredUnitSuggestions = unitList.filter(
    (u) => (form.topic || '').toLowerCase().includes((u || '').toLowerCase()) && (form.topic || '').trim() !== ''
  );
  const unitDropdownList = (form.topic || '').trim() === '' ? unitList : filteredUnitSuggestions;

  const topicList = form.topic ? (STATIC_TOPICS[form.topic] || []) : [];
  const filteredTopicSuggestions = topicList.filter(
    (t) => (form.subtopic || '').toLowerCase().includes((t || '').toLowerCase()) && (form.subtopic || '').trim() !== ''
  );
  const topicDropdownList = (form.subtopic || '').trim() === '' ? topicList : filteredTopicSuggestions;

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => {
      if (name === 'subject') return { ...prev, subject: value, topic: '', subtopic: '' };
      if (name === 'topic') return { ...prev, topic: value, subtopic: '' };
      return { ...prev, [name]: value };
    });
  };

  const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${min}`;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    // Prevent scheduling in the past
    const today = getTodayDate();
    const now = getCurrentTime();
    if (form.date < today || (form.date === today && form.time < now)) {
      alert('Cannot schedule a session in the past. Please select a valid date and time.');
      return;
    }

    try {
      if (editId) {
        // Update existing session
        const response = await fetch(`${BACKEND_URL}/api/sessions/${editId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(form),
        });
        if (!response.ok) {
          const err = await response.json();
          if (response.status === 404) {
            alert('Session not found. It may have been deleted.');
            fetchUserSessions();
            return;
          }
          throw new Error(err.message || 'Failed to update session');
        }
        setEditId(null);
      } else {
        // Create new session
        console.log('Creating session with user:', currentUser);
        const response = await fetch(`${BACKEND_URL}/api/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(form),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || 'Failed to create session');
        }
        const createdSession = await response.json();
        console.log('Session created:', createdSession);
        setScheduled(true);
      }
      setForm({
        subject: '',
        topic: '',
        subtopic: '',
        description: '',
        date: '',
        time: '',
      });
      fetchUserSessions();
    } catch (error) {
      console.error('Error creating/updating session:', error.message);
      alert('Error: ' + error.message);
    }
  };

  const handleEdit = (session) => {
    setEditId(session._id);
    setForm({
      subject: session.subject || '',
      topic: session.topic || '',
      subtopic: session.subtopic || '',
      description: session.description || '',
      date: session.date || '',
      time: session.time || '',
    });
    if (cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this session?")) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/sessions/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const err = await response.json();
        if (response.status === 404) {
          alert('Session not found. It may have already been deleted.');
          fetchUserSessions();
          return;
        }
        throw new Error(err.message || 'Failed to delete session');
      }
      setScheduledSessions(prev => prev.filter(s => s._id !== id));
      if (editId === id) setEditId(null);
      alert('Session deleted!');
    } catch (error) {
      alert('Error deleting session: ' + error.message);
    }
  };

  const handleApproveSession = async (id) => {
    setActionLoading(prev => ({ ...prev, [`approve-${id}`]: true }));
    try {
      const response = await fetch(`${BACKEND_URL}/api/sessions/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to approve session');
      }
      alert('Session approved!');
      fetchUserSessions();
    } catch (error) {
      console.error('Error approving session:', error);
      alert('Error: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [`approve-${id}`]: false }));
    }
  };

  const handleRejectSession = async (id) => {
    setActionLoading(prev => ({ ...prev, [`reject-${id}`]: true }));
    try {
      const response = await fetch(`${BACKEND_URL}/api/sessions/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to reject session');
      }
      alert('Session rejected!');
      fetchUserSessions();
    } catch (error) {
      console.error('Error rejecting session:', error);
      alert('Error: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [`reject-${id}`]: false }));
    }
  };

  const handleJoinSession = async (session) => {
    setActionLoading(prev => ({ ...prev, [`join-${session._id}`]: true }));
    try {
      console.log('Joining session:', session._id);
      setVideoCall(session._id);
      // The video call will handle the connection
    } catch (error) {
      console.error('Error joining session:', error);
      alert('Error joining session: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [`join-${session._id}`]: false }));
    }
  };

  const handleCancelSession = async (session) => {
    setActionLoading(prev => ({ ...prev, [`cancel-${session._id}`]: true }));
    try {
      const response = await fetch(`${BACKEND_URL}/api/sessions/${session._id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to cancel session');
      }
      alert('Session cancelled!');
      fetchUserSessions();
    } catch (error) {
      console.error('Error cancelling session:', error);
      alert('Error: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [`cancel-${session._id}`]: false }));
    }
  };

  const handleStartSession = async (session) => {
    if (session.status !== 'approved') {
      alert('Only approved sessions can be started.');
      return;
    }

    setStartingSession(session._id);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/sessions/${session._id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start session');
      }

      const result = await response.json();
      
      // Show success message
      alert('Session started! The approved user has been notified.');
      
      // Start video call for creator
      setVideoCall(session._id);
      
      // Refresh sessions list
      fetchUserSessions();
      
    } catch (error) {
      console.error('Error starting session:', error);
      alert(error.message || 'Failed to start session');
    } finally {
      setStartingSession(null);
    }
  };

  const fetchUserSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/sessions/mine`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      const sessions = await response.json();
      
      setScheduledSessions(sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserSessions();
  }, []);

  useEffect(() => {
    // Socket listeners for real-time updates
    socket.on('session-approved', (data) => {
      console.log('Session approved:', data);
      fetchUserSessions(); // Refresh sessions
    });

    socket.on('session-rejected', (data) => {
      console.log('Session rejected:', data);
      fetchUserSessions(); // Refresh sessions
    });

    socket.on('session-started', (data) => {
      console.log('Session started:', data);
      // Start video call
      setVideoCall(data.sessionId);
    });

    socket.on('session-cancelled', (data) => {
      console.log('Session cancelled:', data);
      fetchUserSessions(); // Refresh sessions
      // End video call if active
      if (videoCall === data.sessionId) {
        setVideoCall(null);
      }
    });

    return () => {
      socket.off('session-approved');
      socket.off('session-rejected');
      socket.off('session-started');
      socket.off('session-cancelled');
    };
  }, [videoCall]);

  // Skeleton Loader for Scheduled Sessions
  const SkeletonLoader = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
      {[...Array(3)].map((_, idx) => (
        <div key={idx} className="bg-gray-100 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></div>
          <div className="h-4 w-24 bg-blue-100 rounded mb-2"></div>
          <div className="h-5 w-48 bg-blue-100 rounded mb-2"></div>
          <div className="h-16 w-full bg-blue-100 rounded mb-4"></div>
          <div className="h-4 w-32 bg-blue-100 rounded mb-4"></div>
          <div className="flex gap-3">
            <div className="h-4 w-16 bg-blue-100 rounded"></div>
            <div className="h-4 w-16 bg-blue-100 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-100 pt-20 pb-8 px-4 sm:px-6 lg:px-8 font-inter">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start justify-center gap-10">
        {/* Create Session Card */}
        <div ref={cardRef} className="bg-white/95 rounded-3xl shadow-xl border border-blue-200 p-10 w-full max-w-lg min-w-[320px] mx-auto lg:mx-0 mb-10 lg:mb-0 relative animate-slide-up">
          <h1 className="text-3xl font-bold text-blue-900 mb-8 text-center font-lora tracking-tight relative group">
            Create Your Own 1-on-1 Session
            <span className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full w-0 group-hover:w-full transition-all duration-300"></span>
          </h1>
          {/* Schedule Session Section */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-blue-900 mb-4 border-b border-blue-100 pb-2 font-lora animate-fade-in">Schedule Your Session</h2>
            {scheduled ? (
              <div className="text-center animate-fade-in">
                <p className="text-green-700 font-semibold mb-4 font-nunito">Session scheduled successfully!</p>
                <button
                  className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-2 rounded-lg font-semibold hover:scale-105 hover:shadow-lg transition duration-200 transform font-nunito"
                  onClick={() => {
                    setScheduled(false);
                    setForm({ subject: '', topic: '', subtopic: '', description: '', date: '', time: '' });
                  }}
                >
                  Schedule Another
                </button>
              </div>
            ) : (
              <form className="flex flex-col gap-5" onSubmit={handleSubmit} autoComplete="off">
                <div className="relative">
                  <label className="block text-blue-900 font-medium mb-1 font-lora">Subject / Course</label>
                  <input
                    type="text"
                    name="subject"
                    value={form.subject}
                    onChange={e => { handleChange(e); setShowCourseDropdown(true); setHighlightedCourseIdx(-1); }}
                    onFocus={() => setShowCourseDropdown(true)}
                    onBlur={() => setTimeout(() => { setShowCourseDropdown(false); setHighlightedCourseIdx(-1); }, 120)}
                    onKeyDown={e => {
                      if (!showCourseDropdown || courseList.length === 0) return;
                      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
                        e.preventDefault();
                        setHighlightedCourseIdx(idx => (idx + 1) % courseList.length);
                      } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
                        e.preventDefault();
                        setHighlightedCourseIdx(idx => (idx - 1 + courseList.length) % courseList.length);
                      } else if (e.key === 'Enter') {
                        if (highlightedCourseIdx >= 0 && highlightedCourseIdx < courseList.length) {
                          setForm(prev => ({ ...prev, subject: courseList[highlightedCourseIdx], topic: '', subtopic: '' }));
                          setShowCourseDropdown(false);
                          setHighlightedCourseIdx(-1);
                        }
                      }
                    }}
                    placeholder="e.g. Mathematics"
                    className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80 font-nunito"
                    required
                    autoComplete="off"
                  />
                  {showCourseDropdown && (
                    <ul className="absolute z-10 left-0 right-0 bg-white/95 border border-blue-200 rounded-b-lg shadow-lg max-h-48 overflow-y-auto mt-1 animate-fade-in">
                      {courseList.map((s, idx) => (
                        <li
                          key={idx}
                          className={`px-4 py-2 hover:bg-blue-100 cursor-pointer text-base font-nunito transition duration-150 ${highlightedCourseIdx === idx ? 'bg-blue-200' : ''}`}
                          onMouseDown={() => {
                            setForm(prev => ({ ...prev, subject: s, topic: '', subtopic: '' }));
                            setShowCourseDropdown(false);
                            setHighlightedCourseIdx(-1);
                          }}
                        >
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-blue-900 font-medium mb-1 font-lora">Topic / Unit</label>
                  <input
                    type="text"
                    name="topic"
                    value={form.topic}
                    onChange={e => { handleChange(e); setShowUnitDropdown(true); setHighlightedUnitIdx(-1); }}
                    onFocus={() => { if (form.subject && unitList.length) setShowUnitDropdown(true); }}
                    onBlur={() => setTimeout(() => { setShowUnitDropdown(false); setHighlightedUnitIdx(-1); }, 120)}
                    onKeyDown={e => {
                      if (!showUnitDropdown || unitDropdownList.length === 0) return;
                      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
                        e.preventDefault();
                        setHighlightedUnitIdx(idx => (idx + 1) % unitDropdownList.length);
                      } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
                        e.preventDefault();
                        setHighlightedUnitIdx(idx => (idx - 1 + unitDropdownList.length) % unitDropdownList.length);
                      } else if (e.key === 'Enter') {
                        if (highlightedUnitIdx >= 0 && highlightedUnitIdx < unitDropdownList.length) {
                          setForm(prev => ({ ...prev, topic: unitDropdownList[highlightedUnitIdx], subtopic: '' }));
                          setShowUnitDropdown(false);
                          setHighlightedUnitIdx(-1);
                        }
                      }
                    }}
                    placeholder="e.g. Algebra, Calculus"
                    className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80 font-nunito"
                    required
                    autoComplete="off"
                    disabled={!form.subject || !unitList.length}
                  />
                  {showUnitDropdown && form.subject && unitList.length > 0 && (
                    <ul className="absolute z-10 left-0 right-0 bg-white/95 border border-blue-200 rounded-b-lg shadow-lg max-h-48 overflow-y-auto mt-1 animate-fade-in">
                      {unitDropdownList.map((u, idx) => (
                        <li
                          key={idx}
                          className={`px-4 py-2 hover:bg-blue-100 cursor-pointer text-base font-nunito transition duration-150 ${highlightedUnitIdx === idx ? 'bg-blue-200' : ''}`}
                          onMouseDown={() => {
                            setForm(prev => ({ ...prev, topic: u, subtopic: '' }));
                            setShowUnitDropdown(false);
                            setHighlightedUnitIdx(-1);
                          }}
                        >
                          {u}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-blue-900 font-medium mb-1 font-lora">Subtopic</label>
                  <input
                    type="text"
                    name="subtopic"
                    value={form.subtopic}
                    onChange={e => { handleChange(e); setShowSubtopicDropdown(true); setHighlightedSubtopicIdx(-1); }}
                    onFocus={() => setShowSubtopicDropdown(true)}
                    onBlur={() => setTimeout(() => { setShowSubtopicDropdown(false); setHighlightedSubtopicIdx(-1); }, 120)}
                    onKeyDown={e => {
                      if (!showSubtopicDropdown || topicDropdownList.length === 0) return;
                      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
                        e.preventDefault();
                        setHighlightedSubtopicIdx(idx => (idx + 1) % topicDropdownList.length);
                      } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
                        e.preventDefault();
                        setHighlightedSubtopicIdx(idx => (idx - 1 + topicDropdownList.length) % topicDropdownList.length);
                      } else if (e.key === 'Enter') {
                        if (highlightedSubtopicIdx >= 0 && highlightedSubtopicIdx < topicDropdownList.length) {
                          setForm(prev => ({ ...prev, subtopic: topicDropdownList[highlightedSubtopicIdx] }));
                          setShowSubtopicDropdown(false);
                          setHighlightedSubtopicIdx(-1);
                        }
                      }
                    }}
                    placeholder="e.g. Linear Equations, Trees, SQL"
                    className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80 font-nunito"
                    required={!!form.topic}
                    autoComplete="off"
                    disabled={!form.topic}
                  />
                  {showSubtopicDropdown && topicList.length > 0 && (
                    <ul className="absolute z-10 left-0 right-0 bg-white/95 border border-blue-200 rounded-b-lg shadow-lg max-h-48 overflow-y-auto mt-1 animate-fade-in">
                      {topicDropdownList.map((t, idx) => (
                        <li
                          key={idx}
                          className={`px-4 py-2 hover:bg-blue-100 cursor-pointer text-base font-nunito transition duration-150 ${highlightedSubtopicIdx === idx ? 'bg-blue-200' : ''}`}
                          onMouseDown={() => {
                            setForm(prev => ({ ...prev, subtopic: t }));
                            setShowSubtopicDropdown(false);
                            setHighlightedSubtopicIdx(-1);
                          }}
                        >
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <label className="block text-blue-900 font-medium mb-1 font-lora">Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className="w-full border border-blue-200 rounded-lg px-3 py-2 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80 font-nunito"
                    placeholder="Describe your learning goals or questions..."
                    maxLength={500}
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-blue-900 font-medium mb-1 font-lora">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={form.date}
                      onChange={handleChange}
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80 font-nunito"
                      required
                      min={getTodayDate()}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-blue-900 font-medium mb-1 font-lora">Time</label>
                    <input
                      type="time"
                      name="time"
                      value={form.time}
                      onChange={handleChange}
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80 font-nunito"
                      required
                      min={form.date === getTodayDate() ? getCurrentTime() : undefined}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-2 rounded-lg font-semibold hover:scale-105 hover:shadow-lg transition duration-200 transform font-nunito"
                  >
                    {editId ? 'Update Session' : 'Schedule Session'}
                  </button>
                  {editId && (
                    <button
                      type="button"
                      className="flex-1 bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:scale-105 hover:shadow-lg transition duration-200 transform font-nunito"
                      onClick={() => {
                        setEditId(null);
                        setForm({ subject: '', topic: '', subtopic: '', description: '', date: '', time: '' });
                      }}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            )}
          </section>
        </div>
        {/* Scheduled Sessions (Right) */}
        <div className="flex-1 w-full">
          <section>
            <h2 className="text-xl font-bold text-blue-900 mb-6 border-b-2 border-blue-200 pb-2 font-lora tracking-tight relative group animate-fade-in">
              Scheduled Sessions
              <span className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full w-0 group-hover:w-full transition-all duration-300"></span>
            </h2>
            {loading ? (
              <SkeletonLoader />
            ) : scheduledSessions.length > 0 ? (
              <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                {scheduledSessions.map(session => (
                  <li
                    key={session._id}
                    className="border border-blue-200 rounded-2xl p-6 bg-white/80 flex flex-col justify-between min-h-[200px] shadow-sm hover:shadow-xl hover:scale-105 transition duration-300 transform animate-slide-up"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`text-xs font-semibold uppercase tracking-wider font-nunito ${
                          session.status === 'completed' ? 'text-green-600' : 
                          session.status === 'approved' ? 'text-blue-600' : 
                          session.status === 'rejected' ? 'text-red-600' : 
                          'text-yellow-600'
                        }`}>
                        {session.status.toUpperCase()}
                        </div>
                                                  {currentUser && (
                            <div className={`text-xs px-2 py-1 rounded-full font-nunito ${
                              isCurrentUserCreator(session) 
                                ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {isCurrentUserCreator(session) ? 'Creator' : 'Requester'}
                            </div>
                          )}
                      </div>
                      <div className="font-semibold text-blue-900 mb-1 text-lg truncate font-lora">
                        {[session.subject, session.topic, session.subtopic].filter(x => x && x.trim()).join(' - ')}
                      </div>
                      <div className="text-gray-600 text-sm mb-2 line-clamp-3 font-nunito">{session.description}</div>
                      <div className="text-gray-500 text-xs mb-4 font-nunito">{session.date} at {session.time}</div>
                    </div>
                    <div className="flex gap-3 mt-auto">
                                                                    {currentUser && isCurrentUserCreator(session) && (
                        <>
                      <button
                        className="text-blue-600 hover:underline text-sm font-medium font-nunito"
                        onClick={() => handleEdit(session)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:underline text-sm font-medium font-nunito"
                        onClick={() => handleDelete(session._id)}
                      >
                        Delete
                      </button>
                        </>
                      )}
                    </div>
                    <div className="mt-6 flex justify-end">
                      {/* Approve/Reject for creator when requested */}
                      {session.status === 'requested' && currentUser && isCurrentUserCreator(session) && (
                        <div className="flex gap-2 w-full">
                          <button
                            className="flex-1 bg-gradient-to-r from-green-600 to-green-800 text-white px-4 py-2 rounded-lg font-semibold hover:scale-105 hover:shadow-lg transition duration-200 transform font-nunito"
                            onClick={() => handleApproveSession(session._id)}
                            disabled={actionLoading[`approve-${session._id}`]}
                          >
                            {actionLoading[`approve-${session._id}`] ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            className="flex-1 bg-gradient-to-r from-red-600 to-red-800 text-white px-4 py-2 rounded-lg font-semibold hover:scale-105 hover:shadow-lg transition duration-200 transform font-nunito"
                            onClick={() => handleRejectSession(session._id)}
                            disabled={actionLoading[`reject-${session._id}`]}
                          >
                            {actionLoading[`reject-${session._id}`] ? 'Rejecting...' : 'Reject'}
                          </button>
                        </div>
                      )}
                      {/* Start Session for creator when approved */}
                      {session.status === 'approved' && currentUser && isCurrentUserCreator(session) && (
                        <button
                          className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-800 text-white px-5 py-2 rounded-lg font-semibold hover:scale-105 hover:shadow-lg transition duration-200 transform font-nunito"
                          onClick={() => handleStartSession(session)}
                          disabled={startingSession === session._id}
                        >
                          {startingSession === session._id ? 'Starting...' : 'Start Session'}
                        </button>
                      )}
                      {/* Join/Cancel for requester when active */}
                      {session.status === 'active' && currentUser && isCurrentUserRequester(session) && (
                        <div className="flex gap-2 w-full">
                          <button
                            className="flex-1 bg-gradient-to-r from-green-600 to-green-800 text-white px-4 py-2 rounded-lg font-semibold hover:scale-105 hover:shadow-lg transition duration-200 transform font-nunito"
                            onClick={() => handleJoinSession(session)}
                            disabled={actionLoading[`join-${session._id}`]}
                          >
                            {actionLoading[`join-${session._id}`] ? 'Joining...' : 'Join Session'}
                          </button>
                          <button
                            className="flex-1 bg-gradient-to-r from-red-600 to-red-800 text-white px-4 py-2 rounded-lg font-semibold hover:scale-105 hover:shadow-lg transition duration-200 transform font-nunito"
                            onClick={() => handleCancelSession(session)}
                            disabled={actionLoading[`cancel-${session._id}`]}
                          >
                            {actionLoading[`cancel-${session._id}`] ? 'Cancelling...' : 'Cancel Session'}
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500 text-center text-lg mt-10 font-nunito animate-fade-in">No sessions scheduled yet.</div>
            )}
          </section>
        </div>
      </div>
      {videoCall && (
        <VideoCall
          sessionId={videoCall}
          onEndCall={() => setVideoCall(null)}
          userRole={currentUser && scheduledSessions.find(s => s._id === videoCall) && 
            isCurrentUserCreator(scheduledSessions.find(s => s._id === videoCall)) ? 'Creator' : 'Requester'}
        />
      )}
    </div>
  );
};

export default CreateSession;
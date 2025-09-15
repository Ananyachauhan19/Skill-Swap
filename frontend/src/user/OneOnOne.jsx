import React, { useState, useEffect, useRef } from 'react';
import { BACKEND_URL } from '../config.js';
import SearchBar from './oneononeSection/serachBar';
import TutorCard from './oneononeSection/TutorCard';
import Testimonial from "./Testimonial";
import TopPerformersSection from "./HomeSection/TopPerformersSection";
import Blog from '../user/company/Blog'; 
import { useNavigate, useLocation } from 'react-router-dom';

const HowItWorks = () => {
  const [clickedIndex, setClickedIndex] = useState(null);

  const handleCardClick = (index) => {
    setClickedIndex(clickedIndex === index ? null : index);
  };

  return (
    <section className="relative bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl p-4 sm:p-6 flex flex-col gap-6 border border-blue-200 mb-8 animate-slideUp w-full max-w-7xl mx-auto box-border">
      <h2 className="text-xl sm:text-3xl font-extrabold text-blue-900 text-center flex items-center justify-center gap-2 sm:gap-3">
        <svg
          className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        How It Works
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
            title: "Search for an Expert",
            desc: "Select course, unit, or topic."
          },
          {
            icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />,
            title: "Connect & Learn",
            desc: "Get real-time guidance."
          },
          {
            icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2zm0 2c-2.761 0-5 2.239-5 5h10c0-2.761-2.239-5-5-5z" />,
            title: "Silver Coin System",
            desc: "0.25 rupees per minute."
          },
          {
            icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-6v12" />,
            title: "Example",
            desc: "40 min = 10 Coins\n60 min = 15 Coins"
          }
        ].map((item, index) => (
          <div
            key={index}
            className="flex flex-col items-center justify-center text-center p-3 sm:p-4 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:bg-blue-50 border border-blue-100 cursor-pointer aspect-square"
            onClick={() => handleCardClick(index)}
          >
            <div className={`bg-blue-600 text-white rounded-full p-2 sm:p-3 mb-2 sm:mb-3 transform transition-transform duration-300 ${clickedIndex === index ? 'scale-110 rotate-12' : ''}`}>
              <svg
                className="w-4 h-4 sm:w-6 sm:h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                xmlns="http://www.w3.org/2000/svg"
              >
                {item.icon}
              </svg>
            </div>
            <h3 className="text-sm sm:text-lg font-semibold text-blue-900 leading-tight">{item.title}</h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 whitespace-pre-line line-clamp-3">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

const OneOnOne = () => {
  const [course, setCourse] = useState('');
  const [unit, setUnit] = useState('');
  const [topic, setTopic] = useState('');
  const [showTutors, setShowTutors] = useState(false);
  const [sessionRequestedTutor, setSessionRequestedTutor] = useState(null);
  const [pendingSession, setPendingSession] = useState(null);
  const [requestSentTutor, setRequestSentTutor] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchBarRef = useRef(null);

  useEffect(() => {
    const { course, unit, topic } = location.state || {};
    if (course || unit || topic) {
      setCourse(course || '');
      setUnit(unit || '');
      setTopic(topic || '');
      handleFindTutor();
    }
  }, [location.state]);

  const handleFindTutor = async () => {
    setLoading(true);
    setShowTutors(true);

    try {
      const queryParams = new URLSearchParams();
      if (course) queryParams.append('subject', course);
      if (unit) queryParams.append('topic', unit);
      if (topic) queryParams.append('subtopic', topic);

      const token = localStorage.getItem('token');

      const res = await fetch(`${BACKEND_URL}/api/sessions/search?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Unauthorized or failed request');

      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSession = async (session) => {
    if (!session._id) {
      alert('Error: Missing sessionId in session data.');
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

      setSessionRequestedTutor(session.creator);
      setPendingSession({ tutor: session.creator });
      setRequestSentTutor(session.creator);

      alert('Session request sent successfully!');
    } catch (error) {
      alert('Failed to send session request.');
    }
  };

  const handleCloseRequestSent = () => {
    setRequestSentTutor(null);
  };

  const handleAcceptSession = () => {
    alert(`Session with ${pendingSession.tutor.name} accepted! (Demo)`);
    setPendingSession(null);
    setSessionRequestedTutor(null);
    setRequestSentTutor(null);
  };

  const handleRejectSession = () => {
    setPendingSession(null);
    setSessionRequestedTutor(null);
    setRequestSentTutor(null);
  };

  return (
    <div className="min-h-screen w-full bg-blue-50 transition-all duration-2000 pt-16 sm:pt-20">
      <header className="w-full max-w-7xl mx-auto text-center py-6 sm:py-10 px-4 sm:px-6 relative animate-slideUp">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
          <div className="flex-1 text-left">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-blue-900 mb-4 leading-tight">
              Connect with Experts for Personalized Learning
            </h1>
            <p className="text-sm sm:text-lg md:text-xl text-gray-700 max-w-xl mb-6">
              Instantly connect with subject experts, get your doubts solved, and accelerate your learning.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-full font-semibold text-sm sm:text-lg shadow-md hover:bg-blue-700 transition-all duration-300 hover:scale-105"
                onClick={() => window.location.href = '/createSession'}
              >
                Create a Session
              </button>
              <button
                className="w-full sm:w-auto bg-white text-blue-700 border border-blue-600 px-6 py-3 rounded-full font-semibold text-sm sm:text-lg shadow-md hover:bg-blue-50 transition-all duration-300 hover:scale-105"
                onClick={() => navigate('/startskillswap')}
              >
                Start SkillSwap
              </button>
            </div>
          </div>
          <div className="flex-1 mt-6 md:mt-0">
            <img
              src="/assets/expert-connect-illustration.webp"
              alt="Expert Connect Illustration"
              className="w-full max-w-xs sm:max-w-md mx-auto object-contain"
            />
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col gap-12 sm:gap-16 px-4 sm:px-8 pb-16">
        <div className="py-6 sm:py-8">
          <h2 className="text-lg sm:text-2xl font-bold text-blue-900 mb-6 text-center animate-slideUp">Find Your Expert</h2>
          <SearchBar
            ref={searchBarRef}
            courseValue={course}
            setCourseValue={setCourse}
            unitValue={unit}
            setUnitValue={setUnit}
            topicValue={topic}
            setTopicValue={setTopic}
            onFindTutor={handleFindTutor}
            id="oneonone-search-bar"
          />
          {showTutors && (
            <div className="flex flex-col gap-6 sm:gap-8 mt-6 sm:mt-8 animate-slideUp">
              {loading ? (
                <p className="text-center text-blue-600">Searching...</p>
              ) : Array.isArray(searchResults) && searchResults.length === 0 ? (
                <p className="text-center text-gray-500">No pending sessions found.</p>
              ) : Array.isArray(searchResults) ? (
                searchResults.map((session, idx) => (
                  <TutorCard
                    key={idx}
                    tutor={{
                      name: `${session.creator?.firstName ?? ''} ${session.creator?.lastName ?? ''}`.trim() || 'Unknown',
                      profilePic: '/default-user.png',
                      date: session.date,
                      time: session.time,
                      skills: [session.subject, session.topic, session.subtopic].filter(Boolean),
                      status: `${session.status}` === 'pending' ? '🟢 Available' : `🔴 Busy (${session.status})`,
                      rating: 4.5,
                    }}
                    onRequestSession={() => handleRequestSession(session)}
                  />
                ))
              ) : (
                <p className="text-red-600">Unexpected response format.</p>
              )}
            </div>
          )}
        </div>
        <HowItWorks />
        <TopPerformersSection />
      </main>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.5s ease-out;
        }
        /* Prevent overflow on mobile */
        html, body {
          overflow-x: hidden;
          width: 100%;
        }
        /* Responsive adjustments for mobile */
        @media (max-width: 640px) {
          .grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .aspect-square {
            aspect-ratio: 1 / 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 0.75rem;
            overflow: hidden;
          }
          .text-xl {
            font-size: 1.25rem;
          }
          .text-lg {
            font-size: 1rem;
          }
          .text-sm {
            font-size: 0.75rem;
          }
          .text-xs {
            font-size: 0.65rem;
          }
          .p-3 {
            padding: 0.75rem;
          }
          .p-2 {
            padding: 0.5rem;
          }
          .mb-2 {
            margin-bottom: 0.5rem;
          }
          .mt-1 {
            margin-top: 0.25rem;
          }
          .w-4 {
            width: 1rem;
            height: 1rem;
          }
          .max-w-xs {
            max-width: 18rem;
          }
          .line-clamp-3 {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .leading-tight {
            line-height: 1.2;
          }
        }
      `}</style>
    </div>
  );
};

export default OneOnOne;
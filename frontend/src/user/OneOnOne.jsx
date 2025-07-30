/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
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
    <section className="relative bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col gap-8 border border-blue-200 mb-8 animate-slideUp">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-blue-900 text-center flex items-center justify-center gap-3">
        <svg
          className="w-8 h-8 text-blue-600"
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          {
            icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
            title: "Search for an Expert",
            desc: "Select your course, unit, or topic to find a subject expert."
          },
          {
            icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />,
            title: "Connect & Learn",
            desc: "Request a session and get real-time, personalized guidance."
          },
          {
            icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2zm0 2c-2.761 0-5 2.239-5 5h10c0-2.761-2.239-5-5-5z" />,
            title: "Silver Coin System",
            desc: "Each minute costs 0.25 rupees (paid in Silver Coins). Total coins are deducted based on session duration."
          },
          {
            icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-6v12" />,
            title: "Example",
            desc: "40 min = 10 Silver Coins (10 rupees)\n60 min = 15 Silver Coins (15 rupees)"
          }
        ].map((item, index) => (
          <div
            key={index}
            className="flex flex-col items-center text-center p-5 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:bg-blue-50 border border-blue-100 cursor-pointer"
            onClick={() => handleCardClick(index)}
          >
            <div className={`bg-blue-600 text-white rounded-full p-3 mb-4 transform transition-transform duration-300 ${clickedIndex === index ? 'scale-125 rotate-12' : ''}`}>
              <svg
                className="w-7 h-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                xmlns="http://www.w3.org/2000/svg"
              >
                {item.icon}
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-blue-900">{item.title}</h3>
            <p className="text-sm sm:text-base text-gray-600 mt-2 whitespace-pre-line">{item.desc}</p>
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
    <div className="min-h-screen w-full bg-blue-50 transition-all duration-2000">
      <header className="w-full max-w-7xl mx-auto text-center py-6 sm:py-10 px-4 sm:px-6 relative animate-slideUp">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
          <div className="flex-1 text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-blue-900 mb-4 leading-tight">
              Connect with Experts for Personalized Learning
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-xl mb-6">
              Instantly connect with subject experts, get your doubts solved, and accelerate your learning with tailored guidance.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-full font-semibold text-base sm:text-lg shadow-md hover:bg-blue-700 transition-all duration-300 hover:scale-105"
                onClick={() => window.location.href = '/createSession'}
              >
                Create a Session
              </button>
              <button
                className="w-full sm:w-auto bg-white text-blue-700 border border-blue-600 px-6 py-3 rounded-full font-semibold text-base sm:text-lg shadow-md hover:bg-blue-50 transition-all duration-300 hover:scale-105"
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
              className="w-full max-w-md mx-auto object-contain"
            />
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
          {[
            "Instant Doubt Solving",
            "Personalized Guidance",
            "Flexible Scheduling"
          ].map((text, index) => (
            <span
              key={index}
              className="inline-block bg-blue-100 text-blue-800 px-3 sm:px-4 py-2 rounded-full font-semibold text-xs sm:text-sm shadow-sm transition-transform duration-300 hover:scale-105 hover:bg-blue-200"
            >
              {text}
            </span>
          ))}
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col gap-12 sm:gap-16 px-4 sm:px-8 pb-16">
        <div className="py-6 sm:py-8">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-6 text-center animate-slideUp">Find Your Expert</h2>
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
      `}</style>
    </div>
  );
};

export default OneOnOne;
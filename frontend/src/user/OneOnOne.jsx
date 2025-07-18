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

const HowItWorks = () => (
  <section className="relative bg-white rounded-xl shadow p-6 flex flex-col gap-6 border border-blue-200 mb-8 animate-fadeIn">
    <h2 className="text-xl sm:text-2xl font-bold text-blue-900 text-center flex items-center justify-center gap-2">
      <svg
        className="w-6 h-6 text-blue-600"
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
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <div className="flex flex-col items-center text-center p-4 bg-blue-50 rounded-lg shadow hover:shadow-md transition-all duration-200 hover:scale-105">
        <div className="bg-blue-100 text-blue-700 rounded-full p-2 mb-2">
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-blue-900">Search for an Expert</h3>
        <p className="text-xs text-gray-700 mt-1">Select your course, unit, or topic to find a subject expert.</p>
      </div>
      <div className="flex flex-col items-center text-center p-4 bg-blue-50 rounded-lg shadow hover:shadow-md transition-all duration-200 hover:scale-105">
        <div className="bg-blue-100 text-blue-700 rounded-full p-2 mb-2">
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
            />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-blue-900">Connect & Learn</h3>
        <p className="text-xs text-gray-700 mt-1">Request a session and get real-time, personalized guidance.</p>
      </div>
      <div className="flex flex-col items-center text-center p-4 bg-blue-50 rounded-lg shadow hover:shadow-md transition-all duration-200 hover:scale-105">
        <div className="bg-blue-100 text-blue-700 rounded-full p-2 mb-2">
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2zm0 2c-2.761 0-5 2.239-5 5h10c0-2.761-2.239-5-5-5z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-blue-900">Silver Coin System</h3>
        <p className="text-xs text-blue-900 mt-1">
          Each minute of a session costs <span className="font-semibold">0.25 rupees</span> (paid in Silver Coins). At the end, the total Silver Coins (based on session duration) are deducted from your balance and credited to the tutor. Ensure you have enough Silver Coins before starting!
        </p>
      </div>
      <div className="flex flex-col items-center text-center p-4 bg-blue-50 rounded-lg shadow hover:shadow-md transition-all duration-200 hover:scale-105">
        <div className="bg-blue-100 text-blue-700 rounded-full p-2 mb-2">
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-6v12" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-blue-900">Example</h3>
        <p className="text-xs text-blue-700 mt-1">AA 40 min session = 10 Silver coins (10 rupees)</p>
        <p className="text-xs text-blue-700 mt-1">A 60 min session = 15 Silver Coins (15 rupees)</p>
      </div>
    </div>
  </section>
);

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
    // Handle search parameters from StartSkillSwap
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
    <div className="min-h-screen w-full bg-blue-50">
      <header className="w-full max-w-7xl mx-auto text-center py-6 sm:py-10 px-4 sm:px-6 uova relative animate-fadeIn">
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 text-left">
            <h1 className="text-4xl sm:text-5xl font-bold text-blue-900 mb-4 leading-tight">
              Connect with Experts for Personalized Learning
            </h1>
            <p className="text-lg sm:text-xl text-gray-700 max-w-xl mb-6">
              Instantly connect with subject experts, get your doubts solved, and accelerate your learning with tailored guidance.
            </p>
            <div className="flex flex-row items-center gap-4 mt-4">
              <button
                className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold text-lg shadow-md hover:bg-blue-700 transition-all duration-300 hover:scale-105"
                onClick={() => window.location.href = '/createSession'}
              >
                Create a Session
              </button>
              <button
                className="bg-white text-blue-700 border border-blue-600 px-6 py-3 rounded-full font-semibold text-lg shadow-md hover:bg-blue-50 transition-all duration-300 hover:scale-105"
                onClick={() => navigate('/startskillswap')}
              >
                Start SkillSwap
              </button>
            </div>
          </div>
          <div className="flex-1 hidden md:block">
            <img
              src="/assets/expert-connect-illustration.webp"
              alt="Expert Connect Illustration"
              className="w-full max-w-md mx-auto object-contain"
            />
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold text-sm shadow-sm transition-transform hover:scale-105 hover:bg-blue-200">
            Instant Doubt Solving
          </span>
          <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold text-sm shadow-sm transition-transform hover:scale-105 hover:bg-blue-200">
            Personalized Guidance
          </span>
          <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold text-sm shadow-sm transition-transform hover:scale-105 hover:bg-blue-200">
            Flexible Scheduling
          </span>
      </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col gap-16 px-4 sm:px-8 pb-16">
        <div className="py-8">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-6 text-center animate-fadeIn">Find Your Expert</h2>
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
            <div className="flex flex-col gap-8 mt-8 animate-fadeIn">
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
           <Blog />
           
      </main>

      {/* Custom Tailwind animation styles */}
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
import React, { useState, useEffect, useRef } from 'react';
import { BACKEND_URL } from '../config.js';
import SearchBar from './oneononeSection/serachBar'; 
import TutorCard from './oneononeSection/TutorCard';
import Testimonial from "./Testimonial";


const HowItWorks = () => (
  <section className="relative bg-white rounded-xl shadow p-4 flex flex-col gap-4 border border-blue-200 mb-8">
    <h2 className="text-lg sm:text-xl font-bold text-blue-900 text-center flex items-center justify-center gap-2">
      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      How It Works
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
      <div className="flex flex-col items-center text-center p-3 bg-blue-50 rounded-lg shadow hover:shadow-md transition-all duration-200 hover:scale-105">
        <div className="bg-blue-100 text-blue-700 rounded-full p-2 mb-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" d="M8 12l2 2 4-4" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-blue-900">Search for an Expert</h3>
        <p className="text-xs text-gray-700 mt-1">Select your course, unit, or topic to find a subject expert.</p>
      </div>
      <div className="flex flex-col items-center text-center p-3 bg-blue-50 rounded-lg shadow hover:shadow-md transition-all duration-200 hover:scale-105">
        <div className="bg-blue-100 text-blue-700 rounded-full p-2 mb-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="4" width="16" height="16" rx="8" />
            <path strokeLinecap="round" d="M8 12h8" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-blue-900">Connect & Learn</h3>
        <p className="text-xs text-gray-700 mt-1">Request a session and get real-time, personalized guidance.</p>
      </div>
    
      <div className="flex flex-col items-center text-center p-3 bg-blue-50 rounded-lg shadow hover:shadow-md transition-all duration-200 hover:scale-105">
        <div className="bg-blue-100 text-blue-700 rounded-full p-2 mb-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <text x="12" y="16" textAnchor="middle" fontSize="8" fill="currentColor">S</text>
          </svg>
        </div>
        <h3 className="text-base font-semibold text-blue-900">Silver Coin System</h3>
        <p className="text-xs text-blue-900 mt-1">
          Each minute of a session costs <span className="font-semibold">0.25 rupees</span> (paid in Silver Coins). At the end, the total Silver Coins (based on session duration) are deducted from your balance and credited to the tutor. Ensure you have enough Silver Coins before starting!
        </p>
      </div>
      <div className="flex flex-col items-center text-center p-3 bg-blue-50 rounded-lg shadow hover:shadow-md transition-all duration-200 hover:scale-105">
        <div className="bg-blue-100 text-blue-700 rounded-full p-2 mb-2">
          <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor">Ex</text>
          </svg>
        </div>
        <h3 className="text-base font-semibold text-blue-900">Example</h3>
        <p className="text-xs text-blue-700 mt-1">A 40 min session = 10 Silver Coins (10 rupees)</p>
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
  const searchBarRef = useRef(null);

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
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!res.ok) throw new Error('Unauthorized or failed request');

    const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]); // prevent crash if error
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSession = async (session) => {
    console.log('Requesting session with:', session);  // debug line

    if (!session._id) {
      alert('Error: Missing sessionId in session data.');
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/sessions/request/${session._id}`, {
        method: 'POST',
        credentials: 'include', // Send cookies for authentication
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) throw new Error('Failed to send session request');

      setSessionRequestedTutor(session.creator);
      setPendingSession({ tutor: session.creator });
      setRequestSentTutor(session.creator);

      alert('Session request sent successfully!');
    } catch (error) {
      console.error('Session request error:', error);
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
      <header className="w-full max-w-7xl mx-auto text-center py-6 sm:py-10 px-4 sm:px-6 relative">
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
              onClick={() => {
                if (searchBarRef.current && searchBarRef.current.scrollIntoView) {
                  searchBarRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  if (searchBarRef.current.focus) searchBarRef.current.focus();
                }
              }}
            >
              Book Your Session
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
      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col gap-16 px-4 sm:px-6 pb-12">
        <HowItWorks />
        <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-4 text-center">Find Your Expert</h2>
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
  <div className="flex flex-col gap-6">
    {loading ? (
      <p className="text-center text-blue-600">Searching...</p>
    ) : Array.isArray(searchResults) && searchResults.length === 0 ? (
      <p className="text-center text-gray-500">No pending sessions found.</p>
    ) : Array.isArray(searchResults) ? (
      searchResults.map((session, idx) => (
        <TutorCard
          key={idx}
          tutor={{
            name: `${session.creator?.firstName ?? ''} ${session.creator?.lastName ?? ''}`.trim() || "Unknown",
            profilePic: '/default-user.png',
            date: session.date,
            time: session.time,
            skills: [session.subject, session.topic, session.subtopic],
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


        <Testimonial />
      </main>
    </div>
  );
};

export default OneOnOne;
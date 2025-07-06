
import React, { useState } from 'react';
import SearchBar from './oneononeSection/serachBar'; 
import TestimonialSection from './oneononeSection/TestimonialSection';
import TutorCard from './oneononeSection/TutorCard';


const HowItWorks = () => (
  <section className="relative bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-8 border border-blue-200 mb-12">
    <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 text-center flex items-center justify-center gap-3">
      <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      How It Works
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div className="flex flex-col items-center text-center p-6 bg-blue-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
        <div className="bg-blue-100 text-blue-700 rounded-full p-4 mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" d="M8 12l2 2 4-4" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-blue-900">Search for an Expert</h3>
        <p className="text-sm text-gray-700 mt-2">Select your course, unit, or topic to find a subject expert.</p>
      </div>
      <div className="flex flex-col items-center text-center p-6 bg-blue-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
        <div className="bg-blue-100 text-blue-700 rounded-full p-4 mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="4" width="16" height="16" rx="8" />
            <path strokeLinecap="round" d="M8 12h8" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-blue-900">Connect & Learn</h3>
        <p className="text-sm text-gray-700 mt-2">Request a session and get real-time, personalized guidance.</p>
      </div>
      <div className="flex flex-col items-center text-center p-6 bg-blue-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
        <div className="bg-blue-100 text-blue-700 rounded-full p-4 mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M12 6v6l4 2" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-blue-900">Grow & Succeed</h3>
        <p className="text-sm text-gray-700 mt-2">Apply expert advice to master concepts and achieve your goals.</p>
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


const handleFindTutor = async () => {
  setLoading(true);
  setShowTutors(true);

  try {
    const queryParams = new URLSearchParams();
    if (course) queryParams.append('subject', course);
    if (unit) queryParams.append('topic', unit);
    if (topic) queryParams.append('subtopic', topic);

    const token = localStorage.getItem('token');

    const res = await fetch(`http://localhost:5000/api/sessions/search?${queryParams.toString()}`, {
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

const handleRequestSession = async (creator) => {
  console.log('Requesting session with:', creator);  // debug line

  if (!creator.sessionId) {
    alert('Error: Missing sessionId in tutor data.');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/api/sessions/request/${creator.sessionId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) throw new Error('Failed to send session request');

    setSessionRequestedTutor(creator);
    setPendingSession({ tutor: creator });
    setRequestSentTutor(creator);

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
      <header className="w-full max-w-7xl mx-auto text-center py-16 sm:py-24 px-4 sm:px-6 relative">
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 text-left">
            <h1 className="text-4xl sm:text-5xl font-bold text-blue-900 mb-4 leading-tight">
              Connect with Experts for Personalized Learning
            </h1>
            <p className="text-lg sm:text-xl text-gray-700 max-w-xl mb-6">
              Instantly connect with subject experts, get your doubts solved, and accelerate your learning with tailored guidance.
            </p>
            <button
              className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold text-lg shadow-md hover:bg-blue-700 transition-all duration-300 hover:scale-105"
              onClick={() => window.location.href = '/createSession'}
            >
              Create a Session
            </button>
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
        <SearchBar
          courseValue={course}
          setCourseValue={setCourse}
          unitValue={unit}
          setUnitValue={setUnit}
          topicValue={topic}
          setTopicValue={setTopic}
          onFindTutor={handleFindTutor}
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
         status: `${session.status}` === 'pending'
  ? '🟢 Available'
  : `🔴 Busy (${session.status})`,
      rating: 4.5,
    }}
    onRequestSession={() => handleRequestSession(session.creator)}
    
  />
  
))
    ) : (
      <p className="text-red-600">Unexpected response format.</p>
    )}
  </div>
  
)}


        <TestimonialSection />
      </main>
    </div>
  );
};

export default OneOnOne;

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
    <section className="relative rounded-3xl mb-8 w-full max-w-7xl mx-auto overflow-hidden bg-white shadow-xl">
      <div className="relative z-10 px-4 sm:px-8 lg:px-12 py-12 sm:py-16 flex flex-col gap-8 sm:gap-10">
        <div className="flex flex-col items-center gap-4 mb-4 sm:mb-6">
          <div className="flex items-center justify-center gap-3 w-full flex-wrap">
            <div className="w-8 sm:w-12 h-0.5 bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent rounded-full"></div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1e3a8a] text-center">
              🚀 How It Works
            </h2>
            <div className="w-8 sm:w-12 h-0.5 bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent rounded-full"></div>
          </div>
          <p className="text-center text-gray-600 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto px-2">
            Connect with expert tutors and accelerate your learning journey
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {[
            {
              emoji: "🔍",
              title: "Search Expert",
              desc: "Select class, subject, or topic to find the perfect tutor",
              bgGradient: "from-[#3b82f6] to-[#2563eb]",
              lightBg: "from-[#dbeafe] to-[#bfdbfe]",
              borderColor: "border-[#93c5fd]",
            },
            {
              emoji: "🎓",
              title: "Connect & Learn",
              desc: "Get real-time guidance from experienced tutors",
              bgGradient: "from-[#2563eb] to-[#1e40af]",
              lightBg: "from-[#bfdbfe] to-[#93c5fd]",
              borderColor: "border-[#60a5fa]",
            },
            {
              emoji: "💰",
              title: "Silver Coin System",
              desc: "Pay 0.25 rupees per minute of learning",
              bgGradient: "from-[#1e40af] to-[#1e3a8a]",
              lightBg: "from-[#93c5fd] to-[#60a5fa]",
              borderColor: "border-[#3b82f6]",
            },
            {
              emoji: "⏱️",
              title: "Example",
              desc: "40 min = 10 Coins\n60 min = 15 Coins",
              bgGradient: "from-[#3b82f6] to-[#2563eb]",
              lightBg: "from-[#dbeafe] to-[#bfdbfe]",
              borderColor: "border-[#60a5fa]",
            }
          ].map((item, index) => (
            <div
              key={index}
              onClick={() => handleCardClick(index)}
              className={`group relative flex flex-col items-center text-center p-5 sm:p-6 bg-white rounded-2xl border-2 ${item.borderColor} transition-all duration-300 hover:shadow-lg overflow-hidden cursor-pointer`}
            >
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${item.bgGradient}`}></div>

              <div 
                className={`relative z-10 flex items-center justify-center w-14 sm:w-16 h-14 sm:h-16 rounded-full bg-gradient-to-br ${item.lightBg} mb-4 transition-all duration-300 shadow-md text-2xl ${
                  clickedIndex === index ? 'scale-110 rotate-12' : 'group-hover:scale-110'
                }`}
              >
                {item.emoji}
              </div>

              <h3 className="relative z-10 text-lg sm:text-xl font-bold text-[#1e3a8a] mb-2">
                {item.title}
              </h3>

              <p className="relative z-10 text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {item.desc}
              </p>

              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${item.bgGradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-b-2xl`}></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const OneOnOne = () => {
  const [course, setCourse] = useState('');
  const [unit, setUnit] = useState('');
  const [topic, setTopic] = useState('');
  const [showTutors, setShowTutors] = useState(false);
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
      const fetchData = async () => {
        setLoading(true);
        setShowTutors(true);
        try {
          const queryParams = new URLSearchParams();
          if (course) queryParams.append('subject', course);
          if (unit) queryParams.append('topic', unit);
          if (topic) queryParams.append('subtopic', topic);
          const token = localStorage.getItem('token');
          const res = await fetch(`${BACKEND_URL}/api/sessions/search?${queryParams.toString()}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setSearchResults(data);
          } else {
            setSearchResults([]);
          }
        } catch {
          setSearchResults([]);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
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
    } catch {
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

      alert('Session request sent successfully!');
    } catch {
      alert('Failed to send session request.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f0f9ff] via-[#e0f2fe] to-[#e0f2fe]">
      {/* Hero Section */}
      <section className="relative min-h-[75vh] w-full flex items-center justify-center overflow-hidden pt-16 sm:pt-20 pb-6 sm:pb-8">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left space-y-6">
              <div className="inline-block">
                <span className="px-4 py-2 bg-blue-100 text-[#1e3a8a] rounded-full text-sm font-semibold">
                  🎓 One-on-One Learning Platform
                </span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#1e3a8a] leading-tight">
                Connect with Experts for
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] to-[#2563eb] mt-2">
                  Personalized Learning
                </span>
              </h1>
              
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0">
                Instantly connect with subject experts, get your doubts solved in real-time, and accelerate your learning journey.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <button
                  onClick={() => window.location.href = '/createSession'}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white rounded-xl font-bold text-base hover:shadow-2xl transition-all hover:scale-105 transform"
                >
                  📝 Create a Session
                </button>
                <button
                  onClick={() => navigate('/startskillswap')}
                  className="w-full sm:w-auto px-8 py-4 bg-white text-[#1e3a8a] border-2 border-[#3b82f6] rounded-xl font-bold text-base hover:bg-blue-50 transition-all hover:scale-105 transform shadow-md"
                >
                  🔄 Start SkillSwap
                </button>
              </div>
            </div>

            {/* Right Illustration */}
            <div className="flex-1 relative">
              <div className="relative w-full max-w-md mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/20 to-[#2563eb]/20 rounded-3xl blur-2xl"></div>
                <img
                  src="/assets/expert-connect-illustration.webp"
                  alt="Expert Connect"
                  className="relative w-full h-auto object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 text-gray-600">
          <span className="text-xs sm:text-sm font-medium">Scroll to explore</span>
          <div className="w-6 h-10 border-2 border-[#2563eb] rounded-full flex items-start justify-center p-1">
            <div className="w-1.5 h-3 bg-[#2563eb] rounded-full animate-bounce"></div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto flex flex-col gap-12 sm:gap-16 px-4 sm:px-8 py-8 sm:py-12 lg:py-16">
        {/* Search Section */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl overflow-hidden">
          <div className="flex flex-col items-center gap-4 mb-8 pb-6 border-b-2 border-[#3b82f6]/20">
            <div className="flex items-center justify-center gap-3 w-full flex-wrap">
              <div className="w-6 sm:w-8 h-0.5 bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent rounded-full"></div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1e3a8a] text-center">
                🔍 Find Your Expert
              </h2>
              <div className="w-6 sm:w-8 h-0.5 bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent rounded-full"></div>
            </div>
          </div>

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
            <div className="flex flex-col gap-6 mt-8">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#3b82f6] border-t-transparent mb-4"></div>
                  <p className="text-gray-600 text-lg font-semibold">Searching for experts...</p>
                </div>
              ) : Array.isArray(searchResults) && searchResults.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-5xl">🔍</span>
                  </div>
                  <h3 className="text-2xl font-bold text-[#1e3a8a] mb-2">No Sessions Found</h3>
                  <p className="text-gray-600 mb-6">Try adjusting your search criteria or create a new session</p>
                  <button
                    onClick={() => window.location.href = '/createSession'}
                    className="px-8 py-4 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white rounded-xl font-bold hover:shadow-2xl transition-all hover:scale-105"
                  >
                    📝 Create Session
                  </button>
                </div>
              ) : Array.isArray(searchResults) ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-[#1e3a8a]">
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
                          status: `${session.status}` === 'pending' ? '🟢 Available' : `🔴 Busy (${session.status})`,
                          rating: session.creator?.rating || 4.5,
                        }}
                        onRequestSession={() => handleRequestSession(session)}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-red-600 text-lg font-semibold">⚠️ Unexpected response format</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* How It Works */}
        <HowItWorks />

        {/* Top Performers */}
        <TopPerformersSection />
      </main>
    </div>
  );
};

export default OneOnOne;
import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [courseValue, setCourseValue] = useState('');
  const [unitValue, setUnitValue] = useState('');
  const [topicValue, setTopicValue] = useState('');

  // Demo data
  const DEMO_SESSIONS = [
    {
      id: 1,
      title: 'Algebra 101',
      tutor: 'John Doe',
      course: 'Mathematics',
      unit: 'Algebra',
      topic: 'Introduction to Algebra',
      date: '2025-07-10',
      time: '10:00 AM',
      status: 'Upcoming',
    },
    {
      id: 2,
      title: 'Calculus: The Basics',
      tutor: 'Jane Smith',
      course: 'Mathematics',
      unit: 'Calculus',
      topic: 'Limits and Continuity',
      date: '2025-07-12',
      time: '2:00 PM',
      status: 'Upcoming',
    },
    {
      id: 3,
      title: 'Physics: Motion in One Dimension',
      tutor: 'Albert Einstein',
      course: 'Physics',
      unit: 'Kinematics',
      topic: 'Introduction to Motion',
      date: '2025-07-15',
      time: '1:00 PM',
      status: 'Completed',
    },
  ];

  const DEMO_LIVE_STREAMS = [
    {
      id: 1,
      title: 'Live Algebra Q&A',
      tutor: 'John Doe',
      course: 'Mathematics',
      unit: 'Algebra',
      topic: 'Linear Equations',
      time: '10:00 AM',
      date: '2025-07-08',
      status: 'Live',
    },
  ];

  const DEMO_UPLOADED_VIDEOS = [
    {
      id: 1,
      title: 'Algebra Basics - Recorded',
      tutor: 'John Doe',
      course: 'Mathematics',
      unit: 'Algebra',
      topic: 'Linear Equations',
      videoUrl: 'https://www.example.com/video1',
      date: '2025-07-01',
    },
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setSessions(DEMO_SESSIONS);
    }, 500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.6s ease-out;
          }
          .animate-slideIn {
            animation: slideIn 0.6s ease-out;
          }
          .hover-scale {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .hover-scale:hover {
            transform: scale(1.03);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
          }
          .gradient-button {
            background: linear-gradient(to right, #1e40af, #3b82f6);
            transition: background 0.3s ease;
          }
          .gradient-button:hover {
            background: linear-gradient(to right, #3b82f6, #1e40af);
          }
        `}
      </style>
{/* Hero Section */}
<section className="relative w-full px-6 sm:px-8 lg:px-16 py-16 md:py-24 bg-gradient-to-b from-blue-50 to-blue-100 overflow-hidden">
  <motion.div
    className="relative grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.8 }}
  >
    {/* Left Text Content */}
    <div className="text-center md:text-left z-10">
      <motion.h1
        className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-blue-900 leading-tight"
        initial={{ y: -30 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.7 }}
      >
        Elevate Your Learning with <span className="text-blue-700">Live Session</span>
      </motion.h1>
      <motion.p
        className="text-2xl text-gray-900 max-w-3xl mx-auto mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.7 }}
      >
        Personalized 1-on-1 sessions, live streams, and recorded videos with expert tutors to help you master any subject.
      </motion.p>
      <motion.div
        className="flex flex-wrap justify-center md:justify-start gap-6 mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.7 }}
      >
        <motion.button
          className="gradient-button text-white font-semibold px-8 py-4 rounded-xl hover:shadow-xl"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2 inline-block"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
          Start Live Stream
        </motion.button>
        <motion.button
          className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-900 font-semibold px-8 py-4 rounded-xl border border-blue-200 hover:bg-blue-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2 inline-block"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
          Upload Session
        </motion.button>
      </motion.div>
    </div>

    {/* Right-side image with 3% left slide and 5% smaller size */}
    <motion.img
      src="/assets/session.webp"
      alt="Learning Session"
      className="w-full max-w-[700px] scale-[0.95] -translate-x-[3%]"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4, duration: 0.8 }}
    />
  </motion.div>
</section>


      {/* How It Works Section */}
      <section className="py-16 bg-gradient-to-b from-blue-50 to-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-blue-900 text-center mb-16"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            How It Works
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'Discover Sessions',
                description: 'Explore live or recorded sessions by course, unit, or topic with our intuitive search.',
                icon: (
                  <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-full p-4">
                    <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                ),
              },
              {
                title: 'Unlock with Coins',
                description: 'Access any session for just 2 Golden Coins (₹4).',
                icon: (
                  <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-full p-4">
                    <svg className="w-10 h-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <text x="12" y="16" textAnchor="middle" fontSize="12" fill="currentColor">G</text>
                    </svg>
                  </div>
                ),
              },
              {
                title: 'Coin Value',
                description: 'Each Golden Coin equals ₹2, making learning affordable and accessible.',
                icon: (
                  <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-full p-4">
                    <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <text x="12" y="16" textAnchor="middle" fontSize="12" fill="currentColor">₹2</text>
                    </svg>
                  </div>
                ),
              },
              {
                title: 'Instant Learning',
                description: 'Join live sessions or watch videos instantly after unlocking.',
                icon: (
                  <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-full p-4">
                    <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                ),
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100 hover-scale"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="mb-6 flex justify-center">{item.icon}</div>
                <h3 className="text-xl font-bold text-blue-900 mb-3 text-center">{item.title}</h3>
                <p className="text-gray-900 text-center">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Search Bar Section */}
      <section className="py-16 bg-gradient-to-b from-blue-50 to-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-blue-900 text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Find Your Perfect Session
          </motion.h2>
          <motion.div
            className="max-w-4xl mx-auto bg-white bg-opacity-90 backdrop-blur-lg p-8 rounded-3xl shadow-lg border border-blue-100"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              <div className="relative">
                <select
                  value={courseValue}
                  onChange={(e) => setCourseValue(e.target.value)}
                  className="w-full bg-white bg-opacity-80 border border-blue-200 rounded-xl py-3 px-4 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="">Select Course</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="relative">
                <select
                  value={unitValue}
                  onChange={(e) => setUnitValue(e.target.value)}
                  className="w-full bg-white bg-opacity-80 border border-blue-200 rounded-xl py-3 px-4 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="">Select Unit</option>
                  <option value="Algebra">Algebra</option>
                  <option value="Calculus">Calculus</option>
                  <option value="Geometry">Geometry</option>
                  <option value="Trigonometry">Trigonometry</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={topicValue}
                  onChange={(e) => setTopicValue(e.target.value)}
                  placeholder="Search by topic..."
                  className="w-full bg-white bg-opacity-80 border border-blue-200 rounded-xl py-3 px-4 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Streams Section */}
      <section className="py-16 bg-gradient-to-b from-blue-50 to-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-10">
            <motion.h2
              className="text-3xl font-bold text-blue-900"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Live Streams
            </motion.h2>
            <div className="flex items-center">
              <span className="h-3 w-3 bg-red-500 rounded-full mr-2 animate-pulse"></span>
              <span className="text-red-500 font-medium">Live Now</span>
            </div>
          </div>
          {DEMO_LIVE_STREAMS.length === 0 ? (
            <motion.div
              className="text-center py-16 bg-white bg-opacity-90 backdrop-blur-lg rounded-3xl shadow-lg border border-blue-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <svg className="inline-block h-16 w-16 text-blue-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-xl text-gray-900">No live streams at the moment</p>
              <p className="text-gray-700 mt-2">Check back later for upcoming sessions</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {DEMO_LIVE_STREAMS.map((stream, index) => (
                <motion.div
                  key={stream.id}
                  className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 hover-scale"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <h3 className="text-xl font-bold text-blue-900 mb-2">{stream.title}</h3>
                  <div className="flex items-center text-sm text-gray-900 mb-3">
                    <span className="font-medium">Tutor:</span> {stream.tutor}
                  </div>
                  <div className="text-sm text-gray-900 space-y-1">
                    <p><span className="font-medium">Course:</span> {stream.course}</p>
                    <p><span className="font-medium">Unit:</span> {stream.unit}</p>
                    <p><span className="font-medium">Topic:</span> {stream.topic}</p>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-gray-900 font-medium">
                      {stream.date} | {stream.time}
                    </div>
                    <motion.button
                      className="gradient-button text-white rounded-lg px-4 py-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Join Now
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recorded Sessions Section */}
      <section className="py-16 bg-gradient-to-b from-blue-50 to-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.h2
            className="text-3xl font-bold text-blue-900 mb-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Recorded Sessions
          </motion.h2>
          {DEMO_UPLOADED_VIDEOS.length === 0 ? (
            <motion.div
              className="text-center py-16 bg-white bg-opacity-90 backdrop-blur-lg rounded-3xl shadow-lg border border-blue-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <svg className="inline-block h-16 w-16 text-blue-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-xl text-gray-900">No recorded sessions available</p>
              <p className="text-gray-700 mt-2">Upload a session or check back later</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {DEMO_UPLOADED_VIDEOS.map((video, index) => (
                <motion.div
                  key={video.id}
                  className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 hover-scale"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <h3 className="text-xl font-bold text-blue-900 mb-2">{video.title}</h3>
                  <div className="flex items-center text-sm text-gray-900 mb-3">
                    <span className="font-medium">Tutor:</span> {video.tutor}
                  </div>
                  <div className="text-sm text-gray-900 space-y-1">
                    <p><span className="font-medium">Course:</span> {video.course}</p>
                    <p><span className="font-medium">Unit:</span> {video.unit}</p>
                    <p><span className="font-medium">Topic:</span> {video.topic}</p>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-gray-900 font-medium">{video.date}</div>
                    <motion.button
                      className="gradient-button text-white rounded-lg px-4 py-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Watch Now
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Your Sessions Section */}
      <section className="py-16 bg-gradient-to-b from-blue-50 to-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-blue-900 mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Your Learning Sessions
          </motion.h2>
          {sessions.length === 0 ? (
            <motion.div
              className="text-center py-16 bg-white bg-opacity-90 backdrop-blur-lg rounded-3xl shadow-lg border border-blue-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <svg className="inline-block h-16 w-16 text-blue-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-xl text-gray-900">No sessions found.</p>
              <p className="text-gray-700 mt-2">Search and book a session to get started!</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 hover-scale"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-blue-900">{session.title}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        session.status === 'Completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>
                  <div className="flex items-center mb-4">
                    <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl w-12 h-12 flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-blue-900">{session.tutor}</p>
                      <p className="text-sm text-gray-900">{session.course}</p>
                    </div>
                  </div>
                  <div className="mb-6">
                    <div className="flex items-center text-sm text-gray-900 mb-2">
                      <svg className="h-4 w-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {session.date} | {session.time}
                    </div>
                    <div className="text-sm text-gray-900">
                      <p><span className="font-medium">Unit:</span> {session.unit}</p>
                      <p><span className="font-medium">Topic:</span> {session.topic}</p>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <motion.button
                      className="px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-900 rounded-lg border border-blue-200 hover:bg-blue-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      View Details
                    </motion.button>
                    <motion.button
                      className="gradient-button text-white rounded-lg px-4 py-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Join Session
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Sessions;
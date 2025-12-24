import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LiveStream from "./SessionsFolder/LiveStream";
import UploadedVideos from "./SessionsFolder/UploadedVideos";
import ScheduledSessions from "./SessionsFolder/Scheduled";
import Testimonial from "./Testimonial";
import { useNavigate } from "react-router-dom";
import TopPerformersSection from "./HomeSection/TopPerformersSection";
import Blog from '../user/company/Blog';
import socket from '../socket';

const HowItWorks = () => (
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
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            title: "Discover Sessions",
            description: "Search by course, unit, or topic.",
            icon: (
              <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-full p-2 sm:p-3">
                <svg
                  className="w-4 h-4 sm:w-6 sm:h-6 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            ),
          },
          {
            title: "Unlock with Coins",
            description: "Access sessions for 2 Golden Coins (₹4).",
            icon: (
              <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-full p-2 sm:p-3">
                <svg
                  className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <text
                    x="12"
                    y="16"
                    textAnchor="middle"
                    fontSize="12"
                    fill="currentColor"
                  >
                    G
                  </text>
                </svg>
              </div>
            ),
          },
          {
            title: "Coin Value",
            description: "1 Golden Coin = ₹2.",
            icon: (
              <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-full p-2 sm:p-3">
                <svg
                  className="w-4 h-4 sm:w-6 sm:h-6 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <text
                    x="12"
                    y="16"
                    textAnchor="middle"
                    fontSize="12"
                    fill="currentColor"
                  >
                    ₹2
                  </text>
                </svg>
              </div>
            ),
          },
          {
            title: "Instant Learning",
            description: "Join live or watch videos instantly.",
            icon: (
              <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-full p-2 sm:p-3">
                <svg
                  className="w-4 h-4 sm:w-6 sm:h-6 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            ),
          },
        ].map((item, index) => (
          <motion.div
            key={index}
            className="flex flex-col items-center justify-center text-center p-3 sm:p-4 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:bg-blue-50 border border-blue-100 cursor-pointer aspect-square"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className="mb-2 sm:mb-3">{item.icon}</div>
            <h3 className="text-sm sm:text-lg font-semibold text-blue-900 leading-tight">{item.title}</h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 whitespace-pre-line line-clamp-3">{item.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const Sessions = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [liveStreams, setLiveStreams] = useState([]);
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Demo data (simulating public live and videos from yesterday)
  const DEMO_SESSIONS = [
    {
      id: 1,
      title: "Algebra 101",
      tutor: "John Doe",
      course: "Mathematics",
      unit: "Algebra",
      topic: "Introduction to Algebra",
      description:
        "Learn the fundamentals of algebra including variables and equations.",
      date: "2025-07-10",
      time: "10:00 AM",
      status: "Scheduled",
      skillmate: 150,
      views: 200,
      likes: 50,
    },
    {
      id: 2,
      title: "Calculus: The Basics",
      tutor: "Jane Smith",
      course: "Mathematics",
      unit: " Calculus",
      topic: "Limits and Continuity",
      description:
        "Explore the core concepts of calculus with focus on limits.",
      date: "2025-07-12",
      time: "2:00 PM",
      status: "Scheduled",
      skillmate: 180,
      views: 300,
      likes: 75,
    },
    {
      id: 3,
      title: "Physics: Motion in One Dimension",
      tutor: "Albert Einstein",
      course: "Physics",
      unit: "Kinematics",
      topic: "Introduction to Motion",
      description:
        "Understand motion in one dimension with practical examples.",
      date: "2025-07-15",
      time: "1:00 PM",
      status: "Scheduled",
      skillmate: 120,
      views: 250,
      likes: 60,
    },
  ];

  const DEMO_LIVE_STREAMS = [
    {
      id: 1,
      title: "Live Algebra Q&A",
      tutor: "John Doe",
      course: "Mathematics",
      unit: "Algebra",
      topic: "Linear Equations",
      description: "Interactive Q&A session on solving linear equations.",
      time: "10:00 AM",
      date: "2025-07-10",
      status: "Live",
      skillmate: 200,
      views: 500,
      likes: 100,
      joinUrl: "https://www.example.com/join1",
    },
  ];

  const DEMO_UPLOADED_VIDEOS = [
    {
      id: 1,
      title: "Algebra Basics - Recorded",
      tutor: "John Doe",
      course: "Mathematics",
      unit: "Algebra",
      topic: "Linear Equations",
      description:
        "Comprehensive guide to algebra basics and linear equations.",
      videoUrl: "https://www.example.com/video1",
      date: "2025-07-10",
      views: 1000,
      likes: 200,
      skillmate: 80,
    },
  ];

  useEffect(() => {
    // Simulate API calls for public live and yesterday's videos
    setTimeout(() => {
      setSessions(DEMO_SESSIONS);
      setLiveStreams(DEMO_LIVE_STREAMS);
      setUploadedVideos(DEMO_UPLOADED_VIDEOS);
    }, 500);

    // Listen for session-completed event
    socket.on('session-completed', ({ sessionId }) => {
      setSessions(prevSessions => prevSessions.map(session =>
        String(session.id) === String(sessionId) || String(session._id) === String(sessionId)
          ? { ...session, status: 'COMPLETED' }
          : session
      ));
    });
    return () => {
      socket.off('session-completed');
    };
  }, []);

  // Real-time search based on keyword (course, unit, topic, tutor, description)
  const filteredResults = () => {
    const q = searchQuery.toLowerCase();
    const allItems = [
      ...sessions.map((item) => ({ ...item, type: "Scheduled" })),
      ...liveStreams.map((item) => ({ ...item, type: "Live" })),
      ...uploadedVideos.map((item) => ({ ...item, type: "Uploaded" })),
    ];

    return allItems
      .filter(
        (item) =>
          item.course.toLowerCase().includes(q) ||
          item.unit.toLowerCase().includes(q) ||
          item.topic.toLowerCase().includes(q) ||
          item.tutor.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        if (a.type === "Uploaded" && b.type === "Uploaded") {
          return b.views + b.likes - (a.views + a.likes);
        } else if (a.type === "Scheduled" && b.type === "Scheduled") {
          return b.skillmate - a.skillmate;
        } else if (a.type === "Live" && b.type === "Live") {
          return (
            b.skillmate + b.views + b.likes - (a.skillmate + a.views + a.likes)
          );
        } else {
          const typeOrder = { Live: 1, Scheduled: 2, Uploaded: 3 };
          return typeOrder[a.type] - typeOrder[b.type];
        }
      });
  };

  // Suggestions for autocomplete
  const suggestions = [...sessions, ...liveStreams, ...uploadedVideos]
    .flatMap((item) => [
      item.course,
      item.unit,
      item.topic,
      item.tutor,
      item.description,
    ])
    .filter(
      (value, index, self) =>
        self.indexOf(value) === index &&
        value.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 pt-16 sm:pt-20">
      <style jsx>{`
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
          .text-4xl {
            font-size: 1.875rem;
          }
          .text-3xl {
            font-size: 1.5rem;
          }
          .text-2xl {
            font-size: 1.25rem;
          }
          .text-xl {
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

      {/* Hero Section */}
      <section className="relative w-full px-4 sm:px-6 lg:px-16 py-12 sm:py-16 md:py-24 bg-gradient-to-b from-blue-50 to-blue-100 overflow-hidden">
        <motion.div
          className="relative grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center max-w-7xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center md:text-left z-10">
            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-blue-900 leading-tight"
              initial={{ y: -30 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.7 }}
            >
              Elevate Your Learning with{" "}
              <span className="text-blue-700">Live Session</span>
            </motion.h1>
            <motion.p
              className="text-lg sm:text-xl text-gray-900 max-w-3xl mx-auto mt-4 sm:mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              Personalized 1-on-1 sessions, live streams, and recorded videos
              with expert tutors to help you master any subject.
            </motion.p>
          </div>
          <motion.img
            src="https://res.cloudinary.com/dbltazdsa/image/upload/v1766589372/webimages/session.png"
            alt="Learning Session"
            className="w-full max-w-[280px] sm:max-w-xs md:max-w-md lg:max-w-lg mx-auto object-contain"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          />
        </motion.div>
      </section>

      {/* How It Works Section */}
      <HowItWorks />

      {/* Search Bar Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-blue-50 to-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-900 text-center mb-8 sm:mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Find Your Perfect Session
          </motion.h2>
          <motion.div
            className="max-w-4xl mx-auto bg-white bg-opacity-90 backdrop-blur-lg p-6 sm:p-8 rounded-3xl shadow-lg border border-blue-100"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by course, unit, topic, tutor, or description..."
                className="w-full bg-white bg-opacity-80 border border-blue-200 rounded-xl py-2 sm:py-3 px-4 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && suggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-white rounded-xl shadow-lg mt-2 max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm sm:text-base"
                      onClick={() => setSearchQuery(suggestion)}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Search Results Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-blue-50 to-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-900 mb-8 sm:mb-12"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Search Results
          </motion.h2>
          {filteredResults().length === 0 ? (
            <motion.div
              className="text-center py-12 sm:py-16 bg-white bg-opacity-90 backdrop-blur-lg rounded-3xl shadow-lg border border-blue-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <svg
                className="inline-block h-12 sm:h-16 w-12 sm:w-16 text-blue-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-lg sm:text-xl text-gray-900">No sessions found.</p>
              <p className="text-sm sm:text-base text-gray-700 mt-2">Try a different search term!</p>
            </motion.div>
          ) : (
            <>
              <section className="mb-8 sm:mb-10">
                <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-4">
                  Live Streams
                </h2>
                {filteredResults().filter((item) => item.type === "Live")
                  .length === 0 ? (
                  <div className="text-gray-500 text-sm sm:text-base">No live streams found.</div>
                ) : (
                  <LiveStream
                    liveStreams={filteredResults().filter(
                      (item) => item.type === "Live"
                    )}
                  />
                )}
              </section>
              <section className="mb-8 sm:mb-10">
                <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-4">
                  Scheduled Sessions
                </h2>
                {filteredResults().filter((item) => item.type === "Scheduled")
                  .length === 0 ? (
                  <div className="text-gray-500 text-sm sm:text-base">
                    No scheduled sessions found.
                  </div>
                ) : (
                  <ScheduledSessions
                    sessions={filteredResults().filter(
                      (item) => item.type === "Scheduled"
                    )}
                  />
                )}
              </section>
              <section className="mb-8 sm:mb-10">
                <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-4">
                  Uploaded Videos
                </h2>
                {filteredResults().filter((item) => item.type === "Uploaded")
                  .length === 0 ? (
                  <div className="text-gray-500 text-sm sm:text-base">No uploaded videos found.</div>
                ) : (
                  <UploadedVideos
                    videos={filteredResults().filter(
                      (item) => item.type === "Uploaded"
                    )}
                  />
                )}
              </section>
            </>
          )}
        </div>
      </section>
      <section>
        <TopPerformersSection />
      </section>
    </div>
  );
};

export default Sessions;
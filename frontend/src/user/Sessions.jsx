import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LiveStream from "./SessionsFolder/LiveStream";
import UploadedVideos from "./SessionsFolder/UploadedVideos";
import ScheduledSessions from "./SessionsFolder/Scheduled";
import Testimonial from "./Testimonial";
import { useNavigate } from "react-router-dom";

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
      date: "2025-07-10", // Changed to today for public live
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
      date: "2025-07-10", // Changed to yesterday
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
          return b.views + b.likes - (a.views + a.likes); // Sort uploaded videos by views + likes
        } else if (a.type === "Scheduled" && b.type === "Scheduled") {
          return b.skillmate - a.skillmate; // Sort scheduled sessions by skillmate
        } else if (a.type === "Live" && b.type === "Live") {
          return (
            b.skillmate + b.views + b.likes - (a.skillmate + a.views + a.likes)
          ); // Sort live streams by skillmate + views + likes
        } else {
          // Cross-type sorting: prioritize Live, then Scheduled, then Uploaded
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
          <div className="text-center md:text-left z-10">
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-blue-900 leading-tight"
              initial={{ y: -30 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.7 }}
            >
              Elevate Your Learning with{" "}
              <span className="text-blue-700">Live Session</span>
            </motion.h1>
            <motion.p
              className="text-2xl text-gray-900 max-w-3xl mx-auto mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              Personalized 1-on-1 sessions, live streams, and recorded videos
              with expert tutors to help you master any subject.
            </motion.p>
            <motion.div
              className="flex flex-wrap justify-center md:justify-start gap-6 mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.7 }}
            >
              <motion.button
                onClick={() => navigate("/profile/panel/live")}
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
                onClick={() => navigate("/profile/panel/videos")}
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
                title: "Discover Sessions",
                description:
                  "Explore live or recorded sessions by course, unit, or topic with our intuitive search.",
                icon: (
                  <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-full p-4">
                    <svg
                      className="w-10 h-10 text-blue-500"
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
                description: "Access any session for just 2 Golden Coins (₹4).",
                icon: (
                  <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-full p-4">
                    <svg
                      className="w-10 h-10 text-yellow-500"
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
                description:
                  "Each Golden Coin equals ₹2, making learning affordable and accessible.",
                icon: (
                  <div className="bg-gradient-to-r from-blue-100 to-blue-200 Rounded-full p-4">
                    <svg
                      className="w-10 h-10 text-blue-500"
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
                description:
                  "Join live sessions or watch videos instantly after unlocking.",
                icon: (
                  <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-full p-4">
                    <svg
                      className="w-10 h-10 text-blue-500"
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
                className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100 hover-scale"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="mb-6 flex justify-center">{item.icon}</div>
                <h3 className="text-xl font-bold text-blue-900 mb-3 text-center">
                  {item.title}
                </h3>
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
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by course, unit, topic, tutor, or description..."
                className="w-full bg-white bg-opacity-80 border border-blue-200 rounded-xl py-3 px-4 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && suggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-white rounded-xl shadow-lg mt-2 max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
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
      <section className="py-16 bg-gradient-to-b from-blue-50 to-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-blue-900 mb-12"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Search Results
          </motion.h2>
          {filteredResults().length === 0 ? (
            <motion.div
              className="text-center py-16 bg-white bg-opacity-90 backdrop-blur-lg rounded-3xl shadow-lg border border-blue-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <svg
                className="inline-block h-16 w-16 text-blue-400 mb-4"
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
              <p className="text-xl text-gray-900">No sessions found.</p>
              <p className="text-gray-700 mt-2">Try a different search term!</p>
            </motion.div>
          ) : (
            <>
              <section className="mb-10">
                <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-4">
                  Live Streams
                </h2>
                {filteredResults().filter((item) => item.type === "Live")
                  .length === 0 ? (
                  <div className="text-gray-500">No live streams found.</div>
                ) : (
                  <LiveStream
                    liveStreams={filteredResults().filter(
                      (item) => item.type === "Live"
                    )}
                  />
                )}
              </section>
              <section className="mb-10">
                <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-4">
                  Scheduled Sessions
                </h2>
                {filteredResults().filter((item) => item.type === "Scheduled")
                  .length === 0 ? (
                  <div className="text-gray-500">
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
              <section className="mb-10">
                <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-4">
                  Uploaded Videos
                </h2>
                {filteredResults().filter((item) => item.type === "Uploaded")
                  .length === 0 ? (
                  <div className="text-gray-500">No uploaded videos found.</div>
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
        <Testimonial />
      </section>
    </div>
  );
};

export default Sessions;

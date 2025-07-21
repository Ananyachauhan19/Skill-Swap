import React, { useEffect, useState, useRef, Suspense, lazy } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

// Lazy load VideoCard component
const VideoCard = lazy(() => import("./VideoCard"));

// --- BACKEND READY: Uncomment and use these when backend is ready ---
// import axios from 'axios';
// async function fetchWatchHistory(userId) {
//   const res = await axios.get(`/api/user/${userId}/history`, {
//     headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
//   });
//   return res.data;
// }
// async function deleteHistoryItem(userId, videoId) {
//   await axios.delete(`/api/user/${userId}/history/${videoId}`, {
//     headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
//   });
// }
// async function clearHistory(userId) {
//   await axios.delete(`/api/user/${userId}/history`, {
//     headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
//   });
// }

const History = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [renderKey, setRenderKey] = useState(0); // Force re-render
  const menuRefs = useRef({});
  const observer = useRef(null);

  // Static data for testing (remove when backend is ready)
  const staticHistoryData = [
    {
      videoId: "vid1",
      userId: "user123",
      title: "Cooking Tutorial: Pasta",
      thumbnail: "https://via.placeholder.com/360x202?text=Pasta",
      videoUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
      isLive: false,
      scheduledTime: null,
      watchDate: "2025-07-10T14:30:00Z",
      description: "Learn to make delicious pasta at home!",
      views: 1500,
      likes: 120,
      dislikes: 10,
    },
    {
      videoId: "vid2",
      userId: "user123",
      title: "Live Coding Session",
      thumbnail: "https://via.placeholder.com/360x202?text=Coding",
      videoUrl: null,
      isLive: true,
      scheduledTime: null,
      watchDate: "2025-07-10T10:00:00Z",
      description: "Join our live coding session on React!",
      views: 800,
      likes: 50,
      dislikes: 5,
    },
    {
      videoId: "vid3",
      userId: "user456",
      title: "Yoga for Beginners",
      thumbnail: "https://via.placeholder.com/360x202?text=Yoga",
      videoUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_2mb.mp4",
      isLive: false,
      scheduledTime: null,
      watchDate: "2025-07-09T18:45:00Z",
      description: "A beginner-friendly yoga session.",
      views: 2000,
      likes: 180,
      dislikes: 15,
    },
    {
      videoId: "vid4",
      userId: "user123",
      title: "Travel Vlog: Paris",
      thumbnail: "https://via.placeholder.com/360x202?text=Paris",
      videoUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_5mb.mp4",
      isLive: false,
      scheduledTime: null,
      watchDate: "2025-07-01T09:15:00Z",
      description: "Exploring the streets of Paris!",
      views: 3000,
      likes: 250,
      dislikes: 20,
    },
  ];

  // Load watch history
  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      setError(null);
      try {
        // --- BACKEND: Uncomment below ---
        // const data = await fetchWatchHistory(userId);
        // setHistory(data);
        // --- DEMO: Static data ---
        const filtered = userId ? staticHistoryData.filter(item => item.userId === userId) : staticHistoryData;
        setHistory(filtered);
      } catch (err) {
        setError("Failed to load watch history");
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [userId]);

  // Filter videos based on search
  useEffect(() => {
    let filtered = history;
    if (searchQuery) {
      filtered = history.filter(
        (video) =>
          video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (video.description &&
            video.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    setFilteredVideos(filtered);
  }, [searchQuery, history]);

  // Lazy loading observer
  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );
    const videoCards = document.querySelectorAll(".video-card");
    videoCards.forEach((card) => observer.current.observe(card));
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [filteredVideos]);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        openMenuId !== null &&
        menuRefs.current[openMenuId] &&
        !menuRefs.current[openMenuId].contains(event.target)
      ) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  // Handle remove action
  const handleRemove = (video) => {
    setHistory(prev =>
      prev.filter(item => !(item.videoId === video.videoId && item.watchDate === video.watchDate))
    );
    toast.info("Video removed from history (simulated)");
  };

  // Handle report action
  const handleReport = (video) => {
    navigate('/report', { state: { video } });
  };

  // Handle clear history
  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear all watch history?")) {
      setHistory([]);
      setFilteredVideos([]);
      setRenderKey(prev => prev + 1); // Force re-render
      toast.info("Watch history cleared");
    }
  };

  // Group filtered videos by date
  const groupedHistory = filteredVideos.reduce((acc, item) => {
    const date = format(new Date(item.watchDate), "MMMM d, yyyy");
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedHistory).sort((a, b) => {
    return new Date(b) - new Date(a);
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, when: "beforeChildren", staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  const searchBarVariants = {
    hidden: { width: 0, opacity: 0, x: -20 },
    visible: { width: "auto", opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen w-full px-3 sm:px-4 md:px-6 font-[Inter] overflow-hidden"
      key={renderKey}
    >
      <ToastContainer position="top-center" autoClose={2000} />
      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-black opacity-70 font-medium"
        >
          Loading history...
        </motion.div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-500 text-center py-8 font-medium"
        >
          {error}
        </motion.div>
      ) : (
        <>
          <header className="py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <motion.h2
                variants={itemVariants}
                className="text-2xl sm:text-3xl font-extrabold text-blue-900 tracking-tight"
              >
                Watch History
              </motion.h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="text-blue-900 text-2xl"
                onClick={() => setSearchOpen(!searchOpen)}
              >
                <FiSearch />
              </motion.button>
              <AnimatePresence>
                {searchOpen && (
                  <motion.div
                    variants={searchBarVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="overflow-hidden"
                  >
                    <input
                      type="text"
                      placeholder="Search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-b-2 border-blue-900 text-blue-900 placeholder-blue-900 focus:outline-none px-2 py-1"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {filteredVideos.length > 0 && (
              <motion.div variants={itemVariants} className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto bg-blue-800 text-white px-4 py-1.5 rounded-md font-semibold hover:bg-blue-900 transition-all duration-300 text-sm sm:text-base"
                  onClick={handleClearHistory}
                >
                  Clear History
                </motion.button>
              </motion.div>
            )}
          </header>
          <Suspense
            fallback={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-black opacity-70 font-medium"
              >
                Loading history cards...
              </motion.div>
            }
          >
            {filteredVideos.length === 0 ? (
              <motion.div
                variants={itemVariants}
                className="text-center text-black opacity-70 mt-12 text-lg font-medium"
              >
                No watch history available.
              </motion.div>
            ) : (
              <section className="space-y-6">
                {sortedDates.map((date, dateIdx) => (
                  <motion.div key={dateIdx} variants={itemVariants}>
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">{date}</h3>
                    <hr className="mb-4 border-blue-900" />
                    <div className="space-y-6">
                      {groupedHistory[date].map((item) => (
                        <motion.article
                          key={item.videoId}
                          variants={itemVariants}
                          className="video-card w-full"
                        >
                          <VideoCard
                            video={{
                              id: item.videoId,
                              title: item.title,
                              thumbnail: item.thumbnail,
                              videoUrl: item.videoUrl,
                              isLive: item.isLive,
                              scheduledTime: item.scheduledTime,
                              userId: item.userId,
                              uploadDate: item.watchDate,
                              views: item.views || 0,
                              likes: item.likes || 0,
                              dislikes: item.dislikes || 0,
                              description: item.description || "",
                            }}
                            menuOptions={['remove', 'report']}
                            onRemove={() => handleRemove(item)}
                            onReport={() => handleReport(item)}
                            openMenu={openMenuId === item.videoId}
                            setOpenMenu={(open) => setOpenMenuId(open ? item.videoId : null)}
                            menuRef={(el) => (menuRefs.current[item.videoId] = el)}
                            userId={userId}
                          />
                        </motion.article>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </section>
            )}
          </Suspense>
        </>
      )}
    </motion.div>
  );
};

export default History;
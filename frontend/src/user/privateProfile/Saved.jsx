import React, { useEffect, useState, useRef, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";

// Lazy load VideoCard component
const VideoCard = lazy(() => import("./VideoCard"));

const Saved = () => {
  const [saved, setSaved] = useState([]);
  const [filteredSaved, setFilteredSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenuIdx, setOpenMenuIdx] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const observer = useRef(null);
  const menuRefs = useRef([]);
  const navigate = useNavigate();

  // Load saved videos from localStorage or static data
  useEffect(() => {
    setTimeout(() => {
      try {
        // TODO: Replace with backend API call when saved/bookmarked videos feature is implemented
        // Backend should have a User model field like savedVideos: [{ type: ObjectId, ref: 'Video' }]
        // API endpoint: GET /api/videos/saved
        // For now, returning empty array to remove static data
        const savedVideos = JSON.parse(localStorage.getItem("savedVideos") || "[]");
        setSaved(savedVideos);
        setFilteredSaved(savedVideos);
        setLoading(false);
      } catch (err) {
        setError("Failed to load saved videos");
        setLoading(false);
      }
    }, 0);
  }, []);

  // Filter saved videos based on search query
  useEffect(() => {
    let filtered = saved;
    if (searchQuery) {
      filtered = saved.filter(
        (video) =>
          video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (video.description &&
            video.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    setFilteredSaved(filtered);
  }, [searchQuery, saved]);

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
  }, [filteredSaved]);
  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        openMenuIdx !== null &&
        menuRefs.current[openMenuIdx] &&
        !menuRefs.current[openMenuIdx].contains(event.target)
      ) {
        setOpenMenuIdx(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuIdx]);

  // Menu action handlers
  const handleRemove = (idx) => {
    const updated = saved.filter((_, i) => i !== idx);
    setSaved(updated);
    setFilteredSaved(
      searchQuery
        ? updated.filter(
            (video) =>
              video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (video.description &&
                video.description.toLowerCase().includes(searchQuery.toLowerCase()))
          )
        : updated
    );
    localStorage.setItem("savedVideos", JSON.stringify(updated));
  };

  const handleRemoveAll = () => {
    if (saved.length === 0) return;
    setSaved([]);
    setFilteredSaved([]);
    localStorage.setItem("savedVideos", JSON.stringify([]));
  };

  const handleShare = (video) => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/watch/${video.id}`;
    navigator.clipboard.writeText(shareUrl);
    alert(`Link copied to clipboard: ${shareUrl}`);
  };

  const handleReport = (video) => {
    navigate("/report", { state: { video } });
  };

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
      className="min-h-screen max-h-screen w-full px-3 sm:px-4 md:px-6 font-[Inter] overflow-hidden"
    >
      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-black opacity-70 font-medium"
        >
          Loading saved videos...
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
              <motion.h1
                variants={itemVariants}
                className="text-2xl sm:text-3xl font-extrabold text-blue-900 tracking-tight"
              >
                Saved Videos
              </motion.h1>
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
            {filteredSaved.length > 0 && (
              <motion.div variants={itemVariants} className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto bg-blue-800 text-white px-4 py-1.5 rounded-md font-semibold hover:bg-blue-900 transition-all duration-300 text-sm sm:text-base"
                  onClick={handleRemoveAll}
                >
                  Remove All
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
                Loading video cards...
              </motion.div>
            }
          >
            {filteredSaved.length === 0 ? (
              <motion.div
                variants={itemVariants}
                className="text-center text-black opacity-70 mt-10 text-lg font-medium"
              >
                No saved videos.
              </motion.div>
            ) : (
              <section className="space-y-4 overflow-y-auto">
                {filteredSaved.map((video, idx) => (
                  <motion.article
                    key={video._id || video.id || idx}
                    variants={itemVariants}
                    className="video-card"
                  >
                    <VideoCard
                      video={{
                        ...video,
                        userId: typeof video.userId === 'object' ? (video.userId?.username || video.userId?.firstName || 'Unknown') : (video.userId || 'Unknown'),
                        thumbnail: video.thumbnailUrl || video.thumbnail,
                        likes: Array.isArray(video.likes) ? video.likes.length : (video.likes || 0),
                        views: video.views || 0,
                        uploadDate: `Saved: ${video.uploadDate || new Date(video.createdAt).toLocaleString()}`,
                        lastEdited: `Last Edited: ${video.lastEdited || new Date(video.updatedAt).toLocaleString()}`,
                      }}
                      menuOptions={["report", "remove", "share"]}
                      onReport={() => handleReport(video)}
                      onRemove={() => handleRemove(idx)}
                      onShare={() => handleShare(video)}
                      openMenu={openMenuIdx === idx}
                      setOpenMenu={(open) => setOpenMenuIdx(open ? idx : null)}
                      menuRef={(el) => (menuRefs.current[idx] = el)}
                    />
                  </motion.article>
                ))}
              </section>
            )}
          </Suspense>
        </>
      )}
    </motion.div>
  );
};

export default Saved;
import React, { useEffect, useState, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { lazy } from "react";
import { FiSearch } from "react-icons/fi";
import { BACKEND_URL } from '../../config.js';

// Lazy load VideoCard component
const VideoCard = lazy(() => import("./VideoCard"));

const Archive = () => {
  const [archived, setArchived] = useState([]);
  const [filteredArchived, setFilteredArchived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenuIdx, setOpenMenuIdx] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRefs = useRef([]);
  const observer = useRef(null);

  // Backend API functions
  const fetchArchived = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/videos?status=archived`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error("Failed to fetch archived videos");
      const data = await response.json();
      return data.videos || [];
    } catch (err) {
      console.error('Fetch archived error:', err);
      return [];
    }
  };

  const unarchiveVideo = async (id) => {
    const formData = new FormData();
    formData.append('isArchived', false);

    try {
      const response = await fetch(`${BACKEND_URL}/api/videos/${id}`, {
        method: "PUT",
        credentials: 'include',
        body: formData
      });
      if (!response.ok) throw new Error("Failed to unarchive video");
      return await response.json();
    } catch (err) {
      console.error('Unarchive error:', err);
      throw err;
    }
  };

  const deleteVideo = async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/videos/${id}`, {
        method: "DELETE",
        credentials: 'include',
      });
      if (!response.ok) throw new Error("Failed to delete video");
      return await response.json();
    } catch (err) {
      console.error('Delete video error:', err);
      throw err;
    }
  };

  // Load archived videos from backend
  useEffect(() => {
    async function loadArchived() {
      setLoading(true);
      setError(null);
      try {
        const fetchedArchived = await fetchArchived();
        setArchived(fetchedArchived);
        setFilteredArchived(fetchedArchived);
      } catch (err) {
        setError("Failed to load archived videos");
      } finally {
        setLoading(false);
      }
    }
    loadArchived();
  }, []);

  // Filter videos based on search query
  useEffect(() => {
    const filtered = archived.filter(
      (video) =>
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredArchived(filtered);
  }, [searchQuery, archived]);

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
  }, [filteredArchived]);

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

  // Unarchive: move video back to active videos
  const handleUnarchive = async (video) => {
    try {
      await unarchiveVideo(video._id);
      const updated = archived.filter((v) => v._id !== video._id);
      setArchived(updated);
      setFilteredArchived(updated);
    } catch (err) {
      alert('Failed to unarchive video');
    }
  };

  // Delete from archive
  const handleDelete = async (video) => {
    try {
      await deleteVideo(video._id);
      const updated = archived.filter((v) => v._id !== video._id);
      setArchived(updated);
      setFilteredArchived(updated);
    } catch (err) {
      alert('Failed to delete video');
    }
  };

  // Unarchive all: move all videos back to active
  const handleUnarchiveAll = async () => {
    if (archived.length === 0) return;
    if (window.confirm('Are you sure you want to unarchive all videos?')) {
      try {
        await Promise.all(archived.map(video => unarchiveVideo(video._id)));
        setArchived([]);
        setFilteredArchived([]);
      } catch (err) {
        alert('Failed to unarchive all videos');
      }
    }
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
          Loading archived videos...
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
            <motion.h1
              variants={itemVariants}
              className="text-2xl sm:text-3xl font-extrabold text-blue-900 tracking-tight"
            >
              Archived Videos
            </motion.h1>
            <div className="flex items-center space-x-2">
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
            {filteredArchived.length > 0 && (
              <motion.div
                variants={itemVariants}
                className="flex justify-end mt-2"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto bg-blue-800 text-white px-4 py-1.5 rounded-md font-semibold hover:bg-blue-900 transition-all duration-300 text-sm sm:text-base"
                  onClick={handleUnarchiveAll}
                >
                  Unarchive All
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
            {filteredArchived.length === 0 ? (
              <motion.div
                variants={itemVariants}
                className="text-center text-black opacity-70 mt-10 text-lg font-medium"
              >
                No archived videos.
              </motion.div>
            ) : (
              <section className="space-y-4 overflow-y-auto">
                {filteredArchived.map((video, idx) => (
                  <motion.article
                    key={video._id || idx}
                    variants={itemVariants}
                    className="video-card"
                  >
                    <VideoCard
                      video={{
                        ...video,
                        userId: typeof video.userId === 'object' ? (video.userId?.username || video.userId?.firstName || 'Unknown') : video.userId,
                        thumbnail: video.thumbnailUrl,
                        likes: video.likes?.length || 0,
                        views: video.views || 0,
                        uploadDate: `Archived: ${new Date(video.createdAt).toLocaleString()}`,
                        lastEdited: `Last Edited: ${new Date(video.updatedAt).toLocaleString()}`,
                      }}
                      onDelete={() => handleDelete(video)}
                      onUnArchive={() => handleUnarchive(video)}
                      menuOptions={["unarchive", "delete"]}
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

export default Archive;
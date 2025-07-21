import React, { useEffect, useState, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { lazy } from "react";
import { FiSearch } from "react-icons/fi"; // Import search icon from react-icons

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

  // Load archived videos from localStorage or static data
  useEffect(() => {
    setTimeout(() => {
      try {
        const savedArchived = JSON.parse(
          localStorage.getItem("archivedVideos") || "[]"
        );
        const initialArchived =
          savedArchived.length > 0
            ? savedArchived
            : [
                {
                  id: "1",
                  title: "Archived React Session",
                  description: "This session is archived.",
                  thumbnail: "https://placehold.co/320x180?text=Archived+1",
                  videoUrl: "",
                  uploadDate: new Date().toLocaleString(),
                  lastEdited: new Date().toLocaleString(),
                  userId: "user123",
                  isArchived: true,
                },
                {
                  id: "2",
                  title: "Archived Node.js Session",
                  description: "This session is archived.",
                  thumbnail: "https://placehold.co/320x180?text=Archived+2",
                  videoUrl: "",
                  uploadDate: new Date().toLocaleString(),
                  lastEdited: new Date().toLocaleString(),
                  userId: "user456",
                  isArchived: true,
                },
              ];
        setArchived(initialArchived);
        setFilteredArchived(initialArchived);
        setLoading(false);
      } catch (err) {
        setError("Failed to load archived videos");
        setLoading(false);
      }
    }, 0);
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

  // Unarchive: move video back to uploadedVideos
  const handleUnarchive = (idx) => {
    const video = archived[idx];
    const updatedVideo = {
      ...video,
      isArchived: false,
      lastEdited: new Date().toLocaleString(),
    };
    const updated = archived.filter((_, i) => i !== idx);
    setArchived(updated);
    setFilteredArchived(updated);
    localStorage.setItem("archivedVideos", JSON.stringify(updated));
    const videos = JSON.parse(localStorage.getItem("uploadedVideos") || "[]");
    videos.unshift(updatedVideo);
    localStorage.setItem("uploadedVideos", JSON.stringify(videos));
  };

  // Delete from archive
  const handleDelete = (idx) => {
    const updated = archived.filter((_, i) => i !== idx);
    setArchived(updated);
    setFilteredArchived(updated);
    localStorage.setItem("archivedVideos", JSON.stringify(updated));
  };

  // Unarchive all: move all videos back to uploadedVideos
  const handleUnarchiveAll = () => {
    if (archived.length === 0) return;
    const updatedVideos = archived.map((video) => ({
      ...video,
      isArchived: false,
      lastEdited: new Date().toLocaleString(),
    }));
    setArchived([]);
    setFilteredArchived([]);
    localStorage.setItem("archivedVideos", JSON.stringify([]));
    const videos = JSON.parse(localStorage.getItem("uploadedVideos") || "[]");
    localStorage.setItem(
      "uploadedVideos",
      JSON.stringify([...updatedVideos, ...videos])
    );
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
                    key={video.id || idx}
                    variants={itemVariants}
                    className="video-card"
                  >
                    <VideoCard
                      video={{
                        ...video,
                        uploadDate: `Archived: ${video.uploadDate}`,
                        lastEdited: `Last Edited: ${video.lastEdited}`,
                      }}
                      onDelete={() => handleDelete(idx)}
                      onUnArchive={() => handleUnarchive(idx)}
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
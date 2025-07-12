import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
<<<<<<< HEAD
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
||||||| ecc8116
import { useNavigate } from "react-router-dom";
=======
import { useNavigate, useLocation } from "react-router-dom";
import { BACKEND_URL } from '../../config.js';
>>>>>>> 4fb8de77c48f5a30cdd7b93ce9ccb3c94785aeb5
import LiveSetup from "./LiveSetup";
import SearchBar from "./SearchBar";

// Lazy load VideoCard component
const VideoCard = lazy(() => import("./VideoCard"));

// Static data for live and scheduled sessions (to be replaced by backend calls)
const staticVideos = [
  {
    id: "1",
    title: "React Live Coding",
    description: "Live coding session on React",
    thumbnail: "https://placehold.co/320x180?text=Live+1",
    videoUrl: null,
    isLive: true,
    scheduledTime: new Date(Date.now() + 3600 * 1000).toISOString(),
    uploadDate: new Date().toLocaleString(),
    host: "Ananya Sharma",
    userId: "user123",
    viewers: 120,
    skillmates: 10,
    views: 0,
    likes: 0,
    dislikes: 0,
    isDraft: false,
    isRecorded: false,
  },
  {
    id: "2",
    title: "Node.js Q&A",
    description: "Q&A session on Node.js",
    thumbnail: "https://placehold.co/320x180?text=Live+2",
    videoUrl: null,
    isLive: false,
    scheduledTime: new Date(Date.now() + 7200 * 1000).toISOString(),
    uploadDate: new Date().toLocaleString(),
    host: "Rahul Verma",
    userId: "user123",
    viewers: 80,
    skillmates: 8,
    views: 0,
    likes: 0,
    dislikes: 0,
    isDraft: false,
    isRecorded: false,
  },
];

const Live = () => {
  const [showSetup, setShowSetup] = useState(false);
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenuIdx, setOpenMenuIdx] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState({});
  const menuRefs = useRef([]);
  const observer = useRef(null);
  const navigate = useNavigate();

<<<<<<< HEAD
  // Load videos from localStorage or static data
||||||| ecc8116
  // Backend API functions (commented for future implementation)
  /*
  const fetchLiveSessions = async () => {
    try {
      const res = await fetch("/api/live", {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error("Failed to fetch live sessions");
      const data = await res.json();
      return data;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const saveVideo = async (videoData) => {
    const formData = new FormData();
    Object.entries(videoData).forEach(([key, value]) => {
      formData.append(key, value);
    });
    try {
      const res = await fetch("/api/videos/upload", {
        method: "POST",
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      if (!res.ok) throw new Error("Failed to save video");
      return await res.json();
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const updateLiveSession = async (id, videoData) => {
    const formData = new FormData();
    Object.entries(videoData).forEach(([key, value]) => {
      formData.append(key, value);
    });
    try {
      const res = await fetch(`/api/live/${id}`, {
        method: "PUT",
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      if (!res.ok) throw new Error("Failed to update live session");
      return await res.json();
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const deleteLiveSession = async (id) => {
    try {
      const res = await fetch(`/api/live/${id}`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error("Failed to delete live session");
      return await res.json();
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const archiveLiveSession = async (id) => {
    try {
      const res = await fetch(`/api/live/${id}/archive`, {
        method: "POST",
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error("Failed to archive live session");
      return await res.json();
    } catch (err) {
      throw new Error(err.message);
    }
  };
  
  */

  // Load videos from localStorage or static data
=======
  // Backend API functions
  const fetchLiveSessions = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/live`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!res.ok) {
        throw new Error("Failed to fetch live sessions");
      }
      
      const data = await res.json();
      return data.liveSessions || data || [];
    } catch (err) {
      console.error('Error fetching live sessions:', err);
      throw new Error(err.message);
    }
  };

  const saveVideo = async (videoData) => {
    const formData = new FormData();
    Object.entries(videoData).forEach(([key, value]) => {
      formData.append(key, value);
    });
    try {
      const res = await fetch(`${BACKEND_URL}/api/videos/upload`, {
        method: "POST",
        credentials: 'include',
        body: formData
      });
      
      if (!res.ok) {
        throw new Error("Failed to save video");
      }
      
      return await res.json();
    } catch (err) {
      console.error('Error saving video:', err);
      throw new Error(err.message);
    }
  };

  const updateLiveSession = async (id, videoData) => {
    const formData = new FormData();
    Object.entries(videoData).forEach(([key, value]) => {
      formData.append(key, value);
    });
    try {
      const res = await fetch(`${BACKEND_URL}/api/live/${id}`, {
        method: "PUT",
        credentials: 'include',
        body: formData
      });
      
      if (!res.ok) {
        throw new Error("Failed to update live session");
      }
      
      return await res.json();
    } catch (err) {
      console.error('Error updating live session:', err);
      throw new Error(err.message);
    }
  };

  const deleteLiveSession = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/live/${id}`, {
        method: "DELETE",
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!res.ok) {
        throw new Error("Failed to delete live session");
      }
      
      return await res.json();
    } catch (err) {
      console.error('Error deleting live session:', err);
      throw new Error(err.message);
    }
  };

  const archiveLiveSession = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/live/${id}/archive`, {
        method: "POST",
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!res.ok) {
        throw new Error("Failed to archive live session");
      }
      
      return await res.json();
    } catch (err) {
      console.error('Error archiving live session:', err);
      throw new Error(err.message);
    }
  };
  
  // Load live sessions from backend
>>>>>>> 4fb8de77c48f5a30cdd7b93ce9ccb3c94785aeb5
  useEffect(() => {
    const loadLiveSessions = async () => {
      setLoading(true);
      try {
        const sessionsData = await fetchLiveSessions();
        setVideos(sessionsData);
        setFilteredVideos(sessionsData);
      } catch (err) {
        setError("Failed to load live sessions");
        console.error('Error loading live sessions:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadLiveSessions();
  }, []);

  // Lazy loading observer for video cards
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
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [filteredVideos]);

  // Filter videos based on search
  useEffect(() => {
    let filtered = videos;
    if (searchQuery) {
      filtered = filtered.filter(
        (video) =>
          video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (video.description &&
            video.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    setFilteredVideos(filtered);
  }, [searchQuery, videos]);

  // Live updation of views, like, dislike
  useEffect(() => {
    const liveVideos = videos.filter((v) => v.isLive);
    const intervals = liveVideos.map((video) => {
      const interval = setInterval(() => {
        setVideos((prev) => {
          const updated = [...prev];
          const idx = updated.findIndex((v) => v.id === video.id);
          if (idx !== -1 && updated[idx].isLive) {
            updated[idx] = {
              ...updated[idx],
              viewers: Math.max(0, updated[idx].viewers + Math.floor(Math.random() * 11 - 5)),
              likes: Math.max(0, updated[idx].likes + Math.floor(Math.random() * 3 - 1)),
              dislikes: Math.max(0, updated[idx].dislikes + Math.floor(Math.random() * 2 - 1)),
            };
          }
          localStorage.setItem("liveVideos", JSON.stringify(updated));
          return updated;
        });
        setFilteredVideos((prev) => {
          let filtered = [...prev];
          const idx = filtered.findIndex((v) => v.id === video.id);
          if (idx !== -1 && filtered[idx].isLive) {
            filtered[idx] = {
              ...filtered[idx],
              viewers: Math.max(0, filtered[idx].viewers + Math.floor(Math.random() * 11 - 5)),
              likes: Math.max(0, filtered[idx].likes + Math.floor(Math.random() * 3 - 1)),
              dislikes: Math.max(0, filtered[idx].dislikes + Math.floor(Math.random() * 2 - 1)),
            };
          }
          if (searchQuery) {
            filtered = filtered.filter(
              (v) =>
                v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (v.description && v.description.toLowerCase().includes(searchQuery.toLowerCase()))
            );
          }
          return filtered;
        });
      }, 10000);
      return { id: video.id, interval };
    });

    return () => intervals.forEach(({ interval }) => clearInterval(interval));
  }, [videos, searchQuery]);

  // Simulate stream buffering for live sessions
  useEffect(() => {
    const liveVideos = videos.filter((v) => v.isLive);
    liveVideos.forEach((video) => {
      if (!streamBuffer[video.id]) {
        setStreamBuffer((prev) => ({
          ...prev,
          [video.id]: { chunks: [], lastUpdated: Date.now() },
        }));
        const interval = setInterval(() => {
          setStreamBuffer((prev) => ({
            ...prev,
            [video.id]: {
              ...prev[video.id],
              chunks: [
                ...(prev[video.id]?.chunks || []),
                `chunk-${Date.now()}`,
              ],
            },
          }));
        }, 5000);
        return () => clearInterval(interval);
      }
    });
  }, [videos, streamBuffer]);

  // End live session and save as video
  const endLive = (idx) => {
    const video = videos[idx];
    if (!video.isLive) return;

    const processedVideo = {
      ...video,
      isLive: false,
      isRecorded: true,
      videoUrl: `https://sample-videos.com/processed/${video.id}.mp4`,
      viewers: 0,
      views: video.viewers || 0,
      scheduledTime: null
    };

    setVideos((prev) => {
      const updated = [...prev];
      updated[idx] = processedVideo;
      localStorage.setItem("liveVideos", JSON.stringify(updated));
      return updated;
    });

    setFilteredVideos((prev) => {
      let filtered = [...prev];
      filtered = filtered.map((v, i) => (i === idx ? processedVideo : v));
      if (searchQuery) {
        filtered = filtered.filter(
          (v) =>
            v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (v.description &&
              v.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      return filtered;
    });

    setStreamBuffer((prev) => {
      const newBuffer = { ...prev };
      delete newBuffer[video.id];
      return newBuffer;
    });
  };

  const handleLiveSubmit = (video) => {
    if (editData && typeof editData.idx === "number") {
      setVideos((prev) => {
        const updated = [...prev];
        updated[editData.idx] = { ...video, id: prev[editData.idx].id };
        localStorage.setItem("liveVideos", JSON.stringify(updated));
        return updated;
      });
      setFilteredVideos((prev) => {
        let filtered = [...prev];
        filtered = filtered.map((v, i) =>
          i === editData.idx ? { ...video, id: prev[i].id } : v
        );
        if (searchQuery) {
          filtered = filtered.filter(
            (v) =>
              v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (v.description &&
                v.description.toLowerCase().includes(searchQuery.toLowerCase()))
          );
        }
        return filtered;
      });
      setEditData(null);
    } else {
      const newVideo = { ...video, id: Date.now().toString() };
      setVideos((prev) => {
        const updated = [newVideo, ...prev];
        localStorage.setItem("liveVideos", JSON.stringify(updated));
        return updated;
      });
      setFilteredVideos((prev) => {
        let filtered = [newVideo, ...prev];
        if (searchQuery) {
          filtered = filtered.filter(
            (v) =>
              v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (v.description &&
                v.description.toLowerCase().includes(searchQuery.toLowerCase()))
          );
        }
        return filtered;
      });
    }
    setShowSetup(false);
  };

  const handleDelete = (idx) => {
    setVideos((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      localStorage.setItem("liveVideos", JSON.stringify(updated));
      return updated;
    });
    setFilteredVideos((prev) => {
      let filtered = prev.filter((_, i) => i !== idx);
      if (searchQuery) {
        filtered = filtered.filter(
          (v) =>
            v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (v.description &&
              v.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      return filtered;
    });
  };

  const handleArchive = (idx) => {
    const video = videos[idx];
    setVideos((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      localStorage.setItem("liveVideos", JSON.stringify(updated));
      return updated;
    });
    setFilteredVideos((prev) => {
      let filtered = prev.filter((_, i) => i !== idx);
      if (searchQuery) {
        filtered = filtered.filter(
          (v) =>
            v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (v.description &&
              v.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      return filtered;
    });
    const archive = JSON.parse(localStorage.getItem("archivedVideos") || "[]");
    archive.unshift({ ...video, isArchived: true });
    localStorage.setItem("archivedVideos", JSON.stringify(archive));
  };

  const handleSave = (idx) => {
    const video = videos[idx];
    const saved = JSON.parse(localStorage.getItem("savedVideos") || "[]");
    if (!saved.some((v) => v.id === video.id)) {
      saved.unshift(video);
      localStorage.setItem("savedVideos", JSON.stringify(saved));
    }
  };

  const handleShare = (idx) => {
    const video = videos[idx];
    navigator.clipboard.writeText(window.location.origin + "/live/" + video.id);
    alert("Live session link copied to clipboard!");
  };

  const handleEdit = (video, idx) => {
    setEditData({ ...video, idx });
    setShowSetup(true);
    setVideos((prev) =>
      prev.map((v, i) =>
        i === idx ? { ...v, isEditing: true } : { ...v, isEditing: false }
      )
    );
  };

  const closeSetup = () => {
    setShowSetup(false);
    setEditData(null);
    setVideos((prev) => prev.map((v) => ({ ...v, isEditing: false })));
  };

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

  // Calendar view logic
  const getScheduledDates = () => {
    const dates = {};
    videos.forEach((video) => {
      if (video.scheduledTime && !video.isLive) {
        const date = new Date(video.scheduledTime).toLocaleDateString();
        if (!dates[date]) dates[date] = [];
        dates[date].push(video);
      }
    });
    return dates;
  };

  const scheduledDates = getScheduledDates();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, when: "beforeChildren", staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen max-h-screen w-full bg-[#E6F0FA] px-3 sm:px-4 md:px-6 font-[Inter] overflow-hidden"
    >
      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-black opacity-70 font-medium bg-[#E6F0FA]"
        >
          Loading live sessions...
        </motion.div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-500 text-center py-8 font-medium bg-[#E6F0FA]"
        >
          {error}
        </motion.div>
      ) : (
        <>
          {!showSetup ? (
            <>
              <header className="py-3">
                <motion.h1
                  variants={itemVariants}
                  className="text-2xl sm:text-3xl font-extrabold text-blue-900 tracking-tight"
                >
                  Live & Scheduled Sessions
                </motion.h1>
                <motion.div
                  variants={itemVariants}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-2"
                >
                  <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "6px 6px 12px #d1d9e6, -6px -6px 12px #f5f7ff" }}
                      whileTap={{ scale: 0.95, boxShadow: "inset 2px 2px 4px #d1d9e6" }}
                      className="w-full sm:w-auto bg-blue-800 text-white px-4 py-1.5 rounded-md font-semibold shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#f5f7ff] hover:bg-blue-900 transition-all duration-300 text-sm sm:text-base"
                      onClick={() => setShowCalendar(!showCalendar)}
                    >
                      {showCalendar ? "List View" : "Calendar View"}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "6px 6px 12px #d1d9e6, -6px -6px 12px #f5f7ff" }}
                      whileTap={{ scale: 0.95, boxShadow: "inset 2px 2px 4px #d1d9e6" }}
                      className="w-full sm:w-auto bg-blue-800 text-white px-4 py-1.5 rounded-md font-semibold shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#f5f7ff] hover:bg-blue-900 transition-all duration-300 text-sm sm:text-base"
                      onClick={() => setShowSetup(true)}
                    >
                      + Go Live / Schedule Live Session
                    </motion.button>
                  </div>
                </motion.div>
              </header>
              <Suspense
                fallback={
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 text-black opacity-70 font-medium bg-[#E6F0FA]"
                  >
                    Loading video cards...
                  </motion.div>
                }
              >
                <div className="space-y-4">
                  {showCalendar ? (
                    <div className="calendar-view">
                      <motion.h2
                        variants={itemVariants}
                        className="text-xl sm:text-2xl font-bold text-blue-900 mb-3"
                      >
                        Scheduled Sessions
                      </motion.h2>
                      {Object.keys(scheduledDates).length === 0 ? (
                        <motion.div
                          variants={itemVariants}
                          className="text-center text-black opacity-70 text-lg font-medium"
                        >
                          No scheduled sessions.
                        </motion.div>
                      ) : (
                        Object.entries(scheduledDates).map(([date, sessions]) => (
                          <motion.div key={date} variants={itemVariants} className="mb-4">
                            <h3 className="text-lg sm:text-xl font-semibold text-blue-900">{date}</h3>
                            <div className="space-y-3 mt-2">
                              {sessions.map((video, idx) => (
                                <motion.div
                                  key={idx}
                                  variants={itemVariants}
                                  className="w-full video-card"
                                >
                                  <VideoCard
                                    video={video}
                                    onEdit={() =>
                                      handleEdit(
                                        video,
                                        videos.findIndex((v) => v.id === video.id)
                                      )
                                    }
                                    onDelete={() =>
                                      handleDelete(
                                        videos.findIndex((v) => v.id === video.id)
                                      )
                                    }
                                    onShare={() =>
                                      handleShare(
                                        videos.findIndex((v) => v.id === video.id)
                                      )
                                    }
                                    menuOptions={["edit", "share", "delete"]}
                                    openMenu={
                                      openMenuIdx ===
                                      videos.findIndex((v) => v.id === video.id)
                                    }
                                    setOpenMenu={(open) =>
                                      setOpenMenuIdx(
                                        open
                                          ? videos.findIndex((v) => v.id === video.id)
                                          : null
                                      )
                                    }
                                    menuRef={(el) =>
                                      (menuRefs.current[
                                        videos.findIndex((v) => v.id === video.id)
                                      ] = el)
                                    }
                                  />
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  ) : (
                    <>
                      {filteredVideos.length === 0 ? (
                        <motion.div
                          variants={itemVariants}
                          className="text-center text-black opacity-70 mt-10 text-lg font-medium"
                        >
                          No live or scheduled sessions yet.
                        </motion.div>
                      ) : (
                        filteredVideos.map((video, idx) => (
                          <motion.div
                            key={idx}
                            variants={itemVariants}
                            className="w-full video-card"
                          >
                            <VideoCard
                              video={video}
                              onEdit={() => handleEdit(video, idx)}
                              onDelete={() => handleDelete(idx)}
                              onArchive={() => handleArchive(idx)}
                              onSave={() => handleSave(idx)}
                              onShare={() => handleShare(idx)}
                              onEndLive={() => endLive(idx)}
                              menuOptions={
                                video.scheduledTime && !video.isLive
                                  ? ["edit", "share", "delete"]
                                  : video.isLive
                                  ? ["share"]
                                  : ["edit", "archive", "save", "share", "delete"]
                              }
                              openMenu={openMenuIdx === idx}
                              setOpenMenu={(open) =>
                                setOpenMenuIdx(open ? idx : null)
                              }
                              menuRef={(el) => (menuRefs.current[idx] = el)}
                            />
                            {video.isLive && (
                              <motion.button
                                whileHover={{ scale: 1.05, boxShadow: "6px 6px 12px #d1d9e6, -6px -6px 12px #f5f7ff" }}
                                whileTap={{ scale: 0.95, boxShadow: "inset 2px 2px 4px #d1d9e6" }}
                                className="mt-3 w-full sm:w-auto bg-blue-800 text-white px-4 py-1.5 rounded-md font-semibold shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#f5f7ff] hover:bg-blue-900 transition-all duration-300 text-sm sm:text-base"
                                onClick={() => endLive(idx)}
                              >
                                End Live
                              </motion.button>
                            )}
                          </motion.div>
                        ))
                      )}
                    </>
                  )}
                </div>
              </Suspense>
            </>
          ) : (
            <LiveSetup
              onSubmit={handleLiveSubmit}
              editData={editData}
              onClose={closeSetup}
              className="w-full h-[calc(100vh-4rem)] bg-[#E6F0FA] p-3 sm:p-4 flex flex-col justify-start overflow-hidden rounded-lg"
            />
          )}
        </>
      )}
    </motion.div>
  );
};

export default Live;
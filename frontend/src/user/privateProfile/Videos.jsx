
import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BACKEND_URL } from '../../config.js';
import SearchBar from "./SearchBar";

// Lazy load VideoCard component
const VideoCard = lazy(() => import("./VideoCard"));

// Utility function to format date as relative time
const getRelativeTime = (dateStr) => {
  if (!dateStr) return "";
  let date;
  try {
    date = new Date(dateStr);
    if (isNaN(date.getTime())) throw new Error("Invalid date");
  } catch {
    date = new Date();
  }
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

// Static video data (fallback for API failure)
const staticVideos = [
  {
    id: "1",
    title: "Sample Video 1",
    description: "This is a sample video description",
    thumbnail: "https://via.placeholder.com/320x180",
    videoUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
    uploadDate: new Date(Date.now() - 86400000).toLocaleString(),
    userId: "user123",
    skillmates: 10,
    views: 100,
    likes: 5,
    dislikes: 0,
    isLive: false,
    scheduledTime: null,
    isDraft: false,
  },
  {
    id: "2",
    title: "Sample Video 2",
    description: "Another sample video description",
    thumbnail: "https://via.placeholder.com/320x180",
    videoUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_2mb.mp4",
    uploadDate: new Date(Date.now() - 172800000).toLocaleString(),
    userId: "user123",
    skillmates: 8,
    views: 80,
    likes: 3,
    dislikes: 1,
    isLive: false,
    scheduledTime: null,
    isDraft: false,
  },
];

const Videos = () => {
  // State management
  const [showUpload, setShowUpload] = useState(false);
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [editVideoIdx, setEditVideoIdx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenuIdx, setOpenMenuIdx] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const menuRefs = useRef([]);
  const observer = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Backend API functions
  const fetchVideos = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/videos`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }
      const data = await response.json();
      return data.videos || data || [];
    } catch (err) {
      console.error('Error fetching videos:', err);
      return staticVideos; // Fallback to static data
    }
  };

  const uploadVideo = async (videoData) => {
    const formData = new FormData();
    Object.entries(videoData).forEach(([key, value]) => {
      formData.append(key, value);
    });
    try {
      const response = await fetch(`${BACKEND_URL}/api/videos/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      if (!response.ok) {
        throw new Error('Failed to upload video');
      }
      return await response.json();
    } catch (err) {
      console.error('Error uploading video:', err);
      throw new Error('Failed to upload video');
    }
  };

  const updateVideo = async (id, videoData) => {
    const formData = new FormData();
    Object.entries(videoData).forEach(([key, value]) => {
      formData.append(key, value);
    });
    try {
      const response = await fetch(`${BACKEND_URL}/api/videos/${id}`, {
        method: 'PUT',
        credentials: 'include',
        body: formData
      });
      if (!response.ok) {
        throw new Error('Failed to update video');
      }
      return await response.json();
    } catch (err) {
      console.error('Error updating video:', err);
      throw new Error('Failed to update video');
    }
  };

  const deleteVideo = async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/videos/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete video');
      }
      return await response.json();
    } catch (err) {
      console.error('Error deleting video:', err);
      throw new Error('Failed to delete video');
    }
  };

  const archiveVideo = async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/videos/${id}/archive`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to archive video');
      }
      return await response.json();
    } catch (err) {
      console.error('Error archiving video:', err);
      throw new Error('Failed to archive video');
    }
  };

  // Load videos from backend
  useEffect(() => {
    const loadVideos = async () => {
      setLoading(true);
      try {
        const videosData = await fetchVideos();
        setVideos(videosData);
        setFilteredVideos(videosData);
      } catch (err) {
        setError("Failed to load videos");
        setVideos(staticVideos); // Fallback to static data
        setFilteredVideos(staticVideos);
      } finally {
        setLoading(false);
      }
    };
    loadVideos();
  }, []);

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

  // Filter videos
  useEffect(() => {
    let filtered = videos;
    if (searchQuery) {
      filtered = filtered.filter(
        (video) =>
          video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (video.description && video.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((video) =>
        statusFilter === "draft" ? video.isDraft : !video.isDraft
      );
    }
    setFilteredVideos(filtered);
  }, [searchQuery, statusFilter, videos]);

  // Reset form
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setThumbnail(null);
    setThumbnailPreview(null);
    setVideoFile(null);
    setVideoPreview(null);
  };

  // Handle file changes
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  // Save draft
  const handleSaveDraft = (e) => {
    e.preventDefault();
    const draftVideo = {
      draftId: (location.state && location.state.editDraft && location.state.editDraft.draftId) || Date.now().toString(),
      title,
      description,
      thumbnail: thumbnailPreview,
      videoUrl: videoPreview,
      uploadDate: (location.state && location.state.editDraft && location.state.editDraft.uploadDate) || new Date().toLocaleString(),
      userId: "user123",
      skillmates: 0,
      views: 0,
      likes: 0,
      dislikes: 0,
      isLive: false,
      scheduledTime: null,
      isDraft: true,
    };
    let drafts = JSON.parse(localStorage.getItem("videoDrafts") || "[]");
    if (location.state && location.state.editDraft && location.state.editDraft.draftId) {
      drafts = drafts.map((draft) => draft.draftId === location.state.editDraft.draftId ? draftVideo : draft);
    } else {
      drafts.unshift(draftVideo);
    }
    localStorage.setItem("videoDrafts", JSON.stringify(drafts));
    setShowUpload(false);
    resetForm();
    navigate("/profile/drafts");
  };

  // Handle upload
  const handleUpload = async (e) => {
    e.preventDefault();
    let newVideo;
    if (editVideoIdx !== null && videos[editVideoIdx]) {
      const existingVideo = videos[editVideoIdx];
      newVideo = {
        ...existingVideo,
        title,
        description,
        thumbnail: thumbnailPreview || existingVideo.thumbnail,
        videoUrl: videoPreview || existingVideo.videoUrl,
        uploadDate: existingVideo.uploadDate,
        isDraft: false,
      };
      try {
        const updatedVideo = await updateVideo(existingVideo.id, newVideo);
        setVideos((prev) => {
          const updated = [...prev];
          updated[editVideoIdx] = updatedVideo;
          localStorage.setItem("uploadedVideos", JSON.stringify(updated)); // For compatibility
          return updated;
        });
        setFilteredVideos((prev) => {
          let filtered = [...prev];
          filtered = filtered.map((v, i) => (i === editVideoIdx ? updatedVideo : v));
          if (searchQuery) {
            filtered = filtered.filter(
              (video) =>
                video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (video.description && video.description.toLowerCase().includes(searchQuery.toLowerCase()))
            );
          }
          if (statusFilter !== "all") {
            filtered = filtered.filter((video) =>
              statusFilter === "draft" ? video.isDraft : !video.isDraft
            );
          }
          return filtered;
        });
      } catch (err) {
        setError("Failed to update video");
        return;
      }
    } else {
      newVideo = {
        id: Date.now().toString(),
        title,
        description,
        thumbnail: thumbnailPreview,
        videoUrl: videoPreview,
        uploadDate: new Date().toLocaleString(),
        userId: "user123",
        skillmates: 0,
        views: 0,
        likes: 0,
        dislikes: 0,
        isLive: false,
        scheduledTime: null,
        isDraft: false,
      };
      try {
        const uploadedVideo = await uploadVideo(newVideo);
        setVideos((prev) => {
          const updated = [uploadedVideo, ...prev];
          localStorage.setItem("uploadedVideos", JSON.stringify(updated)); // For compatibility
          return updated;
        });
        setFilteredVideos((prev) => {
          let filtered = [uploadedVideo, ...prev];
          if (searchQuery) {
            filtered = filtered.filter(
              (video) =>
                video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (video.description && video.description.toLowerCase().includes(searchQuery.toLowerCase()))
            );
          }
          if (statusFilter !== "all") {
            filtered = filtered.filter((video) =>
              statusFilter === "draft" ? video.isDraft : !video.isDraft
            );
          }
          return filtered;
        });
      } catch (err) {
        setError("Failed to upload video");
        return;
      }
    }
    setShowUpload(false);
    resetForm();
    setEditVideoIdx(null);
    if (location.pathname !== "/profile/panel/videos") {
      navigate("/profile/panel/videos");
    }
  };

  // Edit, archive, save, share, delete
  const handleEdit = (video, idx) => {
    setEditVideoIdx(idx);
    setTitle(video.title || "");
    setDescription(video.description || "");
    setThumbnail(null);
    setThumbnailPreview(video.thumbnail || null);
    setVideoFile(null);
    setVideoPreview(video.videoUrl || null);
    setShowUpload(true);
  };

  const handleArchive = async (idx) => {
    const video = videos[idx];
    try {
      await archiveVideo(video.id);
      setVideos((prev) => {
        const updated = prev.filter((_, i) => i !== idx);
        localStorage.setItem("uploadedVideos", JSON.stringify(updated)); // For compatibility
        return updated;
      });
      setFilteredVideos((prev) => {
        let filtered = prev.filter((_, i) => i !== idx);
        if (searchQuery) {
          filtered = filtered.filter(
            (video) =>
              video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (video.description && video.description.toLowerCase().includes(searchQuery.toLowerCase()))
          );
        }
        if (statusFilter !== "all") {
          filtered = filtered.filter((video) =>
            statusFilter === "draft" ? video.isDraft : !video.isDraft
          );
        }
        return filtered;
      });
      const archive = JSON.parse(localStorage.getItem("archivedVideos") || "[]");
      archive.unshift({ ...video, isArchived: true });
      localStorage.setItem("archivedVideos", JSON.stringify(archive));
    } catch (err) {
      setError("Failed to archive video");
    }
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
    navigator.clipboard.writeText(window.location.origin + "/video/" + video.id);
    alert("Video link copied to clipboard!");
  };

  const handleDelete = (idx) => {
    setShowDeleteConfirm(idx);
  };

  const confirmDelete = async () => {
    if (showDeleteConfirm === null || !videos[showDeleteConfirm]) return;
    const video = videos[showDeleteConfirm];
    try {
      await deleteVideo(video.id);
      setVideos((prev) => {
        const updated = prev.filter((_, i) => i !== showDeleteConfirm);
        localStorage.setItem("uploadedVideos", JSON.stringify(updated)); // For compatibility
        return updated;
      });
      setFilteredVideos((prev) => {
        let filtered = prev.filter((_, i) => i !== showDeleteConfirm);
        if (searchQuery) {
          filtered = filtered.filter(
            (video) =>
              video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (video.description && video.description.toLowerCase().includes(searchQuery.toLowerCase()))
          );
        }
        if (statusFilter !== "all") {
          filtered = filtered.filter((video) =>
            statusFilter === "draft" ? video.isDraft : !video.isDraft
          );
        }
        return filtered;
      });
      setShowDeleteConfirm(null);
    } catch (err) {
      setError("Failed to delete video");
    }
  };

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (openMenuIdx !== null && menuRefs.current[openMenuIdx] && !menuRefs.current[openMenuIdx].contains(event.target)) {
        setOpenMenuIdx(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuIdx]);

  // Clear editDraft state
  useEffect(() => {
    if (showUpload && location.state?.editDraft) {
      navigate("/profile/panel/videos", { replace: true });
    }
  }, [showUpload, location, navigate]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, when: "beforeChildren", staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
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
          Loading videos...
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
          {!showUpload ? (
            <>
              <header className="py-3">
                <motion.h1
                  variants={itemVariants}
                  className="text-2xl sm:text-3xl font-extrabold text-blue-900 tracking-tight"
                >
                  Your Sessions
                </motion.h1>
                <motion.div
                  variants={itemVariants}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-2"
                >
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
                    <motion.select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full sm:w-32 border border-blue-200 rounded-md px-2 py-1.5 bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-300 text-sm sm:text-base"
                    >
                      <option value="all">All</option>
                      <option value="draft">Drafts</option>
                      <option value="published">Published</option>
                    </motion.select>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "6px 6px 12px #d1d9e6, -6px -6px 12px #f5f7ff" }}
                    whileTap={{ scale: 0.95, boxShadow: "inset 2px 2px 4px #d1d9e6" }}
                    className="w-full sm:w-auto bg-blue-800 text-white px-4 py-1.5 rounded-md font-semibold shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#f5f7ff] hover:bg-blue-900 transition-all duration-300 text-sm sm:text-base"
                    onClick={() => setShowUpload(true)}
                  >
                    + Upload Session
                  </motion.button>
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
                {filteredVideos.length === 0 ? (
                  <motion.div
                    variants={itemVariants}
                    className="text-center text-black opacity-70 mt-10 text-lg font-medium bg-[#E6F0FA]"
                  >
                    No sessions found.
                  </motion.div>
                ) : (
                  <section className="space-y-4 overflow-y-auto">
                    {filteredVideos.map((video, idx) => (
                      <motion.article
                        key={video.id || idx}
                        variants={itemVariants}
                        className="video-card bg-[#E6F0FA]"
                      >
                        <VideoCard
                          video={{ ...video, uploadDate: getRelativeTime(video.uploadDate) }}
                          onEdit={() => handleEdit(video, idx)}
                          onArchive={() => handleArchive(idx)}
                          onDelete={() => handleDelete(idx)}
                          onSave={() => handleSave(idx)}
                          onShare={() => handleShare(idx)}
                          menuOptions={["edit", "delete", "archive", "save", "share"]}
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
          ) : (
            <motion.form
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="w-full h-[calc(100vh-4rem)] bg-[#E6F0FA] p-3 sm:p-4 flex flex-col justify-start overflow-hidden rounded-lg"
              onSubmit={handleUpload}
            >
              <motion.h2
                variants={itemVariants}
                className="text-2xl sm:text-3xl font-bold text-blue-900 mb-3"
              >
                Upload Session
              </motion.h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <motion.label variants={itemVariants} className="block text-sm font-semibold text-black opacity-70">
                  Title
                  <input
                    className="mt-1 w-full border border-blue-200 rounded-md px-2 py-1.5 bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-300"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter session title"
                    required
                  />
                </motion.label>
                <motion.label variants={itemVariants} className="block text-sm font-semibold text-black opacity-70">
                  Description
                  <textarea
                    className="mt-1 w-full border border-blue-200 rounded-md px-2 py-1.5 bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-300"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter session description"
                    rows="2"
                    required
                  />
                </motion.label>
                <motion.label variants={itemVariants} className="block text-sm font-semibold text-black opacity-70">
                  Thumbnail
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-1 w-full text-black opacity-70 file:bg-blue-800 file:text-white file:rounded-md file:px-3 file:py-1 file:border-none hover:file:bg-blue-900 file:transition-all file:duration-300"
                    onChange={handleThumbnailChange}
                  />
                  <AnimatePresence>
                    {thumbnailPreview && (
                      <motion.img
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="mt-2 w-24 h-16 object-cover rounded shadow"
                        src={thumbnailPreview}
                        alt="Preview"
                      />
                    )}
                  </AnimatePresence>
                </motion.label>
                <motion.label variants={itemVariants} className="block text-sm font-semibold text-black opacity-70">
                  Video File
                  <input
                    type="file"
                    accept="video/*"
                    className="mt-1 w-full text-black opacity-70 file:bg-blue-800 file:text-white file:rounded-md file:px-3 file:py-1 file:border-none hover:file:bg-blue-900 file:transition-all file:duration-300"
                    onChange={handleVideoChange}
                    disabled={editVideoIdx !== null}
                  />
                  <AnimatePresence>
                    {videoPreview && (
                      <motion.video
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="mt-2 w-full sm:w-32 h-20 rounded shadow"
                        src={videoPreview}
                        controls
                      />
                    )}
                  </AnimatePresence>
                </motion.label>
              </div>
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-2">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "6px 6px 12px #d1d9e6, -6px -6px 12px #f5f7ff" }}
                  whileTap={{ scale: 0.95, boxShadow: "inset 2px 2px 4px #d1d9e6" }}
                  type="submit"
                  disabled={!title || !description || !thumbnailPreview || (!videoPreview && editVideoIdx === null)}
                  className="w-full sm:w-auto bg-blue-800 text-white px-4 py-1.5 rounded-md font-semibold shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#f5f7ff] hover:bg-blue-900 transition-all duration-300 text-sm sm:text-base"
                >
                  {editVideoIdx !== null ? "Save Changes" : "Upload"}
                </motion.button>
                {editVideoIdx === null && (
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "6px 6px 12px #d1d9e6, -6px -6px 12px #f5f7ff" }}
                    whileTap={{ scale: 0.95, boxShadow: "inset 2px 2px 4px #d1d9e6" }}
                    type="button"
                    disabled={!title || !description || !thumbnailPreview || !videoPreview}
                    onClick={handleSaveDraft}
                    className="w-full sm:w-auto bg-blue-800 text-white px-4 py-1.5 rounded-md font-semibold shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#f5f7ff] hover:bg-blue-900 transition-all duration-300 text-sm sm:text-base"
                  >
                    Save as Draft
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "6px 6px 12px #d1d9e6, -6px -6px 12px #f5f7ff" }}
                  whileTap={{ scale: 0.95, boxShadow: "inset 2px 2px 4px #d1d9e6" }}
                  type="button"
                  className="w-full sm:w-auto bg-blue-800 text-white px-4 py-1.5 rounded-md font-semibold shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#f5f7ff] hover:bg-blue-900 transition-all duration-300 text-sm sm:text-base"
                  onClick={() => {
                    setShowUpload(false);
                    resetForm();
                    setEditVideoIdx(null);
                    navigate("/profile/panel/videos");
                  }}
                >
                  Cancel
                </motion.button>
              </motion.div>
            </motion.form>
          )}
          <AnimatePresence>
            {showDeleteConfirm !== null && (
              <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center"
              >
                <motion.div
                  variants={modalVariants}
                  className="bg-[#E6F0FA] rounded-xl shadow-2xl p-5 max-w-sm w-full"
                >
                  <h3 className="text-lg font-bold text-blue-900 tracking-tight mb-3">Confirm Delete</h3>
                  <p className="mb-3 text-black opacity-70 font-medium">Are you sure you want to delete this video?</p>
                  <div className="flex justify-end gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "6px 6px 12px #d1d9e6, -6px -6px 12px #f5f7ff" }}
                      whileTap={{ scale: 0.95, boxShadow: "inset 2px 2px 4px #d1d9e6" }}
                      className="px-3 py-1.5 bg-blue-800 text-white rounded-md font-semibold shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#f5f7ff] hover:bg-blue-900 transition-all duration-300 text-sm sm:text-base"
                      onClick={() => setShowDeleteConfirm(null)}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "6px 6px 12px #d1d9e6, -6px -6px 12px #f5f7ff" }}
                      whileTap={{ scale: 0.95, boxShadow: "inset 2px 2px 4px #d1d9e6" }}
                      className="px-3 py-1.5 bg-blue-800 text-white rounded-md font-semibold shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#f5f7ff] hover:bg-blue-900 transition-all duration-300 text-sm sm:text-base"
                      onClick={confirmDelete}
                    >
                      Delete
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
};

export default Videos;

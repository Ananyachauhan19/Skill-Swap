import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BACKEND_URL } from '../../config.js';

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
      return data.videos || [];
    } catch (err) {
      console.error('Fetch videos error:', err);
      return [];
    }
  };

  const uploadVideo = async (videoData) => {
    const formData = new FormData();
    formData.append('title', videoData.title);
    formData.append('description', videoData.description);
    formData.append('isDraft', videoData.isDraft || false);
    
    if (videoData.videoFile) {
      formData.append('video', videoData.videoFile);
    }
    if (videoData.thumbnailFile) {
      formData.append('thumbnail', videoData.thumbnailFile);
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/videos/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload video');
      }
      const data = await response.json();
      return data.video;
    } catch (err) {
      console.error('Upload video error:', err);
      throw err;
    }
  };

  const updateVideo = async (id, videoData) => {
    const formData = new FormData();
    formData.append('title', videoData.title);
    formData.append('description', videoData.description);
    formData.append('isDraft', videoData.isDraft || false);
    
    if (videoData.videoFile) {
      formData.append('video', videoData.videoFile);
    }
    if (videoData.thumbnailFile) {
      formData.append('thumbnail', videoData.thumbnailFile);
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/videos/${id}`, {
        method: 'PUT',
        credentials: 'include',
        body: formData
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update video');
      }
      const data = await response.json();
      return data.video;
    } catch (err) {
      console.error('Update video error:', err);
      throw err;
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
      throw new Error('Failed to archive video');
    }
  };

  // Load videos from backend
  useEffect(() => {
    const loadVideos = async () => {
      setLoading(true);
      
      // Clear any old localStorage cache (remove this after testing)
      localStorage.removeItem('uploadedVideos');
      console.log('[Videos] Cleared localStorage cache');
      
      try {
        console.log('[Videos] Fetching videos from backend...');
        const videosData = await fetchVideos();
        console.log('[Videos] Received videos:', videosData);
        setVideos(videosData);
        setFilteredVideos(videosData);
        setError(null);
      } catch (err) {
        console.error('[Videos] Error loading videos:', err);
        setError("Failed to load videos");
        console.error('Load videos error:', err);
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

  // Filter videos by status
  useEffect(() => {
    let filtered = videos;
    if (statusFilter !== "all") {
      filtered = filtered.filter((video) =>
        statusFilter === "draft" ? video.isDraft : !video.isDraft
      );
    }
    setFilteredVideos(filtered);
  }, [statusFilter, videos]);

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
  const handleSaveDraft = async (e) => {
    e.preventDefault();
    
    if (!title || !description || !videoFile || !thumbnail) {
      setError('All fields are required to save draft');
      return;
    }

    try {
      setLoading(true);
      
      const videoData = {
        title,
        description,
        isDraft: true,
        videoFile: videoFile,
        thumbnailFile: thumbnail
      };

      const draftVideo = await uploadVideo(videoData);
      
      setVideos((prev) => [draftVideo, ...prev]);
      setShowUpload(false);
      resetForm();
      setError(null);
      navigate("/profile/drafts");
    } catch (err) {
      setError(err.message || "Failed to save draft");
    } finally {
      setLoading(false);
    }
  };

  // Handle upload
  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!title || !description) {
      setError('Title and description are required');
      return;
    }

    try {
      setLoading(true);
      
      if (editVideoIdx !== null && videos[editVideoIdx]) {
        // Update existing video
        const existingVideo = videos[editVideoIdx];
        const videoData = {
          title,
          description,
          isDraft: false,
          videoFile: videoFile,
          thumbnailFile: thumbnail
        };

        const updatedVideo = await updateVideo(existingVideo._id, videoData);
        
        setVideos((prev) => {
          const updated = [...prev];
          updated[editVideoIdx] = updatedVideo;
          return updated;
        });
      } else {
        // Upload new video
        if (!videoFile || !thumbnail) {
          setError('Both video and thumbnail files are required');
          setLoading(false);
          return;
        }

        const videoData = {
          title,
          description,
          isDraft: false,
          videoFile: videoFile,
          thumbnailFile: thumbnail
        };

        const uploadedVideo = await uploadVideo(videoData);
        
        setVideos((prev) => [uploadedVideo, ...prev]);
      }

      setShowUpload(false);
      resetForm();
      setEditVideoIdx(null);
      setError(null);
      
      if (location.pathname !== "/profile/panel/videos") {
        navigate("/profile/panel/videos");
      }
    } catch (err) {
      setError(err.message || "Failed to upload video");
    } finally {
      setLoading(false);
    }
  };

  // Edit, archive, save, share, delete
  const handleEdit = (video, idx) => {
    setEditVideoIdx(idx);
    setTitle(video.title || "");
    setDescription(video.description || "");
    setThumbnail(null);
    setThumbnailPreview(video.thumbnailUrl || null);
    setVideoFile(null);
    setVideoPreview(video.videoUrl || null);
    setShowUpload(true);
  };

  const handleArchive = async (idx) => {
    const video = videos[idx];
    try {
      setLoading(true);
      await archiveVideo(video._id);
      setVideos((prev) => prev.filter((_, i) => i !== idx));
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to archive video");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (idx) => {
    const video = videos[idx];
    const saved = JSON.parse(localStorage.getItem("savedVideos") || "[]");
    if (!saved.some((v) => v._id === video._id)) {
      saved.unshift(video);
      localStorage.setItem("savedVideos", JSON.stringify(saved));
    }
  };

  const handleShare = (idx) => {
    const video = videos[idx];
    navigator.clipboard.writeText(window.location.origin + "/video/" + video._id);
    alert("Video link copied to clipboard!");
  };

  const handleDelete = (idx) => {
    setShowDeleteConfirm(idx);
  };

  const confirmDelete = async () => {
    if (showDeleteConfirm === null || !videos[showDeleteConfirm]) return;
    const video = videos[showDeleteConfirm];
    try {
      setLoading(true);
      await deleteVideo(video._id);
      setVideos((prev) => prev.filter((_, i) => i !== showDeleteConfirm));
      setShowDeleteConfirm(null);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to delete video");
    } finally {
      setLoading(false);
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
      className="min-h-screen max-h-screen w-full px-3 sm:px-4 md:px-6 font-[Inter] overflow-hidden"
    >
      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-black opacity-70 font-medium"
        >
          Loading videos...
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
                  <motion.select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full sm:w-32 border border-blue-200 rounded-md px-2 py-1.5 bg-white/90 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-300 text-sm sm:text-base"
                  >
                    <option value="all">All</option>
                    <option value="draft">Drafts</option>
                    <option value="published">Published</option>
                  </motion.select>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto bg-blue-800 text-white px-4 py-1.5 rounded-md font-semibold hover:bg-blue-900 transition-all duration-300 text-sm sm:text-base"
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
                    className="text-center py-8 text-black opacity-70 font-medium"
                  >
                    Loading video cards...
                  </motion.div>
                }
              >
                {filteredVideos.length === 0 ? (
                  <motion.div
                    variants={itemVariants}
                    className="text-center text-black opacity-70 mt-10 text-lg font-medium"
                  >
                    No sessions found.
                  </motion.div>
                ) : (
                  <section className="space-y-4 overflow-y-auto">
                    {filteredVideos.map((video, idx) => (
                      <motion.article
                        key={video._id || idx}
                        variants={itemVariants}
                        className="video-card"
                      >
                        <VideoCard
                          video={{ 
                            ...video, 
                            id: video._id,
                            thumbnail: video.thumbnailUrl,
                            likes: Array.isArray(video.likes) ? video.likes : [],
                            dislikes: Array.isArray(video.dislikes) ? video.dislikes : [],
                            likeCount: Array.isArray(video.likes) ? video.likes.length : 0,
                            dislikeCount: Array.isArray(video.dislikes) ? video.dislikes.length : 0,
                            uploadDate: getRelativeTime(video.uploadDate || video.createdAt),
                            userId: typeof video.userId === 'object' 
                              ? (video.userId?.username || video.userId?.firstName || 'Unknown')
                              : video.userId,
                            skillmates: 0,
                            views: video.views || 0
                          }}
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
              className="w-full h-[calc(100vh-4rem)] p-3 sm:p-4 flex flex-col justify-start overflow-hidden rounded-lg"
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
                    className="mt-1 w-full border border-blue-200 rounded-md px-2 py-1.5 bg-white/90 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-300"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter session title"
                    required
                  />
                </motion.label>
                <motion.label variants={itemVariants} className="block text-sm font-semibold text-black opacity-70">
                  Description
                  <textarea
                    className="mt-1 w-full border border-blue-200 rounded-md px-2 py-1.5 bg-white/90 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-300"
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
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!title || !description || !thumbnailPreview || (!videoPreview && editVideoIdx === null)}
                  className="w-full sm:w-auto bg-blue-800 text-white px-4 py-1.5 rounded-md font-semibold hover:bg-blue-900 transition-all duration-300 text-sm sm:text-base"
                >
                  {editVideoIdx !== null ? "Save Changes" : "Upload"}
                </motion.button>
                {editVideoIdx === null && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    disabled={!title || !description || !thumbnailPreview || !videoPreview}
                    onClick={handleSaveDraft}
                    className="w-full sm:w-auto bg-blue-800 text-white px-4 py-1.5 rounded-md font-semibold hover:bg-blue-900 transition-all duration-300 text-sm sm:text-base"
                  >
                    Save as Draft
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  className="w-full sm:w-auto bg-blue-800 text-white px-4 py-1.5 rounded-md font-semibold hover:bg-blue-900 transition-all duration-300 text-sm sm:text-base"
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
                  className="bg-white rounded-xl shadow-2xl p-5 max-w-sm w-full"
                >
                  <h3 className="text-lg font-bold text-blue-900 tracking-tight mb-3">Confirm Delete</h3>
                  <p className="mb-3 text-black opacity-70 font-medium">Are you sure you want to delete this video?</p>
                  <div className="flex justify-end gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-1.5 bg-blue-800 text-white rounded-md font-semibold hover:bg-blue-900 transition-all duration-300 text-sm sm:text-base"
                      onClick={() => setShowDeleteConfirm(null)}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-1.5 bg-blue-800 text-white rounded-md font-semibold hover:bg-blue-900 transition-all duration-300 text-sm sm:text-base"
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
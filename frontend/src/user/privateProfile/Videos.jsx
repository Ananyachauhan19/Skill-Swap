import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import SearchBar from "./SearchBar";

// Lazy load VideoCard component
const VideoCard = lazy(() => import("./VideoCard"));

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
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000)
    return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

// Static data for videos (to be replaced by backend calls)
const staticVideos = [
  {
    id: "1",
    title: "Sample Video 1",
    description: "This is a sample video description",
    thumbnail: "https://via.placeholder.com/320x180",
    videoUrl:
      "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
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
    videoUrl:
      "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_2mb.mp4",
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

  // Backend API functions (commented for future implementation)
  /*
  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/videos', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      return data.videos;
    } catch (err) {
      throw new Error('Failed to fetch videos');
    }
  };

  const uploadVideo = async (videoData) => {
    const formData = new FormData();
    Object.entries(videoData).forEach(([key, value]) => {
      formData.append(key, value);
    });
    try {
      const response = await fetch('/api/videos/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      return await response.json();
    } catch (err) {
      throw new Error('Failed to upload video');
    }
  };

  const updateVideo = async (id, videoData) => {
    const formData = new FormData();
    Object.entries(videoData).forEach(([key, value]) => {
      formData.append(key, value);
    });
    try {
      const response = await fetch(`/api/videos/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      return await response.json();
    } catch (err) {
      throw new Error('Failed to update video');
    }
  };

  const deleteVideo = async (id) => {
    try {
      const response = await fetch(`/api/videos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return await response.json();
    } catch (err) {
      throw new Error('Failed to delete video');
    }
  };

  const archiveVideo = async (id) => {
    try {
      const response = await fetch(`/api/videos/${id}/archive`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return await response.json();
    } catch (err) {
      throw new Error('Failed to archive video');
    }
  };
  */

  // Load videos (using static data for now)
  useEffect(() => {
    // Simulate async data fetching
    setTimeout(() => {
      try {
        // Replace with fetchVideos() when backend is ready
        setVideos(staticVideos);
        setFilteredVideos(staticVideos);
        setLoading(false);
      } catch (err) {
        setError("Failed to load videos");
        setLoading(false);
      }
    }, 0);
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
  }, [filteredVideos]); // Remove currentPage from dependencies

  // Filter videos based on search and status
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
      draftId:
        (location.state &&
          location.state.editDraft &&
          location.state.editDraft.draftId) ||
        Date.now().toString(),
      title,
      description,
      thumbnail: thumbnailPreview,
      videoUrl: videoPreview,
      uploadDate:
        (location.state &&
          location.state.editDraft &&
          location.state.editDraft.uploadDate) ||
        new Date().toLocaleString(),
      userId: "user123",
      skillmates: 0,
      views: 0,
      likes: 0,
      dislikes: 0,
      isLive: false,
      scheduledTime: null,
      isDraft: true,
    };
    // Replace with backend call when ready
    let drafts = JSON.parse(localStorage.getItem("videoDrafts") || "[]");
    if (
      location.state &&
      location.state.editDraft &&
      location.state.editDraft.draftId
    ) {
      drafts = drafts.map((draft) =>
        draft.draftId === location.state.editDraft.draftId ? draftVideo : draft
      );
    } else {
      drafts.unshift(draftVideo);
    }
    localStorage.setItem("videoDrafts", JSON.stringify(drafts));
    setShowUpload(false);
    resetForm();
    navigate("/profile/drafts");
  };

    //Handle Upload
  const handleUpload = async (e) => {
  e.preventDefault();
  let newVideo;
  if (editVideoIdx !== null && videos[editVideoIdx]) {
    // For editing, merge existing video properties with updated fields
    const existingVideo = videos[editVideoIdx];
    newVideo = {
      ...existingVideo, // Preserve all existing properties
      title, // Update only edited fields
      description,
      thumbnail: thumbnailPreview || existingVideo.thumbnail, // Fallback to existing thumbnail if unchanged
      videoUrl: videoPreview || existingVideo.videoUrl, // Fallback to existing videoUrl if unchanged
      uploadDate: existingVideo.uploadDate, // Ensure uploadDate is preserved
      isDraft: false, // Update draft status
    };
  } else {
    // For new uploads, create new video object
    newVideo = {
      id: Date.now(),
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
  }

  try {
    // Replace with backend call when ready
    // const uploadedVideo = await uploadVideo(newVideo);
    let updatedVideos = JSON.parse(localStorage.getItem("uploadedVideos") || "[]");
    if (editVideoIdx !== null && videos[editVideoIdx]) {
      updatedVideos[editVideoIdx] = newVideo;
    } else {
      updatedVideos.unshift(newVideo);
    }
    localStorage.setItem("uploadedVideos", JSON.stringify(updatedVideos));
    
    // Update videos state with deep copy
    setVideos([...updatedVideos]);
    
    // Update filteredVideos with the same filtering logic as in useEffect
    let filtered = [...updatedVideos]; // Deep copy for filteredVideos
    if (searchQuery) {
      filtered = filtered.filter((video) =>
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
    
    setShowUpload(false);
    resetForm();
    setEditVideoIdx(null);
    // Navigate only if necessary
    if (location.pathname !== "/profile/panel/videos") {
      navigate("/profile/panel/videos");
    }
  } catch (err) {
    setError("Failed to upload video");
  }
};

  // Edit video
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

  // Archive video
  const handleArchive = async (idx) => {
    const video = videos[idx];
    try {
      // Replace with backend call when ready
      // await archiveVideo(video.id);
      const updatedVideos = videos.filter((_, i) => i !== idx);
      setVideos(updatedVideos);
      localStorage.setItem("uploadedVideos", JSON.stringify(updatedVideos));
      const archive = JSON.parse(
        localStorage.getItem("archivedVideos") || "[]"
      );
      archive.unshift({ ...video, isArchived: true });
      localStorage.setItem("archivedVideos", JSON.stringify(archive));
    } catch (err) {
      setError("Failed to archive video");
    }
  };

  // Save video
  const handleSave = (idx) => {
    const video = videos[idx];
    const saved = JSON.parse(localStorage.getItem("savedVideos") || "[]");
    if (!saved.some((v) => v.uploadDate === video.uploadDate)) {
      saved.unshift(video);
      localStorage.setItem("savedVideos", JSON.stringify(saved));
    }
  };

  // Share video
  const handleShare = (idx) => {
    const video = videos[idx];
    navigator.clipboard.writeText(
      window.location.origin + "/video/" + video.id
    );
    alert("Video link copied to clipboard!");
  };

  // Delete video with confirmation
  const handleDelete = (idx) => {
    setShowDeleteConfirm(idx);
  };

  const confirmDelete = async () => {
    const video = videos[showDeleteConfirm];
    try {
      // Replace with backend call when ready
      // await deleteVideo(video.id);
      const updatedVideos = videos.filter((_, i) => i !== showDeleteConfirm);
      setVideos(updatedVideos);
      localStorage.setItem("uploadedVideos", JSON.stringify(updatedVideos));
      setShowDeleteConfirm(null);
    } catch (err) {
      setError("Failed to delete video");
    }
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

  // Clear editDraft state from URL
  useEffect(() => {
    if (showUpload && location.state?.editDraft) {
      navigate("/profile/panel/videos", { replace: true });
    }
  }, [showUpload, location, navigate]);

  if (loading) return <div className="text-center py-8">Loading videos...</div>;
  if (error)
    return <div className="text-red-500 text-center py-8">{error}</div>;

  return (
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 md:px-8">
      {!showUpload && (
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            </div>
            <button
              className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 text-sm sm:text-base"
              onClick={() => setShowUpload(true)}
            >
              + Upload Session
            </button>
          </div>
        </div>
      )}

      {showUpload ? (
        <form
          className="max-w-lg mx-auto bg-white rounded-lg shadow p-4 sm:p-6 mt-8"
          onSubmit={handleUpload}
        >
          <h2 className="text-lg sm:text-xl font-bold mb-4">
            Upload New Session
          </h2>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter session title"
              required
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              className="w-full border rounded px-3 py-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your session"
              required
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Thumbnail</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
            />
            {thumbnailPreview && (
              <img
                src={thumbnailPreview}
                alt="Preview"
                className="w-32 h-20 mt-2 object-cover rounded"
              />
            )}
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Video File</label>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              disabled={editVideoIdx !== null}
            />
            {videoPreview && (
              <video
                src={videoPreview}
                controls
                className="w-full sm:w-48 h-28 mt-2 rounded"
              />
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <button
              type="submit"
              className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded"
              disabled={
                !title || !description || !thumbnailPreview || !videoPreview
              }
            >
              {editVideoIdx !== null ? "Save Changes" : "Upload"}
            </button>

            {editVideoIdx === null && (
              <button
                type="button"
                className="w-full sm:w-auto bg-yellow-500 text-white px-4 py-2 rounded"
                disabled={
                  !title || !description || !thumbnailPreview || !videoPreview
                }
                onClick={handleSaveDraft}
              >
                Save as Draft
              </button>
            )}

            <button
              type="button"
              className="w-full sm:w-auto bg-gray-300 text-gray-700 px-4 py-2 rounded"
              onClick={() => {
                setShowUpload(false);
                resetForm();
                setEditVideoIdx(null);
                navigate("/profile/panel/videos");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <Suspense
          fallback={
            <div className="text-center py-8">Loading video cards...</div>
          }
        >
          <div className="space-y-6">
            {filteredVideos.length === 0 ? (
  <div className="text-center text-gray-500 mt-12">
    No sessions found.
  </div>
) : (
  filteredVideos.map((video, idx) => (
    <div key={idx} className="w-full video-card">
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
    </div>
  ))
)}
          </div>
        </Suspense>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
            <p className="mb-4">Are you sure you want to delete this video?</p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Videos;

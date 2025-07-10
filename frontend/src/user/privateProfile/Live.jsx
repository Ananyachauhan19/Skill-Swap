import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
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

  const saveToPlaylist = async (id, playlistId) => {
    try {
      const res = await fetch(`/api/playlists/${playlistId}/videos`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoId: id })
      });
      if (!res.ok) throw new Error("Failed to add to playlist");
      return await res.json();
    } catch (err) {
      throw new Error(err.message);
    }
  };
  */

  // Load videos from localStorage or static data
  useEffect(() => {
    setTimeout(() => {
      try {
        const savedVideos = JSON.parse(
          localStorage.getItem("liveVideos") || "[]"
        );
        const initialVideos =
          savedVideos.length > 0 ? savedVideos : staticVideos;
        setVideos(initialVideos);
        setFilteredVideos(initialVideos);
        setLoading(false);
      } catch (err) {
        setError("Failed to load live sessions");
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
            viewers: Math.max(0, updated[idx].viewers + Math.floor(Math.random() * 11 - 5)), // Simulate viewer fluctuation
            likes: Math.max(0, updated[idx].likes + Math.floor(Math.random() * 3 - 1)), // Simulate likes fluctuation (±1)
            dislikes: Math.max(0, updated[idx].dislikes + Math.floor(Math.random() * 2 - 1)), // Simulate dislikes fluctuation (±1)
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
    }, 10000); // Update every 10 seconds
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
        // Simulate adding stream chunks
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
        }, 5000); // Simulate adding a chunk every 5 seconds
        return () => clearInterval(interval);
      }
    });
  }, [videos, streamBuffer]);

  // End live session and save as video
  const endLive = (idx) => {
    const video = videos[idx];
    if (!video.isLive) return;

    // Simulate encoding and processing
    const processedVideo = {
      ...video,
      isLive: false,
      isRecorded: true,
      videoUrl: `https://sample-videos.com/processed/${video.id}.mp4`, // Simulated URL
      viewers: 0,
      views: video.viewers || 0, // Transfer viewers to views
      scheduledTime: null // Remove scheduled time
    };

    // Update videos state
    setVideos((prev) => {
      const updated = [...prev];
      updated[idx] = processedVideo;
      localStorage.setItem("liveVideos", JSON.stringify(updated));
      return updated;
    });

    // Update filteredVideos
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

    // Clear stream buffer
    setStreamBuffer((prev) => {
      const newBuffer = { ...prev };
      delete newBuffer[video.id];
      return newBuffer;
    });
  };

  const handleLiveSubmit = (video) => {
    if (editData && typeof editData.idx === "number") {
      // Update existing session
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
      // Add new session
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

  const handleAddToPlaylist = (idx) => {
    const video = videos[idx];
    const playlists = JSON.parse(localStorage.getItem("playlists") || "[]");
    if (!playlists.some((v) => v.id === video.id)) {
      playlists.unshift(video);
      localStorage.setItem("playlists", JSON.stringify(playlists));
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

  if (loading)
    return <div className="text-center py-8">Loading live sessions...</div>;
  if (error)
    return <div className="text-red-500 text-center py-8">{error}</div>;

  return (
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 md:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <div className="flex gap-2">
          <button
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 text-sm sm:text-base"
            onClick={() => setShowCalendar(!showCalendar)}
          >
            {showCalendar ? "List View" : "Calendar View"}
          </button>
          <button
            className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 text-sm sm:text-base"
            onClick={() => setShowSetup(true)}
          >
            + Go Live / Schedule Live Session
          </button>
        </div>
      </div>
      {showSetup && (
        <LiveSetup
          onSubmit={handleLiveSubmit}
          editData={editData}
          onClose={closeSetup}
        />
      )}
      {!showSetup && (
        <Suspense
          fallback={
            <div className="text-center py-8">Loading video cards...</div>
          }
        >
          <div className="space-y-6">
            {showCalendar ? (
              <div className="calendar-view">
                <h2 className="text-xl font-bold mb-4">Scheduled Sessions</h2>
                {Object.keys(scheduledDates).length === 0 ? (
                  <div className="text-center text-gray-500">
                    No scheduled sessions.
                  </div>
                ) : (
                  Object.entries(scheduledDates).map(([date, sessions]) => (
                    <div key={date} className="mb-6">
                      <h3 className="text-lg font-semibold">{date}</h3>
                      <div className="space-y-4 mt-2">
                        {sessions.map((video, idx) => (
                          <div key={idx} className="w-full video-card">
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
                              onSaveToPlaylist={() =>
                                handleAddToPlaylist(
                                  videos.findIndex((v) => v.id === video.id)
                                )
                              }
                              menuOptions={[
                                "edit",
                                "share",
                                "saveToPlaylist",
                                "delete",
                              ]}
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
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <>
                {filteredVideos.length === 0 ? (
                  <div className="text-center text-gray-500 mt-12">
                    No live or scheduled sessions yet.
                  </div>
                ) : (
                  filteredVideos.map((video, idx) => (
                    <div key={idx} className="w-full video-card">
                      <VideoCard
                        video={video}
                        onEdit={() => handleEdit(video, idx)}
                        onDelete={() => handleDelete(idx)}
                        onArchive={() => handleArchive(idx)}
                        onSave={() => handleSave(idx)}
                        onShare={() => handleShare(idx)}
                        onSaveToPlaylist={() => handleAddToPlaylist(idx)}
                        onEndLive={() => endLive(idx)}
                        menuOptions={
                          video.scheduledTime && !video.isLive
                            ? ["edit", "share", "saveToPlaylist", "delete"]
                            : video.isLive
                            ? ["share"]
                            : [
                                "edit",
                                "archive",
                                "save",
                                "saveToPlaylist",
                                "share",
                                "delete",
                              ]
                        }
                        openMenu={openMenuIdx === idx}
                        setOpenMenu={(open) =>
                          setOpenMenuIdx(open ? idx : null)
                        }
                        menuRef={(el) => (menuRefs.current[idx] = el)}
                      />
                      {video.isLive && (
                        <button
                          className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                          onClick={() => endLive(idx)}
                        >
                          End Live
                        </button>
                      )}
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </Suspense>
      )}
    </div>
  );
};

export default Live;

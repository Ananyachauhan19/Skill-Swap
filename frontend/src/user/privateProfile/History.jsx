import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import VideoCard from "./VideoCard";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

// Placeholder SearchBar component (replace with actual SearchBar implementation)
const SearchBar = ({ searchQuery, setSearchQuery }) => {
  return (
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Search watch history..."
      className="w-full max-w-xs p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
    />
  );
};

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
  const [renderKey, setRenderKey] = useState(0); // Force re-render
  const menuRefs = useRef({});

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

  const handleRemove = (video) => {
    setHistory(prev =>
      prev.filter(item => !(item.videoId === video.videoId && item.watchDate === video.watchDate))
    );
    toast.info("Video removed from history (simulated)");
  };

  const handleReport = (video) => {
    navigate('/report', { state: { video } });
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear all watch history?")) {
      setHistory([]);
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

  return (
    <div className="p-4 max-w-3xl mx-auto min-h-[200px]" key={renderKey}>
      <div className="flex justify-between items-center mb-6">
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <h2 className="text-2xl font-bold">Watch History</h2>
        <button
          onClick={handleClearHistory}
          className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
        >
          Clear History
        </button>
      </div>
      <ToastContainer position="top-center" autoClose={2000} />
      {loading && <div className="text-center py-8">Loading history...</div>}
      {error && <div className="text-red-500 text-center py-8">{error}</div>}
      {!loading && !error && filteredVideos.length === 0 && (
        <div className="text-center text-gray-500">No watch history available.</div>
      )}
      {!loading && !error && filteredVideos.length > 0 && (
        <div className="space-y-6">
          {sortedDates.map((date, dateIdx) => (
            <div key={dateIdx}>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{date}</h3>
              <hr className="mb-4 border-gray-300" />
              <div className="space-y-6">
                {groupedHistory[date].map((item) => (
                  <div key={item.videoId} className="w-full">
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
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
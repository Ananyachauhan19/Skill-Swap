import React, { useEffect, useState, useRef } from "react";
import VideoCard from "./VideoCard";
import SearchBar from "./SearchBar";

const Saved = () => {
  const [saved, setSaved] = useState([]);
  const [filteredSaved, setFilteredSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenuIdx, setOpenMenuIdx] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRefs = useRef([]);

  // Backend API functions (commented for future implementation)
  /*
  const fetchSaved = async () => {
    try {
      const res = await fetch("/api/saved", {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error("Failed to fetch saved videos");
      const data = await res.json();
      return data;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const removeSaved = async (videoId) => {
    try {
      const res = await fetch(`/api/saved/${videoId}`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error("Failed to remove saved video");
      return await res.json();
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const saveToPlaylist = async (videoId, playlistId) => {
    try {
      const res = await fetch(`/api/playlists/${playlistId}/videos`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoId })
      });
      if (!res.ok) throw new Error("Failed to add to playlist");
      return await res.json();
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const reportVideo = async (videoId) => {
    try {
      const res = await fetch("/api/report/video", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoId, reason: 'User report' })
      });
      if (!res.ok) throw new Error("Failed to report video");
      return await res.json();
    } catch (err) {
      throw new Error(err.message);
    }
  };
  */

  // Load saved videos from localStorage or static data
  useEffect(() => {
    setTimeout(() => {
      try {
        const savedVideos = JSON.parse(localStorage.getItem("savedVideos") || "[]");
        const initialVideos = savedVideos.length > 0 ? savedVideos : [
          {
            id: "1",
            title: "Saved React Session",
            description: "This session is saved.",
            thumbnail: "https://placehold.co/320x180?text=Saved+1",
            videoUrl: "",
            uploadDate: new Date().toLocaleString(),
            lastEdited: new Date().toLocaleString(),
            userId: "user123",
            isLive: false,
            viewers: 0,
            likes: 0,
            dislikes: 0,
            skillmates: 5,
            views: 120,
          },
          {
            id: "2",
            title: "Saved Node.js Session",
            description: "This session is saved.",
            thumbnail: "https://placehold.co/320x180?text=Saved+2",
            videoUrl: "",
            uploadDate: new Date().toLocaleString(),
            lastEdited: new Date().toLocaleString(),
            userId: "user456",
            isLive: false,
            viewers: 0,
            likes: 0,
            dislikes: 0,
            skillmates: 3,
            views: 80,
          },
        ];
        setSaved(initialVideos);
        setFilteredSaved(initialVideos);
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
    setFilteredSaved(searchQuery
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

  const handleSaveToPlaylist = (video) => {
    const playlists = JSON.parse(localStorage.getItem("playlists") || "[]");
    const defaultPlaylist = playlists.find(p => p.name === "Default") || { name: "Default", videos: [] };
    if (!defaultPlaylist.videos.find(v => v.id === video.id)) {
      defaultPlaylist.videos.push(video);
      const updatedPlaylists = playlists.filter(p => p.name !== "Default");
      updatedPlaylists.push(defaultPlaylist);
      localStorage.setItem("playlists", JSON.stringify(updatedPlaylists));
      alert(`Added "${video.title}" to Default playlist`);
    } else {
      alert(`"${video.title}" is already in Default playlist`);
    }
  };

  const handleReport = (video) => {
    alert(`Reported "${video.title}" for review`);
  };

  if (loading) return <div className="text-center py-8">Loading saved videos...</div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

  return (
    <div className="w-full max-w-8xl mx-auto px-2 sm:px-4 md:px-8">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
        <h2 className="text-lg sm:text-xl font-bold">Saved Videos</h2>
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        {filteredSaved.length > 0 && (
    <button
      className="w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded text-sm shadow hover:bg-red-700"
      onClick={handleRemoveAll}
    >
      Remove All
    </button>
  )}
      </div>
      <div className="space-y-6">
        {filteredSaved.length === 0 ? (
          <div className="text-center text-gray-500 mt-12">No saved videos.</div>
        ) : (
          filteredSaved.map((video, idx) => (
            <div key={idx} className="w-full">
              <VideoCard
                video={{
                  ...video,
                  uploadDate: `Saved: ${video.uploadDate}`,
                  lastEdited: `Last Edited: ${video.lastEdited}`,
                }}
                menuOptions={["report", "remove", "share", "saveToPlaylist"]}
                onReport={() => handleReport(video)}
                onRemove={() => handleRemove(idx)}
                onShare={() => handleShare(video)}
                onSaveToPlaylist={() => handleSaveToPlaylist(video)}
                openMenu={openMenuIdx === idx}
                setOpenMenu={(open) => setOpenMenuIdx(open ? idx : null)}
                menuRef={(el) => (menuRefs.current[idx] = el)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Saved;
import React, { useEffect, useState, useRef } from 'react';
import VideoCard from '../privateProfile/VideoCard';
import { useNavigate } from "react-router-dom";

const PublicLive = () => {
  const [liveVideos, setLiveVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenuIdx, setOpenMenuIdx] = useState(null);
  const menuRefs = useRef([]); 
  const navigate = useNavigate();

  // Fetch live and scheduled videos from Live.jsx 
  useEffect(() => {
    setTimeout(() => {
      try {
        // Load from localStorage (matches Live.jsx)
        const savedLiveVideos = JSON.parse(localStorage.getItem("liveVideos") || "[]");
        const initialLiveVideos = savedLiveVideos.length > 0 ? savedLiveVideos : [
          {
            id: "live1",
            title: 'React Live Coding',
            isLive: true,
            scheduledTime: new Date(Date.now() + 3600 * 1000).toISOString(),
            host: 'Ananya Sharma',
            viewers: 120,
            thumbnail: 'https://placehold.co/320x180?text=Live+1',
            userId: 'user123',
          },
          {
            id: "live2",
            title: 'Node.js Q&A',
            isLive: false,
            scheduledTime: new Date(Date.now() + 7200 * 1000).toISOString(),
            host: 'Rahul Verma',
            viewers: 80,
            thumbnail: 'https://placehold.co/320x180?text=Live+2',
            userId: 'user456',
          },
        ];
        setLiveVideos(initialLiveVideos.filter(video => video.isLive || video.scheduledTime)); // Only live or scheduled
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch live videos');
        setLoading(false);
      }
    }, 0);
    // Backend fetch (commented for demo)
    /*
    const fetchPublicLive = async () => {
      try {
        const res = await fetch('/api/user/live?userId=public', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!res.ok) throw new Error('Failed to fetch live videos');
        const data = await res.json();
        setLiveVideos(data.filter(video => video.isLive || video.scheduledTime));
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch live videos');
        setLoading(false);
      }
    };
    fetchPublicLive();
    */
  }, []);

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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuIdx]);

  // Menu options for public view
  const menuOptions = ['save', 'share', 'report'];

  // Menu action handlers
  const handleSave = (video) => {
    // Simulate saving video (e.g., to user's saved list)
    const savedVideos = JSON.parse(localStorage.getItem('savedVideos') || '[]');
    if (!savedVideos.find(v => v.id === video.id)) {
      savedVideos.push(video);
      localStorage.setItem('savedVideos', JSON.stringify(savedVideos));
      alert(`Saved "${video.title}" to your list`);
    } else {
      alert(`"${video.title}" is already saved`);
    }
    // Backend (commented)
    /*
    fetch('/api/user/save-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ videoId: video.id })
    });
    */
  };

  const handleShare = (video) => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/watch/${video.id}`;
    navigator.clipboard.writeText(shareUrl);
    alert(`Link copied to clipboard: ${shareUrl}`);
  };

  const handleReport = (video) => {
    // Simulate reporting video
    navigate("/report", { state: { video } });
    // Backend (commented)
    /*
    fetch('/api/report/video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ videoId: video.id, reason: 'User report' })
    });
    */
  };

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 to-cream-100 min-h-screen py-2 sm:py-6 px-0 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full mx-auto px-2 sm:px-0">
        <h2 className="text-base sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-6 text-dark-blue tracking-tight">Live & Scheduled Videos</h2>
        {loading && <div className="text-gray-600 text-xs sm:text-sm py-3 sm:py-8">Loading...</div>}
        {error && <div className="text-red-500 text-xs sm:text-sm py-3 sm:py-8">{error}</div>}
        {liveVideos.length === 0 && !loading && (
          <div className="text-gray-600 text-xs sm:text-sm py-3 sm:py-8">No live or scheduled videos available.</div>
        )}
        <div className="space-y-2 sm:space-y-6">
          {liveVideos.map((video, idx) => (
            <VideoCard
              key={idx}
              video={video}
              menuOptions={menuOptions}
              onSave={() => handleSave(video)}
              onShare={() => handleShare(video)}
              onReport={(video) => handleReport(video)}
              openMenu={openMenuIdx === idx}
              setOpenMenu={(open) => setOpenMenuIdx(open ? idx : null)}
              menuRef={(el) => (menuRefs.current[idx] = el)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PublicLive;
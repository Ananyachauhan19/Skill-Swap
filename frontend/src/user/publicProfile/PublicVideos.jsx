import React, { useEffect, useState, useRef } from 'react';
import VideoCard from '../privateProfile/VideoCard';
import { useNavigate } from "react-router-dom";

const PublicVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenuIdx, setOpenMenuIdx] = useState(null);
  const menuRefs = useRef([]); 
  const navigate = useNavigate();

  // Fetch uploaded videos from Videos.jsx (localStorage or backend)
  useEffect(() => {
    setTimeout(() => {
      try {
        // Load from localStorage (matches Videos.jsx)
        const savedVideos = JSON.parse(localStorage.getItem("uploadedVideos") || "[]");
        const initialVideos = savedVideos.length > 0 ? savedVideos : [
          {
            id: "1",
            title: 'React Hooks Tutorial',
            description: 'Learn React Hooks in depth.',
            thumbnail: 'https://placehold.co/320x180?text=React+Hooks',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            uploadDate: new Date().toLocaleString(),
            lastEdited: new Date().toLocaleString(),
            userId: 'user123',
            skillmates: 5,
            views: 120,
            likes: 20,
            dislikes: 1,
            isLive: false,
            scheduledTime: null,
            isDraft: false,
            isArchived: false,
          },
          {
            id: "2",
            title: 'Node.js Crash Course',
            description: 'A quick start to Node.js.',
            thumbnail: 'https://placehold.co/320x180?text=Node+JS',
            videoUrl: 'https://www.w3schools.com/html/movie.mp4',
            uploadDate: new Date().toLocaleString(),
            lastEdited: new Date().toLocaleString(),
            userId: 'user456',
            skillmates: 3,
            views: 80,
            likes: 10,
            dislikes: 0,
            isLive: false,
            scheduledTime: null,
            isDraft: false,
            isArchived: false,
          },
        ];
        setVideos(initialVideos.filter(video => !video.isDraft && !video.isArchived && !video.isLive)); // Exclude drafts, archived, and live videos
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch videos');
        setLoading(false);
      }
    }, 0);
    
    // Backend fetch (commented for demo)
    /*
    const fetchPublicVideos = async () => {
      try {
        const res = await fetch('/api/user/videos?userId=public', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!res.ok) throw new Error('Failed to fetch videos');
        const data = await res.json();
        setVideos(data.filter(video => !video.isDraft && !video.isArchived && !video.isLive));
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch videos');
        setLoading(false);
      }
    };
    fetchPublicVideos();
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
  const menuOptions = ['report', 'save', 'share'];

  // Menu action handlers
  const handleSave = (video) => {
    // Simulate saving video to user's saved list
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
    <div className="w-full bg-gradient-to-br from-blue-50 to-cream-100 min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-dark-blue tracking-tight">Uploaded Videos</h2>
        {loading && <p className="text-gray-600 text-sm">Loading...</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {videos.length === 0 && !loading && (
          <p className="text-gray-600 text-sm">No uploaded videos available.</p>
        )}
        <div className="space-y-6">
          {videos.map((video, idx) => (
            <VideoCard
              key={idx}
              video={{
                ...video,
                uploadDate: `Uploaded: ${video.uploadDate}`, // Format for display
                lastEdited: `Last Edited: ${video.lastEdited}`, // Include lastEdited
              }}
              menuOptions={menuOptions}
              onReport={(video) => handleReport(video)}
              onSave={() => handleSave(video)}
              onShare={() => handleShare(video)}
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

export default PublicVideos;
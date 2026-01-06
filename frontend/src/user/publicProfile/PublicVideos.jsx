import React, { useEffect, useState, useRef, useContext } from 'react';
import VideoCard from '../privateProfile/VideoCard';
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from '../../config.js';
import { ProfileContext } from './SideBarPublic';

const PublicVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenuIdx, setOpenMenuIdx] = useState(null);
  const menuRefs = useRef([]); 
  const navigate = useNavigate();
  const { profileUserId } = useContext(ProfileContext) || {};

  // Fetch uploaded videos from backend
  useEffect(() => {
    const fetchPublicVideos = async () => {
      try {
        setLoading(true);
        const userId = profileUserId || new URLSearchParams(window.location.search).get('userId');
        
        if (!userId) {
          setError('No user ID found');
          setLoading(false);
          return;
        }

        const response = await fetch(`${BACKEND_URL}/api/videos/user/${userId}`, {
          method: 'GET',
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch videos');
        }

        const data = await response.json();
        setVideos(data.videos || []);
        setError(null);
      } catch (err) {
        console.error('Fetch public videos error:', err);
        setError('Failed to fetch videos');
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicVideos();
  }, [profileUserId]);

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
    <div className="w-full py-3 sm:py-6">
      <div className="max-w-6xl w-full mx-auto lg:mx-0">
        {loading && <p className="text-gray-600 text-xs sm:text-sm py-2 sm:py-4">Loading...</p>}
        {error && <p className="text-red-500 text-xs sm:text-sm py-2 sm:py-4">{error}</p>}
        {videos.length === 0 && !loading && (
          <p className="text-gray-600 text-xs sm:text-sm py-2 sm:py-4">No uploaded videos available.</p>
        )}
        <div className="space-y-2 sm:space-y-6">
          {videos.map((video, idx) => (
            <VideoCard
              key={video._id || idx}
              video={{
                ...video,
                id: video._id,
                thumbnail: video.thumbnailUrl,
                likes: Array.isArray(video.likes) ? video.likes : [],
                dislikes: Array.isArray(video.dislikes) ? video.dislikes : [],
                likeCount: Array.isArray(video.likes) ? video.likes.length : 0,
                dislikeCount: Array.isArray(video.dislikes) ? video.dislikes.length : 0,
                views: video.views || 0,
                userId: typeof video.userId === 'object' ? (video.userId?.username || `${video.userId?.firstName || ''} ${video.userId?.lastName || ''}`.trim() || 'Unknown') : (video.userId || 'Unknown'),
              }}
              menuOptions={menuOptions}
              onReport={() => handleReport(video)}
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
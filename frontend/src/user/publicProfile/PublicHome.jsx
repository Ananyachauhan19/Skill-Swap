import React, { useEffect, useState, useRef, useContext } from 'react';
import VideoCard from '../privateProfile/VideoCard';
import { ProfileContext } from './SideBarPublic';
import { useNavigate } from "react-router-dom";

const PublicHome = () => {
  const navigate = useNavigate();
  const { searchQuery } = useContext(ProfileContext);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenuIdx, setOpenMenuIdx] = useState(null);
  const menuRefs = useRef([]);

  // Fetch live/scheduled videos from Live.jsx and uploaded videos from Videos.jsx
  useEffect(() => {
    setTimeout(() => {
      try {
        // Load live/scheduled videos from Live.jsx
        const liveVideos = JSON.parse(localStorage.getItem("liveVideos") || "[]").map(video => ({
          ...video,
          type: 'live',
          date: video.scheduledTime || video.uploadDate || new Date().toISOString(),
        }));
        // Load uploaded videos from Videos.jsx
        const uploadedVideos = JSON.parse(localStorage.getItem("uploadedVideos") || "[]").map(video => ({
          ...video,
          type: 'video',
          date: video.uploadDate || new Date().toISOString(),
        }));
        // Static demo data (fallback if localStorage is empty)
        const initialContent = (liveVideos.length > 0 || uploadedVideos.length > 0)
          ? [...liveVideos, ...uploadedVideos]
          : [
              {
                type: 'live',
                id: "live1",
                title: 'React Live Coding',
                isLive: true,
                scheduledTime: new Date(Date.now() + 3600 * 1000).toISOString(),
                host: 'Ananya Sharma',
                viewers: 120,
                thumbnail: 'https://placehold.co/320x180?text=Live+1',
                userId: 'user123',
                date: new Date(Date.now() + 3600 * 1000).toISOString(),
              },
              {
                type: 'live',
                id: "live2",
                title: 'Node.js Q&A',
                isLive: false,
                scheduledTime: new Date(Date.now() + 7200 * 1000).toISOString(),
                host: 'Rahul Verma',
                viewers: 80,
                thumbnail: 'https://placehold.co/320x180?text=Live+2',
                userId: 'user456',
                date: new Date(Date.now() + 7200 * 1000).toISOString(),
              },
              {
                type: 'video',
                id: "video1",
                title: 'React Hooks Tutorial',
                description: 'Learn React Hooks in depth.',
                thumbnail: 'https://placehold.co/320x180?text=React+Hooks',
                videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
                uploadDate: new Date().toISOString(),
                lastEdited: new Date().toISOString(),
                userId: 'user123',
                skillmates: 5,
                views: 120,
                likes: 20,
                dislikes: 1,
                isLive: false,
                scheduledTime: null,
                isDraft: false,
                isArchived: false,
                date: new Date().toISOString(),
              },
              {
                type: 'video',
                id: "video2",
                title: 'Node.js Crash Course',
                description: 'A quick start to Node.js.',
                thumbnail: 'https://placehold.co/320x180?text=Node+JS',
                videoUrl: 'https://www.w3schools.com/html/movie.mp4',
                uploadDate: new Date().toISOString(),
                lastEdited: new Date().toISOString(),
                userId: 'user456',
                skillmates: 3,
                views: 80,
                likes: 10,
                dislikes: 0,
                isLive: false,
                scheduledTime: null,
                isDraft: false,
                isArchived: false,
                date: new Date().toISOString(),
              },
            ];
        // Filter by searchQuery and exclude drafts/archived, then sort by date
        const filteredContent = initialContent
          .filter(item => !item.isDraft && !item.isArchived && 
            item.title.toLowerCase().includes(searchQuery.toLowerCase()))
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setContent(filteredContent);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch content');
        setLoading(false);
      }
    }, 0);
    
    // Backend fetch (commented for demo)
    /*
    const fetchPublicContent = async () => {
      try {
        const liveRes = await fetch('/api/user/live?userId=public', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const videoRes = await fetch('/api/user/videos?userId=public', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!liveRes.ok || !videoRes.ok) throw new Error('Failed to fetch content');
        const liveData = await liveRes.json();
        const videoData = await videoRes.json();
        const allContent = [
          ...liveData.map(video => ({ ...video, type: 'live', date: video.scheduledTime || video.uploadDate })),
          ...videoData.map(video => ({ ...video, type: 'video', date: video.uploadDate })),
        ].filter(item => !item.isDraft && !item.isArchived && 
          item.title.toLowerCase().includes(searchQuery.toLowerCase()))
         .sort((a, b) => new Date(b.date) - new Date(a.date));
        setContent(allContent);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch content');
        setLoading(false);
      }
    };
    fetchPublicContent();
    */
  }, [searchQuery]);

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
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-dark-blue tracking-tight">All Content</h2>
        {loading && <div className="text-gray-600 text-sm py-8">Loading content...</div>}
        {error && <div className="text-red-500 text-sm py-8">{error}</div>}
        {content.length === 0 && !loading && (
          <div className="text-gray-600 text-sm py-8">No content available.</div>
        )}
        <div className="space-y-6">
          {content.map((item, idx) => (
            <div key={idx} className="w-full">
              <VideoCard
                video={{
                  ...item,
                  uploadDate: item.type === 'live' ? `Live: ${item.scheduledTime || item.date}` : `Uploaded: ${item.uploadDate}`,
                  lastEdited: item.lastEdited ? `Last Edited: ${item.lastEdited}` : null,
                }}
                menuOptions={menuOptions}
                onReport={(item) => handleReport(item)}
                onSave={() => handleSave(item)}
                onShare={() => handleShare(item)}
                openMenu={openMenuIdx === idx}
                setOpenMenu={(open) => setOpenMenuIdx(open ? idx : null)}
                menuRef={(el) => (menuRefs.current[idx] = el)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PublicHome;
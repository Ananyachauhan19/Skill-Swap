import React, { useEffect, useState, useRef, useContext } from 'react';
import VideoCard from '../privateProfile/VideoCard';
import { ProfileContext } from './SideBarPublic';
import { useNavigate } from "react-router-dom";
import api from '../../lib/api';
import { BACKEND_URL } from '../../config';
import { useToast } from '../../components/ToastContext.js';

const PublicHome = () => {
  const navigate = useNavigate();
  const { searchQuery } = useContext(ProfileContext);
  const { addToast } = useToast();
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenuIdx, setOpenMenuIdx] = useState(null);
  const menuRefs = useRef([]);

  // Fetch public content for the viewed user from backend
  useEffect(() => {
    const fetchPublicContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');
        // Try to infer username from pathname 
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        // e.g., /profile/:username or /public-profile
        const username = pathParts[0] === 'profile' && pathParts[1] ? decodeURIComponent(pathParts[1]) : null;

        // Choose endpoints based on available identifier
        const liveUrl = username
          ? `${BACKEND_URL}/api/auth/public/live/${username}`
          : userId
          ? `${BACKEND_URL}/api/auth/public/live/byId/${userId}`
          : null;
        const videosUrl = username
          ? `${BACKEND_URL}/api/auth/public/videos/${username}`
          : userId
          ? `${BACKEND_URL}/api/auth/public/videos/byId/${userId}`
          : null;

        let initialContent = [];

        if (liveUrl && videosUrl) {
          const [liveRes, videosRes] = await Promise.all([
            api.get(liveUrl, { withCredentials: false }),
            api.get(videosUrl, { withCredentials: false }),
          ]);

          const liveData = (liveRes?.data?.liveSessions || []).map((v) => ({
            ...v,
            type: 'live',
            date: v.scheduledTime || v.uploadDate || new Date().toISOString(),
          }));
          const videoData = (videosRes?.data?.videos || []).map((v) => ({
            ...v,
            type: 'video',
            date: v.uploadDate || new Date().toISOString(),
          }));
          initialContent = [...liveData, ...videoData];
        } else {
          // Fallback to localStorage/static demo data when no identifier is present
          const liveVideos = JSON.parse(localStorage.getItem('liveVideos') || '[]').map((video) => ({
            ...video,
            type: 'live',
            date: video.scheduledTime || video.uploadDate || new Date().toISOString(),
          }));
          const uploadedVideos = JSON.parse(localStorage.getItem('uploadedVideos') || '[]').map((video) => ({
            ...video,
            type: 'video',
            date: video.uploadDate || new Date().toISOString(),
          }));
          initialContent = [...liveVideos, ...uploadedVideos];
          if (initialContent.length === 0) {
            initialContent = [
              {
                type: 'live',
                id: 'live1',
                title: 'React Live Coding',
                isLive: true,
                scheduledTime: new Date(Date.now() + 3600 * 1000).toISOString(),
                host: 'User',
                viewers: 120,
                thumbnail: 'https://placehold.co/320x180?text=Live+1',
                userId: 'user123',
                date: new Date(Date.now() + 3600 * 1000).toISOString(),
              },
              {
                type: 'video',
                id: 'video1',
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
          }
        }

        const filteredContent = initialContent
          .filter(
            (item) =>
              !item.isDraft &&
              !item.isArchived &&
              (item.title || '')
                .toString()
                .toLowerCase()
                .includes((searchQuery || '').toLowerCase())
          )
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setContent(filteredContent);
      } catch (err) {
        console.warn('[DEBUG] PublicHome fetch error:', err?.message || err);
        setError('Failed to fetch content');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicContent();
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
      addToast({ title: 'Saved', message: `Saved "${video.title}" to your list`, variant: 'success', timeout: 2500 });
    } else {
      addToast({ title: 'Already Saved', message: `"${video.title}" is already saved`, variant: 'info', timeout: 2500 });
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
    addToast({ title: 'Link Copied', message: shareUrl, variant: 'info', timeout: 2500 });
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
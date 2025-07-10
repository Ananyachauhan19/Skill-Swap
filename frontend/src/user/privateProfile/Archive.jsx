import React, { useEffect, useState, useRef } from "react";
import VideoCard from "./VideoCard";
import SearchBar from "./SearchBar";


const Archive = () => {
  const [archived, setArchived] = useState([]);
  const [filteredArchived, setFilteredArchived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuIdx, setOpenMenuIdx] = useState(null);
  const menuRefs = useRef([]);

  // Backend API functions (commented for future implementation)
  /*
  const fetchArchived = async () => {
    try {
      const res = await fetch("/api/archived", {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error("Failed to fetch archived videos");
      const data = await res.json();
      return data;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const unarchiveVideo = async (id) => {
    try {
      const res = await fetch(`/api/archived/${id}/unarchive`, {
        method: "PUT",
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error("Failed to unarchive video");
      return await res.json();
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const deleteArchived = async (id) => {
    try {
      const res = await fetch(`/api/archived/${id}`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error("Failed to delete archived video");
      return await res.json();
    } catch (err) {
      throw new Error(err.message);
    }
  };
  */

  // Load archived videos from localStorage or static data
  useEffect(() => {
    setTimeout(() => {
      try {
        const savedArchived = JSON.parse(
          localStorage.getItem("archivedVideos") || "[]"
        );
        const initialArchived =
          savedArchived.length > 0
            ? savedArchived
            : [
                {
                  id: "1",
                  title: "Archived React Session",
                  description: "This session is archived.",
                  thumbnail: "https://placehold.co/320x180?text=Archived+1",
                  videoUrl: "",
                  uploadDate: new Date().toLocaleString(),
                  lastEdited: new Date().toLocaleString(), // Added for consistency
                  userId: "user123",
                  isArchived: true,
                },
                {
                  id: "2",
                  title: "Archived Node.js Session",
                  description: "This session is archived.",
                  thumbnail: "https://placehold.co/320x180?text=Archived+2",
                  videoUrl: "",
                  uploadDate: new Date().toLocaleString(),
                  lastEdited: new Date().toLocaleString(), // Added for consistency
                  userId: "user456",
                  isArchived: true,
                },
              ];
        setArchived(initialArchived);
        setFilteredArchived(initialArchived);
        setLoading(false);
      } catch (err) {
        setError("Failed to load archived videos");
        setLoading(false);
      }
    }, 0);
  }, []);

  // Filter archived videos based on search query
  useEffect(() => {
    let filtered = archived;
    if (searchQuery) {
      filtered = archived.filter(
        (video) =>
          video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (video.description &&
            video.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    setFilteredArchived(filtered);
  }, [searchQuery, archived]);

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

  // Unarchive: move video back to uploadedVideos
  const handleUnarchive = (idx) => {
    const video = archived[idx];
    const updatedVideo = {
      ...video,
      isArchived: false,
      lastEdited: new Date().toLocaleString(), // Update lastEdited
    };
    // Remove from archive
    const updated = archived.filter((_, i) => i !== idx);
    setArchived(updated);
    setFilteredArchived(
      searchQuery
        ? updated.filter(
            (video) =>
              video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (video.description &&
                video.description
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()))
          )
        : updated
    );
    localStorage.setItem("archivedVideos", JSON.stringify(updated));
    // Add to uploadedVideos
    const videos = JSON.parse(localStorage.getItem("uploadedVideos") || "[]");
    videos.unshift(updatedVideo);
    localStorage.setItem("uploadedVideos", JSON.stringify(videos));
  };

  // Delete from archive
  const handleDelete = (idx) => {
    const updated = archived.filter((_, i) => i !== idx);
    setArchived(updated);
    setFilteredArchived(
      searchQuery
        ? updated.filter(
            (video) =>
              video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (video.description &&
                video.description
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()))
          )
        : updated
    );
    localStorage.setItem("archivedVideos", JSON.stringify(updated));
  };

  // Unarchive all: move all videos back to uploadedVideos
  const handleUnarchiveAll = () => {
    if (archived.length === 0) return;
    const updatedVideos = archived.map((video) => ({
      ...video,
      isArchived: false,
      lastEdited: new Date().toLocaleString(), // Update lastEdited
    }));
    // Clear archive
    setArchived([]);
    setFilteredArchived([]);
    localStorage.setItem("archivedVideos", JSON.stringify([]));
    // Add to uploadedVideos
    const videos = JSON.parse(localStorage.getItem("uploadedVideos") || "[]");
    localStorage.setItem(
      "uploadedVideos",
      JSON.stringify([...updatedVideos, ...videos])
    );
  };

  if (loading)
    return <div className="text-center py-8">Loading archived videos...</div>;
  if (error)
    return <div className="text-red-500 text-center py-8">{error}</div>;

  return (
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 md:px-8">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
        <h2 className="text-lg sm:text-xl font-bold">Archived Videos</h2>
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        {filteredArchived.length > 0 && (
          <button
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded text-sm shadow hover:bg-blue-700"
            onClick={handleUnarchiveAll}
          >
            Unarchive All
          </button>
        )}
      </div>
      <div className="space-y-6">
        {filteredArchived.length === 0 ? (
          <div className="text-center text-gray-500 mt-12">
            No archived videos.
          </div>
        ) : (
          filteredArchived.map((video, idx) => (
            <div key={idx} className="w-full">
              <VideoCard
                video={{
                  ...video,
                  uploadDate: `Archived: ${video.uploadDate}`,
                  lastEdited: `Last Edited: ${video.lastEdited}`,
                }}
                onDelete={() => handleDelete(idx)}
                onUnArchive={() => handleUnarchive(idx)}
                menuOptions={["unarchive", "delete"]}
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

export default Archive;

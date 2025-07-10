import React, { useEffect, useState, useRef } from "react";
import VideoCard from "./VideoCard";
import SearchBar from "./SearchBar";
import DraftForm from "./DraftForm";
import { useNavigate } from "react-router-dom";

const Draft = () => {
  const [drafts, setDrafts] = useState([]);
  const [filteredDrafts, setFilteredDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDraftForm, setShowDraftForm] = useState(false);
  const [editDraftIdx, setEditDraftIdx] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuIdx, setOpenMenuIdx] = useState(null); // Track open menu
  const menuRefs = useRef([]); // Refs for menu elements
  const navigate = useNavigate();

  // Backend API functions (commented for future implementation)
  /*
  const fetchDrafts = async () => {
    try {
      const res = await fetch("/api/drafts", {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error("Failed to fetch drafts");
      const data = await res.json();
      return data;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const saveDraft = async (draftData) => {
    const formData = new FormData();
    Object.entries(draftData).forEach(([key, value]) => {
      formData.append(key, value);
    });
    try {
      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      if (!res.ok) throw new Error("Failed to save draft");
      return await res.json();
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const updateDraft = async (id, draftData) => {
    const formData = new FormData();
    Object.entries(draftData).forEach(([key, value]) => {
      formData.append(key, value);
    });
    try {
      const res = await fetch(`/api/drafts/${id}`, {
        method: "PUT",
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      if (!res.ok) throw new Error("Failed to update draft");
      return await res.json();
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const deleteDraft = async (id) => {
    try {
      const res = await fetch(`/api/drafts/${id}`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error("Failed to delete draft");
      return await res.json();
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const postVideo = async (videoData) => {
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
      if (!res.ok) throw new Error("Failed to post video");
      return await res.json();
    } catch (err) {
      throw new Error(err.message);
    }
  };
  */

  // Load drafts from localStorage or static data
  useEffect(() => {
    setTimeout(() => {
      try {
        const savedDrafts = JSON.parse(localStorage.getItem("videoDrafts") || "[]");
        const initialDrafts = savedDrafts.length > 0 ? savedDrafts : [
          {
            draftId: "d1",
            title: "React Custom Hooks",
            description: "Draft for custom hooks session.",
            thumbnail: "https://placehold.co/320x180?text=Draft+1",
            videoUrl: "",
            uploadDate: new Date().toLocaleString(),
            lastEdited: new Date().toLocaleString(),
            userId: "user123",
            isDraft: true,
          },
          {
            draftId: "d2",
            title: "Node.js Streams",
            description: "Draft for Node.js streams.",
            thumbnail: "https://placehold.co/320x180?text=Draft+2",
            videoUrl: "",
            uploadDate: new Date().toLocaleString(),
            lastEdited: new Date().toLocaleString(),
            userId: "user456",
            isDraft: true,
          },
        ];
        setDrafts(initialDrafts);
        setFilteredDrafts(initialDrafts);
        setLoading(false);
      } catch (err) {
        setError("Failed to load drafts");
        setLoading(false);
      }
    }, 1000);
  }, []);

  // Filter drafts based on search query
  useEffect(() => {
    let filtered = drafts;
    if (searchQuery) {
      filtered = drafts.filter(
        (draft) =>
          draft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (draft.description &&
            draft.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    setFilteredDrafts(filtered);
  }, [searchQuery, drafts]);

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

  // Handle draft submission (edit or new)
  const handleDraftSubmit = (draftData) => {
    let updatedDrafts;
    if (editDraftIdx !== null && drafts[editDraftIdx]) {
      // Update existing draft
      updatedDrafts = [...drafts];
      updatedDrafts[editDraftIdx] = {
        ...drafts[editDraftIdx],
        ...draftData,
        lastEdited: new Date().toLocaleString(), // Update last edited timestamp
      };
    } else {
      // New draft (not used here, but kept for completeness)
      updatedDrafts = [{ ...draftData, draftId: Date.now().toString(), uploadDate: new Date().toLocaleString(), lastEdited: new Date().toLocaleString(), isDraft: true }, ...drafts];
    }
    localStorage.setItem("videoDrafts", JSON.stringify(updatedDrafts));
    setDrafts(updatedDrafts);
    setFilteredDrafts(searchQuery
      ? updatedDrafts.filter(
          (draft) =>
            draft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (draft.description &&
              draft.description.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : updatedDrafts
    );
    setShowDraftForm(false);
    setEditDraftIdx(null);
  };

  // Delete draft
  const handleDelete = (idx) => {
    const updatedDrafts = drafts.filter((_, i) => i !== idx);
    localStorage.setItem("videoDrafts", JSON.stringify(updatedDrafts));
    setDrafts(updatedDrafts);
    setFilteredDrafts(searchQuery
      ? updatedDrafts.filter(
          (draft) =>
            draft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (draft.description &&
              draft.description.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : updatedDrafts
    );
  };

  // Edit draft: show form with existing data
  const handleEdit = (video, idx) => {
    setEditDraftIdx(idx);
    setShowDraftForm(true);
  };

  // Post draft: move to videos
  const handlePost = (idx) => {
    const draft = drafts[idx];
    const postedVideo = {
      ...draft,
      isDraft: false,
      id: draft.draftId, // Use draftId as video id
      views: 0,
      likes: 0,
      dislikes: 0,
      skillmates: 0,
    };
    const updatedDrafts = drafts.filter((_, i) => i !== idx);
    localStorage.setItem("videoDrafts", JSON.stringify(updatedDrafts));
    setDrafts(updatedDrafts);
    setFilteredDrafts(searchQuery
      ? updatedDrafts.filter(
          (draft) =>
            draft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (draft.description &&
              draft.description.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : updatedDrafts
    );
    const videos = JSON.parse(localStorage.getItem("uploadedVideos") || "[]");
    videos.unshift(postedVideo);
    localStorage.setItem("uploadedVideos", JSON.stringify(videos));
  };

  // Close draft form
  const closeDraftForm = () => {
    setShowDraftForm(false);
    setEditDraftIdx(null);
  };

  if (loading) return <div className="text-center py-8">Loading drafts...</div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

  return (
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 md:px-8">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
        <h2 className="text-lg sm:text-xl font-bold">Draft Videos</h2>
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        {drafts.length > 0 && (
          <button
            className="w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded text-sm shadow hover:bg-red-700"
            onClick={() => {
              setDrafts([]);
              setFilteredDrafts([]);
              localStorage.removeItem("videoDrafts");
            }}
          >
            Delete All
          </button>
        )}
      </div>
      {showDraftForm && (
        <DraftForm
          onSubmit={handleDraftSubmit}
          editData={editDraftIdx !== null ? drafts[editDraftIdx] : null}
          onClose={closeDraftForm}
        />
      )}
      <div className="space-y-6">
        {filteredDrafts.length === 0 ? (
          <div className="text-center text-gray-500 mt-12">No drafts saved yet.</div>
        ) : (
          filteredDrafts.map((video, idx) => (
            <div key={idx} className="w-full">
              <VideoCard
                video={{
                  ...video,
                  uploadDate: `Saved: ${video.uploadDate}`,
                  lastEdited: `Last Edited: ${video.lastEdited}`,
                }}
                onEdit={() => handleEdit(video, idx)}
                onDelete={() => handleDelete(idx)}
                onPost={() => handlePost(idx)}
                menuOptions={["edit", "post", "delete"]}
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

export default Draft;
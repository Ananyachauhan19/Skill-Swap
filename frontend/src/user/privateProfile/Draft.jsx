import React, { useEffect, useState, useRef, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";

// Lazy load components
const VideoCard = lazy(() => import("./VideoCard"));
const DraftForm = lazy(() => import("./DraftForm"));

const Draft = () => {
  const [drafts, setDrafts] = useState([]);
  const [filteredDrafts, setFilteredDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDraftForm, setShowDraftForm] = useState(false);
  const [editDraftIdx, setEditDraftIdx] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuIdx, setOpenMenuIdx] = useState(null);
  const menuRefs = useRef([]);
  const observer = useRef(null);
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

  // Lazy loading observer
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
      if (observer.current) observer.current.disconnect();
    };
  }, [filteredDrafts]);

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
      updatedDrafts = [...drafts];
      updatedDrafts[editDraftIdx] = {
        ...drafts[editDraftIdx],
        ...draftData,
        lastEdited: new Date().toLocaleString(),
      };
    } else {
      updatedDrafts = [
        {
          ...draftData,
          draftId: Date.now().toString(),
          uploadDate: new Date().toLocaleString(),
          lastEdited: new Date().toLocaleString(),
          isDraft: true,
        },
        ...drafts,
      ];
    }
    localStorage.setItem("videoDrafts", JSON.stringify(updatedDrafts));
    setDrafts(updatedDrafts);
    setFilteredDrafts(
      searchQuery
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
    setFilteredDrafts(
      searchQuery
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
      id: draft.draftId,
      views: 0,
      likes: 0,
      dislikes: 0,
      skillmates: 0,
    };
    const updatedDrafts = drafts.filter((_, i) => i !== idx);
    localStorage.setItem("videoDrafts", JSON.stringify(updatedDrafts));
    setDrafts(updatedDrafts);
    setFilteredDrafts(
      searchQuery
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
    navigate("/profile/panel/videos");
  };

  // Close draft form
  const closeDraftForm = () => {
    setShowDraftForm(false);
    setEditDraftIdx(null);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, when: "beforeChildren", staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  const searchBarVariants = {
    hidden: { width: 0, opacity: 0, x: -20 },
    visible: { width: "auto", opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen w-full px-3 sm:px-4 md:px-6 font-[Inter] overflow-hidden"
    >
      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-black opacity-70 font-medium"
        >
          Loading drafts...
        </motion.div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-500 text-center py-8 font-medium"
        >
          {error}
        </motion.div>
      ) : (
        <>
          <header className="py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <motion.h2
                variants={itemVariants}
                className="text-2xl sm:text-3xl font-extrabold text-blue-900 tracking-tight"
              >
                Draft Videos
              </motion.h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="text-blue-900 text-2xl"
                onClick={() => setSearchOpen(!searchOpen)}
              >
                <FiSearch />
              </motion.button>
              <AnimatePresence>
                {searchOpen && (
                  <motion.div
                    variants={searchBarVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="overflow-hidden"
                  >
                    <input
                      type="text"
                      placeholder="Search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-b-2 border-blue-900 text-blue-900 placeholder-blue-900 focus:outline-none px-2 py-1"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {drafts.length > 0 && (
              <motion.div variants={itemVariants} className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto bg-blue-800 text-white px-4 py-1.5 rounded-md font-semibold hover:bg-blue-900 transition-all duration-300 text-sm sm:text-base"
                  onClick={() => {
                    setDrafts([]);
                    setFilteredDrafts([]);
                    localStorage.removeItem("videoDrafts");
                  }}
                >
                  Delete All
                </motion.button>
              </motion.div>
            )}
          </header>
          <Suspense
            fallback={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-black opacity-70 font-medium"
              >
                Loading draft cards...
              </motion.div>
            }
          >
            <AnimatePresence>
              {showDraftForm && (
                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="w-full mb-4"
                >
                  <DraftForm
                    onSubmit={handleDraftSubmit}
                    editData={editDraftIdx !== null ? drafts[editDraftIdx] : null}
                    onClose={closeDraftForm}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <section className="space-y-4 overflow-y-auto">
              {filteredDrafts.length === 0 ? (
                <motion.div
                  variants={itemVariants}
                  className="text-center text-black opacity-70 mt-12 text-lg font-medium"
                >
                  No drafts saved yet.
                </motion.div>
              ) : (
                filteredDrafts.map((video, idx) => (
                  <motion.article
                    key={video.draftId || idx}
                    variants={itemVariants}
                    className="video-card"
                  >
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
                  </motion.article>
                ))
              )}
            </section>
          </Suspense>
        </>
      )}
    </motion.div>
  );
};

export default Draft;
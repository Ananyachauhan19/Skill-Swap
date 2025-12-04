import React, { useEffect, useState, useRef, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { BACKEND_URL } from '../../config.js';

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

  // Backend API functions
  const fetchDrafts = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/videos?status=draft`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error("Failed to fetch drafts");
      const data = await response.json();
      return data.videos || [];
    } catch (err) {
      console.error('Fetch drafts error:', err);
      return [];
    }
  };

  const deleteDraft = async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/videos/${id}`, {
        method: "DELETE",
        credentials: 'include',
      });
      if (!response.ok) throw new Error("Failed to delete draft");
      return await response.json();
    } catch (err) {
      console.error('Delete draft error:', err);
      throw err;
    }
  };

  const updateDraft = async (id, draftData) => {
    const formData = new FormData();
    formData.append('title', draftData.title);
    formData.append('description', draftData.description);
    formData.append('isDraft', true);
    
    if (draftData.videoFile) {
      formData.append('video', draftData.videoFile);
    }
    if (draftData.thumbnailFile) {
      formData.append('thumbnail', draftData.thumbnailFile);
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/videos/${id}`, {
        method: "PUT",
        credentials: 'include',
        body: formData
      });
      if (!response.ok) throw new Error("Failed to update draft");
      return await response.json();
    } catch (err) {
      console.error('Update draft error:', err);
      throw err;
    }
  };

  const publishDraft = async (id) => {
    const formData = new FormData();
    formData.append('isDraft', false);

    try {
      const response = await fetch(`${BACKEND_URL}/api/videos/${id}`, {
        method: "PUT",
        credentials: 'include',
        body: formData
      });
      if (!response.ok) throw new Error("Failed to publish draft");
      return await response.json();
    } catch (err) {
      console.error('Publish draft error:', err);
      throw err;
    }
  };

  // Load drafts from backend
  useEffect(() => {
    async function loadDrafts() {
      setLoading(true);
      setError(null);
      try {
        const fetchedDrafts = await fetchDrafts();
        setDrafts(fetchedDrafts);
        setFilteredDrafts(fetchedDrafts);
      } catch (err) {
        setError("Failed to load drafts");
      } finally {
        setLoading(false);
      }
    }
    loadDrafts();
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
  const handleDelete = async (idx) => {
    const draft = drafts[idx];
    try {
      await deleteDraft(draft._id);
      const updatedDrafts = drafts.filter((_, i) => i !== idx);
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
    } catch (err) {
      alert('Failed to delete draft');
    }
  };

  // Edit draft: show form with existing data
  const handleEdit = (video, idx) => {
    setEditDraftIdx(idx);
    setShowDraftForm(true);
  };

  // Post draft: publish to videos
  const handlePost = async (idx) => {
    const draft = drafts[idx];
    try {
      await publishDraft(draft._id);
      const updatedDrafts = drafts.filter((_, i) => i !== idx);
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
      navigate("/profile/panel/videos");
    } catch (err) {
      alert('Failed to publish draft');
    }
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
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete all drafts?')) {
                      try {
                        await Promise.all(drafts.map(draft => deleteDraft(draft._id)));
                        setDrafts([]);
                        setFilteredDrafts([]);
                      } catch (err) {
                        alert('Failed to delete all drafts');
                      }
                    }
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
                    key={video._id || idx}
                    variants={itemVariants}
                    className="video-card"
                  >
                    <VideoCard
                      video={{
                        ...video,
                        userId: typeof video.userId === 'object' ? (video.userId?.username || video.userId?.firstName || 'Unknown') : video.userId,
                        thumbnail: video.thumbnailUrl,
                        likes: video.likes?.length || 0,
                        views: video.views || 0,
                        uploadDate: `Saved: ${new Date(video.createdAt).toLocaleString()}`,
                        lastEdited: `Last Edited: ${new Date(video.updatedAt).toLocaleString()}`,
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
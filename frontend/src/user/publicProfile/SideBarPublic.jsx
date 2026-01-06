import React, { useEffect, useRef, useState, createContext } from "react";
import {
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaGlobe,
  FaSearch,
  FaUser,
  FaGraduationCap,
  FaBriefcase,
  FaCode,
  FaChalkboardTeacher,
  FaChevronDown,
  FaArrowLeft,
} from "react-icons/fa";
import { MdReport } from "react-icons/md";
import { useNavigate, useParams } from "react-router-dom";
import ContributionCalendar from "../myprofile/ContributionCalendar";
// Chat is now a full-page experience at /chat
import SearchBar from "../privateProfile/SearchBar";
import { BACKEND_URL } from "../../config.js";
import { useToast } from "../../components/ToastContext.js";
import PublicHome from "./PublicHome";
import PublicLive from "./PublicLive";
import PublicVideos from "./PublicVideos";

export const ProfileContext = createContext();

const fetchUserProfile = async (
  username,
  userId,
  retries = 3,
  delay = 1000
) => {
  try {
    const url = username
      ? `${BACKEND_URL}/api/auth/user/public/${username}`
      : userId
      ? `${BACKEND_URL}/api/auth/user/profile?userId=${userId}`
      : `${BACKEND_URL}/api/auth/user/profile`;

    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error("Failed to fetch user profile");
    const user = await res.json();
    return {
      ...user,
      fullName:
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        "Unknown User",
    };
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchUserProfile(username, userId, retries - 1, delay * 2);
    }
    throw new Error("Failed to fetch user profile after retries");
  }
};

const SideBarPublic = ({ username, setNotFound }) => {
  const navigate = useNavigate();
  const { username: paramUsername } = useParams();
  const [activeTab, setActiveTab] = useState("home");

  // Desktop sidebar sizing (resizable)
  const layoutRef = useRef(null);
  const [sidebarWidth, setSidebarWidth] = useState(288); // default ~w-72
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [sidebarBottomPx, setSidebarBottomPx] = useState(0);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSkillMate, setIsSkillMate] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const { addToast } = useToast();

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  useEffect(() => {
    if (!isResizingSidebar) return;

    const onMove = (e) => {
      const next = e.clientX;
      setSidebarWidth(clamp(next, 240, 420));
    };

    const onUp = () => setIsResizingSidebar(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isResizingSidebar]);

  useEffect(() => {
    const updateSidebarBottomOffset = () => {
      const footer = document.getElementById("app-footer");
      if (!footer) {
        setSidebarBottomPx(0);
        return;
      }

      const rect = footer.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 0;

      if (rect.top >= viewportHeight) {
        setSidebarBottomPx(0);
        return;
      }

      const overlap = viewportHeight - rect.top;
      setSidebarBottomPx(Math.max(0, Math.round(overlap)));
    };

    updateSidebarBottomOffset();
    window.addEventListener("resize", updateSidebarBottomOffset);
    window.addEventListener("scroll", updateSidebarBottomOffset, { passive: true });
    return () => {
      window.removeEventListener("resize", updateSidebarBottomOffset);
      window.removeEventListener("scroll", updateSidebarBottomOffset);
    };
  }, []);

  useEffect(() => {
    const targetUsername = paramUsername || username;
    const userId = new URLSearchParams(window.location.search).get("userId");

    async function loadProfile() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchUserProfile(targetUsername, userId);
        setProfile(data);
        if (setNotFound) setNotFound(false);
        if (data._id) await checkSkillMateStatus(data._id);
      } catch (err) {
        setError(err.message);
        setProfile(null);
        if (setNotFound) setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    if (targetUsername || userId) loadProfile();
    else {
      setError("No username or userId provided");
      setLoading(false);
    }

    window.addEventListener("profileUpdated", loadProfile);
    return () => window.removeEventListener("profileUpdated", loadProfile);
  }, [paramUsername, username, setNotFound]);

  const checkSkillMateStatus = async (userId) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/skillmates/check/${userId}`,
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) throw new Error("Failed to check SkillMate status");
      const data = await response.json();
      setIsSkillMate(data.isSkillMate);
      setPendingRequest(data.pendingRequest);
    } catch (error) {
      console.warn("SkillMate status check failed:", error?.message);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowDropdown(false);
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target))
        setShowMobileMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sendSkillMateRequest = async (recipientId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/skillmates/request`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId }),
      });
      if (!response.ok) throw new Error("Failed to send SkillMate request");
      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  const handleAddSkillMate = async () => {
    if (!profile || !profile._id) return;
    setRequestLoading(true);
    try {
      const res = await sendSkillMateRequest(profile._id);
      setPendingRequest({ id: res?.skillMate?._id, isRequester: true });
      addToast({
        title: "Request Sent",
        message: "SkillMate request sent successfully.",
        variant: "success",
        timeout: 3000,
      });
    } catch (error) {
      addToast({
        title: "Error",
        message: error.message || "Failed to send SkillMate request",
        variant: "error",
        timeout: 4000,
      });
    } finally {
      setRequestLoading(false);
    }
  };

  const removeSkillMate = async (skillMateId) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/skillmates/remove/${skillMateId}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) throw new Error("Failed to remove SkillMate");
      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  const handleRemoveSkillMate = async () => {
    if (!profile || !profile._id) return;
    setRequestLoading(true);
    try {
      await removeSkillMate(profile._id);
      setIsSkillMate(false);
      setPendingRequest(null);
      setShowDropdown(false);
      addToast({
        title: "Removed",
        message: "SkillMate removed successfully.",
        variant: "success",
        timeout: 3000,
      });
    } catch (error) {
      addToast({
        title: "Error",
        message: error.message || "Failed to remove SkillMate",
        variant: "error",
        timeout: 4000,
      });
    } finally {
      setRequestLoading(false);
    }
  };

  const cancelSkillMateRequest = async (requestId) => {
    const response = await fetch(
      `${BACKEND_URL}/api/skillmates/requests/cancel/${requestId}`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to cancel SkillMate request");
    }

    return await response.json();
  };

  const handleCancelRequest = async () => {
    if (!pendingRequest?.id) return;
    setRequestLoading(true);
    try {
      await cancelSkillMateRequest(pendingRequest.id);
      setPendingRequest(null);
      setShowDropdown(false);
      addToast({
        title: "Cancelled",
        message: "SkillMate request cancelled.",
        variant: "success",
        timeout: 3000,
      });
    } catch (error) {
      addToast({
        title: "Error",
        message: error.message || "Failed to cancel SkillMate request",
        variant: "error",
        timeout: 4000,
      });
    } finally {
      setRequestLoading(false);
    }
  };

  const approveSkillMateRequest = async (requestId) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/skillmates/requests/approve/${requestId}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) throw new Error("Failed to approve SkillMate request");
      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  const handleApproveRequest = async () => {
    if (!pendingRequest || !pendingRequest.id) return;
    setRequestLoading(true);
    try {
      await approveSkillMateRequest(pendingRequest.id);
      setIsSkillMate(true);
      setPendingRequest(null);
      addToast({
        title: "Approved",
        message: "You are now SkillMates.",
        variant: "success",
        timeout: 3000,
      });
    } catch (error) {
      addToast({
        title: "Error",
        message: error.message || "Failed to approve SkillMate request",
        variant: "error",
        timeout: 4000,
      });
    } finally {
      setRequestLoading(false);
    }
  };

  const toggleDropdown = () => setShowDropdown((prev) => !prev);
  const toggleSearchBar = () => setShowSearchBar((prev) => !prev);
  const toggleMobileMenu = () => setShowMobileMenu((prev) => !prev);

  const mobileNavItems = [
    { icon: FaUser, label: "Profile", action: () => { window.scrollTo({ top: 0, behavior: 'smooth' }); } },
    { icon: FaGraduationCap, label: "Education", path: "#education" },
    { icon: FaBriefcase, label: "Experience", path: "#experience" },
    { icon: FaCode, label: "Skills", path: "#skills" },
    { icon: FaChalkboardTeacher, label: "Teach", path: "#teach" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "home":
        return <PublicHome />;
      case "live":
        return <PublicLive />;
      case "videos":
        return <PublicVideos />;
      default:
        return <PublicHome />;
    }
  };

  return (
    <ProfileContext.Provider value={{ searchQuery, setSearchQuery, profileUserId: profile?._id }}>
      <div
        ref={layoutRef}
        className="min-h-screen w-full bg-blue-50 font-sans sm:pl-[var(--sidebar-w)]"
        style={{ "--sidebar-w": `${sidebarWidth}px` }}
      >
        {/* Sidebar - Web Version (fixed, resize-only) */}
        <aside
          className="hidden sm:flex fixed left-0 top-0 z-30 border-r border-blue-100 bg-white/70 shadow-sm ring-1 ring-blue-100/60 overflow-y-auto scrollbar-hide px-5 pt-6 pb-6"
          style={{ width: sidebarWidth, bottom: sidebarBottomPx }}
          aria-label="Public profile sidebar"
        >
          <div className="w-full relative">
            {/* Resize handle */}
            <div
              className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize bg-blue-100/70 hover:bg-blue-200/70"
              onMouseDown={() => setIsResizingSidebar(true)}
              onDoubleClick={() => setSidebarWidth(288)}
              role="separator"
              aria-label="Resize sidebar"
              title="Drag to resize"
            />

            <div className="mb-7">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Connect</h3>
              <div className="flex flex-col gap-3">
                {profile?.linkedin && (
                  <a
                    href={`https://linkedin.com/in/${profile.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-700 hover:text-blue-900 text-sm font-medium transition-colors duration-200 p-2 rounded-xl hover:bg-blue-50 border border-transparent hover:border-blue-100"
                  >
                    <FaLinkedin className="text-xl text-blue-600" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {profile?.github && (
                  <a
                    href={`https://github.com/${profile.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-700 hover:text-blue-900 text-sm font-medium transition-colors duration-200 p-2 rounded-xl hover:bg-blue-50 border border-transparent hover:border-blue-100"
                  >
                    <FaGithub className="text-xl text-gray-900" />
                    <span>GitHub</span>
                  </a>
                )}
                {profile?.twitter && (
                  <a
                    href={`https://twitter.com/${profile.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-700 hover:text-blue-900 text-sm font-medium transition-colors duration-200 p-2 rounded-xl hover:bg-blue-50 border border-transparent hover:border-blue-100"
                  >
                    <FaTwitter className="text-xl text-blue-500" />
                    <span>Twitter</span>
                  </a>
                )}
                {profile?.website && (
                  <a
                    href={
                      profile.website.startsWith("http")
                        ? profile.website
                        : `https://${profile.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-700 hover:text-blue-900 text-sm font-medium transition-colors duration-200 p-2 rounded-xl hover:bg-blue-50 border border-transparent hover:border-blue-100"
                  >
                    <FaGlobe className="text-xl text-green-600" />
                    <span>Website</span>
                  </a>
                )}
              </div>
            </div>

            <div className="mb-7">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Education</h3>
              {loading ? (
                <span className="text-gray-500 text-sm">Loading...</span>
              ) : error ? (
                <span className="text-red-500 text-sm">{error}</span>
              ) : profile?.education && profile.education.length > 0 ? (
                <ul className="flex flex-col gap-4">
                  {profile.education.map((edu, i) => (
                    <li
                      key={i}
                      className="text-sm leading-relaxed border-l-2 border-blue-600 pl-3"
                    >
                      {edu.course && <div className="font-semibold text-gray-900 mb-1">{edu.course}</div>}
                      {edu.branch && <div className="text-blue-600 text-sm font-medium mb-0.5">{edu.branch}</div>}
                      {edu.college && <div className="text-gray-600 text-xs">{edu.college}</div>}
                      {(edu.city || edu.passingYear) && (
                        <div className="text-gray-500 text-xs mt-1">
                          {edu.city}{edu.city && edu.passingYear && ' • '}{edu.passingYear}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-xs text-gray-400">Not added yet</span>
              )}
            </div>

            <div className="mb-7">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Experience</h3>
              {loading ? (
                <span className="text-gray-500 text-sm">Loading...</span>
              ) : error ? (
                <span className="text-red-500 text-sm">{error}</span>
              ) : profile?.experience && profile.experience.length > 0 ? (
                <ul className="flex flex-col gap-4">
                  {profile.experience.map((exp, i) => (
                    <li key={i} className="text-sm leading-relaxed border-l-2 border-blue-600 pl-3">
                      {exp.position && <div className="font-semibold text-gray-900 mb-1">{exp.position}</div>}
                      {exp.company && <div className="text-blue-600 text-sm font-medium mb-0.5">{exp.company}</div>}
                      {exp.duration && <div className="text-gray-500 text-xs mb-1">{exp.duration}</div>}
                      {exp.description && <div className="text-gray-600 text-xs leading-relaxed">{exp.description}</div>}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-xs text-gray-400">Not added yet</span>
              )}
            </div>

            <div className="mb-7">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Skills</h3>
              {loading ? (
                <span className="text-gray-500 text-sm">Loading...</span>
              ) : error ? (
                <span className="text-red-500 text-sm">{error}</span>
              ) : profile?.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="bg-white/70 text-gray-800 px-3 py-1.5 rounded-xl text-xs font-medium border border-blue-100 hover:border-blue-200 hover:bg-blue-50 transition-colors duration-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-gray-400">Not added yet</span>
              )}
            </div>

            <div className="mb-7">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">What I Can Teach</h3>
              {loading ? (
                <span className="text-gray-500 text-sm">Loading...</span>
              ) : error ? (
                <span className="text-red-500 text-sm">{error}</span>
              ) : profile?.skillsToTeach && profile.skillsToTeach.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {profile.skillsToTeach.map((s, i) => (
                    <li
                      key={i}
                      className="bg-white/70 text-green-800 px-3 py-1.5 rounded-xl text-xs font-medium border border-green-200 hover:bg-green-50 transition-colors duration-200"
                    >
                      {s.class ? `${s.class} • ` : ""}
                      {s.subject}{" "}
                      {s.topic === "ALL"
                        ? " > ALL"
                        : s.topic
                        ? `> ${s.topic}`
                        : ""}{" "}
                      {s.subtopic ? `> ${s.subtopic}` : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-xs text-gray-400">Not added yet</span>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="min-h-screen pb-10 max-w-6xl mx-auto lg:mx-0 px-4 sm:px-6 pt-4">
            {/* Cover Image */}
            <div className="relative">
              <div className="h-28 sm:h-36 md:h-44 w-full rounded-2xl overflow-hidden border border-blue-100 bg-blue-100">
                {loading ? (
                  <div className="w-full h-full animate-pulse bg-blue-100" />
                ) : error ? (
                  <div className="w-full h-full flex items-center justify-center text-sm text-red-600 bg-transparent">
                    Failed to load profile
                  </div>
                ) : profile?.coverImageUrl ? (
                  <img
                    src={profile.coverImageUrl}
                    alt="Profile cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-blue-100" />
                )}
              </div>
            </div>

            {/* Profile Header */}
            <div className="mt-3 sm:mt-4 mb-4">
              {/* Back Button - Positioned in top right corner */}
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 transition shadow-sm"
                  aria-label="Go back"
                  title="Back"
                >
                  <FaArrowLeft className="text-xs" />
                  <span>Back</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                {/* Profile Picture - 35% overlap on mobile, 6% on web */}
                <div className="-mt-14 sm:-mt-2 shrink-0">
                  {loading ? (
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-3 sm:border-4 border-white shadow-xl bg-blue-100 animate-pulse" />
                  ) : (
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full border-3 sm:border-4 border-white shadow-xl overflow-hidden bg-blue-100">
                      {profile?.profilePic ? (
                        <img
                          src={profile.profilePic}
                          alt={`${profile?.fullName || "User"} profile`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FaUser className="text-blue-900 text-2xl sm:text-3xl" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Profile Info & Actions */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-3">
                    {/* Name and Bio */}
                    <div className="min-w-0">
                      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                        {profile?.fullName || "User"}
                      </h1>
                      <p className="text-sm text-gray-600 truncate mt-0.5">
                        {profile?.username ? `@${profile.username}` : "@user"}
                      </p>
                      <p className="mt-2 text-sm text-gray-700 line-clamp-3">
                        {profile?.bio || "Your bio goes here, set it in Setup Profile."}
                      </p>
                      
                      {/* Action Buttons - Desktop Only (below bio) */}
                      <div className="hidden sm:flex items-center gap-2 mt-3 relative">
                        {pendingRequest?.isRequester && !isSkillMate ? (
                          <>
                            <button
                              className="px-3 py-2 rounded-xl border text-xs font-semibold transition bg-yellow-50 border-yellow-300 text-yellow-800 shadow-sm"
                              disabled
                              title="Request Pending"
                            >
                              Pending
                            </button>
                            <button
                              className="px-3 py-2 rounded-xl border text-xs font-semibold transition bg-white border-blue-200 text-blue-900 hover:bg-blue-50 hover:border-blue-300 shadow-sm"
                              onClick={handleCancelRequest}
                              disabled={requestLoading}
                              title="Cancel Request"
                            >
                              {requestLoading ? "Cancelling" : "Cancel"}
                            </button>
                          </>
                        ) : (
                          <button
                            className={
                              `px-6 py-2.5 rounded-2xl border text-sm font-bold transition shadow-md ${
                                isSkillMate
                                  ? "bg-blue-50 border-blue-300 text-blue-900 hover:bg-blue-100 hover:shadow-lg"
                                  : pendingRequest
                                  ? "bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100 hover:shadow-lg"
                                  : "bg-blue-900 text-white border-blue-900 hover:bg-blue-800 hover:shadow-lg"
                              }`
                            }
                            onClick={
                              isSkillMate
                                ? toggleDropdown
                                : pendingRequest
                                ? handleApproveRequest
                                : handleAddSkillMate
                            }
                            disabled={requestLoading}
                            title={
                              isSkillMate
                                ? "Manage SkillMate"
                                : pendingRequest
                                ? "Approve Request"
                                : "Add SkillMate"
                            }
                          >
                            {requestLoading
                              ? "Processing"
                              : isSkillMate
                              ? "SkillMate"
                              : pendingRequest
                              ? "Approve"
                              : "Add SkillMate"}
                            {isSkillMate && <FaChevronDown className="text-xs ml-1.5 inline" />}
                          </button>
                        )}
                        
                        {isSkillMate && (
                          <button
                            className="border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm hover:shadow-md"
                            onClick={() => navigate('/chat', { state: { skillMateId: profile?._id } })}
                            title="Message"
                          >
                            Message
                          </button>
                        )}
                        
                        {!isSkillMate && (
                          <button
                            className="border border-blue-200 text-blue-900 bg-white hover:bg-blue-50 px-2.5 py-2.5 rounded-xl text-base font-bold transition shadow-sm hover:shadow-md"
                            onClick={toggleDropdown}
                            title="More options"
                            aria-label="More options"
                          >
                            ⋮
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons - Mobile Only (same as before) */}
                    <div className="sm:hidden flex items-center justify-between w-full relative">
                      {/* Left: Pending and Cancel (if applicable) */}
                      <div className="flex items-center gap-2">
                        {pendingRequest?.isRequester && !isSkillMate && (
                          <>
                            <button
                              className="px-3 py-2 rounded-xl border text-xs font-semibold transition bg-yellow-50 border-yellow-300 text-yellow-800 shadow-sm"
                              disabled
                              title="Request Pending"
                            >
                              Pending
                            </button>
                            <button
                              className="px-3 py-2 rounded-xl border text-xs font-semibold transition bg-white border-blue-200 text-blue-900 hover:bg-blue-50 hover:border-blue-300 shadow-sm"
                              onClick={handleCancelRequest}
                              disabled={requestLoading}
                              title="Cancel Request"
                            >
                              {requestLoading ? "Cancelling" : "Cancel"}
                            </button>
                          </>
                        )}
                      </div>

                      {/* Center: Main Action Button */}
                      {!(pendingRequest?.isRequester && !isSkillMate) && (
                        <div className="flex-1 flex justify-center">
                          <button
                            className={
                              `px-6 py-2.5 rounded-2xl border text-sm font-bold transition shadow-md ${
                                isSkillMate
                                  ? "bg-blue-50 border-blue-300 text-blue-900 hover:bg-blue-100 hover:shadow-lg"
                                  : pendingRequest
                                  ? "bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100 hover:shadow-lg"
                                  : "bg-blue-900 text-white border-blue-900 hover:bg-blue-800 hover:shadow-lg"
                              }`
                            }
                            onClick={
                              isSkillMate
                                ? toggleDropdown
                                : pendingRequest
                                ? handleApproveRequest
                                : handleAddSkillMate
                            }
                            disabled={requestLoading}
                            title={
                              isSkillMate
                                ? "Manage SkillMate"
                                : pendingRequest
                                ? "Approve Request"
                                : "Add SkillMate"
                            }
                          >
                            {requestLoading
                              ? "Processing"
                              : isSkillMate
                              ? "SkillMate"
                              : pendingRequest
                              ? "Approve"
                              : "Add SkillMate"}
                            {isSkillMate && <FaChevronDown className="text-xs ml-1.5 inline" />}
                          </button>
                        </div>
                      )}
                      {showDropdown && (
                        <div
                          ref={dropdownRef}
                          className="absolute top-full right-0 mt-2 w-48 bg-white border border-blue-200 rounded-xl shadow-xl z-50"
                        >
                          {isSkillMate && (
                            <>
                              <button
                                className="block w-full text-left px-4 py-2 text-sm text-dark-blue hover:bg-blue-100"
                                onClick={() => {
                                  addToast({
                                    title: "Notifications",
                                    message: "Notifications turned ON",
                                    variant: "info",
                                    timeout: 2500,
                                  });
                                  setShowDropdown(false);
                                }}
                              >
                                🔔 On Notification
                              </button>
                              <button
                                className="block w-full text-left px-4 py-2 text-sm text-dark-blue hover:bg-blue-100"
                                onClick={() => {
                                  addToast({
                                    title: "Notifications",
                                    message: "Notifications muted",
                                    variant: "warning",
                                    timeout: 2500,
                                  });
                                  setShowDropdown(false);
                                }}
                              >
                                🔕 Mute Notification
                              </button>
                              <button
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-blue-100"
                                onClick={handleRemoveSkillMate}
                              >
                                ❌ Remove SkillMate
                              </button>
                              <div className="border-t border-blue-200 my-1"></div>
                            </>
                          )}
                          <button
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-blue-100 rounded-b-lg"
                            onClick={() => {
                              if (!profile) return;
                              navigate('/report', {
                                state: {
                                  reportedUser: {
                                    _id: profile._id,
                                    username: profile.username,
                                    fullName: profile.fullName,
                                    email: profile.email,
                                  },
                                },
                              });
                              setShowDropdown(false);
                            }}
                          >
                            🚩 Report User
                          </button>
                        </div>
                      )}
                      {/* Right: Message (if SkillMate) or Three Dots */}
                      <div className="flex items-center gap-2">
                        {isSkillMate && (
                          <button
                            className="border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm hover:shadow-md"
                            onClick={() => navigate('/chat', { state: { skillMateId: profile?._id } })}
                            title="Message"
                          >
                            Message
                          </button>
                        )}
                        {!isSkillMate && (
                          <button
                            className="border border-blue-200 text-blue-900 bg-white hover:bg-blue-50 px-2.5 py-2.5 rounded-xl text-base font-bold transition shadow-sm hover:shadow-md"
                            onClick={toggleDropdown}
                            title="More options"
                            aria-label="More options"
                          >
                            ⋮
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* Social Section (Mobile) */}
            <div className="sm:hidden mb-6 mt-4">
              <div className="flex flex-col gap-3 w-full">
                {/* Social Links */}
                {(profile?.linkedin || profile?.github || profile?.twitter || profile?.website) && (
                  <div className="flex flex-col gap-2">
                    {profile?.linkedin && (
                      <a
                        href={`https://linkedin.com/in/${profile.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-blue-100 text-dark-blue bg-white shadow-sm border border-blue-100"
                      >
                        <FaLinkedin className="text-base text-blue-600" />
                        <span className="text-xs font-medium">LinkedIn</span>
                      </a>
                    )}
                    {profile?.github && (
                      <a
                        href={`https://github.com/${profile.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-blue-100 text-dark-blue bg-white shadow-sm border border-blue-100"
                      >
                        <FaGithub className="text-base" />
                        <span className="text-xs font-medium">GitHub</span>
                      </a>
                    )}
                    {profile?.twitter && (
                      <a
                        href={`https://twitter.com/${profile.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-blue-100 text-dark-blue bg-white shadow-sm border border-blue-100"
                      >
                        <FaTwitter className="text-base text-blue-400" />
                        <span className="text-xs font-medium">Twitter</span>
                      </a>
                    )}
                    {profile?.website && (
                      <a
                        href={
                          profile.website.startsWith("http")
                            ? profile.website
                            : `https://${profile.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-blue-100 text-dark-blue bg-white shadow-sm border border-blue-100"
                      >
                        <FaGlobe className="text-base text-green-600" />
                        <span className="text-xs font-medium">Website</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Education Section - Mobile */}
                <div id="education" className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-blue-100/50">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FaGraduationCap className="text-base text-blue-600" />
                    <h3 className="font-semibold text-gray-900 text-sm">Education</h3>
                  </div>
                  {loading ? (
                    <span className="text-gray-600 text-xs">Loading...</span>
                  ) : error ? (
                    <span className="text-red-500 text-xs">{error}</span>
                  ) : profile?.education && profile.education.length > 0 ? (
                    <ul className="flex flex-col gap-2">
                      {profile.education.map((edu, i) => (
                        <li key={i} className="text-xs text-gray-700 bg-blue-50/50 p-2 rounded-md">
                          {edu.course && <div className="font-semibold text-xs text-gray-900">{edu.course}</div>}
                          {edu.branch && <div className="text-blue-600 text-[10px] mt-0.5">{edu.branch}</div>}
                          {edu.college && <div className="text-gray-600 text-[10px] mt-0.5">{edu.college}</div>}
                          {(edu.city || edu.passingYear) && (
                            <div className="text-gray-500 text-[10px] mt-0.5">
                              {edu.city}{edu.city && edu.passingYear && ' • '}{edu.passingYear}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs text-gray-500">Not added yet</span>
                  )}
                </div>

                {/* Experience Section - Mobile */}
                <div id="experience" className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-blue-100/50">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FaBriefcase className="text-base text-blue-600" />
                    <h3 className="font-semibold text-gray-900 text-sm">Experience</h3>
                  </div>
                  {loading ? (
                    <span className="text-gray-600 text-xs">Loading...</span>
                  ) : error ? (
                    <span className="text-red-500 text-xs">{error}</span>
                  ) : profile?.experience && profile.experience.length > 0 ? (
                    <ul className="flex flex-col gap-2">
                      {profile.experience.map((exp, i) => (
                        <li key={i} className="text-xs text-gray-700 bg-blue-50/50 p-2 rounded-md">
                          {exp.position && <div className="font-semibold text-xs text-gray-900">{exp.position}</div>}
                          {exp.company && <div className="text-blue-600 text-[10px] mt-0.5">{exp.company}</div>}
                          {exp.duration && <div className="text-gray-500 text-[10px] mt-0.5">{exp.duration}</div>}
                          {exp.description && <div className="text-gray-600 text-[10px] mt-0.5 line-clamp-2">{exp.description}</div>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs text-gray-500">Not added yet</span>
                  )}
                </div>

                {/* Skills Section - Mobile */}
                <div id="skills" className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-blue-100/50">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FaCode className="text-base text-blue-600" />
                    <h3 className="font-semibold text-gray-900 text-sm">Skills</h3>
                  </div>
                  {loading ? (
                    <span className="text-gray-600 text-xs">Loading...</span>
                  ) : error ? (
                    <span className="text-red-500 text-xs">{error}</span>
                  ) : profile?.skills && profile.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="bg-blue-100/70 text-blue-800 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-blue-200/50"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">Not added yet</span>
                  )}
                </div>

                {/* What I Can Teach Section - Mobile */}
                <div id="teach" className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-blue-100/50">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FaChalkboardTeacher className="text-base text-blue-600" />
                    <h3 className="font-semibold text-gray-900 text-sm">What I Can Teach</h3>
                  </div>
                  {loading ? (
                    <span className="text-gray-600 text-xs">Loading...</span>
                  ) : error ? (
                    <span className="text-red-500 text-xs">{error}</span>
                  ) : profile?.skillsToTeach && profile.skillsToTeach.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.skillsToTeach.map((s, i) => (
                        <span
                          key={i}
                          className="bg-green-100/70 text-green-800 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-green-200/50"
                        >
                          {s.class ? `${s.class} • ` : ""}
                          {s.subject}{" "}
                          {s.topic === "ALL"
                            ? " > ALL"
                            : s.topic
                            ? `> ${s.topic}`
                            : ""}{" "}
                          {s.subtopic ? `> ${s.subtopic}` : ""}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">Not added yet</span>
                  )}
                </div>
              </div>
            </div>

            {/* Contribution Calendar removed here; appears in Home tab only */}

            {/* Navigation Tabs (transparent, pill) */}
            <div className="mt-4 pt-2 pb-2 border-b border-blue-100">
              <div className="flex items-center justify-between gap-3">
                <nav className="flex flex-nowrap gap-2 sm:gap-3 overflow-x-auto scrollbar-hide -mx-2 px-2">
                  <button
                    onClick={() => setActiveTab("home")}
                    className={
                      `shrink-0 whitespace-nowrap inline-flex items-center justify-center px-2.5 sm:px-3 py-1.5 text-[13px] sm:text-sm font-semibold rounded-xl border transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
                        activeTab === "home"
                          ? "text-blue-900 border-blue-900 bg-blue-50 shadow-sm"
                          : "text-gray-700 border-gray-200 bg-transparent hover:text-blue-900 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm"
                      }`
                    }
                    aria-current={activeTab === "home" ? "page" : undefined}
                  >
                    Home
                  </button>
                  <button
                    onClick={() => setActiveTab("live")}
                    className={
                      `shrink-0 whitespace-nowrap inline-flex items-center justify-center px-2.5 sm:px-3 py-1.5 text-[13px] sm:text-sm font-semibold rounded-xl border transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
                        activeTab === "live"
                          ? "text-blue-900 border-blue-900 bg-blue-50 shadow-sm"
                          : "text-gray-700 border-gray-200 bg-transparent hover:text-blue-900 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm"
                      }`
                    }
                    aria-current={activeTab === "live" ? "page" : undefined}
                  >
                    Live
                  </button>
                  <button
                    onClick={() => setActiveTab("videos")}
                    className={
                      `shrink-0 whitespace-nowrap inline-flex items-center justify-center px-2.5 sm:px-3 py-1.5 text-[13px] sm:text-sm font-semibold rounded-xl border transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
                        activeTab === "videos"
                          ? "text-blue-900 border-blue-900 bg-blue-50 shadow-sm"
                          : "text-gray-700 border-gray-200 bg-transparent hover:text-blue-900 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm"
                      }`
                    }
                    aria-current={activeTab === "videos" ? "page" : undefined}
                  >
                    Videos
                  </button>
                </nav>

                <div className="flex items-center gap-2 pr-1">
                  <button
                    onClick={toggleSearchBar}
                    className="p-2 rounded-md border border-blue-200 text-blue-900 hover:border-blue-300 transition"
                    aria-label="Toggle search bar"
                    title="Search"
                  >
                    <FaSearch className="text-sm" />
                  </button>
                </div>
              </div>

              {showSearchBar && (
                <div className="mt-2 px-2">
                  <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
                </div>
              )}
            </div>

            {/* Tab Content */}
            <div className="relative">
              {renderTabContent()}
            </div>
        </main>
      </div>
    </ProfileContext.Provider>
  );
};

export default SideBarPublic;

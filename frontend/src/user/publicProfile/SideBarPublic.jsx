import React, { useEffect, useRef, useState, createContext } from "react";
import {
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaGlobe,
  FaSearch,
  FaBars,
  FaTimes,
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
import Chat from "../../components/Chat";
import SearchBar from "../privateProfile/SearchBar";
import { BACKEND_URL } from "../../config.js";
import { useToast } from "../../components/ToastContext.js";
import PublicHome from "./PublicHome";
import PublicLive from "./PublicLive";
import PublicVideos from "./PublicVideos";

export const ProfileContext = createContext();

const contributions = {
  "2024-01-01": 5,
  "2024-01-02": 2,
};

const months = [
  { name: "Jan", year: 2024, days: 31 },
  { name: "Feb", year: 2024, days: 29 },
];

const currentDate = new Date();

const getContributionColor = (count) => {
  if (count === 0) return "bg-gray-100";
  if (count <= 2) return "bg-blue-100";
  if (count <= 5) return "bg-blue-300";
  if (count <= 8) return "bg-blue-500";
  return "bg-blue-700";
};

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
  const activeTabStyle =
    "border-b-4 border-blue-600 text-gray-900 font-bold -mb-0.5";
  const normalTabStyle = "text-gray-500 hover:text-gray-900 font-medium";

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
  const [activeChatId, setActiveChatId] = useState(null);
  const { addToast } = useToast();

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
      await sendSkillMateRequest(profile._id);
      setPendingRequest({ isRequester: true });
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
      <div className="flex flex-col sm:flex-row min-h-screen w-full bg-[#f8f9fb] font-sans">
        {/* Sidebar - Web Version */}
        <aside className="hidden sm:flex sm:w-72 min-h-screen bg-white px-6 pt-8 border-r border-gray-200 shadow-sm">
          <div className="w-full">
            <div className="mb-7">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Connect</h3>
              <div className="flex flex-col gap-3">
                {profile?.linkedin && (
                  <a
                    href={`https://linkedin.com/in/${profile.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors duration-200 p-2 rounded-lg hover:bg-gray-50"
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
                    className="flex items-center gap-3 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors duration-200 p-2 rounded-lg hover:bg-gray-50"
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
                    className="flex items-center gap-3 text-gray-600 hover:text-blue-500 text-sm font-medium transition-colors duration-200 p-2 rounded-lg hover:bg-gray-50"
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
                    className="flex items-center gap-3 text-gray-600 hover:text-green-600 text-sm font-medium transition-colors duration-200 p-2 rounded-lg hover:bg-gray-50"
                  >
                    <FaGlobe className="text-xl text-green-600" />
                    <span>Website</span>
                  </a>
                )}
              </div>
            </div>

            <div className="mb-7">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Education</h3>
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
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Experience</h3>
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
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Skills</h3>
              {loading ? (
                <span className="text-gray-500 text-sm">Loading...</span>
              ) : error ? (
                <span className="text-red-500 text-sm">{error}</span>
              ) : profile?.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-200 transition-colors duration-200"
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
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">What I Can Teach</h3>
              {loading ? (
                <span className="text-gray-500 text-sm">Loading...</span>
              ) : error ? (
                <span className="text-red-500 text-sm">{error}</span>
              ) : profile?.skillsToTeach && profile.skillsToTeach.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {profile.skillsToTeach.map((s, i) => (
                    <li
                      key={i}
                      className="bg-green-50 text-green-800 px-3 py-1.5 rounded-lg text-xs font-medium border border-green-200 hover:bg-green-100 transition-colors duration-200"
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

            {/* Report Button */}
            <div className="mb-7 pt-4 border-t border-gray-200">
              <button
                className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md"
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
                }}
                title="Report this profile"
              >
                <MdReport className="text-lg" />
                <span>Report User</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-h-screen pt-10 pb-8 px-6 sm:px-10">
          <div className="max-w-6xl mx-auto">
            {/* Profile Section */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start mb-10 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200">
              {loading ? (
                <div className="w-[100px] h-[100px] sm:w-[180px] sm:h-[180px] mx-auto">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center gap-2 mx-auto">
                  <span className="text-red-500 text-sm">{error}</span>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-dark-blue px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 hover:bg-blue-100"
                    aria-label="Retry loading profile"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <>
                  <img
                    src={
                      profile?.profilePic ||
                      "https://placehold.co/100x100?text=User"
                    }
                    alt={`${profile?.fullName || "User"}'s profile picture`}
                    className="w-[120px] h-[120px] sm:w-[200px] sm:h-[200px] rounded-full object-cover border-4 border-gray-200 shadow-lg mx-auto sm:mx-0"
                  />
                  <div className="mt-6 sm:mt-0 sm:ml-8 flex-1 flex flex-col items-center sm:items-start relative">
                    <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 text-center sm:text-left mb-2">
                      {profile?.fullName || "Full Name"}
                    </h1>
                    <p className="text-base text-blue-600 font-medium text-center sm:text-left mb-3">
                      {profile?.username ? `@${profile.username}` : "@username"}
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed mt-1 max-w-xl text-center sm:text-left">
                      {profile?.bio ||
                        "Your bio goes here, set it in Setup Profile."}
                    </p>
                    <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center sm:justify-start relative z-10">
                      <button
                        className={`border px-8 py-3 rounded-xl text-sm font-semibold max-w-xs flex items-center justify-between transition-all duration-200 shadow-sm hover:shadow-md ${
                          isSkillMate
                            ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                            : pendingRequest
                            ? "bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                            : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                        }`}
                        onClick={
                          isSkillMate
                            ? toggleDropdown
                            : pendingRequest
                            ? pendingRequest.isRequester
                              ? null
                              : handleApproveRequest
                            : handleAddSkillMate
                        }
                        disabled={
                          requestLoading ||
                          (pendingRequest && pendingRequest.isRequester)
                        }
                        title={
                          isSkillMate
                            ? "Manage SkillMate"
                            : pendingRequest
                            ? pendingRequest.isRequester
                              ? "Request Pending"
                              : "Approve Request"
                            : "Add SkillMate"
                        }
                      >
                        {requestLoading ? (
                          <span className="flex items-center justify-center w-full">
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          <span className="flex-1 text-center">
                            {isSkillMate
                              ? "SkillMate"
                              : pendingRequest
                              ? pendingRequest.isRequester
                                ? "Request Pending"
                                : "Approve Request"
                              : "Add SkillMate"}
                          </span>
                        )}
                        {isSkillMate && <FaChevronDown className="text-sm" />}
                      </button>
                      {showDropdown && (
                        <div
                          ref={dropdownRef}
                          className="absolute z-20 mt-12 w-44 bg-blue-50 border border-blue-200 rounded-lg shadow-lg"
                        >
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
                        </div>
                      )}
                      {isSkillMate && (
                        <button
                          className="border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                          onClick={() => setActiveChatId(profile?._id)}
                          title="Message"
                        >
                          Message
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Social Section (Mobile) */}
            <div className="sm:hidden mb-8">
              <div className="flex flex-col gap-6 w-full">
                {/* Social Links */}
                {(profile?.linkedin || profile?.github || profile?.twitter || profile?.website) && (
                  <div className="flex flex-col gap-3">
                    {profile?.linkedin && (
                      <a
                        href={`https://linkedin.com/in/${profile.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-100 text-dark-blue bg-white shadow-sm border border-blue-100"
                      >
                        <FaLinkedin className="text-xl text-blue-600" />
                        <span className="text-sm font-medium">LinkedIn</span>
                      </a>
                    )}
                    {profile?.github && (
                      <a
                        href={`https://github.com/${profile.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-100 text-dark-blue bg-white shadow-sm border border-blue-100"
                      >
                        <FaGithub className="text-xl" />
                        <span className="text-sm font-medium">GitHub</span>
                      </a>
                    )}
                    {profile?.twitter && (
                      <a
                        href={`https://twitter.com/${profile.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-100 text-dark-blue bg-white shadow-sm border border-blue-100"
                      >
                        <FaTwitter className="text-xl text-blue-400" />
                        <span className="text-sm font-medium">Twitter</span>
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
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-100 text-dark-blue bg-white shadow-sm border border-blue-100"
                      >
                        <FaGlobe className="text-xl text-green-600" />
                        <span className="text-sm font-medium">Website</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Education Section - Mobile */}
                <div id="education" className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <FaGraduationCap className="text-xl text-blue-600" />
                    <h3 className="font-semibold text-dark-blue text-base">Education</h3>
                  </div>
                  {loading ? (
                    <span className="text-gray-600 text-sm">Loading...</span>
                  ) : error ? (
                    <span className="text-red-500 text-sm">{error}</span>
                  ) : profile?.education && profile.education.length > 0 ? (
                    <ul className="flex flex-col gap-3">
                      {profile.education.map((edu, i) => (
                        <li key={i} className="text-sm text-gray-700 bg-blue-50 p-3 rounded-md">
                          {edu.course && <div className="font-medium">{edu.course}</div>}
                          {edu.branch && <div className="text-gray-600">{edu.branch}</div>}
                          {edu.college && <div className="text-gray-600">{edu.college}</div>}
                          {edu.city && <div className="text-gray-500 text-xs">{edu.city}</div>}
                          {edu.passingYear && <div className="text-gray-500 text-xs">{edu.passingYear}</div>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-sm text-gray-500">Not added yet</span>
                  )}
                </div>

                {/* Experience Section - Mobile */}
                <div id="experience" className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <FaBriefcase className="text-xl text-blue-600" />
                    <h3 className="font-semibold text-dark-blue text-base">Experience</h3>
                  </div>
                  {loading ? (
                    <span className="text-gray-600 text-sm">Loading...</span>
                  ) : error ? (
                    <span className="text-red-500 text-sm">{error}</span>
                  ) : profile?.experience && profile.experience.length > 0 ? (
                    <ul className="flex flex-col gap-3">
                      {profile.experience.map((exp, i) => (
                        <li key={i} className="text-sm text-gray-700 bg-blue-50 p-3 rounded-md">
                          {exp.position && <div className="font-medium">{exp.position}</div>}
                          {exp.company && <div className="text-gray-600">{exp.company}</div>}
                          {exp.duration && <div className="text-gray-500 text-xs">{exp.duration}</div>}
                          {exp.description && <div className="text-gray-600 text-xs mt-1">{exp.description}</div>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-sm text-gray-500">Not added yet</span>
                  )}
                </div>

                {/* Skills Section - Mobile */}
                <div id="skills" className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <FaCode className="text-xl text-blue-600" />
                    <h3 className="font-semibold text-dark-blue text-base">Skills</h3>
                  </div>
                  {loading ? (
                    <span className="text-gray-600 text-sm">Loading...</span>
                  ) : error ? (
                    <span className="text-red-500 text-sm">{error}</span>
                  ) : profile?.skills && profile.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium border border-blue-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Not added yet</span>
                  )}
                </div>

                {/* What I Can Teach Section - Mobile */}
                <div id="teach" className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <FaChalkboardTeacher className="text-xl text-blue-600" />
                    <h3 className="font-semibold text-dark-blue text-base">What I Can Teach</h3>
                  </div>
                  {loading ? (
                    <span className="text-gray-600 text-sm">Loading...</span>
                  ) : error ? (
                    <span className="text-red-500 text-sm">{error}</span>
                  ) : profile?.skillsToTeach && profile.skillsToTeach.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.skillsToTeach.map((s, i) => (
                        <span
                          key={i}
                          className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium border border-green-200"
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
                    <span className="text-sm text-gray-500">Not added yet</span>
                  )}
                </div>
              </div>
            </div>

            {/* Contribution Calendar removed here; appears in Home tab only */}

            {/* Tab Navigation */}
            <div className="px-2 sm:px-0 pt-6 sm:pt-8">
              <div className="flex items-center gap-2 sm:gap-6 border-b-2 border-gray-200 mb-8">
                {/* Back Button - Mobile Only */}
                <button
                  onClick={() => navigate(-1)}
                  className="sm:hidden flex items-center gap-1 pb-2 px-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                  aria-label="Go back"
                >
                  <FaArrowLeft className="text-sm" />
                </button>
                
                <div className="flex flex-wrap gap-4 sm:gap-6">
                  <button
                    onClick={() => setActiveTab('home')}
                    className={`pb-3 px-2 text-base ${
                      activeTab === 'home' ? activeTabStyle : normalTabStyle
                    }`}
                  >
                    Home
                  </button>
                  <button
                    onClick={() => setActiveTab('live')}
                    className={`pb-3 px-2 text-base ${
                      activeTab === 'live' ? activeTabStyle : normalTabStyle
                    }`}
                  >
                    Live
                  </button>
                  <button
                    onClick={() => setActiveTab('videos')}
                    className={`pb-3 px-2 text-base ${
                      activeTab === 'videos' ? activeTabStyle : normalTabStyle
                    }`}
                  >
                    Videos
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="relative min-h-[calc(100vh-28rem)] sm:min-h-[calc(100vh-32rem)]">
              <div className="absolute top-0 right-0 p-2 sm:p-4 flex items-center space-x-2">
                <button
                  onClick={toggleSearchBar}
                  className="text-dark-blue hover:text-blue-700"
                  aria-label="Toggle search bar"
                >
                  <FaSearch className="text-xl" />
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    showSearchBar
                      ? "translate-x-0 opacity-100"
                      : "translate-x-10 opacity-0"
                  }`}
                >
                  {showSearchBar && (
                    <SearchBar
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                    />
                  )}
                </div>
              </div>
              {renderTabContent()}
            </div>
          </div>
        </main>
        {activeChatId && (
          <Chat
            skillMateId={activeChatId}
            onClose={() => setActiveChatId(null)}
          />
        )}
      </div>
    </ProfileContext.Provider>
  );
};

export default SideBarPublic;

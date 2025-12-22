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
} from "react-icons/fa";
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
    "border-b-2 border-blue-600 text-dark-blue font-semibold";
  const normalTabStyle = "text-gray-600 hover:text-dark-blue";

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
    { icon: FaUser, label: "Profile", action: () => setActiveTab("home") },
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
      <div className="flex flex-col sm:flex-row min-h-screen w-full bg-gradient-to-br from-blue-50 to-cream-100 font-sans">
        {/* Scrollable Menu Button */}
        <div className="sm:hidden px-4 py-2 relative">
          <button
            onClick={toggleMobileMenu}
            className="text-dark-blue"
            aria-label="Open menu"
          >
            <FaBars className="text-2xl" />
          </button>

          {/* Dropdown appears OVER page content */}
          {showMobileMenu && (
            <div className="absolute top-full left-0 mt-2 w-screen bg-blue-100 z-50 shadow-md">
              <div className="p-4 max-w-md mx-auto rounded-md">
                <ul className="space-y-3">
                  {mobileNavItems.map((item, index) => (
                    <li key={index}>
                      <a
                        href={item.path || "#"}
                        className="flex items-center gap-3 p-2 rounded-md text-dark-blue hover:bg-blue-200"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleMobileMenu();
                          if (item.action) {
                            item.action();
                          } else if (item.path && item.path !== "#") {
                            window.location.hash = item.path;
                          }
                        }}
                      >
                        <item.icon className="text-lg" />
                        <span className="text-sm">{item.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Web Version */}
        <aside className="hidden sm:flex sm:w-64 min-h-screen bg-blue-50 px-6 pt-8 border-r border-blue-200">
          <div className="w-full">
            <div className="mb-8">
              <div className="flex flex-col gap-3">
                {profile?.linkedin && (
                  <a
                    href={`https://linkedin.com/in/${profile.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-600 hover:text-dark-blue text-sm"
                  >
                    <FaLinkedin className="text-xl text-dark-blue" />
                    LinkedIn
                  </a>
                )}
                {profile?.github && (
                  <a
                    href={`https://github.com/${profile.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-600 hover:text-dark-blue text-sm"
                  >
                    <FaGithub className="text-xl text-dark-blue" />
                    GitHub
                  </a>
                )}
                {profile?.twitter && (
                  <a
                    href={`https://twitter.com/${profile.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-600 hover:text-dark-blue text-sm"
                  >
                    <FaTwitter className="text-xl text-dark-blue" />
                    Twitter
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
                    className="flex items-center gap-2 text-gray-600 hover:text-dark-blue text-sm"
                  >
                    <FaGlobe className="text-xl text-dark-blue" />
                    Website
                  </a>
                )}
              </div>
            </div>

            <div className="mb-8">
              <div className="font-semibold text-dark-blue mb-3 text-lg">
                Education
              </div>
              {loading ? (
                <span className="text-gray-600 text-sm">Loading...</span>
              ) : error ? (
                <span className="text-red-500 text-sm">{error}</span>
              ) : profile?.education && profile.education.length > 0 ? (
                <ul className="flex flex-col gap-4">
                  {profile.education.map((edu, i) => (
                    <li
                      key={i}
                      className="text-xs text-gray-600 whitespace-pre-line"
                    >
                      {edu.course && <div>{edu.course}</div>}
                      {edu.branch && <div>{edu.branch}</div>}
                      {edu.college && <div>{edu.college}</div>}
                      {edu.city && <div>{edu.city}</div>}
                      {edu.passingYear && <div>{edu.passingYear}</div>}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-xs text-gray-600">Not added yet</span>
              )}
            </div>

            <div className="mb-8">
              <div className="font-semibold text-dark-blue mb-3 text-lg">
                Experience
              </div>
              {loading ? (
                <span className="text-gray-600 text-sm">Loading...</span>
              ) : error ? (
                <span className="text-red-500 text-sm">{error}</span>
              ) : profile?.experience && profile.experience.length > 0 ? (
                <ul className="flex flex-col gap-3">
                  {profile.experience.map((exp, i) => (
                    <li key={i} className="text-xs text-gray-600">
                      {exp.position && exp.company && exp.duration && exp.description ? (
                        <span>
                          <span className="font-medium">{exp.position}</span>
                          {` at ${exp.company} for ${exp.duration}. ${exp.description}`}
                        </span>
                      ) : (
                        <span>
                          {exp.position && <span className="font-medium">{exp.position}</span>}
                          {exp.company ? ` at ${exp.company}` : ""}
                          {exp.duration ? ` (${exp.duration})` : ""}
                          {exp.description ? `: ${exp.description}` : ""}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-xs text-gray-600">Not added yet</span>
              )}
            </div>

            <div className="mb-8">
              <div className="font-semibold text-dark-blue mb-3 text-lg">
                Skills
              </div>
              {loading ? (
                <span className="text-gray-600 text-sm">Loading...</span>
              ) : error ? (
                <span className="text-red-500 text-sm">{error}</span>
              ) : profile?.skills && profile.skills.length > 0 ? (
                <ul className="flex flex-col gap-3">
                  {profile.skills.map((skill, i) => (
                    <li key={i} className="text-xs text-gray-600">
                      {skill}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-xs text-gray-600">Not added yet</span>
              )}
            </div>

            <div className="mb-8">
              <div className="font-semibold text-dark-blue mb-3 text-lg">
                What I Can Teach
              </div>
              {loading ? (
                <span className="text-gray-600 text-sm">Loading...</span>
              ) : error ? (
                <span className="text-red-500 text-sm">{error}</span>
              ) : profile?.skillsToTeach && profile.skillsToTeach.length > 0 ? (
                (() => {
                  const teachSkills = profile.skillsToTeach.filter(s => s.class);
                  if (teachSkills.length === 0) {
                    return <span className="text-xs text-gray-600">Not added yet</span>;
                  }
                  return (
                    <ul className="flex flex-wrap gap-2">
                      {teachSkills.map((skill, i) => (
                        <li key={i} className="text-xs text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
                          {skill.class ? `${skill.class} • ` : ''}{skill.subject} {skill.topic === 'ALL' ? ' > ALL Topics' : skill.topic ? `> ${skill.topic}` : ''}
                        </li>
                      ))}
                    </ul>
                  );
                })()
              ) : (
                <span className="text-xs text-gray-600">Not added yet</span>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-h-screen pt-8 pb-24 px-4 sm:px-8">
          <div className="max-w-5xl mx-auto">
            {/* Profile Section */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start mb-8">
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
                    className="w-[100px] h-[100px] sm:w-[180px] sm:h-[180px] rounded-full object-cover border-2 border-blue-200 mx-auto sm:mx-0"
                  />
                  <div className="mt-4 sm:mt-0 sm:ml-6 flex-1 flex flex-col items-center sm:items-start relative">
                    <h1 className="text-xl sm:text-3xl font-bold text-dark-blue text-center sm:text-left">
                      {profile?.fullName || "Full Name"}
                    </h1>
                    <p className="text-sm text-gray-600 text-center sm:text-left">
                      {profile?.username ? `@${profile.username}` : "@username"}
                    </p>
                    <p className="text-sm text-gray-600 mt-2 max-w-md text-center sm:text-left">
                      {profile?.bio ||
                        "Your bio goes here, set it in Setup Profile."}
                    </p>
                    <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center sm:justify-start relative z-10">
                      <button
                        className={`border border-blue-200 text-dark-blue px-6 sm:px-8 py-2 rounded-lg text-sm font-medium max-w-xs flex items-center justify-between ${
                          isSkillMate
                            ? "bg-green-50 border-green-200"
                            : pendingRequest
                            ? "bg-yellow-50 border-yellow-200"
                            : "bg-blue-50 hover:bg-blue-100"
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
                          className="border border-blue-200 text-white bg-blue-600 hover:bg-blue-700 px-6 sm:px-8 py-2 rounded-lg text-sm font-medium"
                          onClick={() => setActiveChatId(profile?._id)}
                          title="Message"
                        >
                          Message
                        </button>
                      )}
                      <button
                        className="border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 px-6 sm:px-8 py-2 rounded-lg text-sm font-medium"
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
                        Report
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Social Section (Mobile) */}
            <div className="sm:hidden mb-8">
              <div className="flex flex-col items-center w-full max-w-sm">
                <div className="flex flex-col gap-3 w-full">
                  {profile?.linkedin && (
                    <a
                      href={`https://linkedin.com/in/${profile.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-100 text-dark-blue"
                    >
                      <FaLinkedin className="text-xl" />
                      LinkedIn
                    </a>
                  )}
                  {profile?.github && (
                    <a
                      href={`https://github.com/${profile.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-100 text-dark-blue"
                    >
                      <FaGithub className="text-xl" />
                      GitHub
                    </a>
                  )}
                  {profile?.twitter && (
                    <a
                      href={`https://twitter.com/${profile.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-100 text-dark-blue"
                    >
                      <FaTwitter className="text-xl" />
                      Twitter
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
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-100 text-dark-blue"
                    >
                      <FaGlobe className="text-xl" />
                      Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Contribution Calendar removed here; appears in Home tab only */}

            {/* Tab Navigation */}
            <div className="px-2 sm:px-0 pt-4 sm:pt-6">
              <div className="flex flex-wrap gap-2 sm:gap-4 border-b border-blue-200 mb-6">
                <button
                  onClick={() => setActiveTab('home')}
                  className={`pb-2 px-3 text-sm font-medium ${
                    activeTab === 'home' ? activeTabStyle : normalTabStyle
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => setActiveTab('live')}
                  className={`pb-2 px-3 text-sm font-medium ${
                    activeTab === 'live' ? activeTabStyle : normalTabStyle
                  }`}
                >
                  Live
                </button>
                <button
                  onClick={() => setActiveTab('videos')}
                  className={`pb-2 px-3 text-sm font-medium ${
                    activeTab === 'videos' ? activeTabStyle : normalTabStyle
                  }`}
                >
                  Videos
                </button>
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

import React, { useEffect, useState } from "react";
import {
  FaUserCircle,
  FaChartBar,
  FaRegSave,
  FaRegFileAlt,
  FaArchive,
  FaHistory,
  FaFileAlt,
  FaUsers,
} from "react-icons/fa";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { BACKEND_URL } from '../../config.js';

// Fetch user profile from backend
const fetchUserProfile = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/user/profile`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch user profile');
    const userData = await response.json();
    
    return {
      fullName: userData.firstName && userData.lastName 
        ? `${userData.firstName} ${userData.lastName}` 
        : userData.firstName || userData.username || 'User',
      userId: userData.username || userData._id || 'viveksemwal',
      profilePic: userData.profilePic || null,
      profilePicPreview: userData.profilePic || null,
      bio: userData.bio || 'Your bio goes here, set it in Setup Profile.',
      country: userData.country || 'Not specified',
      education: userData.education || [],
      experience: userData.experience || [],
      skillMatesCount: userData.skillMatesCount || 0,
      email: userData.email || '',
      skillsToTeach: userData.skillsToTeach || [],
      skillsToLearn: userData.skillsToLearn || [],
      socialLinks: userData.socialLinks || [],
    };
  } catch (err) {
    throw new Error("Failed to fetch user profile");
  }
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMore, setShowMore] = useState(false);

  const loadUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserProfile();
      setUser(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
    window.addEventListener("profileUpdated", loadUser);
    return () => window.removeEventListener("profileUpdated", loadUser);
  }, []);

  const isActive = (path) =>
    location.pathname === `/profile/${path}` ||
    (path === "panel" && location.pathname === "/profile")
      ? "text-blue-900 font-semibold bg-blue-100 rounded-lg"
      : "text-blue-900 hover:bg-blue-100 hover:text-blue-700 rounded-lg";

  return (
    <div className="flex min-h-screen w-full bg-[#f5f8ff] font-sans">
      <aside
        className="hidden sm:sticky sm:top-0 sm:self-start sm:w-16 sm:flex sm:flex-col justify-start items-center gap-2 py-4 bg-white border-r border-blue-100 z-20"
        style={{
          maxHeight: 'calc(100vh - 70px)',
        }}
      >
        {[
          { path: "panel", icon: FaFileAlt, label: "Panel", title: "Go to Profile Panel" },
          { path: "drafts", icon: FaRegFileAlt, label: "Drafts", title: "View Drafts" },
          { path: "analytics", icon: FaChartBar, label: "Analytics", title: "View Analytics" },
          { path: "archived", icon: FaArchive, label: "Archive", title: "View Archived Items" },
          { path: "saved", icon: FaRegSave, label: "Saved", title: "View Saved Items" },
          { path: "history", icon: FaHistory, label: "History", title: "View History" },
          { path: "account", icon: FaUserCircle, label: "Account", title: "Go to Account Settings", route: "/accountSettings" },
        ].map(({ path, icon: Icon, label, title, route }) => (
          <button
            key={path}
            onClick={() => navigate(route || `/profile/${path}`)}
            className={`flex flex-col items-center gap-1 p-2 sm:p-2.5 transition-all duration-300 transform hover:scale-105 ${isActive(path)}`}
            title={title}
            aria-label={title}
          >
            <Icon className="text-blue-900 sprit text-lg sm:text-xl" />
            <span className="text-blue-900 text-[10px] sm:text-xs">{label}</span>
          </button>
        ))}
      </aside>

      <main className="w-full sm:ml-16 sm:w-[calc(100%-4rem)] min-h-screen">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start mb-6">
            {loading ? (
              <div className="flex items-center justify-center w-[100px] h-[100px] sm:w-[180px] sm:h-[180px] mx-auto sm:mx-0">
                <div className="w-8 h-8 sm:w-12 sm:h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 mx-auto sm:mx-0">
                <span className="text-red-500 text-sm">{error}</span>
                <button
                  onClick={loadUser}
                  className="text-blue-900 px-4 py-2 rounded-lg text-sm font-medium bg-blue-100 hover:bg-blue-200 transition-all duration-300"
                  aria-label="Retry loading profile"
                >
                  Retry
                </button>
              </div>
            ) : (
              <img
                src={user?.profilePicPreview || user?.profilePic || "https://placehold.co/100x100?text=User"}
                alt={`${user?.fullName || "User"}'s profile picture`}
                className="w-[100px] h-[100px] sm:w-[180px] sm:h-[180px] rounded-full object-cover border-2 border-blue-200 mx-auto sm:mx-0"
              />
            )}
            <div className="mt-4 sm:mt-0 sm:ml-4 flex-1 flex flex-col sm:flex-row items-center sm:items-start justify-between">
              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-4xl font-bold text-blue-900">{user?.fullName || "User"}</h1>
                <p className="text-sm text-gray-600">@{user?.userId || "viveksemwal"}</p>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-sm text-gray-600 max-w-md">{user?.bio || "Your bio goes here, set it in Setup Profile."}</p>
                  <button
                    onClick={() => setShowMore(true)}
                    className="text-blue-900 text-sm font-semibold hover:text-blue-700"
                    aria-label="View more profile details"
                  >
                    ....More
                  </button>
                </div>
                <button
                  onClick={() => navigate("/profile/skillmates")}
                  className="mt-3 flex items-center gap-2 text-blue-900 text-lg font-medium bg-transparent hover:text-blue-700 shadow-[0_2px_6px_rgba(0,0,139,0.2)] px-5 py-2.5 rounded-lg transition-all duration-300"
                  aria-label="View SkillMates"
                >
                  <FaUsers className="text-blue-900 text-xl" />
                  <span>SkillMates ({user?.skillMatesCount || 0})</span>
                </button>
              </div>
              <button
                onClick={() => navigate("/your-profile")}
                className="mt-4 sm:mt-0 text-blue-900 px-4 py-2 rounded-lg text-sm font-medium bg-blue-100 hover:bg-blue-200 transition-all duration-300"
                aria-label="Setup Profile"
              >
                Setup Profile
              </button>
            </div>
          </div>
        </div>
        <Outlet />
      </main>

      {showMore && (
        <>
          <div
            className="fixed inset-0 z-20 animate-[fadeIn_0.3s_ease-in]"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
            onClick={() => setShowMore(false)}
          ></div>
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] sm:w-[45%] h-[60%] bg-[#f5f8ff] rounded-lg p-6 overflow-y-auto z-30 animate-[fadeIn_0.3s_ease-in]">
            <h2 className="text-2xl font-bold text-blue-900 mb-4">{user?.fullName || "User"}</h2>
            <p className="text-sm text-gray-600 mb-2">@{user?.userId || "viveksemwal"}</p>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-semibold text-blue-900">Country:</span> {user?.country || "Not specified"}
            </p>
            <div className="mb-4">
              <h3 className="font-semibold text-blue-900 mb-1">What I Can Teach:</h3>
              {(user?.skillsToTeach || []).length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {user.skillsToTeach.map((s, i) => (
                    <li key={i} className="bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-xs font-medium">
                      {s.subject} {s.topic ? `> ${s.topic}` : ''} {s.subtopic ? `> ${s.subtopic}` : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 text-sm">Not added yet</p>
              )}
            </div>
            <div className="mb-4">
              <h3 className="font-semibold text-blue-900 mb-1">Education:</h3>
              {(user?.education || []).length > 0 ? (
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {user.education.map((edu, i) => (
                    <li key={i}>
                      {edu.course} {edu.branch ? `(${edu.branch})` : ''} 
                      {edu.college ? `, ${edu.college}` : ''} 
                      {edu.city ? `, ${edu.city}` : ''} 
                      {edu.passingYear ? `, ${edu.passingYear}` : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 text-sm">Not added yet</p>
              )}
            </div>
            <div className="mb-4">
              <h3 className="font-semibold text-blue-900 mb-1">Experience:</h3>
              {(user?.experience || []).length > 0 ? (
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {user.experience.map((exp, i) => (
                    <li key={i}>
                      {exp.position} {exp.company ? `at ${exp.company}` : ''} 
                      {exp.duration ? `, ${exp.duration}` : ''} 
                      {exp.description ? `- ${exp.description}` : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 text-sm">Not added yet</p>
              )}
            </div>
            <div className="mb-4">
              <h3 className="font-semibold text-blue-900 mb-1">Social Links:</h3>
              {(user?.socialLinks || []).length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {user.socialLinks.map((link, i) => (
                    <li key={i}>
                      <a
                        href={link.url}
                        className="text-blue-900 text-sm hover:text-blue-700"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.platform || 'Link'}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 text-sm">Not added yet</p>
              )}
            </div>
            <button
              onClick={() => setShowMore(false)}
              className="text-blue-900 px-4 py-2 rounded-lg text-sm font-medium bg-blue-100 hover:bg-blue-200 transition-all duration-300 w-full"
              aria-label="Close more details"
            >
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Sidebar;
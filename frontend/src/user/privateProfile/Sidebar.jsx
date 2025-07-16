import React, { useEffect, useState } from "react";
import {
  FaUserCircle,
  FaChartBar,
  FaRegSave,
  FaRegFileAlt,
  FaArchive,
  FaHistory,
  FaFileAlt,
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
    console.log("Sidebar fetchUserProfile response:", userData);
    
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
    };
  } catch (err) {
    console.error("Error fetching user profile:", err.message);
    throw new Error("Failed to fetch user profile");
  }
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUser = async () => {
    console.log("loadUser triggered");
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserProfile();
      console.log("Fetched user data:", data);
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
      ? "text-blue-900 font-semibold bg-blue-200 rounded-lg"
      : "text-blue-900 hover:bg-blue-100 hover:text-blue-700 rounded-lg";

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-b from-[#f9fcff] to-[#eef7ff] font-sans animate-fade-in">
      <aside className="fixed bottom-0 left-0 w-full sm:w-16 sm:static flex sm:flex-col justify-around sm:justify-start items-center sm:gap-[2vh] py-2 sm:py-4 sm:min-h-[calc(100vh-4rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hidden bg-blue-50 bg-opacity-80 transition-all duration-500 animate-slide-in-left z-10 sm:z-auto">
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
            className={`flex flex-col items-center gap-1 p-2 sm:p-3 transition-all duration-300 transform hover:scale-105 ${isActive(path)}`}
            title={title}
            aria-label={title}
          >
            <Icon className="text-blue-900 text-xl sm:text-2xl transition-colors duration-300 hover:text-blue-700" />
            <span className="text-blue-900 text-[10px] sm:text-xs">{label}</span>
          </button>
        ))}
      </aside>

      <main className="w-full sm:ml-16 sm:w-[calc(100%-4rem)] min-h-screen p-4 sm:p-6 overflow-y-auto scrollbar-hidden animate-fade-in scroll-smooth">
        <div className="flex flex-col sm:flex-row items-start mb-6">
          {loading ? (
            <div className="flex items-center justify-center w-[100px] h-[100px] sm:w-[180px] sm:h-[180px] mx-auto sm:mx-0">
              <div className="w-8 h-8 sm:w-12 sm:h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 mx-auto sm:mx-0">
              <span className="text-red-500 text-sm transition-all duration-300 animate-fade-in">{error}</span>
              <button
                onClick={loadUser}
                className="text-blue-900 px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 hover:bg-blue-100 transition-all duration-300"
                aria-label="Retry loading profile"
              >
                Retry
              </button>
            </div>
          ) : (
            <img
              src={user?.profilePicPreview || user?.profilePic || "https://placehold.co/100x100?text=User"}
              alt={`${user?.fullName || "User"}'s profile picture`}
              className="w-[100px] h-[100px] sm:w-[180px] sm:h-[180px] rounded-full object-cover border-2 border-blue-200 transition-all duration-300 hover:scale-105 mx-auto sm:mx-0"
            />
          )}
          <div className="mt-4 sm:mt-0 sm:ml-4 flex-1 flex flex-col sm:flex-row items-center sm:items-start justify-between">
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-4xl font-bold text-blue-800 transition-colors duration-300">
                {user?.fullName || "User"}
              </h1>
              <p className="text-sm text-blue-600/70 transition-colors duration-300">@{user?.userId || "viveksemwal"}</p>
              <p className="text-sm text-blue-600/70 mt-2 max-w-md transition-colors duration-300">
                {user?.bio || "Your bio goes here, set it in Setup Profile."}
              </p>
              {/* Country */}
              <p className="text-sm text-blue-600/70 mt-2">
                <span className="font-semibold">Country:</span> {user?.country || "Not specified"}
              </p>
              {/* What I Can Teach */}
              <div className="mt-4 text-left">
                <div className="font-semibold text-blue-900 mb-1">What I Can Teach:</div>
                <ul className="flex flex-wrap gap-2">
                  {(user?.skillsToTeach || []).length > 0 ? (
                    user.skillsToTeach.map((s, i) => (
                      <li key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium border border-blue-200 flex items-center gap-1">
                        {s.subject} {s.topic ? `> ${s.topic}` : ''} {s.subtopic ? `> ${s.subtopic}` : ''}
                      </li>
                    ))
                  ) : (
                    <div className="text-gray-400">Not added yet</div>
                  )}
                </ul>
              </div>
              {/* Education */}
              <div className="mt-4 text-left">
                <div className="font-semibold text-blue-900 mb-1">Education:</div>
                {(user?.education || []).length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-blue-600/70">
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
                  <div className="text-gray-400">Not added yet</div>
                )}
              </div>
              {/* Experience */}
              <div className="mt-4 text-left">
                <div className="font-semibold text-blue-900 mb-1">Experience:</div>
                {(user?.experience || []).length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-blue-600/70">
                    {user.experience.map((exp, i) => (
                      <li key={i}>
                        {exp.position} {exp.company ? `at ${exp.company}` : ''} 
                        {exp.duration ? `, ${exp.duration}` : ''} 
                        {exp.description ? `- ${exp.description}` : ''}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-400">Not added yet</div>
                )}
              </div>
              {/* SkillMates */}
              <div className="mt-4">
                <button
                  className="border border-blue-200 text-blue-900 px-4 sm:px-8 py-2 rounded-lg text-sm font-medium w-full max-w-xs flex items-center justify-between bg-blue-50 bg-opacity-80 hover:bg-blue-100 transition-all duration-300 transform hover:scale-105"
                  onClick={() => navigate("/profile/skillmates")}
                  title="View SkillMates"
                  aria-label="View SkillMates"
                >
                  <span>SkillMates</span>
                  <span className="bg-blue-200 text-blue-900 px-2 py-1 rounded-full text-xs transition-colors duration-300 hover:bg-blue-300">
                    {user?.skillMatesCount || 0}
                  </span>
                </button>
              </div>
            </div>
            <button
              onClick={() => navigate("/your-profile")}
              className="mt-4 sm:mt-0 border border-blue-200 text-blue-900 px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 bg-opacity-80 hover:bg-blue-100 transition-all duration-300 transform hover:scale-105"
              aria-label="Setup Profile"
            >
              Setup Profile
            </button>
          </div>
        </div>
        <div className="h-[calc(100vh-16rem)] sm:h-[calc(100vh-20rem)] overflow-y-auto scrollbar-hidden animate-fade-in scroll-smooth">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Sidebar;
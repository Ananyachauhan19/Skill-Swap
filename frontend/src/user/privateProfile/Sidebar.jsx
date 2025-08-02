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
  FaTimes,
  FaEllipsisH
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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

  // Navigation items for both desktop and mobile
  const navItems = [
    { path: "panel", icon: FaFileAlt, label: "Panel", title: "Go to Profile Panel" },
    { path: "drafts", icon: FaRegFileAlt, label: "Drafts", title: "View Drafts" },
    { path: "analytics", icon: FaChartBar, label: "Analytics", title: "View Analytics" },
    { path: "archived", icon: FaArchive, label: "Archive", title: "View Archived Items" },
    { path: "saved", icon: FaRegSave, label: "Saved", title: "View Saved Items" },
    { path: "history", icon: FaHistory, label: "History", title: "View History" },
    { path: "account", icon: FaUserCircle, label: "Account", title: "Go to Account Settings", route: "/accountSettings" },
  ];

  return (
    <div className="flex min-h-screen w-full bg-[#f5f8ff] font-sans">
      {/* Desktop Sidebar */}
      <aside
        className="hidden sm:sticky sm:top-0 sm:self-start sm:w-16 sm:flex sm:flex-col justify-start items-center gap-2 py-4 bg-white border-r border-blue-100 z-20"
        style={{
          maxHeight: 'calc(100vh - 70px)',
        }}
      >
        {navItems.map(({ path, icon: Icon, label, title, route }) => (
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

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-blue-100 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
        <div className="flex justify-around items-center py-2">
          {navItems.slice(0, 3).map(({ path, icon: Icon, label, title, route }) => (
            <button
              key={path}
              onClick={() => navigate(route || `/profile/${path}`)}
              className={`flex flex-col items-center gap-1 p-2 transition-all duration-300 w-full ${isActive(path)}`}
              title={title}
              aria-label={title}
            >
              <Icon className="text-blue-900 text-lg" />
              <span className="text-blue-900 text-xs">{label}</span>
            </button>
          ))}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="flex flex-col items-center gap-1 p-2 w-full text-blue-900 hover:bg-blue-100 rounded-lg"
            aria-label="More options"
          >
            <FaEllipsisH className="text-lg" />
            <span className="text-xs">More</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="sm:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="w-full bg-white rounded-t-2xl p-4 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-blue-900">Menu</h3>
              <button 
                onClick={() => setShowMobileMenu(false)}
                className="text-blue-900"
                aria-label="Close menu"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {navItems.slice(3).map(({ path, icon: Icon, label, title, route }) => (
                <button
                  key={path}
                  onClick={() => {
                    navigate(route || `/profile/${path}`);
                    setShowMobileMenu(false);
                  }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all duration-300 ${isActive(path)}`}
                  title={title}
                  aria-label={title}
                >
                  <Icon className="text-blue-900 text-xl" />
                  <span className="text-blue-900 text-xs">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="w-full sm:ml-16 sm:w-[calc(100%-4rem)] min-h-screen pb-16 sm:pb-0">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col items-center sm:flex-row sm:items-start mb-6">
            {/* Profile Image */}
            {loading ? (
              <div className="flex items-center justify-center w-[120px] h-[120px] sm:w-[180px] sm:h-[180px]">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 w-full sm:w-auto">
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
                className="w-[120px] h-[120px] sm:w-[180px] sm:h-[180px] rounded-full object-cover border-2 border-blue-200"
              />
            )}
            
            <div className="mt-4 sm:mt-0 sm:ml-4 w-full sm:w-auto flex flex-col items-center sm:items-start justify-between">
              <div className="text-center sm:text-left w-full">
                <h1 className="text-2xl sm:text-4xl font-bold text-blue-900">{user?.fullName || "User"}</h1>
                <p className="text-sm text-gray-600 mt-1">@{user?.userId || "viveksemwal"}</p>
                
                <div className="mt-3">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {user?.bio || "Your bio goes here, set it in Setup Profile."}
                  </p>
                  <button
                    onClick={() => setShowMore(true)}
                    className="text-blue-900 text-sm font-semibold hover:text-blue-700 mt-1"
                    aria-label="View more profile details"
                  >
                    View More
                  </button>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3">
                  <button
                    onClick={() => navigate("/profile/skillmates")}
                    className="flex items-center gap-2 text-blue-900 text-base font-medium bg-transparent hover:text-blue-700 shadow-[0_2px_6px_rgba(0,0,139,0.2)] px-4 py-2 rounded-lg transition-all duration-300 w-full sm:w-auto justify-center"
                    aria-label="View SkillMates"
                  >
                    <FaUsers className="text-blue-900 text-lg" />
                    <span>SkillMates ({user?.skillMatesCount || 0})</span>
                  </button>
                  
                  <button
                    onClick={() => navigate("/your-profile")}
                    className="text-blue-900 px-4 py-2 rounded-lg text-sm font-medium bg-blue-100 hover:bg-blue-200 transition-all duration-300 w-full sm:w-auto"
                    aria-label="Setup Profile"
                  >
                    Setup Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-4 sm:px-6">
          <Outlet />
        </div>
      </main>

      {/* Profile Details Modal */}
      {showMore && (
        <>
         <div
    className="fixed inset-0 z-20 bg-black/20 backdrop-blur-0 animate-[fadeIn_0.3s_ease-in]"
      onClick={() => setShowMore(false)}
></div>

          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md max-h-[80vh] bg-white rounded-lg p-6 overflow-y-auto z-30 animate-[fadeIn_0.3s_ease-in]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-blue-900">{user?.fullName || "User"}</h2>
                <p className="text-sm text-gray-600">@{user?.userId || "viveksemwal"}</p>
              </div>
              <button
                onClick={() => setShowMore(false)}
                className="text-blue-900"
                aria-label="Close more details"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold text-blue-900">Country:</span> {user?.country || "Not specified"}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-blue-900">Email:</span> {user?.email || "Not specified"}
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">What I Can Teach:</h3>
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
              
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Education:</h3>
                {(user?.education || []).length > 0 ? (
                  <ul className="space-y-2">
                    {user.education.map((edu, i) => (
                      <li key={i} className="text-sm text-gray-600">
                        <div className="font-medium">{edu.course}</div>
                        {edu.branch && <div>{edu.branch}</div>}
                        {edu.college && <div>{edu.college}</div>}
                        <div>
                          {edu.city && <span>{edu.city}</span>}
                          {edu.passingYear && <span>, {edu.passingYear}</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600 text-sm">Not added yet</p>
                )}
              </div>
              
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Experience:</h3>
                {(user?.experience || []).length > 0 ? (
                  <ul className="space-y-2">
                    {user.experience.map((exp, i) => (
                      <li key={i} className="text-sm text-gray-600">
                        <div className="font-medium">{exp.position}</div>
                        {exp.company && <div>at {exp.company}</div>}
                        {exp.duration && <div>{exp.duration}</div>}
                        {exp.description && <div className="mt-1">{exp.description}</div>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600 text-sm">Not added yet</p>
                )}
              </div>
              
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Social Links:</h3>
                {(user?.socialLinks || []).length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {user.socialLinks.map((link, i) => (
                      <li key={i}>
                        <a
                          href={link.url}
                          className="text-blue-900 text-sm hover:text-blue-700 bg-blue-50 px-3 py-1 rounded-full inline-block"
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
            </div>
            
            <button
              onClick={() => setShowMore(false)}
              className="mt-4 text-blue-900 px-4 py-2 rounded-lg text-sm font-medium bg-blue-100 hover:bg-blue-200 transition-all duration-300 w-full"
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
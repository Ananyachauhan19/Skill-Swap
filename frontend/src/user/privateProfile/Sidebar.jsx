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
import { useAuth } from '../../context/AuthContext.jsx';
function TutorStatusBadge() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState({ isTutor: false, appStatus: null });

  useEffect(() => {
    let timer;
    (async () => {
      try {
        const { BACKEND_URL } = await import('../../config.js');
        const res = await fetch(`${BACKEND_URL}/api/tutor/status`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const appStatus = data?.application?.status || null;
          const isTutor = !!data?.isTutor;
          setStatus({ isTutor, appStatus });
          // If user has reverted, refetch full profile to clear any stale tutor skills in UI
          if (appStatus === 'reverted') {
            try {
              const prof = await fetch(`${BACKEND_URL}/api/auth/user/profile`, { credentials: 'include' });
              if (prof.ok) {
                const fresh = await prof.json();
                setUser(prev => ({ ...(prev || {}), ...fresh }));
              }
            } catch (_) {}
          }
          // No countdown logic; activation is immediate on approval
        }
      } catch (_) {}
    })();
    return () => { if (timer) clearInterval(timer); };
  }, []);

  // Immediately show Tutor Active when approved or already active
  if (status.isTutor || status.appStatus === 'approved') {
    return <span className="px-3 py-1 rounded-full bg-green-600 text-white font-medium">✓ Tutor Active</span>;
  }
  if (status.appStatus === 'pending') {
    return <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 font-medium">Tutor Application: Pending Review</span>;
  }
  if (status.appStatus === 'rejected') {
    return <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-medium">Tutor Application: Rejected</span>;
  }
  return (
    <button onClick={() => navigate('/tutor/apply')} className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition">Apply as Tutor</button>
  );
}
import { BACKEND_URL } from '../../config.js';
import { useSkillMates } from '../../context/SkillMatesContext.jsx';

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
    
    const profile = {
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
      isTutor: userData.isTutor || false,
      tutorActivationAt: null,
    };

    try {
      const statusRes = await fetch(`${BACKEND_URL}/api/tutor/status`, { credentials: 'include' });
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        profile.tutorApplication = statusData.application;
        // activationRemainingMs removed; immediate activation expected
        profile.isTutor = statusData.isTutor; // override if activated
      } else if (statusRes.status === 404) {
        // No application found - user hasn't applied yet
        profile.tutorApplication = null;
      }
    } catch (e) {
      // ignore errors silently
    }
    return profile;
  } catch {
    throw new Error("Failed to fetch user profile");
  }
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { open: openSkillMates, count: skillMateCount } = useSkillMates();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  // Profile image upload states
  const [imageFile, setImageFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle | uploading | success | error
  const [uploadError, setUploadError] = useState('');

  const onSelectImage = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (f.size > 1024 * 1024) {
      setUploadError('Max size 1MB');
      return;
    }
    if (!['image/jpeg','image/png','image/webp'].includes(f.type)) {
      setUploadError('Allowed: JPEG PNG WEBP');
      return;
    }
    setUploadError('');
    setImageFile(f);
    setUser((prev) => prev ? { ...prev, profilePicPreview: URL.createObjectURL(f) } : prev);
  };

  const uploadProfilePhoto = async () => {
    if (!imageFile) return;
    setUploadStatus('uploading');
    setUploadError('');
    try {
      const form = new FormData();
      form.append('image', imageFile);
      const resp = await fetch(`${BACKEND_URL}/api/user/profile-photo`, {
        method: 'PATCH',
        credentials: 'include',
        body: form,
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || 'Upload failed');
      setUser((prev) => prev ? { ...prev, profilePic: data.profileImageUrl, profilePicPreview: data.profileImageUrl } : prev);
      setUploadStatus('success');
      setTimeout(() => setUploadStatus('idle'), 2000);
      setImageFile(null);
      window.dispatchEvent(new Event('profileUpdated'));
    } catch (e) {
      setUploadStatus('error');
      setUploadError(e.message);
    }
  };

  const loadUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserProfile();
      console.log('[Sidebar] User data loaded:', { 
        isTutor: data.isTutor, 
        hasApplication: !!data.tutorApplication,
        applicationStatus: data.tutorApplication?.status 
      });
      setUser(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
    
    // Refresh user data every 30 seconds to catch tutor activation
    const interval = setInterval(loadUser, 30000);
    
    window.addEventListener("profileUpdated", loadUser);
    window.addEventListener("tutorStatusChanged", loadUser);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("profileUpdated", loadUser);
      window.removeEventListener("tutorStatusChanged", loadUser);
    };
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
        {navItems.map((item) => {
          const { path, icon, label, title, route } = item;
          return (
            <button
              key={path}
              onClick={() => navigate(route || `/profile/${path}`)}
              className={`flex flex-col items-center gap-1 p-2 sm:p-2.5 transition-all duration-300 transform hover:scale-105 ${isActive(path)}`}
              title={title}
              aria-label={title}
            >
              {React.createElement(icon, { className: 'text-blue-900 sprit text-lg sm:text-xl' })}
              <span className="text-blue-900 text-[10px] sm:text-xs">{label}</span>
            </button>
          );
        })}
      </aside>


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
              {navItems.slice(3).map((item) => {
                const { path, icon, label, title, route } = item;
                return (
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
                    {React.createElement(icon, { className: 'text-blue-900 text-xl' })}
                    <span className="text-blue-900 text-xs">{label}</span>
                  </button>
                );
              })}
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
              <div className="relative group">
                <img
                  src={user?.profilePicPreview || user?.profileImageUrl || user?.profilePic || "https://placehold.co/100x100?text=User"}
                  alt={`${user?.fullName || "User"}'s profile picture`}
                  className="w-[120px] h-[120px] sm:w-[180px] sm:h-[180px] rounded-full object-cover border-2 border-blue-200"
                />
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white font-medium rounded-full cursor-pointer transition" title="Change photo">
                  <span>Change</span>
                  <input type="file" accept="image/*" onChange={onSelectImage} className="hidden" />
                </label>
              </div>
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
                
                <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3 w-full">
                  <button
                    onClick={openSkillMates}
                    className="flex items-center gap-2 text-blue-900 text-base font-medium bg-transparent hover:text-blue-700 shadow-[0_2px_6px_rgba(0,0,139,0.2)] px-4 py-2 rounded-lg transition-all duration-300 w-full sm:w-auto justify-center"
                    aria-label="Open SkillMates"
                  >
                    <FaUsers className="text-blue-900 text-lg" />
                    <span>SkillMates ({typeof skillMateCount === 'number' ? skillMateCount : (user?.skillMatesCount || 0)})</span>
                  </button>
                  
                  <button
                    onClick={() => navigate("/your-profile")}
                    className="text-blue-900 px-4 py-2 rounded-lg text-sm font-medium bg-blue-100 hover:bg-blue-200 transition-all duration-300 w-full sm:w-auto"
                    aria-label="Setup Profile"
                  >
                    Setup Profile
                  </button>
                  {/* Upload controls */}
                  {imageFile && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <button
                        onClick={uploadProfilePhoto}
                        disabled={uploadStatus==='uploading'}
                        className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50 hover:bg-indigo-700 transition"
                      >{uploadStatus==='uploading' ? 'Uploading...' : 'Save Photo'}</button>
                      <button
                        onClick={() => { setImageFile(null); setUser((p)=> p ? { ...p, profilePicPreview: p.profilePic } : p); }}
                        className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 transition"
                      >Cancel</button>
                    </div>
                  )}

                  {/* Tutor application status (fetched) */}
                    <TutorStatusBadge />
                </div>
                {(uploadError || uploadStatus==='success') && (
                  <div className="mt-2 w-full text-center sm:text-left">
                    {uploadError && <p className="text-[11px] text-red-600">{uploadError}</p>}
                    {uploadStatus==='success' && <p className="text-[11px] text-green-600">Profile photo updated</p>}
                  </div>
                )}
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
                        {s.class ? `${s.class} • ` : ''}{s.subject} {s.topic === 'ALL' ? ' > ALL Topics' : s.topic ? `> ${s.topic}` : ''} {s.subtopic ? `> ${s.subtopic}` : ''}
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
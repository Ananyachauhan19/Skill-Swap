import React, { useEffect, useRef, useState, useCallback } from "react";
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
  FaEllipsisH,
  FaFlag
} from "react-icons/fa";
import { NavLink, useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from '../../context/AuthContext.jsx';
import { FiEdit2 } from 'react-icons/fi';
function TutorStatusBadge() {
  const { setUser } = useAuth();
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
            } catch {
              /* ignore */
            }
          }
          // No countdown logic; activation is immediate on approval
        }
      } catch {
        /* ignore */
      }
    })();
    return () => { if (timer) clearInterval(timer); };
  }, [setUser]);

  // Immediately show Tutor Active when approved or already active
  if (status.isTutor || status.appStatus === 'approved') {
    return <span className="px-2 py-1 rounded-full border border-green-600 text-green-700 text-xs font-medium">Tutor Active</span>;
  }
  if (status.appStatus === 'pending') {
    return <span className="px-2 py-1 rounded-full border border-yellow-400 text-yellow-800 text-xs font-medium">Tutor: Pending</span>;
  }
  if (status.appStatus === 'rejected') {
    return <span className="px-2 py-1 rounded-full border border-red-400 text-red-700 text-xs font-medium">Tutor: Rejected</span>;
  }
  return (
    <button
      onClick={() => navigate('/tutor/apply')}
      className="px-3 py-1.5 rounded-md border border-blue-200 text-blue-900 text-xs font-medium hover:border-blue-300 transition"
    >
      Apply Tutor
    </button>
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
      userId: userData.username || userData._id || 'User',
      profilePic: userData.profileImageUrl || userData.profilePic || null,
      profilePicPreview: userData.profileImageUrl || userData.profilePic || null,
      coverImageUrl: userData.coverImageUrl || '',
      coverImagePreview: userData.coverImageUrl || '',
      bio: userData.bio || 'Your bio goes here, set it in Setup Profile.',
      country: userData.country || 'Not specified',
      education: userData.education || [],
      experience: userData.experience || [],
      skillMatesCount: userData.skillMatesCount || 0,
      email: userData.email || '',
      skillsToTeach: userData.skillsToTeach || [],
      skillsToLearn: userData.skillsToLearn || [],
      // Build social links list from profile fields so it stays
      // in sync with what the user edits in My Profile.
      socialLinks: [
        userData.linkedin && {
          platform: 'LinkedIn',
          url: `https://linkedin.com/in/${userData.linkedin}`,
        },
        userData.github && {
          platform: 'GitHub',
          url: `https://github.com/${userData.github}`,
        },
        userData.twitter && {
          platform: 'Twitter',
          url: `https://twitter.com/${userData.twitter}`,
        },
        userData.website && {
          platform: 'Website',
          url: userData.website.startsWith('http') ? userData.website : `https://${userData.website}`,
        },
      ].filter(Boolean),
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
    } catch {
      /* ignore */
    }
    return profile;
  } catch {
    throw new Error("Failed to fetch user profile");
  }
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { count: skillMateCount } = useSkillMates();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [sidebarBottomPx, setSidebarBottomPx] = useState(24);
  const coverInputRef = useRef(null);
  // Profile image upload states
  const [imageFile, setImageFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle | uploading | success | error
  const [uploadError, setUploadError] = useState('');

  // Cover image upload states (auto-save)
  const [coverUploadStatus, setCoverUploadStatus] = useState('idle'); // idle | uploading | success | error
  const [coverUploadError, setCoverUploadError] = useState('');

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

  const onSelectCoverImage = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (f.size > 1024 * 1024) {
      setCoverUploadError('Max size 1MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      setCoverUploadError('Allowed: JPEG PNG WEBP');
      return;
    }

    setCoverUploadError('');
    setCoverUploadStatus('uploading');

    const previewUrl = URL.createObjectURL(f);
    setUser((prev) => (prev ? { ...prev, coverImagePreview: previewUrl } : prev));

    try {
      const form = new FormData();
      form.append('image', f);
      const resp = await fetch(`${BACKEND_URL}/api/user/cover-photo`, {
        method: 'PATCH',
        credentials: 'include',
        body: form,
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || 'Upload failed');

      setUser((prev) =>
        prev
          ? {
              ...prev,
              coverImageUrl: data.coverImageUrl,
              coverImagePreview: data.coverImageUrl,
            }
          : prev
      );
      setCoverUploadStatus('success');
      setTimeout(() => setCoverUploadStatus('idle'), 1500);
      window.dispatchEvent(new Event('profileUpdated'));
    } catch (err) {
      setCoverUploadStatus('error');
      setCoverUploadError(err.message);
    } finally {
      if (e.target) e.target.value = '';
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

  const isSideItemActive = (path) => {
    if (path === 'panel') return location.pathname === '/profile' || location.pathname.startsWith('/profile/panel');
    return location.pathname.startsWith(`/profile/${path}`);
  };

  const updateSidebarBottomOffset = useCallback(() => {
    const footerEl = document.getElementById('app-footer');
    const base = 24;

    if (!footerEl) {
      setSidebarBottomPx(base);
      return;
    }

    const rect = footerEl.getBoundingClientRect();
    const overlap = Math.max(0, window.innerHeight - rect.top);
    const capped = Math.min(overlap, rect.height || overlap);
    setSidebarBottomPx(base + capped);
  }, []);

  useEffect(() => {
    let rafId;

    const onScrollOrResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateSidebarBottomOffset);
    };

    onScrollOrResize();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [updateSidebarBottomOffset]);

  // Navigation items for both desktop and mobile
  const navItems = [
    { path: "panel", icon: FaFileAlt, label: "Panel", title: "Go to Profile Panel" },
    { path: "drafts", icon: FaRegFileAlt, label: "Drafts", title: "View Drafts" },
    { path: "analytics", icon: FaChartBar, label: "Analytics", title: "View Analytics" },
    { path: "archived", icon: FaArchive, label: "Archive", title: "View Archived Items" },
    { path: "saved", icon: FaRegSave, label: "Saved", title: "View Saved Items" },
    { path: "history", icon: FaHistory, label: "History", title: "View History" },
    { path: "report", icon: FaFlag, label: "Report", title: "Report an Issue", route: "/report" },
    { path: "account", icon: FaUserCircle, label: "Account", title: "Go to Account Settings", route: "/accountSettings" },
  ];

  return (
    <div className="min-h-screen w-full bg-blue-50 font-sans">
      {/* Desktop Floating Sidebar (icons only, transparent) */}
      <aside
        className="hidden sm:flex sm:fixed sm:left-4 sm:top-28 sm:z-30 sm:flex-col sm:items-stretch sm:gap-1 sm:w-12 lg:hover:sm:w-40 transition-[width] duration-200 ease-out overflow-y-auto scrollbar-hide group/sidebar"
        aria-label="Profile sidebar"
        style={{ bottom: sidebarBottomPx }}
      >
        {navItems.map((item) => {
          const { path, icon, label, title, route } = item;
          const active = isSideItemActive(path);

          return (
            <button
              key={path}
              onClick={() => navigate(route || `/profile/${path}`)}
              className={
                `group/sidebar-item w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ` +
                `focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ` +
                (active
                  ? 'bg-white/70 border border-blue-100 text-blue-900'
                  : 'border border-transparent text-blue-900 hover:bg-white/60 hover:border-blue-100')
              }
              title={title}
              aria-label={title}
            >
              <span className="flex items-center justify-center w-6">
                {React.createElement(icon, { className: 'text-blue-900 text-lg' })}
              </span>

              {/* Label reveal on sidebar hover (no layout shift when collapsed) */}
              <span
                className="text-sm font-medium whitespace-nowrap overflow-hidden max-w-0 opacity-0 transition-[max-width,opacity] duration-200 ease-out lg:group-hover/sidebar:max-w-[140px] lg:group-hover/sidebar:opacity-100"
              >
                {label}
              </span>
            </button>
          );
        })}
      </aside>


      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div
          className="sm:hidden fixed inset-0 bg-transparent z-50 flex items-end"
          onClick={() => setShowMobileMenu(false)}
          role="presentation"
        >
          <div
            className="w-full bg-white rounded-t-2xl border border-blue-100 p-4 animate-slide-up max-h-[70vh] overflow-y-auto scrollbar-hide"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Menu"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-semibold text-blue-900">Menu</h3>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="text-blue-900 p-1 rounded hover:bg-blue-50 transition"
                aria-label="Close menu"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const { path, icon, label, title, route } = item;
                const active = isSideItemActive(path);

                return (
                  <button
                    key={path}
                    onClick={() => {
                      navigate(route || `/profile/${path}`);
                      setShowMobileMenu(false);
                    }}
                    className={
                      `w-full flex items-center gap-3 px-3 py-2 rounded-xl border transition-all duration-200 ` +
                      (active
                        ? 'bg-blue-50 border-blue-200 text-blue-900'
                        : 'bg-transparent border-transparent text-blue-900 hover:bg-blue-50 hover:border-blue-100')
                    }
                    title={title}
                    aria-label={title}
                  >
                    <span className="flex items-center justify-center w-7">
                      {React.createElement(icon, { className: 'text-blue-900 text-lg' })}
                    </span>
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <main className="w-full min-h-screen sm:pl-14 lg:pl-40 pb-10">
        <div className="max-w-6xl mx-auto lg:mx-0 px-4 sm:px-6 pt-4">
          {/* Cover Image (private profile only) */}
          <div className="relative">
            <div className="h-28 sm:h-36 md:h-44 w-full rounded-2xl overflow-hidden border border-blue-100 bg-blue-100">
              {loading ? (
                <div className="w-full h-full animate-pulse bg-blue-100" />
              ) : error ? (
                <div className="w-full h-full flex items-center justify-center text-sm text-red-600 bg-transparent">
                  Failed to load profile
                </div>
              ) : user?.coverImagePreview ? (
                <img
                  src={user.coverImagePreview}
                  alt="Profile cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-100" />
              )}
            </div>

            {!loading && !error && (
              <>
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="absolute top-2 right-2 p-2 rounded-full border border-blue-200 bg-transparent hover:border-blue-300 transition"
                  aria-label="Edit cover image"
                  title="Edit cover image"
                >
                  <FiEdit2 className="text-blue-900 text-sm" />
                </button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={onSelectCoverImage}
                  className="hidden"
                />
              </>
            )}
          </div>

          {/* Profile Header */}
          <div className="mt-3 flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="-mt-10 sm:-mt-12">
              {loading ? (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-blue-100 bg-blue-100 animate-pulse" />
              ) : (
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-blue-100 overflow-hidden bg-blue-100">
                  {user?.profilePicPreview ? (
                    <img
                      src={user.profilePicPreview}
                      alt={`${user?.fullName || 'User'} profile`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaUserCircle className="text-blue-900 text-3xl" />
                    </div>
                  )}

                  <label
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full border border-blue-200 bg-blue-50 cursor-pointer hover:bg-blue-100 transition"
                    title="Change profile photo"
                  >
                    <FiEdit2 className="text-blue-900 text-xs" />
                    <input type="file" accept="image/*" onChange={onSelectImage} className="hidden" />
                  </label>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                      {user?.fullName || 'User'}
                    </h1>
                    <button
                      type="button"
                      onClick={() => navigate('/your-profile')}
                      className="p-1 rounded-md hover:bg-blue-100 transition"
                      aria-label="Edit profile details"
                      title="Edit profile details"
                    >
                      <FiEdit2 className="text-blue-900 text-sm" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 truncate">@{user?.userId || 'user'}</p>
                  <p className="mt-1 text-xs text-gray-700 line-clamp-2">
                    {user?.bio || 'Your bio goes here, set it in Setup Profile.'}
                  </p>
                  <button
                    onClick={() => setShowMore(true)}
                    className="mt-1 text-xs font-medium text-blue-900 hover:text-blue-700"
                    aria-label="View more profile details"
                  >
                    View more
                  </button>

                  {(coverUploadError || coverUploadStatus === 'success') && (
                    <div className="mt-1">
                      {coverUploadError && <p className="text-[11px] text-red-600">{coverUploadError}</p>}
                      {coverUploadStatus === 'success' && <p className="text-[11px] text-green-700">Cover updated</p>}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <button
                    onClick={() => navigate('/chat')}
                    className="px-3 py-1.5 rounded-md border border-blue-200 text-blue-900 text-xs font-medium hover:border-blue-300 transition"
                    aria-label="Open SkillMates"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <FaUsers className="text-blue-900 text-sm" />
                      <span>
                        SkillMates ({typeof skillMateCount === 'number' ? skillMateCount : user?.skillMatesCount || 0})
                      </span>
                    </span>
                  </button>

                  <button
                    onClick={() => navigate('/your-profile')}
                    className="px-3 py-1.5 rounded-md bg-blue-100 text-blue-900 text-xs font-medium hover:bg-blue-200 transition"
                    aria-label="Setup Profile"
                  >
                    Setup Profile
                  </button>

                  <TutorStatusBadge />

                  <button
                    onClick={() => setShowMobileMenu(true)}
                    className="sm:hidden p-2 rounded-md border border-blue-200 text-blue-900 hover:border-blue-300 transition"
                    aria-label="Open menu"
                    title="Menu"
                  >
                    <FaEllipsisH className="text-blue-900 text-sm" />
                  </button>
                </div>
              </div>

              {/* Upload controls for profile photo */}
              {imageFile && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    onClick={uploadProfilePhoto}
                    disabled={uploadStatus === 'uploading'}
                    className="px-3 py-1.5 rounded-md bg-blue-900 text-white text-xs font-medium disabled:opacity-50 hover:bg-blue-800 transition"
                  >
                    {uploadStatus === 'uploading' ? 'Uploading…' : 'Save photo'}
                  </button>
                  <button
                    onClick={() => {
                      setImageFile(null);
                      setUser((p) => (p ? { ...p, profilePicPreview: p.profilePic } : p));
                    }}
                    className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 text-xs font-medium hover:border-gray-400 transition"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {(uploadError || uploadStatus === 'success') && (
                <div className="mt-1">
                  {uploadError && <p className="text-[11px] text-red-600">{uploadError}</p>}
                  {uploadStatus === 'success' && <p className="text-[11px] text-green-700">Profile photo updated</p>}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs (transparent, minimal) */}
          <div className="mt-4 pt-2 pb-2 border-b border-blue-100">
            <nav className="flex flex-nowrap gap-2 sm:gap-3 overflow-x-auto scrollbar-hide -mx-2 px-2">
              <NavLink
                to="/profile/panel/contribution"
                className={({ isActive }) =>
                  `shrink-0 whitespace-nowrap inline-flex items-center justify-center px-2.5 sm:px-3 py-1.5 text-[13px] sm:text-sm font-semibold rounded-xl border transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
                    isActive
                      ? 'text-blue-900 border-blue-900 bg-blue-50 shadow-sm'
                      : 'text-gray-700 border-gray-200 bg-transparent hover:text-blue-900 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm'
                  }`
                }
              >
                Contribution
              </NavLink>
              <NavLink
                to="/profile/panel/home"
                className={({ isActive }) =>
                  `shrink-0 whitespace-nowrap inline-flex items-center justify-center px-2.5 sm:px-3 py-1.5 text-[13px] sm:text-sm font-semibold rounded-xl border transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
                    isActive
                      ? 'text-blue-900 border-blue-900 bg-blue-50 shadow-sm'
                      : 'text-gray-700 border-gray-200 bg-transparent hover:text-blue-900 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm'
                  }`
                }
              >
                Home
              </NavLink>
              {/* <NavLink
                to="/profile/panel/live"
                className={({ isActive }) =>
                  `shrink-0 whitespace-nowrap inline-flex items-center justify-center px-2.5 sm:px-3 py-1.5 text-[13px] sm:text-sm font-semibold rounded-xl border transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
                    isActive
                      ? 'text-blue-900 border-blue-900 bg-blue-50 shadow-sm'
                      : 'text-gray-700 border-gray-200 bg-transparent hover:text-blue-900 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm'
                  }`
                }
              >
                Live
              </NavLink> */}
              <NavLink
                to="/profile/panel/videos"
                className={({ isActive }) =>
                  `shrink-0 whitespace-nowrap inline-flex items-center justify-center px-2.5 sm:px-3 py-1.5 text-[13px] sm:text-sm font-semibold rounded-xl border transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
                    isActive
                      ? 'text-blue-900 border-blue-900 bg-blue-50 shadow-sm'
                      : 'text-gray-700 border-gray-200 bg-transparent hover:text-blue-900 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm'
                  }`
                }
              >
                Videos
              </NavLink>
            </nav>
          </div>
        </div>

        <div className="max-w-6xl mx-auto lg:mx-0 px-4 sm:px-6">
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
                {(() => {
                  const teachSkills = (user?.skillsToTeach || []).filter(s => s.class);
                  if (teachSkills.length === 0) {
                    return <p className="text-gray-600 text-sm">Not added yet</p>;
                  }
                  return (
                    <ul className="flex flex-wrap gap-2">
                      {teachSkills.map((s, i) => (
                        <li key={i} className="bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-xs font-medium">
                          {s.class ? `${s.class} • ` : ''}{s.subject} {s.topic === 'ALL' ? ' > ALL Topics' : s.topic ? `> ${s.topic}` : ''} {s.subtopic ? `> ${s.subtopic}` : ''}
                        </li>
                      ))}
                    </ul>
                  );
                })()}
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
                        {exp.position && exp.company && exp.duration && exp.description ? (
                          <div>
                            <span className="font-medium">{exp.position}</span>
                            {` at ${exp.company} for ${exp.duration}. ${exp.description}`}
                          </div>
                        ) : (
                          <div>
                            {exp.position && <div className="font-medium">{exp.position}</div>}
                            {exp.company && <div>at {exp.company}</div>}
                            {exp.duration && <div>{exp.duration}</div>}
                            {exp.description && <div className="mt-1">{exp.description}</div>}
                          </div>
                        )}
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
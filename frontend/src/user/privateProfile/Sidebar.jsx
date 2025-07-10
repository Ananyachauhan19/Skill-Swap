import React, { useRef, useEffect, useState } from "react";
import {
  FaUserCircle,
  FaChartBar,
  FaRegSave,
  FaRegFileAlt,
  FaArchive,
  FaCoins,
} from "react-icons/fa";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import CoinsBadges from "../myprofile/CoinsBadges";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const [showCoins, setShowCoins] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch static user data (same as Profile.jsx)
  const fetchUser = async () => {
    try {
      // Static user data matching Profile.jsx
      const userData = {
        fullName: 'John Doe',
        userId: 'john_doe123',
        profilePic: 'https://placehold.co/100x100?text=JD',
        profilePicPreview: 'https://placehold.co/100x100?text=JD',
        silver: 1200, 
        gold: 0,   
        badges: ['Starter', 'Helper'],
        rank: 'Bronze',
      };
      return userData;
    } catch {
      throw new Error('Failed to fetch user profile');
    }
    // Uncomment for backend integration
    /*
    const res = await fetch('/api/user/profile', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}' }
    });
    if (!res.ok) throw new Error('Failed to fetch user profile');
    const data = await res.json();
    return {
      fullName: data.fullName || 'Your Name',
      userId: data.userId || 'Your userID',
      profilePic: data.profilePic || 'https://placehold.co/100x100?text=U',
      profilePicPreview: data.profilePicPreview || 'https://placehold.co/100x100?text=U',
      silver: data.silver || 0,
      gold: data.gold || 0,
      badges: data.badges || [''],
      rank: data.rank || '',
    };
    */
  };

  // Load user data and handle profile updates
  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      try {
        const data = await fetchUser();
        setUser(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
    window.addEventListener('profileUpdated', loadUser);
    return () => window.removeEventListener('profileUpdated', loadUser);
  }, []);

  // Close coins dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowCoins(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (path) =>
    location.pathname === `/profile/${path}` ||
    (path === "panel" && location.pathname === "/profile")
      ? "bg-gray-100 text-blue-600 font-semibold"
      : "hover:bg-gray-100 text-gray-700";

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed w-60 h-[calc(100vh-60px)] bg-white px-4 pt-6 shadow z-10">
        <div className="flex flex-col items-center mb-10">
          {loading ? (
            <span>Loading...</span>
          ) : error ? (
            <span className="text-red-500">{error}</span>
          ) : user?.profilePic || user?.profilePicPreview ? (
            <img
              src={user.profilePicPreview || user.profilePic}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover mb-2"
            />
          ) : (
            <FaUserCircle className="text-7xl text-gray-400 mb-2" />
          )}
          <span className="text-lg font-medium text-gray-800">
            {user?.userId || "username"}
          </span>
          <span className="text-base text-gray-600 mt-1">
            {user?.fullName || "fullname"}
          </span>
        </div>

        <nav className="flex flex-col gap-3 text-sm">
          <button onClick={() => navigate("/profile/panel")} className={`flex items-center gap-2 px-3 py-2 rounded-md ${isActive("panel")}`}>
            <FaRegFileAlt className="text-lg" />
            Panel
          </button>
          <button onClick={() => navigate("/profile/drafts")} className={`flex items-center gap-2 px-3 py-2 rounded-md ${isActive("drafts")}`}>
            <FaRegFileAlt className="text-lg" />
            Drafts
          </button>
          <button onClick={() => navigate("/profile/analytics")} className={`flex items-center gap-2 px-3 py-2 rounded-md ${isActive("analytics")}`}>
            <FaChartBar className="text-lg" />
            Analytics
          </button>
          <button onClick={() => navigate("/profile/archived")} className={`flex items-center gap-2 px-3 py-2 rounded-md ${isActive("archived")}`}>
            <FaArchive className="text-lg" />
            Archive
          </button>
          <button onClick={() => navigate("/profile/saved")} className={`flex items-center gap-2 px-3 py-2 rounded-md ${isActive("saved")}`}>
            <FaRegSave className="text-lg" />
            Saved
          </button>
          <button onClick={() => navigate("/accountSettings")} className="flex items-center gap-2 px-3 py-2 rounded-md">
            <FaUserCircle className="text-lg" />
            Account
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-0 md:ml-60 w-full md:w-[calc(100vw-16.1rem)] min-h-screen bg-gray-50">
        {/* Top beside card */}
        <div className="h-42 bg-white px-4 py-3 shadow w-full relative flex flex-col gap-4 justify-center">
          {/* Coins Dropdown (top-right) */}
          <div className="absolute top-3 right-4 z-50" ref={dropdownRef}>
            <button
              onClick={() => setShowCoins((prev) => !prev)}
              className="flex items-center gap-1 px-2 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300 shadow"
            >
              <FaCoins className="text-sm text-yellow-600" />
              Coins
            </button>
            {showCoins && user && (
              <div className="absolute top-8 right-0 z-50 bg-white border shadow-md p-3 rounded-xl w-56">
                <CoinsBadges silver={user.silver || 1200} gold={user.gold || 0} profile={user} />
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-4">
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded bg-gray-500 text-white text-xs shadow hover:bg-gray-600"
              onClick={() => navigate("/your-profile")}
            >
              <FaRegFileAlt className="text-sm" />
              Setup Profile
            </button>

            <div className="flex flex-col items-center">
              <span className="text-base text-gray-700 font-semibold">0</span>
              <button
                className="flex items-center gap-2 px-3 py-1.5 rounded bg-gray-500 text-white text-xs shadow hover:bg-gray-600"
                onClick={() => navigate("/profile/skillmates")}
              >
                <FaRegFileAlt className="text-sm" />
                SkillMates
              </button>
            </div>
          </div>
        </div>

        {/* Main page content */}
        <div className="p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Sidebar;
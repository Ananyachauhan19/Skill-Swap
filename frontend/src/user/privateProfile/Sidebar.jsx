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

  // Fetch user
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/user/profile");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setUser(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
    window.addEventListener("profileUpdated", fetchUser);
    return () => window.removeEventListener("profileUpdated", fetchUser);
  }, []);

  // Close coins on outside click
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
          ) : user?.profilePic ? (
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
                <CoinsBadges silver={user.silver} gold={user.gold} profile={user} />
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

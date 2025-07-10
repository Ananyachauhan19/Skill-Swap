import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

const Panel = () => {
  const [panelData, setPanelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const activeTab = "border-b-2 border-blue-600 text-blue-600";
  const normalTab = "text-gray-600 hover:text-blue-600";
  const location = useLocation();
  // If on /profile/panel exactly, show welcome message
  const isPanelRoot = location.pathname === "/profile/panel";

  useEffect(() => {
    // --- BACKEND FETCH COMMENTED OUT FOR DEMO ---
    // async function fetchPanelData() {
    //   setLoading(true);
    //   setError(null);
    //   try {
    //     const res = await fetch("/api/user/panel");
    //     if (!res.ok) throw new Error("Failed to fetch panel data");
    //     const data = await res.json();
    //     setPanelData(data);
    //   } catch (err) {
    //     setError(err.message);
    //   } finally {
    //     setLoading(false);
    //   }
    // }
    // fetchPanelData();
    // --- STATIC DEMO DATA ---
    setLoading(true);
    setTimeout(() => {
      setPanelData({
      });
      setLoading(false);
    }, 0);
  }, []);

  if (loading) return <div className="text-center py-8">Loading dashboard...</div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

  return (
    <div className="p-4 sm:p-6 w-full">
  {/* Tab Navigation (always visible) */}
  <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 border-b mb-4">
    <NavLink
      to="live"
      className={({ isActive }) =>
        `pb-2 px-2 text-sm font-medium ${isActive ? activeTab : normalTab}`
      }
      end
    >
      Live
    </NavLink>
    <NavLink
      to="videos"
      className={({ isActive }) =>
        `pb-2 px-2 text-sm font-medium ${isActive ? activeTab : normalTab}`
      }
    >
      Videos
    </NavLink>
    <NavLink
      to="playlist"
      className={({ isActive }) =>
        `pb-2 px-2 text-sm font-medium ${isActive ? activeTab : normalTab}`
      }
    >
      Playlist
    </NavLink>
  </div>

  {/* Tab content always below navigation */}
  <div>
    {isPanelRoot ? (
      <div className="text-gray-500 mt-6 text-base sm:text-lg">
        Welcome to your Panel! Select a tab above to get started.
      </div>
    ) : (
      <Outlet />
    )}
  </div>
</div>

  );
};

export default Panel;

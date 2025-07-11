import React, { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

const Panel = () => {
  const [panelData, setPanelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const activeTab = "border-b-2 border-blue-600 text-blue-600";
  const normalTab = "text-gray-600 hover:text-blue-600";

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setPanelData({});
      setLoading(false);
    }, 0);
  }, []);

  if (loading) return <div className="text-center py-8">Loading dashboard...</div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

  return (
    <div className="flex flex-col w-full h-screen p-4 sm:p-6">
      {/* Tab Navigation (fixed at the top) */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 border-b mb-4 sticky top-0 bg-white z-10">
        <NavLink
          to="your-home"
          className={({ isActive }) =>
            `pb-2 px-2 text-sm font-medium ${isActive ? activeTab : normalTab}`
          }
        >
          Home
        </NavLink>
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
      </div>

      {/* Outlet content (fixed position, scrollable content) */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-hidden">
          <Outlet />
        </div>
      </div>

      <style>{`
        .scrollbar-hidden::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hidden {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      `}</style>
    </div>
  );
};

export default Panel;
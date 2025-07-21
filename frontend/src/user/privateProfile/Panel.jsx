import React, { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { FiSearch } from "react-icons/fi";

const Panel = () => {
  const [showSearch, setShowSearch] = useState(false);

  const activeTab = "border-b-2 border-blue-600 text-blue-800 font-semibold";
  const normalTab = "text-gray-700 hover:text-blue-700 transition duration-200";

  return (
    <div className="flex flex-col w-full min-h-screen p-4 sm:p-6 bg-[#f7fbfd]">
      {/* Tabs */}
      <div className="flex items-center gap-6 border-b mb-6 px-4 py-3 rounded-lg bg-[#f0f6fa] sticky top-[8.5%] z-10 shadow-sm">
        <NavLink to="your-home" className={({ isActive }) => `pb-2 text-base ${isActive ? activeTab : normalTab}`}>Home</NavLink>
        <NavLink to="live" className={({ isActive }) => `pb-2 text-base ${isActive ? activeTab : normalTab}`}>Live</NavLink>
        <NavLink to="videos" className={({ isActive }) => `pb-2 text-base ${isActive ? activeTab : normalTab}`}>Videos</NavLink>

        {/* Search Icon with sliding transparent div */}
        <div className="relative flex items-center gap-2">
          <FiSearch
            onClick={() => setShowSearch(!showSearch)}
            className="text-xl text-blue-900 cursor-pointer hover:text-blue-700 transition duration-300"
          />

          {/* Sliding div */}
         <div
  className={`overflow-hidden transition-all duration-500 ease-in-out ${
    showSearch ? "w-40 sm:w-56 opacity-100" : "w-0 opacity-0"
  }`}
>
  <div className="flex items-center px-2 py-[2px] bg-transparent rounded-sm border-b-[2px] border-blue-800">
    <input
      type="text"
      placeholder="Search"
      className="w-full bg-transparent outline-none text-sm text-black text-opacity-70 placeholder:text-black placeholder:text-opacity-50"
    />
  </div>


</div>

         
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default Panel;

import React from "react";

const SearchBar = ({ searchQuery, setSearchQuery }) => {
  return (
    <input
      type="text"
      className="w-full sm:w-64 border rounded px-3 py-2"
      placeholder="Search sessions..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
  );
};


export default SearchBar;
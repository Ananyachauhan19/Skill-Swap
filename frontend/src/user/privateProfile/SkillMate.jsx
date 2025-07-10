import React, { useState } from "react";

// Demo data for skillmates
const demoSkillMates = [
  {
    id: "user123",
    username: "Ananya Sharma",
    profilePic: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    id: "user456",
    username: "Rahul Verma",
    profilePic: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    id: "user789",
    username: "Priya Singh",
    profilePic: "https://randomuser.me/api/portraits/women/68.jpg",
  },
];

const SkillMate = () => {
  const [skillMates, setSkillMates] = useState(demoSkillMates);

  const handleRemove = (id) => {
    setSkillMates((prev) => prev.filter((mate) => mate.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-2 sm:px-4 md:px-8">
      <h2 className="text-2xl font-bold mb-6 text-center">Your SkillMates</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {skillMates.map((mate) => (
          <div key={mate.id} className="flex items-center bg-white rounded-lg shadow p-4 gap-4">
            <img
              src={mate.profilePic}
              alt={mate.username}
              className="w-16 h-16 rounded-full object-cover border"
            />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-lg truncate">{mate.username}</div>
              <div className="text-xs text-gray-500 truncate">ID: {mate.id}</div>
            </div>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
              onClick={() => handleRemove(mate.id)}
            >
              Remove
            </button>
          </div>
        ))}
        {skillMates.length === 0 && (
          <div className="col-span-2 text-center text-gray-500 py-8">No SkillMates found.</div>
        )}
      </div>
    </div>
  );
};

export default SkillMate;

import React from 'react';

const getProfilePic = (profilePic, name) => {
  if (profilePic) return profilePic;
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=DBEAFE&color=1E40AF&bold=true`;
};

const TutorCard = ({ tutor, onRequestSession }) => {
  return (
    <div className="bg-white shadow-md rounded-xl p-6 border border-gray-200 flex flex-col sm:flex-row items-start gap-4">
      <img
        src={getProfilePic(tutor.profilePic, tutor.name)}
        alt="Profile"
        className="w-16 h-16 rounded-full object-cover"
      />

      <div className="flex-1">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-gray-800">{tutor.name}</h2>
          <span className="text-sm">{tutor.status}</span>
        </div>

        <p className="text-sm text-gray-600 mb-1">
          <strong>Date:</strong> {tutor.date}
        </p>
        <p className="text-sm text-gray-600 mb-1">
          <strong>Time:</strong> {tutor.time}
        </p>
        <p className="text-sm text-gray-600 mb-1">
          <strong>Skills:</strong> {tutor.skills.join(', ')}
        </p>
        <p className="text-sm text-gray-600 mb-3">
          <strong>Rating:</strong> ⭐ {tutor.rating}
        </p>

        <button
          onClick={onRequestSession}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
        >
          Request Session
        </button>
      </div>
    </div>
  );
};

export default TutorCard;

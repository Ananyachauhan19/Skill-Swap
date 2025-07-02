import React from 'react';

// Helper to get initials from name
function getInitials(name) {
  if (!name) return '';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Props: tutor { name, profilePic, skills, status, rating, creditPerMin }, onRequestSession
const TutorCard = ({ tutor, onRequestSession }) => {
  const hasImage = tutor.profilePic && tutor.profilePic.trim() !== '';
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white rounded-xl shadow border border-blue-100">
      {hasImage ? (
        <img
          src={tutor.profilePic}
          alt={tutor.name}
          className="w-16 h-16 rounded-full object-cover border-2 border-blue-200"
        />
      ) : (
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-blue-200 text-blue-800 text-2xl font-bold border-2 border-blue-200">
          {getInitials(tutor.name)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-blue-900 text-lg truncate">{tutor.name}</span>
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${tutor.status === 'Online and Free' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{tutor.status === 'Online and Free' ? '🟢 Online and Free' : '🔴 Busy'}</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-1">
          {tutor.skills.map((skill, idx) => (
            <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{skill}</span>
          ))}
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600 mb-1">
          <span>⭐ {tutor.rating.toFixed(1)}</span>
          <span className="text-blue-700 font-semibold">{tutor.creditPerMin} credits/min</span>
        </div>
      </div>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
        onClick={onRequestSession}
        disabled={tutor.status !== 'Online and Free'}
      >
        Request Session
      </button>
    </div>
  );
};

export default TutorCard;

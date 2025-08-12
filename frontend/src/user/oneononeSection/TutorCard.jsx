import React from 'react';

const getProfilePic = (profilePic, name) => {
  if (profilePic) return profilePic;
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=DBEAFE&color=1E3A8A&bold=true`;
};

const TutorCard = ({ tutor, onRequestSession }) => {
  return (
    <div className="bg-blue-50 shadow-lg rounded-2xl p-6 border border-blue-100 flex flex-col sm:flex-row items-center gap-6 transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl max-w-3xl mx-auto">
      <img
        src={getProfilePic(tutor.profilePic, tutor.name)}
        alt="Profile"
        className="w-20 h-20 rounded-full object-cover border-2 border-blue-200 shadow-sm"
      />

      <div className="flex-1 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <h2 className="text-xl font-bold text-blue-900">{tutor.name}</h2>
          <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
            {tutor.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          <p className="text-sm text-gray-700">
            <strong className="text-blue-900">Date:</strong> {tutor.date}
          </p>
          <p className="text-sm text-gray-700">
            <strong className="text-blue-900">Time:</strong> {tutor.time}
          </p>
          <p className="text-sm text-gray-700">
            <strong className="text-blue-900">Skills:</strong> {tutor.skills.join(', ')}
          </p>
          <p className="text-sm text-gray-700">
            <strong className="text-blue-900">Rating:</strong>{' '}
            <span className="text-yellow-500">{'★'.repeat(Math.floor(tutor.rating))}</span>
            <span className="text-gray-400">{'★'.repeat(5 - Math.floor(tutor.rating))}</span>{' '}
            ({tutor.rating})
          </p>
        </div>

        <button
          onClick={onRequestSession}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
        >
          Request Session
        </button>
      </div>
    </div>
  );
};

export default TutorCard;
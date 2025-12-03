import React from 'react';
import { FaCalendarAlt, FaClock, FaStar, FaUserGraduate, FaCheckCircle } from 'react-icons/fa';

const getProfilePic = (profilePic, name) => {
  if (profilePic && profilePic !== '/default-user.png') return profilePic;
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=3b82f6&color=fff&bold=true`;
};

const TutorCard = ({ tutor, onRequestSession }) => {
  const isAvailable = tutor.status?.includes('Available');

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 transition-all">
      <div className="flex items-start gap-4 mb-5">
        {/* Profile Image */}
        <div className="relative flex-shrink-0">
          <img
            src={getProfilePic(tutor.profilePic, tutor.name)}
            alt={tutor.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
          />
          {isAvailable && (
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
          )}
        </div>

        {/* Tutor Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">{tutor.name}</h3>
          <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium ${
            isAvailable 
              ? 'bg-green-50 text-green-700' 
              : 'bg-red-50 text-red-700'
          }`}>
            {tutor.status}
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="space-y-3 mb-5">
        <div className="flex items-center gap-3">
          <FaCalendarAlt className="text-blue-600 text-sm flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Session Date</p>
            <p className="font-medium text-gray-900">{tutor.date || 'Not scheduled'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <FaClock className="text-blue-600 text-sm flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Time</p>
            <p className="font-medium text-gray-900">{tutor.time || 'Flexible'}</p>
          </div>
        </div>

        {tutor.skills && tutor.skills.length > 0 && (
          <div className="flex items-start gap-3">
            <FaUserGraduate className="text-blue-600 text-sm flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1.5">Expertise</p>
              <div className="flex flex-wrap gap-1.5">
                {tutor.skills.map((skill, idx) => (
                  <span 
                    key={idx}
                    className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {tutor.rating && (
          <div className="flex items-center gap-3">
            <FaStar className="text-yellow-500 text-sm flex-shrink-0" />
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <FaStar 
                    key={i} 
                    className={i < Math.floor(tutor.rating) ? 'text-yellow-400' : 'text-gray-300'} 
                    size={12} 
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {tutor.rating.toFixed(1)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={onRequestSession}
        className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
      >
        <FaCheckCircle size={16} />
        <span>Request Session</span>
      </button>
    </div>
  );
};

export default TutorCard;
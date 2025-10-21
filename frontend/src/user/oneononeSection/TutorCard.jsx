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
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-2 border-[#93c5fd] hover:border-[#3b82f6] overflow-hidden group">
      {/* Accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#3b82f6] to-[#2563eb]"></div>

      <div className="flex items-start gap-4 mb-5">
        {/* Profile Image */}
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6] to-[#2563eb] opacity-20 rounded-full blur-md"></div>
          <img
            src={getProfilePic(tutor.profilePic, tutor.name)}
            alt={tutor.name}
            className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-3 border-white shadow-lg ring-2 ring-[#3b82f6]"
          />
          {isAvailable && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
          )}
        </div>

        {/* Tutor Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-[#1e3a8a] mb-1 truncate">{tutor.name}</h3>
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              isAvailable 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {tutor.status}
            </span>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="space-y-3 mb-5">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <div className="w-8 h-8 bg-gradient-to-br from-[#60a5fa] to-[#3b82f6] rounded-lg flex items-center justify-center">
            <FaCalendarAlt className="text-white text-xs" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Session Date</p>
            <p className="font-semibold text-[#1e3a8a]">{tutor.date || 'Not scheduled'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-600">
          <div className="w-8 h-8 bg-gradient-to-br from-[#93c5fd] to-[#60a5fa] rounded-lg flex items-center justify-center">
            <FaClock className="text-white text-xs" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Time</p>
            <p className="font-semibold text-[#1e3a8a]">{tutor.time || 'Flexible'}</p>
          </div>
        </div>

        {tutor.skills && tutor.skills.length > 0 && (
          <div className="flex items-start gap-3 text-sm text-gray-600">
            <div className="w-8 h-8 bg-gradient-to-br from-[#60a5fa] to-[#3b82f6] rounded-lg flex items-center justify-center flex-shrink-0">
              <FaUserGraduate className="text-white text-xs" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-medium mb-1">Expertise</p>
              <div className="flex flex-wrap gap-1.5">
                {tutor.skills.map((skill, idx) => (
                  <span 
                    key={idx}
                    className="px-2.5 py-1 bg-blue-50 text-[#1e3a8a] text-xs font-semibold rounded-lg border border-blue-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {tutor.rating && (
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] rounded-lg flex items-center justify-center">
              <FaStar className="text-white text-xs" />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <FaStar 
                    key={i} 
                    className={i < Math.floor(tutor.rating) ? 'text-yellow-400' : 'text-gray-300'} 
                    size={14} 
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-[#1e3a8a]">
                {tutor.rating.toFixed(1)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={onRequestSession}
        className="w-full py-3 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300 hover:scale-105 transform flex items-center justify-center gap-2"
      >
        <FaCheckCircle className="text-lg" />
        <span>Request Session</span>
      </button>
    </div>
  );
};

export default TutorCard;
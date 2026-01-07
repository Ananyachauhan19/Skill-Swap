import React, { useState } from 'react';
import { FaCalendarAlt, FaClock, FaStar, FaUserGraduate, FaCheckCircle, FaComments, FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import TutorFeedbackModal from '../../components/TutorFeedbackModal';

const getProfilePic = (profilePic, name) => {
  if (profilePic && profilePic !== '/default-user.png') return profilePic;
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=1e3a8a&color=fff&bold=true`;
};

const TutorCard = ({ tutor, onRequestSession }) => {
  const isAvailable = tutor.status?.includes('Available');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const navigate = useNavigate();

  const handleProfileClick = (e) => {
    e.stopPropagation();
    const username = tutor.username || tutor.userId;
    if (username) {
      navigate(`/profile/${username}`);
    } else {
      console.warn('No username or userId available for tutor:', tutor);
    }
  };

  return (
    <div className={`w-full rounded-md md:rounded-lg border-2 transition-all duration-300 overflow-hidden group max-h-[140px] sm:max-h-[160px] md:max-h-none
      ${isAvailable 
        ? 'bg-gradient-to-br from-emerald-50/50 via-white to-blue-50/30 border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-100 hover:shadow-xl' 
        : 'bg-gradient-to-br from-slate-50 to-blue-50/50 border-slate-200 hover:border-blue-300 hover:shadow-lg'
      }`}
    >
      <div className="flex flex-row items-stretch h-full">
        {/* Left Section - Profile & Basic Info */}
        <div 
          onClick={handleProfileClick}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 md:gap-3 p-2 sm:p-3 md:p-4 text-white cursor-pointer transition-all duration-300
            w-20 sm:w-24 md:w-40 lg:w-56 xl:w-64 flex-shrink-0
            ${isAvailable 
              ? 'bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-700 hover:from-emerald-700 hover:via-teal-700 hover:to-blue-800' 
              : 'bg-gradient-to-br from-slate-600 via-slate-700 to-blue-800 hover:from-slate-700 hover:via-slate-800 hover:to-blue-900'
            }`}
        >
          <div className="relative flex-shrink-0">
            <img
              src={getProfilePic(tutor.profilePic, tutor.name)}
              alt={tutor.name}
              className="w-10 h-10 sm:w-11 sm:h-11 md:w-14 md:h-14 rounded-full object-cover border-2 border-white shadow-lg group-hover:scale-105 transition-transform duration-300"
            />
            {isAvailable && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 bg-emerald-400 border-2 border-white rounded-full animate-pulse shadow-md">
                <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
              </div>
            )}
            {!isAvailable && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 bg-red-500 border-2 border-white rounded-full shadow-md"></div>
            )}
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h3 className="text-[10px] sm:text-xs md:text-sm lg:text-base font-bold truncate mb-0.5 sm:mb-1 group-hover:text-emerald-100 transition-colors leading-tight">
              {tutor.name}
            </h3>
            <span className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] md:text-xs font-semibold shadow-sm
              ${isAvailable 
                ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300' 
                : 'bg-red-100 text-red-700 ring-1 ring-red-300'
              }`}>
              <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></span>
              <span className="hidden sm:inline">{tutor.status}</span>
              <span className="sm:hidden">{isAvailable ? 'On' : 'Off'}</span>
            </span>
          </div>

          <div className="hidden lg:block">
            <FaUser className="text-white/70 text-xs md:text-sm group-hover:text-white/90 transition-colors" />
          </div>
        </div>

        {/* Middle Section - Details */}
        <div className="flex-1 p-1.5 sm:p-2 md:p-3 lg:p-4 flex flex-wrap items-center gap-x-2 sm:gap-x-3 md:gap-x-4 gap-y-1.5 sm:gap-y-2 md:gap-y-2.5 bg-white/80 backdrop-blur-sm overflow-hidden">
          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 min-w-[70px] sm:min-w-[90px] md:min-w-[120px] lg:min-w-[140px]">
            <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded bg-blue-50 flex items-center justify-center flex-shrink-0 ring-1 ring-blue-100">
              <FaCalendarAlt className="text-blue-600 text-[8px] sm:text-[9px] md:text-xs lg:text-sm" />
            </div>
            <div className="min-w-0">
              <p className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-slate-500 leading-none mb-0.5 font-medium">Date</p>
              <p className="font-bold text-slate-900 text-[9px] sm:text-[10px] md:text-xs lg:text-sm leading-none truncate">{tutor.date || 'Flex'}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 min-w-[60px] sm:min-w-[80px] md:min-w-[100px] lg:min-w-[120px]">
            <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded bg-blue-50 flex items-center justify-center flex-shrink-0 ring-1 ring-blue-100">
              <FaClock className="text-blue-600 text-[8px] sm:text-[9px] md:text-xs lg:text-sm" />
            </div>
            <div className="min-w-0">
              <p className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-slate-500 leading-none mb-0.5 font-medium">Time</p>
              <p className="font-bold text-slate-900 text-[9px] sm:text-[10px] md:text-xs lg:text-sm leading-none truncate">{tutor.time || 'Flex'}</p>
            </div>
          </div>

          {tutor.skills && tutor.skills.length > 0 && (
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-1 min-w-[100px] sm:min-w-[140px] md:min-w-[180px]">
              <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded bg-indigo-50 flex items-center justify-center flex-shrink-0 ring-1 ring-indigo-100">
                <FaUserGraduate className="text-indigo-600 text-[8px] sm:text-[9px] md:text-xs lg:text-sm" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-slate-500 leading-none mb-1 font-medium">Expertise</p>
                <div className="flex flex-wrap gap-0.5 sm:gap-1">
                  {tutor.skills.slice(0, 2).map((skill, idx) => (
                    <span 
                      key={idx}
                      className="px-1.5 sm:px-2 py-0.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs font-semibold rounded-full shadow-sm truncate max-w-[80px] sm:max-w-none"
                    >
                      {skill}
                    </span>
                  ))}
                  {tutor.skills.length > 2 && (
                    <span className="px-1.5 sm:px-2 py-0.5 bg-slate-200 text-slate-700 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs font-semibold rounded-full">
                      +{tutor.skills.length - 2}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {tutor.rating && (
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded bg-amber-50 flex items-center justify-center flex-shrink-0 ring-1 ring-amber-100">
                <FaStar className="text-amber-600 text-[8px] sm:text-[9px] md:text-xs lg:text-sm" />
              </div>
              <div className="flex items-center gap-1">
                <div className="hidden sm:flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <FaStar 
                      key={i} 
                      className={i < Math.floor(tutor.rating) ? 'text-amber-500' : 'text-slate-300'} 
                      size={8} 
                    />
                  ))}
                </div>
                <span className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-bold text-slate-900">
                  {tutor.rating.toFixed(1)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Section - Action Buttons */}
        <div className="flex flex-col gap-1 sm:gap-1.5 md:gap-2 p-1.5 sm:p-2 md:p-3 lg:p-4 bg-gradient-to-br from-slate-50/80 to-blue-50/80 backdrop-blur-sm border-l border-slate-200/50 w-16 sm:w-24 md:w-32 lg:w-40 xl:w-44 flex-shrink-0 justify-center">
          <button
            onClick={onRequestSession}
            className={`flex-1 py-1.5 sm:py-2 px-1.5 sm:px-2 md:px-3 rounded md:rounded-lg font-bold transition-all duration-300 flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 shadow-md hover:shadow-lg text-[9px] sm:text-[10px] md:text-xs lg:text-sm transform hover:-translate-y-0.5 active:translate-y-0
              ${isAvailable 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 ring-1 sm:ring-2 ring-emerald-200' 
                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 ring-1 sm:ring-2 ring-blue-200'
              }`}
          >
            <FaCheckCircle size={10} className="sm:w-3 sm:h-3" />
            <span className="hidden sm:inline">Request</span>
            <span className="sm:hidden">Req</span>
          </button>
          
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="flex-1 py-1.5 sm:py-2 px-1.5 sm:px-2 md:px-3 bg-white border border-indigo-600 sm:border-2 text-indigo-700 rounded md:rounded-lg font-bold hover:bg-indigo-600 hover:text-white transition-all duration-300 flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 shadow-sm hover:shadow-md text-[9px] sm:text-[10px] md:text-xs lg:text-sm transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <FaComments size={10} className="sm:w-3 sm:h-3" />
            <span className="hidden sm:inline">Feedback</span>
            <span className="sm:hidden">Rate</span>
          </button>
        </div>
      </div>

      {/* Feedback Modal */}
      <TutorFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        tutorId={tutor.userId}
        tutorName={tutor.name}
      />
    </div>
  );
};

export default TutorCard;
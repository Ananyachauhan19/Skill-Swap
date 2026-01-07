import React, { useState } from 'react';
import { FaStar, FaUser, FaBriefcase, FaGraduationCap, FaCheckCircle, FaEye } from 'react-icons/fa';
import FeedbackModal from './FeedbackModal';

function InterviewerCard({ interviewer: m, onBookSession, navigate, onModalAction }) {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const isAvailable = true; // Interviewers are typically available

  const getProfilePic = (profilePic, name) => {
    if (profilePic) return profilePic;
    const initial = name ? name.charAt(0).toUpperCase() : '?';
    return `https://ui-avatars.com/api/?name=${initial}&background=1e3a8a&color=fff&size=128`;
  };

  const displayName = (m.user?.firstName || m.user?.username) + (m.user?.lastName ? ` ${m.user.lastName}` : '');

  const handleProfileClick = (e) => {
    e.stopPropagation();
    const username = m.user?.username || m.user?._id;
    if (username) {
      navigate(`/profile/${username}`);
      if (onModalAction) onModalAction();
    } else {
      console.warn('No username or _id available for interviewer:', m);
    }
  };

  return (
    <>
      <div className="w-full bg-gradient-to-br from-violet-50/50 via-white to-blue-50/30 rounded-lg border-2 border-violet-200 hover:border-violet-400 hover:shadow-violet-100 hover:shadow-xl transition-all duration-300 overflow-hidden group">
        <div className="flex flex-col lg:flex-row items-stretch">
          {/* Left Section - Profile & Basic Info */}
          <div 
            onClick={handleProfileClick}
            className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-800 text-white cursor-pointer transition-all duration-300 lg:w-56 xl:w-64 flex-shrink-0"
          >
            <div className="relative flex-shrink-0">
              <img
                src={getProfilePic(m.user?.profilePic, displayName)}
                alt={displayName}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-white shadow-lg group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full shadow-md">
                <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-bold truncate mb-1 group-hover:text-violet-100 transition-colors">{displayName}</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 ring-1 ring-violet-300 shadow-sm">
                <FaGraduationCap size={10} />
                Interviewer
              </span>
            </div>

            <div className="hidden lg:block">
              <FaUser className="text-white/70 text-sm group-hover:text-white/90 transition-colors" />
            </div>
          </div>

          {/* Middle Section - Details */}
          <div className="flex-1 p-3 sm:p-4 flex flex-wrap items-center gap-x-4 gap-y-2.5 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 min-w-[150px] sm:min-w-[180px]">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0 ring-1 ring-violet-100">
                <FaBriefcase className="text-violet-600 text-xs sm:text-sm" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] sm:text-xs text-slate-500 leading-none mb-0.5 font-medium">Company</p>
                <p className="font-bold text-slate-900 text-xs sm:text-sm leading-none truncate">
                  {m.application?.company || m.user?.college || 'Not specified'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 min-w-[150px] sm:min-w-[180px]">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 ring-1 ring-indigo-100">
                <FaUser className="text-indigo-600 text-xs sm:text-sm" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] sm:text-xs text-slate-500 leading-none mb-0.5 font-medium">Position</p>
                <p className="font-bold text-slate-900 text-xs sm:text-sm leading-none truncate">
                  {m.application?.position || m.application?.qualification || 'Not specified'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 ring-1 ring-blue-100">
                <FaCheckCircle className="text-blue-600 text-xs sm:text-sm" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-slate-500 leading-none mb-0.5 font-medium">Interviews</p>
                <p className="font-bold text-slate-900 text-xs sm:text-sm leading-none">{m.stats?.conductedInterviews || 0}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 ring-1 ring-amber-100">
                <FaStar className="text-amber-600 text-xs sm:text-sm" />
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <FaStar 
                      key={i} 
                      className={i < Math.floor(m.stats?.averageRating || 0) ? 'text-amber-500' : 'text-slate-300'} 
                      size={10} 
                    />
                  ))}
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  {(m.stats?.averageRating || 0).toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Section - Action Buttons */}
          <div className="flex lg:flex-col gap-2 p-3 sm:p-4 bg-gradient-to-br from-slate-50/80 to-violet-50/80 backdrop-blur-sm border-t lg:border-t-0 lg:border-l border-slate-200/50 lg:w-40 xl:w-44 flex-shrink-0">
            <button
              onClick={() => {
                onBookSession({
                  interviewer: m,
                });
                if (onModalAction) onModalAction();
              }}
              className="flex-1 lg:flex-none py-2 px-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-bold hover:from-violet-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-xs sm:text-sm transform hover:-translate-y-0.5 active:translate-y-0 ring-2 ring-violet-200"
            >
              <FaCheckCircle size={13} />
              <span>Book</span>
            </button>
            
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="flex-1 lg:flex-none py-2 px-3 bg-white border-2 border-amber-500 text-amber-700 rounded-lg font-bold hover:bg-amber-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md text-xs sm:text-sm transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <FaStar size={13} />
              <span>Feedback</span>
            </button>

            <button
              onClick={() => {
                navigate(`/profile/${m.user?.username || m.user?._id}`);
                if (onModalAction) onModalAction();
              }}
              className="flex-1 lg:flex-none py-2 px-3 bg-white border-2 border-slate-400 text-slate-700 rounded-lg font-bold hover:bg-slate-100 transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md text-xs sm:text-sm transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <FaEye size={13} />
              <span>Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal 
          isOpen={showFeedbackModal} 
          onClose={() => setShowFeedbackModal(false)} 
          interviewer={m}
        />
      )}
    </>
  );
}

export default InterviewerCard;

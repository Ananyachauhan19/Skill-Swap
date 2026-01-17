import React, { useState } from 'react';
import { FaStar, FaUser, FaBriefcase, FaGraduationCap, FaCheckCircle } from 'react-icons/fa';
import FeedbackModal from './FeedbackModal';

function InterviewerCard({ interviewer: m, onBookSession, navigate, onModalAction }) {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const isAvailable = true; // Interviewers are typically available

  const getProfilePic = (profilePic, name) => {
    if (profilePic) return profilePic;
    const initial = name ? name.charAt(0).toUpperCase() : '?';
    return `https://ui-avatars.com/api/?name=${initial}&background=1e3a8a&color=fff&size=128`;
  };

  const baseName = m.user?.firstName || m.user?.username || 'Interviewer';
  const displayName = baseName + (m.user?.lastName ? ` ${m.user.lastName}` : '');

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
      <div className="w-full bg-white rounded-lg border border-slate-200 hover:border-blue-200 hover:shadow-lg transition-all duration-300 group">
        {/* Top Section - Profile */}
        <div
          onClick={handleProfileClick}
          className="flex items-start gap-2 sm:gap-2.5 p-2 sm:p-3 bg-white hover:bg-slate-50 text-slate-900 cursor-pointer transition-all duration-300 border-b border-slate-200"
        >
            <div className="relative flex-shrink-0">
              <img
                src={getProfilePic(m.user?.profilePic, displayName)}
                alt={displayName}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white shadow-lg group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full shadow-md">
                <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1.5">
                <h3 className="text-xs sm:text-sm font-bold truncate group-hover:text-slate-900 transition-colors leading-tight">
                  {displayName}
                </h3>
                <FaUser className="text-slate-400 text-xs flex-shrink-0 mt-0.5" />
              </div>

              <div className="mt-0.5 sm:mt-1 flex flex-wrap items-center gap-1 sm:gap-1.5">
                <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-white text-blue-900 ring-1 ring-blue-200 shadow-sm">
                  <FaGraduationCap size={9} />
                  Interviewer
                </span>
                {isAvailable && (
                  <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Available
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Middle Section - Details */}
          <div className="p-2 sm:p-2.5 bg-white">
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 ring-1 ring-blue-100">
                  <FaBriefcase className="text-blue-700 text-[10px] sm:text-xs" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] sm:text-[10px] text-slate-500 leading-none mb-0.5 font-medium">Company</p>
                  <p className="font-bold text-slate-900 text-[10px] sm:text-xs leading-tight truncate">
                    {m.application?.company || m.user?.college || 'Not specified'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 ring-1 ring-indigo-100">
                  <FaUser className="text-indigo-600 text-[10px] sm:text-xs" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] sm:text-[10px] text-slate-500 leading-none mb-0.5 font-medium">Position</p>
                  <p className="font-bold text-slate-900 text-[10px] sm:text-xs leading-tight truncate">
                    {m.application?.position || m.application?.qualification || 'Not specified'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 ring-1 ring-blue-100">
                  <FaCheckCircle className="text-blue-600 text-[10px] sm:text-xs" />
                </div>
                <div>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 leading-none mb-0.5 font-medium">Interviews</p>
                  <p className="font-bold text-slate-900 text-[10px] sm:text-xs leading-tight">
                    {m.stats?.conductedInterviews || 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 ring-1 ring-amber-100">
                  <FaStar className="text-amber-600 text-[10px] sm:text-xs" />
                </div>
                <div className="flex items-center gap-1 min-w-0">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={i < Math.floor(m.stats?.averageRating || 0) ? 'text-amber-500' : 'text-slate-300'}
                        size={8}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-900">
                    {(m.stats?.averageRating || 0).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section - Action Buttons */}
          <div className="p-2 sm:p-2.5 pt-0 bg-white">
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBookSession({ interviewer: m });
                  if (onModalAction) onModalAction();
                }}
                className="py-1.5 sm:py-2 px-2 sm:px-3 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-950 transition-all duration-300 flex items-center justify-center gap-1 sm:gap-1.5 shadow-md hover:shadow-lg text-[10px] sm:text-xs ring-2 ring-blue-100"
              >
                <FaCheckCircle size={12} />
                <span className="truncate">Book</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFeedbackModal(true);
                }}
                className="py-1.5 sm:py-2 px-2 sm:px-3 bg-white border-2 border-amber-500 text-amber-700 rounded-lg font-bold hover:bg-amber-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-1 sm:gap-1.5 shadow-sm hover:shadow-md text-[10px] sm:text-xs"
              >
                <FaStar size={12} />
                <span className="truncate">Feedback</span>
              </button>
            </div>
          </div>
        </div>

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

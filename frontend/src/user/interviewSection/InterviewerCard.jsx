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
          className="flex items-start gap-3 p-3 sm:p-4 bg-white hover:bg-slate-50 text-slate-900 cursor-pointer transition-all duration-300 border-b border-slate-200"
        >
            <div className="relative flex-shrink-0">
              <img
                src={getProfilePic(m.user?.profilePic, displayName)}
                alt={displayName}
                className="w-11 h-11 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-white shadow-lg group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-emerald-400 border-2 border-white rounded-full shadow-md">
                <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm sm:text-base font-bold truncate group-hover:text-slate-900 transition-colors">
                  {displayName}
                </h3>
                <FaUser className="text-slate-400 text-sm flex-shrink-0" />
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-white text-blue-900 ring-1 ring-blue-200 shadow-sm">
                  <FaGraduationCap size={10} />
                  Interviewer
                </span>
                {isAvailable && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Available
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Middle Section - Details */}
          <div className="p-3 sm:p-4 bg-white">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 ring-1 ring-blue-100">
                  <FaBriefcase className="text-blue-700 text-xs sm:text-sm" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-slate-500 leading-none mb-0.5 font-medium">Company</p>
                  <p className="font-bold text-slate-900 text-xs sm:text-sm leading-none truncate">
                    {m.application?.company || m.user?.college || 'Not specified'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 ring-1 ring-indigo-100">
                  <FaUser className="text-indigo-600 text-xs sm:text-sm" />
                </div>
                <div className="min-w-0">
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
                  <p className="font-bold text-slate-900 text-xs sm:text-sm leading-none">
                    {m.stats?.conductedInterviews || 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 ring-1 ring-amber-100">
                  <FaStar className="text-amber-600 text-xs sm:text-sm" />
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
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
          </div>

          {/* Bottom Section - Action Buttons */}
          <div className="p-3 sm:p-4 pt-0 bg-white">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBookSession({ interviewer: m });
                  if (onModalAction) onModalAction();
                }}
                className="py-2.5 px-3 sm:px-4 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-950 transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-xs sm:text-sm ring-2 ring-blue-100"
              >
                <FaCheckCircle size={14} />
                <span className="truncate">Book</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFeedbackModal(true);
                }}
                className="py-2.5 px-3 sm:px-4 bg-white border-2 border-amber-500 text-amber-700 rounded-lg font-bold hover:bg-amber-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md text-xs sm:text-sm"
              >
                <FaStar size={14} />
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

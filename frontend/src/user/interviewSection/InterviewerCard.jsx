import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';
import FeedbackModal from './FeedbackModal';

function InterviewerCard({ interviewer: m, onBookSession, navigate, onModalAction }) {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const getProfilePic = (profilePic, name) => {
    if (profilePic) return profilePic;
    const initial = name ? name.charAt(0).toUpperCase() : '?';
    return `https://ui-avatars.com/api/?name=${initial}&background=1e3a8a&color=fff&size=128`;
  };

  const displayName = (m.user?.firstName || m.user?.username) + (m.user?.lastName ? ` ${m.user.lastName}` : '');

  return (
    <>
      <div className="p-2 sm:p-3 lg:p-4 rounded-lg bg-white border border-slate-200/50 hover:border-blue-900/30 transition-all hover:shadow-lg flex flex-col">
        <div className="flex-1">
          {/* Profile Header */}
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <img
              src={getProfilePic(m.user?.profilePic, displayName)}
              alt={displayName}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-200"
            />
            <div className="font-bold text-slate-900 text-xs sm:text-sm lg:text-base truncate leading-tight flex-1">
              {displayName}
            </div>
          </div>
          <div className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs lg:text-sm">
            <div>
              <div className="text-slate-500 text-[10px] sm:text-xs mb-0.5">Company</div>
              <div className="text-slate-900 font-medium truncate">{m.application?.company || m.user?.college || '—'}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px] sm:text-xs mb-0.5">Position</div>
              <div className="text-slate-900 font-medium truncate">{m.application?.position || m.application?.qualification || '—'}</div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-500 text-[10px] sm:text-xs mb-0.5">Interviews</div>
                <div className="text-slate-900 font-medium">{m.stats?.conductedInterviews || 0}</div>
              </div>
              <div>
                <div className="text-slate-500 text-[10px] sm:text-xs mb-0.5">Rating</div>
                <div className="flex items-center gap-1 text-slate-900 font-medium">
                  <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-xs">{(m.stats?.averageRating || 0).toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1 sm:gap-1.5 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-100">
          <button
            onClick={() => {
              navigate(`/profile/${m.user?.username}`);
              if (onModalAction) onModalAction();
            }}
            className="w-full px-2 py-1 sm:px-3 sm:py-1.5 bg-slate-100 text-slate-900 border border-slate-300 rounded text-[10px] sm:text-xs font-medium hover:bg-slate-200 transition-colors"
          >
            View Profile
          </button>
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="w-full px-2 py-1 sm:px-3 sm:py-1.5 bg-amber-50 text-amber-900 border border-amber-300 rounded text-[10px] sm:text-xs font-medium hover:bg-amber-100 transition-colors flex items-center justify-center gap-1"
          >
            <FaStar className="text-amber-500" size={10} />
            See Feedback
          </button>
          <button
            onClick={() => {
              onBookSession({
                interviewer: m.user,
                company: m.application?.company,
                position: m.application?.position,
              });
              if (onModalAction) onModalAction();
            }}
            className="w-full px-2 py-1 sm:px-3 sm:py-1.5 bg-blue-900 text-white rounded text-[10px] sm:text-xs font-medium hover:bg-blue-800 transition-colors"
          >
            Book Session
          </button>
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

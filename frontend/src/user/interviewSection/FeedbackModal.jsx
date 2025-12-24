import React, { useState, useEffect } from 'react';
import { FaTimes, FaStar, FaComment } from 'react-icons/fa';
import { BACKEND_URL } from '../../config.js';

function FeedbackModal({ isOpen, onClose, interviewer }) {
  const [feedbackData, setFeedbackData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && interviewer?.user?._id) {
      fetchFeedback();
    }
  }, [isOpen, interviewer]);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const interviewerId = interviewer.user._id;
      const res = await fetch(`${BACKEND_URL}/api/interview/interviewer/${interviewerId}/feedback`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setFeedbackData(data);
      } else {
        console.error('Failed to fetch feedback');
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const interviewerName = `${interviewer.user?.firstName || interviewer.user?.username || 'Interviewer'}${interviewer.user?.lastName ? ' ' + interviewer.user.lastName : ''}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-blue-800 text-white p-6 rounded-t-xl z-10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Feedback for {interviewerName}</h3>
              <p className="text-blue-100 text-sm mt-1">
                {interviewer.application?.company || interviewer.user?.college || 'Company'} • {interviewer.application?.position || 'Position'}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors"
            >
              <FaTimes size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : feedbackData && feedbackData.totalCount > 0 ? (
            <>
              {/* Rating Distribution */}
              <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl p-6 mb-6 border border-blue-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-2xl font-bold text-slate-900 mb-1">Customer Reviews</h4>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <FaStar 
                            key={i} 
                            className={i < Math.round(feedbackData.averageRating) ? 'text-yellow-500' : 'text-gray-300'} 
                            size={20} 
                          />
                        ))}
                      </div>
                      <span className="text-xl font-bold text-slate-900">
                        {feedbackData.averageRating.toFixed(1)} out of 5
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{feedbackData.totalCount} global ratings</p>
                  </div>
                </div>

                {/* Rating Bars */}
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = feedbackData.ratingDistribution[star] || 0;
                    const percentage = feedbackData.totalCount > 0 
                      ? Math.round((count / feedbackData.totalCount) * 100) 
                      : 0;
                    
                    return (
                      <div key={star} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-blue-900 w-12">{star} star</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-5 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-orange-400 to-orange-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-slate-700 w-12 text-right">{percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Individual Feedbacks */}
              <div>
                <h4 className="text-lg font-bold text-slate-900 mb-4">Recent Reviews</h4>
                <div className="space-y-4">
                  {feedbackData.feedbacks.map((feedback) => (
                    <div key={feedback._id} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        {/* User Avatar */}
                        <img
                          src={feedback.requester?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(feedback.requester?.firstName || feedback.requester?.username || 'User')}&background=3b82f6&color=fff&bold=true`}
                          alt={feedback.requester?.firstName || 'User'}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                        
                        <div className="flex-1">
                          {/* User Name */}
                          <div className="font-semibold text-slate-900">
                            {feedback.requester?.firstName || feedback.requester?.username || 'Anonymous'}
                            {feedback.requester?.lastName && ` ${feedback.requester.lastName}`}
                          </div>

                          {/* Star Rating */}
                          <div className="flex items-center gap-2 my-2">
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <FaStar 
                                  key={i} 
                                  className={i < feedback.rating ? 'text-yellow-500' : 'text-gray-300'} 
                                  size={14} 
                                />
                              ))}
                            </div>
                            <span className="text-sm font-semibold text-slate-700">{feedback.rating}/5</span>
                          </div>

                          {/* Interview Details */}
                          <div className="text-xs text-slate-600 mb-2">
                            <span className="font-medium">Interview for:</span> {feedback.company || 'N/A'} • {feedback.position || 'N/A'}
                          </div>

                          {/* Feedback Text */}
                          {feedback.feedback && (
                            <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                              {feedback.feedback}
                            </div>
                          )}

                          {/* Date */}
                          <div className="text-xs text-slate-500 mt-2">
                            {new Date(feedback.updatedAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FaComment className="text-slate-400" size={32} />
              </div>
              <p className="text-slate-600 font-medium">No feedback available yet</p>
              <p className="text-slate-500 text-sm mt-1">This interviewer hasn't received any reviews</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FeedbackModal;

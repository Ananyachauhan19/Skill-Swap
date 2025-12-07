/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Fuse from 'fuse.js';
import { FaTimes, FaCheckCircle, FaUserTie, FaCalendarAlt, FaComment, FaClock, FaStar, FaVideo } from 'react-icons/fa';
import { BACKEND_URL } from "../config.js";
import { useAuth } from "../context/AuthContext";
import socketClient from '../socket.js';
import { COMPANIES, POSITIONS } from "../constants/interviewData";
import StatsSection from "./interviewSection/StatsSection";
import PastInterviewsPreview from "./interviewSection/PastInterviewsPreview";
import TopInterviewers from "./interviewSection/TopInterviewers";
import FAQSection from "./interviewSection/FAQ";


const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Book Interview",
      description: "Choose your domain and schedule with an expert interviewer who understands your target role.",
      icon: (
        <svg className="w-8 h-8 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      number: "02",
      title: "Live Session",
      description: "Attend a real-time mock interview and get actionable feedback in a professional setting.",
      icon: (
        <svg className="w-8 h-8 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      number: "03",
      title: "Get Evaluated",
      description: "Receive detailed feedback and improvement suggestions to enhance your interview skills.",
      icon: (
        <svg className="w-8 h-8 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      number: "04",
      title: "Affordable Pricing",
      description: "Quality interview preparation at just ₹500 per session. Invest in your career success.",
      icon: (
        <svg className="w-8 h-8 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <section className="bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-6 lg:p-10 xl:p-12 border border-slate-200/50 shadow-sm max-w-7xl mx-auto">
      <div className="mb-4 sm:mb-8 lg:mb-12 text-center">
        <h2 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-slate-900 mb-1 sm:mb-2 lg:mb-3 tracking-tight">
          Your Interview Preparation in 4 Simple Steps
        </h2>
        <p className="text-slate-500 text-[10px] sm:text-xs lg:text-sm xl:text-base max-w-2xl mx-auto leading-relaxed px-1 sm:px-2">
          From booking to feedback - get ready for your dream job with our expert-led mock interviews
        </p>
      </div>

      <div className="relative">
        <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-900/20 via-blue-900/40 to-blue-900/20" style={{ top: '4rem' }}></div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 xl:gap-8 relative">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="bg-white rounded-md sm:rounded-lg lg:rounded-xl p-2 sm:p-3 lg:p-6 border border-slate-200/50 hover:border-blue-900/30 transition-all hover:shadow-lg group">
                <div className="absolute -top-1.5 -left-1.5 sm:-top-2 sm:-left-2 lg:-top-4 lg:-left-4 w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 bg-blue-900 text-white rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs lg:text-lg shadow-lg group-hover:scale-110 transition-transform">
                  {step.number}
                </div>
                
                <div className="mb-1 sm:mb-2 lg:mb-4 mt-0.5 sm:mt-1 lg:mt-2 flex justify-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-16 lg:h-16 bg-blue-900/10 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center group-hover:bg-blue-900/20 transition-colors">
                    <div className="scale-50 sm:scale-75 lg:scale-100">{step.icon}</div>
                  </div>
                </div>
                
                <h3 className="text-[10px] sm:text-xs lg:text-base xl:text-lg font-bold text-slate-900 mb-0.5 sm:mb-1 lg:mb-3 text-center tracking-tight leading-tight">
                  {step.title}
                </h3>
                <p className="text-[8px] sm:text-[10px] lg:text-sm text-slate-600 leading-relaxed text-center hidden sm:block">
                  {step.description}
                </p>
              </div>

              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 -right-4 z-10">
                  <svg className="w-8 h-8 text-blue-900/30" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 sm:mt-8 lg:mt-12 text-center bg-blue-900/5 rounded-md sm:rounded-lg lg:rounded-xl p-3 sm:p-4 lg:p-6 border border-blue-900/10">
        <p className="text-slate-900 font-semibold text-xs sm:text-sm lg:text-base mb-0.5 sm:mb-1 lg:mb-2">Ready to ace your interview?</p>
        <p className="text-slate-600 text-[10px] sm:text-xs lg:text-sm">Book your mock interview session and get expert guidance to land your dream job!</p>
      </div>
    </section>
  );
};

// Browse Interviewers Section
function BrowseInterviewersSection({ onBookSession }) {
  const [allInterviewers, setAllInterviewers] = useState([]);
  const [searchMode, setSearchMode] = useState('company');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);
  const navigate = useNavigate();

  // Load all interviewers on mount
  const { user } = useAuth();
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${BACKEND_URL}/api/interview/interviewers`, { credentials: 'include' });
        if (!res.ok) { setAllInterviewers([]); return; }
        const data = await res.json();
        let filtered = data || [];
        // Exclude current user from the list
        const currentUserId = user?._id;
        if (currentUserId) {
          filtered = filtered.filter(m => {
            const interviewerUserId = m.user?._id || m.user;
            return String(interviewerUserId) !== String(currentUserId);
          });
        }
        if (searchText.trim()) {
          const lower = searchText.toLowerCase();
          filtered = filtered.filter(m => {
            if (searchMode === 'company') {
              const cName = m.application?.company || m.user?.college || '';
              return cName.toLowerCase().includes(lower);
            } else {
              const pos = m.application?.position || m.application?.qualification || '';
              return pos.toLowerCase().includes(lower);
            }
          });
        }
        setAllInterviewers(filtered);
      } catch (e) {
        console.error('Failed to load interviewers', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [searchText, searchMode, user?._id]);

  return (
    <section className="bg-gradient-to-br from-white via-blue-50/20 to-slate-50/50 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-5 lg:p-8 border border-slate-200/50 shadow-sm">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-1 sm:mb-2 tracking-tight">
          Browse Expert Interviewers
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
          Discover and connect with approved industry experts for your mock interview sessions
        </p>
      </div>

      {/* Search Controls */}
      <div className="bg-white rounded-lg p-3 sm:p-4 border border-slate-200/50 mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder={`Search by ${searchMode}...`}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none hover:border-slate-400 transition-colors text-sm"
          />
          <select
            value={searchMode}
            onChange={e => setSearchMode(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none bg-white hover:border-slate-400 transition-colors"
          >
            <option value="company">Company</option>
            <option value="position">Position</option>
          </select>
        </div>
      </div>

      {/* Interviewers Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : allInterviewers.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-slate-600 text-sm">No interviewers found matching your criteria</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
            {allInterviewers.slice(0, 4).map((m) => (
              <InterviewerCard key={m.application?._id || m.user?._id} interviewer={m} onBookSession={onBookSession} navigate={navigate} />
            ))}
          </div>
          
          {allInterviewers.length > 4 && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setShowAllModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-900 to-blue-800 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
              >
                View More Interviewers ({allInterviewers.length - 4} more)
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}

          {/* View All Interviewers Modal */}
          {showAllModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAllModal(false)}>
              <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-blue-900 text-white p-6 rounded-t-xl flex items-center justify-between z-10">
                  <div>
                    <h3 className="text-xl font-bold">All Expert Interviewers</h3>
                    <p className="text-blue-100 text-sm mt-1">{allInterviewers.length} approved professionals</p>
                  </div>
                  <button 
                    onClick={() => setShowAllModal(false)} 
                    className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors"
                  >
                    <FaTimes size={20} />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {allInterviewers.map((m) => (
                      <InterviewerCard key={m.application?._id || m.user?._id} interviewer={m} onBookSession={onBookSession} navigate={navigate} onModalAction={() => setShowAllModal(false)} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// Interviewer Card Component (extracted for reusability)
function InterviewerCard({ interviewer: m, onBookSession, navigate, onModalAction }) {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  return (
    <>
      <div className="p-2 sm:p-3 lg:p-4 rounded-lg bg-white border border-slate-200/50 hover:border-blue-900/30 transition-all hover:shadow-lg flex flex-col">
        <div className="flex-1">
          <div className="font-bold text-slate-900 text-xs sm:text-sm lg:text-base mb-1.5 sm:mb-2 truncate leading-tight">
            {(m.user?.firstName || m.user?.username) + (m.user?.lastName ? ` ${m.user.lastName}` : '')}
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
              if (onModalAction) onModalAction();
              navigate(`/profile/${m.user?.username || m.user?._id}`);
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
              if (onModalAction) onModalAction();
              if (onBookSession) {
                onBookSession({
                  interviewer: m
                });
              }
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

// Feedback Modal Component
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

// Book Mock Interview Modal
function BookInterviewModal({ isOpen, onClose, preSelectedInterviewer, preFilledData }) {
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [matchedInterviewers, setMatchedInterviewers] = useState([]);
  const [selectedInterviewer, setSelectedInterviewer] = useState('');
  const { user } = useAuth() || {};

  // Pre-select interviewer when provided
  useEffect(() => {
    if (preSelectedInterviewer) {
      setSelectedInterviewer(String(preSelectedInterviewer.user?._id || ''));
      setMatchedInterviewers([preSelectedInterviewer]);
    }
  }, [preSelectedInterviewer]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Small delay to avoid visual glitch
      setTimeout(() => {
        if (!isOpen) {
          setCompany('');
          setPosition('');
          setMessage('');
          setSelectedInterviewer('');
          setMatchedInterviewers([]);
        }
      }, 300);
    }
  }, [isOpen]);

  // Dropdown states
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showPositionDropdown, setShowPositionDropdown] = useState(false);
  const [highlightedCompanyIdx, setHighlightedCompanyIdx] = useState(-1);
  const [highlightedPositionIdx, setHighlightedPositionIdx] = useState(-1);
  const companyInputRef = useRef();
  const positionInputRef = useRef();

  // Fuse.js instances for fuzzy search
  const fuseCompanies = useMemo(() => {
    return new Fuse(COMPANIES, {
      threshold: 0.3,
      distance: 100,
      keys: ['']
    });
  }, []);

  const fusePositions = useMemo(() => {
    return new Fuse(POSITIONS, {
      threshold: 0.3,
      distance: 100,
      keys: ['']
    });
  }, []);

  // Filtered lists using Fuse.js
  const companyList = useMemo(() => {
    if ((company || '').trim() === '') return COMPANIES;
    const results = fuseCompanies.search(company);
    return results.map(result => result.item);
  }, [company, fuseCompanies]);

  const positionList = useMemo(() => {
    if ((position || '').trim() === '') return POSITIONS;
    const results = fusePositions.search(position);
    return results.map(result => result.item);
  }, [position, fusePositions]);

  // Keyboard navigation for company
  const handleCompanyKeyDown = (e) => {
    if (!showCompanyDropdown || companyList.length === 0) return;
    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      setHighlightedCompanyIdx(idx => (idx + 1) % companyList.length);
    } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault();
      setHighlightedCompanyIdx(idx => (idx - 1 + companyList.length) % companyList.length);
    } else if (e.key === 'Enter') {
      if (highlightedCompanyIdx >= 0 && highlightedCompanyIdx < companyList.length) {
        setCompany(companyList[highlightedCompanyIdx]);
        setShowCompanyDropdown(false);
        setHighlightedCompanyIdx(-1);
      }
    }
  };

  // Keyboard navigation for position
  const handlePositionKeyDown = (e) => {
    if (!showPositionDropdown || positionList.length === 0) return;
    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      setHighlightedPositionIdx(idx => (idx + 1) % positionList.length);
    } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault();
      setHighlightedPositionIdx(idx => (idx - 1 + positionList.length) % positionList.length);
    } else if (e.key === 'Enter') {
      if (highlightedPositionIdx >= 0 && highlightedPositionIdx < positionList.length) {
        setPosition(positionList[highlightedPositionIdx]);
        setShowPositionDropdown(false);
        setHighlightedPositionIdx(-1);
      }
    }
  };

  const handleSubmit = async () => {
    if (!company || !position) return alert('Please provide company and position');
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/interview/create`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, position, message, assignedInterviewer: selectedInterviewer || undefined }),
      });
      let json = null;
      try { json = await res.json(); } catch (_) { /* non-json response */ }
      if (!res.ok) throw new Error((json && json.message) || (await res.text()) || 'Failed to request');
      alert('Interview request submitted successfully!');
      setCompany(''); setPosition(''); setMessage('');
      setMatchedInterviewers([]);
      setSelectedInterviewer('');
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error submitting request');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchMatched = async () => {
      // If there's a preselected interviewer, keep it in the list regardless of company/position
      if (preSelectedInterviewer) {
        if (!company && !position) {
          setMatchedInterviewers([preSelectedInterviewer]);
          return;
        }
        try {
          const q = new URLSearchParams({ company: company || '', position: position || '' }).toString();
          const res = await fetch(`${BACKEND_URL}/api/interview/interviewers?${q}`, { credentials: 'include' });
          if (!res.ok) {
            setMatchedInterviewers([preSelectedInterviewer]);
            return;
          }
          const data = await res.json();
          // Always include the preselected interviewer
          const preselectedId = String(preSelectedInterviewer.user?._id || '');
          const hasPreselected = (data || []).some(m => String(m.user?._id || '') === preselectedId);
          if (!hasPreselected) {
            setMatchedInterviewers([preSelectedInterviewer, ...(data || [])]);
          } else {
            setMatchedInterviewers(data || []);
          }
        } catch (e) {
          console.error('Failed to fetch interviewers', e);
          setMatchedInterviewers([preSelectedInterviewer]);
        }
      } else {
        // Normal behavior when no preselected interviewer
        if (!company && !position) { setMatchedInterviewers([]); return; }
        try {
          const q = new URLSearchParams({ company: company || '', position: position || '' }).toString();
          const res = await fetch(`${BACKEND_URL}/api/interview/interviewers?${q}`, { credentials: 'include' });
          if (!res.ok) return setMatchedInterviewers([]);
          const data = await res.json();
          setMatchedInterviewers(data || []);
        } catch (e) {
          console.error('Failed to fetch interviewers', e);
          setMatchedInterviewers([]);
        }
      }
    };
    const t = setTimeout(fetchMatched, 400);
    return () => clearTimeout(t);
  }, [company, position, preSelectedInterviewer]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-blue-900 text-white p-6 rounded-t-xl flex items-center justify-between z-10">
            <h3 className="text-xl font-bold">
              Request Mock Interview
            </h3>
            <button onClick={onClose} className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors">
              <FaTimes size={18} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-slate-600 text-sm">Fill in the details below to request a mock interview session with an expert</p>
            
            <>
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-semibold text-slate-900 mb-2">Company Name *</label>
                <input
                  ref={companyInputRef}
                  type="text"
                  value={company}
                  onChange={e => {
                    setCompany(e.target.value);
                    setShowCompanyDropdown(true);
                    setHighlightedCompanyIdx(-1);
                  }}
                  onFocus={() => setShowCompanyDropdown(true)}
                  onBlur={() => setTimeout(() => { setShowCompanyDropdown(false); setHighlightedCompanyIdx(-1); }, 150)}
                  onKeyDown={handleCompanyKeyDown}
                  placeholder="Search company..."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-sm outline-none hover:border-slate-400 transition-colors"
                  autoComplete="off"
                />
                {showCompanyDropdown && companyList.length > 0 && (
                  <ul className="absolute z-20 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-2">
                    {companyList.map((c, idx) => (
                      <li
                        key={idx}
                        className={`px-4 py-2.5 text-slate-700 hover:bg-blue-50 cursor-pointer text-sm transition-colors ${highlightedCompanyIdx === idx ? 'bg-blue-100' : ''}`}
                        onMouseDown={() => {
                          setCompany(c);
                          setShowCompanyDropdown(false);
                          setHighlightedCompanyIdx(-1);
                        }}
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-semibold text-slate-900 mb-2">Position *</label>
                <input
                  ref={positionInputRef}
                  type="text"
                  value={position}
                  onChange={e => {
                    setPosition(e.target.value);
                    setShowPositionDropdown(true);
                    setHighlightedPositionIdx(-1);
                  }}
                  onFocus={() => setShowPositionDropdown(true)}
                  onBlur={() => setTimeout(() => { setShowPositionDropdown(false); setHighlightedPositionIdx(-1); }, 150)}
                  onKeyDown={handlePositionKeyDown}
                  placeholder="Search position..."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-sm outline-none hover:border-slate-400 transition-colors"
                  autoComplete="off"
                />
                {showPositionDropdown && positionList.length > 0 && (
                  <ul className="absolute z-20 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-2">
                    {positionList.map((p, idx) => (
                      <li
                        key={idx}
                        className={`px-4 py-2.5 text-slate-700 hover:bg-blue-50 cursor-pointer text-sm transition-colors ${highlightedPositionIdx === idx ? 'bg-blue-100' : ''}`}
                        onMouseDown={() => {
                          setPosition(p);
                          setShowPositionDropdown(false);
                          setHighlightedPositionIdx(-1);
                        }}
                      >
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
              </div>



              <div>
                <label className="text-sm font-semibold text-slate-900 mb-2 block">
                  Additional Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Any specific topics or areas you'd like to focus on..."
                  rows="4"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-sm outline-none resize-none hover:border-slate-400 transition-colors"
                />
              </div>

              {matchedInterviewers && matchedInterviewers.length > 0 && (
                <div className="bg-blue-900/5 p-4 rounded-lg border border-blue-900/10">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">
                    Recommended Interviewers
                  </h4>
                  <div className="space-y-2">
                    {matchedInterviewers.filter(m => m.user && m.user._id).map((m) => (
                      <label
                        key={m.application._id}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedInterviewer === String(m.user._id)
                            ? 'bg-blue-900 text-white'
                            : 'bg-white hover:bg-blue-50 border border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="radio"
                            name="selectedInterviewer"
                            value={m.user._id}
                            checked={selectedInterviewer === String(m.user._id)}
                            onChange={() => setSelectedInterviewer(String(m.user._id))}
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <div className="font-semibold flex items-center gap-2">
                              {m.user?.firstName || m.user?.username} {m.user?.lastName || ''}
                              {m.stats && m.stats.averageRating > 0 && (
                                <span className={`flex items-center gap-1 text-xs ${
                                  selectedInterviewer === String(m.user._id) ? 'text-yellow-300' : 'text-yellow-500'
                                }`}>
                                  <FaStar className="text-xs" />
                                  {m.stats.averageRating.toFixed(1)}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 text-sm">
                              <div>
                                <div className={`${selectedInterviewer === String(m.user._id) ? 'text-blue-100' : 'text-gray-500'}`}>Company</div>
                                <div className={`${selectedInterviewer === String(m.user._id) ? 'text-blue-50' : 'text-gray-800'} font-medium`}>{m.application?.company || m.user?.college || '—'}</div>
                              </div>
                              <div>
                                <div className={`${selectedInterviewer === String(m.user._id) ? 'text-blue-100' : 'text-gray-500'}`}>Position</div>
                                <div className={`${selectedInterviewer === String(m.user._id) ? 'text-blue-50' : 'text-gray-800'} font-medium`}>{m.application?.position || m.application?.qualification || '—'}</div>
                              </div>
                              <div>
                                <div className={`${selectedInterviewer === String(m.user._id) ? 'text-blue-100' : 'text-gray-500'}`}>Total Interviews</div>
                                <div className={`${selectedInterviewer === String(m.user._id) ? 'text-blue-50' : 'text-gray-800'} font-medium`}>{m.stats?.conductedInterviews || 0}</div>
                              </div>
                              <div>
                                <div className={`${selectedInterviewer === String(m.user._id) ? 'text-blue-100' : 'text-gray-500'}`}>Overall Rating</div>
                                <div className={`flex items-center gap-1 ${selectedInterviewer === String(m.user._id) ? 'text-blue-50' : 'text-gray-800'} font-medium`}>
                                  <FaStar className={`${selectedInterviewer === String(m.user._id) ? 'text-yellow-300' : 'text-yellow-500'}`} />
                                  {(m.stats?.averageRating || 0).toFixed(1)}
                                </div>
                              </div>
                            </div>
                            <div className={`text-xs mt-2 flex items-center gap-3 ${selectedInterviewer === String(m.user._id) ? 'text-blue-200' : 'text-gray-500'}`}>

                              {m.stats?.totalRatings > 0 && (
                                <span>
                                  • Total : {m.stats.totalRatings} rating{m.stats.totalRatings !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {selectedInterviewer === String(m.user._id) && (
                          <FaCheckCircle className="text-white" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !company || !position}
                className="flex-1 px-6 py-3 bg-blue-900 text-white rounded-lg font-medium hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
            </>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
}

// Register as Interviewer Modal
function RegisterInterviewerModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth() || {};

  useEffect(() => {
    try {
      window.dispatchEvent(new Event('authChanged'));
    } catch (e) {
      // ignore
    }
  }, []);

  const isApproved = user && (user.role === 'interviewer' || user.role === 'both' || (Array.isArray(user.roles) && user.roles.includes('interviewer')));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-lg w-full">
          <div className="bg-blue-900 text-white p-6 rounded-t-xl flex items-center justify-between">
            <h3 className="text-xl font-bold">
              Become an Interviewer
            </h3>
            <button onClick={onClose} className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors">
              <FaTimes size={18} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {isApproved ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-900/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">You're Already an Approved Interviewer!</h4>
                <p className="text-slate-600 text-sm">You can start conducting mock interviews right away.</p>
              </div>
            ) : (
              <>
                <div className="bg-blue-900/5 p-4 rounded-lg border border-blue-900/10">
                  <h4 className="font-semibold text-slate-900 mb-2">Why Become an Interviewer?</h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-900 mt-1">✓</span>
                      <span>Share your industry experience and help others succeed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-900 mt-1">✓</span>
                      <span>Earn while conducting mock interviews</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-900 mt-1">✓</span>
                      <span>Build your professional network</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-900 mt-1">✓</span>
                      <span>Flexible scheduling based on your availability</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-900/5 p-4 rounded-lg border border-blue-900/10">
                  <p className="text-sm text-slate-700">
                    <strong>Note:</strong> Your application will be reviewed by our admin team. You'll be notified once approved.
                  </p>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              {!isApproved && (
                <button
                  onClick={() => {
                    navigate('/register-interviewer');
                    onClose();
                  }}
                  className="flex-1 px-6 py-3 bg-blue-900 text-white rounded-lg font-medium hover:bg-blue-800 transition-colors"
                >
                  Apply Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
}

// Scheduled Interviews Section
function ScheduledInterviewSection() {
  const [scheduled, setScheduled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [interviewerDirectory, setInterviewerDirectory] = useState(new Map());
  const { user } = useAuth() || {};
  const navigate = useNavigate();

  const handleRateClick = (interview) => {
    setSelectedInterview(interview);
    setShowRatingModal(true);
  };

  const handleRatingSubmitted = (data) => {
    console.log('Rating submitted:', data);
    // Refresh the scheduled interviews
    fetchScheduled();
  };

  const fetchScheduled = async () => {
    setLoading(true);
    try {
      // Fetch directly from InterviewRequest endpoint for scheduled status
      let res = await fetch(`${BACKEND_URL}/api/interview/scheduled`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        console.log('Scheduled interviews:', data);
        setScheduled(Array.isArray(data) ? data : []);
        setLoading(false);
        return;
      }

      // Fallback to my-interviews and filter for scheduled
      res = await fetch(`${BACKEND_URL}/api/interview/my-interviews`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        const scheduledOnly = list.filter(item => {
          const status = (item.status || '').toLowerCase();
          return status === 'scheduled';
        });
        setScheduled(scheduledOnly);
        setLoading(false);
        return;
      }

      // Final fallback to requests endpoint
      res = await fetch(`${BACKEND_URL}/api/interview/requests`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [...(data.sent || []), ...(data.received || [])];
        const scheduledOnly = list.filter(item => {
          const status = (item.status || '').toLowerCase();
          return status === 'scheduled';
        });
        setScheduled(scheduledOnly);
      } else {
        setScheduled([]);
      }

      // Also load approved interviewer directory to enrich cards with interviewer company/position
      try {
        const resDir = await fetch(`${BACKEND_URL}/api/interview/interviewers`, { credentials: 'include' });
        if (resDir.ok) {
          const list = await resDir.json();
          const map = new Map();
          (Array.isArray(list) ? list : []).forEach((item) => {
            const uid = item.user?._id;
            if (uid) {
              map.set(String(uid), {
                company: item.application?.company || item.user?.college || '',
                position: item.application?.position || item.application?.qualification || '',
                stats: item.stats || null,
              });
            }
          });
          setInterviewerDirectory(map);
        } else {
          setInterviewerDirectory(new Map());
        }
      } catch (_) {
        setInterviewerDirectory(new Map());
      }
    } catch (e) {
      console.error('Failed to fetch scheduled interviews', e);
      setScheduled([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchScheduled(); }, []);

  if (loading) return (
    <div className="text-center py-12">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#3b82f6] border-t-transparent"></div>
      <p className="text-gray-600 mt-4 text-sm sm:text-base">Loading scheduled interviews...</p>
    </div>
  );

  const visible = (scheduled || []).filter(s => {
    if (!user) return false;
    const uid = String(user._id);
    const requesterId = s.requester?._id || s.requester;
    const assignedId = s.assignedInterviewer?._id || s.assignedInterviewer;
    return String(requesterId) === uid || String(assignedId) === uid;
  });

  return (
    <section className="w-full bg-home-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-2">
            Your Scheduled Interviews
          </h2>
          <p className="text-center text-gray-600 text-sm">Upcoming sessions and completed interviews</p>
        </div>

      {visible.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCalendarAlt className="text-blue-600 text-2xl" />
          </div>
          <p className="text-gray-900 text-lg font-semibold">No scheduled interviews yet</p>
          <p className="text-gray-600 text-sm mt-2">Book your first mock interview to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visible.map((s, idx) => (
            <div
              key={s._id}
              className="bg-white border border-gray-200 rounded-xl p-6"
            >

              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  
                  <div className="mt-1">
                    <p className="text-sm text-gray-700 flex items-center gap-2">
                      <span className="text-gray-500 font-medium">Requested for:</span>
                    </p>
                    <p className="text-sm text-gray-800 flex items-center gap-2">
                      <span className="font-medium">{s.company || s.subject || '—'}</span>
                      <span>•</span>
                      <span>{s.position || s.topic || '—'}</span>
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-blue-600 text-white text-xs font-medium rounded-md whitespace-nowrap ml-2">
                  {(s.status || 'Scheduled').charAt(0).toUpperCase() + (s.status || 'Scheduled').slice(1)}
                </span>
              </div>
              
              <div className="space-y-3 text-sm text-gray-700 mb-5">
                {/* Interviewer Details with headings */}
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <FaUserTie className="text-blue-600 text-sm mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {(() => {
                          try {
                            const other = s.assignedInterviewer; // Always show interviewer details
                            if (!other) return 'TBD';
                            const name = other.username || `${other.firstName || ''} ${other.lastName || ''}`.trim() || other.firstName || 'TBD';
                            return name;
                          } catch (e) {
                            return 'TBD';
                          }
                        })()}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                        {/* Interviewer's fixed company/position from their application */}
                        {(() => {
                          const assignedId = s.assignedInterviewer?._id || s.assignedInterviewer;
                          const dir = assignedId ? interviewerDirectory.get(String(assignedId)) : null;
                          const interviewerCompany = s.interviewerApp?.company || dir?.company || '—';
                          const interviewerPosition = s.interviewerApp?.position || dir?.position || '—';
                          return (
                            <>
                              <div>
                                <div className="text-gray-500">Company</div>
                                <div className="text-gray-800 font-medium">{interviewerCompany}</div>
                              </div>
                              <div>
                                <div className="text-gray-500">Position</div>
                                <div className="text-gray-800 font-medium">{interviewerPosition}</div>
                              </div>
                            </>
                          );
                        })()}
                        {s.interviewerStats && (
                          <>
                            <div>
                              <div className="text-gray-500">Total Interviews</div>
                              <div className="text-gray-800 font-medium">{s.interviewerStats.conductedInterviews || 0}</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Overall Rating</div>
                              <div className="flex items-center gap-1 text-gray-800 font-medium">
                                <FaStar className="text-yellow-500" />
                                {(s.interviewerStats.averageRating || 0).toFixed(1)}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Schedule info */}
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="text-blue-600 text-sm" />
                  <span className="font-medium">
                    {s.scheduledAt ? new Date(s.scheduledAt).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    }) : 'Date TBD'}
                  </span>
                </div>
                {s.message && (
                  <div className="flex items-start gap-2 mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <FaComment className="text-blue-600 text-sm flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-700 line-clamp-2">{s.message}</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/session-requests')}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                >
                  View Details →
                </button>
                
                {s.status === 'completed' && !s.rating && String(s.requester?._id || s.requester) === String(user._id) && (
                  <button
                    onClick={() => handleRateClick(s)}
                    className="py-2.5 px-4 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors text-sm flex items-center gap-2"
                  >
                    <FaStar /> Rate
                  </button>
                )}
                {s.rating && String(s.requester?._id || s.requester) === String(user._id) && (
                  <div className="py-2.5 px-4 bg-green-50 border border-green-200 text-green-700 rounded-lg font-medium text-sm flex items-center gap-2">
                    <FaStar className="text-yellow-500" /> {s.rating}/5
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </section>
  );
}

const Interview = () => {
  // Modal states
  const [showBookModal, setShowBookModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [preSelectedInterviewer, setPreSelectedInterviewer] = useState(null);
  const [preFilledData, setPreFilledData] = useState(null);

  const handleBookSession = (data) => {
    setPreSelectedInterviewer(data.interviewer);
    setPreFilledData(null);
    setShowBookModal(true);
  };

  // 3D tilt effect on mouse move
  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth - 0.5) * 20;
      const y = (clientY / window.innerHeight - 0.5) * 20;
      setMousePosition({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen w-full bg-home-bg">
      {/* Hero Section */}
      <section className="relative min-h-[65vh] sm:min-h-[75vh] w-full flex items-center justify-center overflow-hidden pt-12 sm:pt-16 lg:pt-20 pb-4 sm:pb-6 lg:pb-8 bg-gradient-to-b from-slate-50 to-white">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-900/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-900/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8 lg:gap-12">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left space-y-3 sm:space-y-4 lg:space-y-6">
              <div className="flex gap-2">
                <span className="px-2.5 py-1 sm:px-3 sm:py-1.5 lg:px-4 lg:py-2 bg-blue-900/10 text-blue-900 rounded-full text-[9px] sm:text-[10px] lg:text-xs font-semibold tracking-wide">
                  Mock Interview Platform
                </span>
              </div>
              
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-slate-900 leading-tight tracking-tight px-1 sm:px-2 lg:px-0">
                Master Your Interviews with
                <span className="block text-blue-900 mt-1 sm:mt-1.5 lg:mt-2">
                  Industry Experts
                </span>
              </h1>
              
              <p className="text-xs sm:text-sm lg:text-base xl:text-lg text-slate-500 max-w-2xl mx-auto lg:mx-0 px-2 sm:px-4 lg:px-0 leading-relaxed">
                Practice with industry experts, get real feedback, and land your dream job with confidence.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 sm:gap-3 lg:gap-4 pt-2 sm:pt-3 lg:pt-4 px-2 sm:px-4 lg:px-0">
                <button
                  onClick={() => setShowBookModal(true)}
                  className="w-full sm:w-auto px-5 py-2.5 sm:px-6 sm:py-3 lg:px-8 lg:py-4 bg-blue-900 text-white rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm lg:text-base hover:bg-blue-800 transition-all hover:shadow-xl"
                >
                  Book Mock Interview
                </button>
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="w-full sm:w-auto px-5 py-2.5 sm:px-6 sm:py-3 lg:px-8 lg:py-4 bg-white text-blue-900 border-2 border-blue-900 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm lg:text-base hover:bg-blue-50 transition-all"
                >
                  Become Interviewer
                </button>
              </div>

              {/* Stats Section Inline */}
              <div className="pt-4 sm:pt-6">
                <StatsSection />
              </div>
            </div>

            {/* Right Illustration */}
            {/* Right Illustration */}
<div className="flex-1 relative hidden lg:block">
  <div className="relative w-full max-w-[480px] mx-auto scale-80">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-blue-900/5 rounded-3xl blur-2xl"></div>
    <img
      src="/assets/interview-illustration.webp"
      alt="Mock Interview"
      className="relative w-full h-auto object-contain drop-shadow-2xl"
    />
  </div>
</div>

          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 text-slate-400">
        </div>
      </section>

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto flex flex-col gap-4 sm:gap-8 lg:gap-12 xl:gap-16 px-2 sm:px-3 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-12 xl:py-16">
        <ScheduledInterviewSection />
        
        <BrowseInterviewersSection onBookSession={handleBookSession} />
        
        <PastInterviewsPreview />
        
        <TopInterviewers />
        
        <HowItWorks />
        
        <FAQSection />
      </main>

      {/* Modals */}
      <BookInterviewModal 
        isOpen={showBookModal} 
        onClose={() => {
          setShowBookModal(false);
          setPreSelectedInterviewer(null);
          setPreFilledData(null);
        }} 
        preSelectedInterviewer={preSelectedInterviewer}
        preFilledData={preFilledData}
      />
      <RegisterInterviewerModal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)} />
    </div>
  );
};

export default Interview;
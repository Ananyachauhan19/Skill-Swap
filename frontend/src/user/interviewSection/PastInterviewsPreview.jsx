import React, { useState, useEffect } from 'react';
// no navigation used here
import { FaCalendarAlt, FaUser, FaStar, FaArrowRight, FaClock } from 'react-icons/fa';
import { BACKEND_URL } from '../../config.js';
import { useAuth } from '../../context/AuthContext';

const PastInterviewsPreview = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  // no navigate needed
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('recent'); // 'recent' or 'all'

  useEffect(() => {
    fetchPastInterviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const [error, setError] = useState(null);
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString();
  };

  const fetchPastInterviews = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try my-interviews endpoint first
      let res = await fetch(`${BACKEND_URL}/api/interview/my-interviews`, { credentials: 'include' });
      let list = [];

      if (res.ok) {
        const data = await res.json();
        list = Array.isArray(data) ? data : [];
      } else {
        // Fallback to requests endpoint
        res = await fetch(`${BACKEND_URL}/api/interview/requests`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        list = Array.isArray(data) ? data : [...(data.sent || []), ...(data.received || [])];
      }

      // Only show items relevant to the current user (requester or assignedInterviewer)
      const uid = user && user._id ? String(user._id) : null;
      const own = uid
        ? list.filter((i) => {
            const requesterId = i.requester && (i.requester._id || i.requester);
            const interId = i.assignedInterviewer && (i.assignedInterviewer._id || i.assignedInterviewer);
            return String(requesterId) === uid || String(interId) === uid;
          })
        : list;

      // Consider past when:
      // - status in completed/ended/cancelled/declined/rejected/done/closed/finished
      // - OR scheduledAt/date is in the past and not pending
      const pastStatuses = new Set([
        'completed', 'ended', 'cancelled', 'declined', 'rejected', 'done', 'closed', 'finished'
      ]);
      const now = Date.now();
      const past = own.filter((i) => {
        const status = String(i.status || '').toLowerCase();
        if (pastStatuses.has(status)) return true;
        const ts = new Date(i.scheduledAt || i.date || i.updatedAt || 0).getTime();
        // If we have a time in the past, treat as past regardless of status
        if (ts && ts < now) return true;
        return false;
      }).sort((a, b) => {
        const da = new Date(a.updatedAt || a.date || a.scheduledAt || 0).getTime();
        const db = new Date(b.updatedAt || b.date || b.scheduledAt || 0).getTime();
        return db - da;
      });

      setInterviews(past);
    } catch {
      setError('Failed to load past interviews.');
    } finally {
      setLoading(false);
    }
  };

  const displayedInterviews = activeTab === 'recent' ? interviews.slice(0, 2) : interviews;

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#f0f9ff] via-[#e0f2fe] to-[#e0f2fe]">
      <div className="relative z-10 px-4 sm:px-8 lg:px-12 py-8 sm:py-12 flex flex-col gap-6 sm:gap-8 max-w-7xl mx-auto">
        {/* Header with Tabs */}
        <div className="flex flex-col items-center gap-4 sm:gap-6">
          <div className="flex items-center justify-center gap-2 sm:gap-3 w-full flex-wrap">
            <div className="w-6 sm:w-8 h-0.5 bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent rounded-full"></div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1e3a8a] text-center">
              📚 Past Interviews
            </h2>
            <div className="w-6 sm:w-8 h-0.5 bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent rounded-full"></div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-1.5 sm:p-2 bg-white border-2 border-[#93c5fd] rounded-xl sm:rounded-2xl shadow-inner w-full sm:w-auto flex-wrap sm:flex-nowrap justify-center">
            <button
              onClick={() => setActiveTab('recent')}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all duration-300 ${
                activeTab === 'recent'
                  ? 'bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white shadow-lg'
                  : 'text-[#1e40af] hover:bg-[#dbeafe]/50'
              }`}
            >
              📌 Recent (2)
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all duration-300 ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white shadow-lg'
                  : 'text-[#1e40af] hover:bg-[#dbeafe]/50'
              }`}
            >
              📋 All History ({interviews.length})
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#3b82f6] border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center text-sm sm:text-base">{error}</div>
        ) : displayedInterviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl sm:text-6xl mb-4">📝</div>
            <p className="text-[#9ca3af] text-base sm:text-lg">No past interviews found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {displayedInterviews.map((interview, idx) => (
              <div
                key={interview._id || interview.id || idx}
                className="relative bg-white rounded-2xl p-4 sm:p-6 border-2 border-[#93c5fd] shadow-md"
              >
                {/* Color accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#3b82f6] to-[#2563eb]"></div>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#60a5fa] to-[#3b82f6] flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-lg flex-shrink-0">
                    {((interview.interviewerName || interview.interviewer?.firstName || interview.assignedInterviewer?.firstName || interview.assignedInterviewer?.username || 'I') + '').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#1e3a8a] text-sm sm:text-lg truncate">
                      {interview.interviewerName || interview.interviewer?.firstName || interview.assignedInterviewer?.firstName || interview.assignedInterviewer?.username || 'Interviewer'}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#1e40af] truncate">{interview.domain || interview.subject || 'General'}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-[#1e3a8a] bg-[#f0f9ff] rounded-lg p-2 sm:p-3 flex-wrap">
                    <FaCalendarAlt className="w-3 h-3 sm:w-4 sm:h-4 text-[#3b82f6] flex-shrink-0" />
                    <span className="font-medium">{formatDate(interview.date || interview.scheduledAt || interview.updatedAt)}</span>
                    <span className="text-[#3b82f6] mx-1">•</span>
                    <span>{interview.time || 'N/A'}</span>
                  </div>
                  
                  <div className="text-xs sm:text-sm text-[#1e3a8a] bg-[#f0f9ff] rounded-lg p-2 sm:p-3">
                    <span className="font-semibold text-[#1e40af] flex items-center gap-1">💬 Feedback:</span>
                    <p className="mt-1 line-clamp-2">{interview.feedback || 'No feedback provided yet.'}</p>
                  </div>
                </div>

                {interview.rating && (
                  <div className="flex items-center gap-2 pt-3 border-t border-[#93c5fd]">
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className={i < interview.rating ? 'text-[#3b82f6]' : 'text-gray-300'} size={14} />
                      ))}
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-[#1e3a8a] ml-2">{interview.rating}/5</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'recent' && interviews.length > 2 && (
          <div className="flex justify-center mt-4 sm:mt-6">
            <button
              onClick={() => setActiveTab('all')}
              className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white font-bold text-sm sm:text-base rounded-xl hover:shadow-lg"
            >
              View all {interviews.length} interviews
              <FaArrowRight className="text-sm" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default PastInterviewsPreview;

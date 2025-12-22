import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaUserTie, FaStar, FaArrowRight, FaComment } from 'react-icons/fa';
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
  const [interviewerDirectory, setInterviewerDirectory] = useState(new Map());
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString();
  };

  const fetchPastInterviews = async () => {
    setLoading(true);
    setError(null);
    try {
      let list = [];
      // Fetch directly from InterviewRequest endpoints
      let res = await fetch(`${BACKEND_URL}/api/interview/my-interviews`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        list = Array.isArray(data) ? data : [];
      } else {
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

      // Only show completed/ended/cancelled sessions (not pending/requested/scheduled)
      const pastStatuses = new Set([
        'completed', 'ended', 'cancelled', 'declined', 'rejected', 'done', 'closed', 'finished'
      ]);
      const past = own.filter((i) => {
        const status = String(i.status || '').toLowerCase();
        return pastStatuses.has(status);
      }).sort((a, b) => {
        const da = new Date(a.updatedAt || a.date || a.scheduledAt || 0).getTime();
        const db = new Date(b.updatedAt || b.date || b.scheduledAt || 0).getTime();
        return db - da;
      });

      setInterviews(past);

      // Enrich with interviewer directory for company/position
      try {
        const resDir = await fetch(`${BACKEND_URL}/api/interview/interviewers`, { credentials: 'include' });
        if (resDir.ok) {
          const listDir = await resDir.json();
          const map = new Map();
          (Array.isArray(listDir) ? listDir : []).forEach((item) => {
            const uidMap = item.user?._id;
            if (uidMap) {
              map.set(String(uidMap), {
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
    } catch {
      setError('Failed to load past interviews.');
    } finally {
      setLoading(false);
    }
  };

  const displayedInterviews = activeTab === 'recent' ? interviews.slice(0, 2) : interviews;

  // If there are no past interviews, do not render this section.
  // (Matches the Scheduled Interviews section behavior.)
  if (!loading && !error && (!Array.isArray(interviews) || interviews.length === 0)) {
    return null;
  }

  return (
    <section className="bg-gradient-to-br from-white via-blue-50/20 to-slate-50/50 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-5 lg:p-8 border border-slate-200/50 shadow-sm">
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Header with Tabs */}
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <div className="text-center">
            <h2 className="text-base sm:text-xl lg:text-2xl xl:text-3xl font-bold text-slate-900 mb-1 sm:mb-2 tracking-tight">
              Past Interviews
            </h2>
            <p className="text-slate-500 text-[10px] sm:text-xs lg:text-sm">Review your completed interview history</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-1.5 bg-white border border-slate-200 rounded-xl shadow-sm w-full sm:w-auto flex-wrap sm:flex-nowrap justify-center">
            <button
              onClick={() => setActiveTab('recent')}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
                activeTab === 'recent'
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              Recent ({Math.min(interviews.length, 2)})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
                activeTab === 'all'
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              All History ({interviews.length})
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-900 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center text-xs sm:text-sm">{error}</div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
            {displayedInterviews.map((s, idx) => (
              <div key={s._id || idx} className="bg-white border border-gray-200 rounded-lg p-2 sm:p-3 lg:p-4">
                <div className="flex flex-col gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                  <div className="flex-1">
                    <p className="text-[10px] sm:text-xs text-gray-500 font-medium mb-0.5">Requested for:</p>
                    <p className="text-xs sm:text-sm text-gray-800 font-medium truncate">
                      {s.company || s.subject || '—'}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-600 truncate">
                      {s.position || s.topic || '—'}
                    </p>
                  </div>
                  <span className="px-1.5 py-0.5 bg-gray-600 text-white text-[9px] sm:text-[10px] font-medium rounded self-start">
                    {(s.status || 'Completed').charAt(0).toUpperCase() + (s.status || 'Completed').slice(1)}
                  </span>
                </div>

                <div className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs text-gray-700 mb-2 sm:mb-3">
                  <div className="p-1.5 sm:p-2 bg-white rounded border border-gray-200">
                    <div className="flex items-start gap-1 sm:gap-2">
                      <FaUserTie className="text-blue-600 text-[10px] sm:text-xs mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate text-[10px] sm:text-xs">
                          {(() => {
                            try {
                              const requesterId = s.requester?._id || s.requester;
                              const assignedId = s.assignedInterviewer?._id || s.assignedInterviewer;
                              let other = s.assignedInterviewer; // show interviewer name
                              if (!other) return 'TBD';
                              const name = other.username || `${other.firstName || ''} ${other.lastName || ''}`.trim() || other.firstName || 'TBD';
                              return name;
                            } catch (e) {
                              return 'TBD';
                            }
                          })()}
                        </div>
                        <div className="space-y-1 mt-1">
                          {(() => {
                            const assignedId = s.assignedInterviewer?._id || s.assignedInterviewer;
                            const dir = assignedId ? interviewerDirectory.get(String(assignedId)) : null;
                            const interviewerCompany = s.interviewerApp?.company || dir?.company || '—';
                            const interviewerPosition = s.interviewerApp?.position || dir?.position || '—';
                            return (
                              <div className="text-[9px] sm:text-[10px] text-gray-600 truncate">
                                {interviewerCompany} • {interviewerPosition}
                              </div>
                            );
                          })()}
                          {s.interviewerStats && (
                            <div className="flex items-center gap-2 text-[9px] sm:text-[10px]">
                              <span className="text-gray-600">{s.interviewerStats.conductedInterviews || 0} interviews</span>
                              <span className="flex items-center gap-0.5 text-gray-800 font-medium">
                                <FaStar className="text-yellow-500 text-[8px]" />
                                {(s.interviewerStats.averageRating || 0).toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Date row */}
                  <div className="flex items-center gap-1">
                    <FaCalendarAlt className="text-blue-600 text-[9px] sm:text-[10px]" />
                    <span className="font-medium text-[9px] sm:text-[10px] truncate">
                      {s.scheduledAt ? new Date(s.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                    </span>
                  </div>

                  {/* Rating - show only on larger screens or if exists */}
                  {s.rating && (
                    <div className="flex items-center gap-1 p-1 sm:p-1.5 bg-yellow-50 rounded border border-yellow-200">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <FaStar key={i} className={i < (s.rating || 0) ? 'text-yellow-500' : 'text-gray-300'} size={8} />
                        ))}
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-semibold text-gray-700">{s.rating}/5</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'recent' && interviews.length > 2 && (
          <div className="flex justify-center mt-3 sm:mt-4">
            <button
              onClick={() => setActiveTab('all')}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 lg:px-6 lg:py-3 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white font-bold text-[10px] sm:text-xs lg:text-sm rounded-lg sm:rounded-xl hover:shadow-lg"
            >
              View all {interviews.length} interviews
              <FaArrowRight className="text-[10px] sm:text-xs" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default PastInterviewsPreview;

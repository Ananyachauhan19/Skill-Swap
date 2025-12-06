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
      let res = await fetch(`${BACKEND_URL}/api/interview/my-interviews`, { credentials: 'include' });
      let list = [];

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
            {displayedInterviews.map((s, idx) => (
              <div key={s._id || idx} className="bg-white border border-gray-200 rounded-xl p-6">
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
                  <span className="px-2.5 py-1 bg-gray-600 text-white text-xs font-medium rounded-md whitespace-nowrap ml-2">
                    {(s.status || 'Completed').charAt(0).toUpperCase() + (s.status || 'Completed').slice(1)}
                  </span>
                </div>

                <div className="space-y-3 text-sm text-gray-700 mb-5">
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-start gap-3">
                      <FaUserTie className="text-blue-600 text-sm mt-0.5" />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
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
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
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

                  {/* Date row */}
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-blue-600 text-sm" />
                    <span className="font-medium">
                      {s.scheduledAt ? new Date(s.scheduledAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Date N/A'}
                    </span>
                  </div>

                  {/* Rating + Feedback row */}
                  {(s.rating || s.feedback) && (
                    <div className="flex items-start gap-2 mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <FaComment className="text-blue-600 text-sm flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        {typeof s.rating !== 'undefined' && (
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <FaStar key={i} className={i < (s.rating || 0) ? 'text-yellow-500' : 'text-gray-300'} size={14} />
                              ))}
                            </div>
                            <span className="text-xs font-semibold text-gray-700">{s.rating}/5</span>
                          </div>
                        )}
                        {s.feedback && (
                          <span className="text-xs text-gray-700 line-clamp-3">{s.feedback}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
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

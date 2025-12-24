import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaUserTie, FaCalendarAlt, FaComment, FaStar } from 'react-icons/fa';
import { BACKEND_URL } from '../../config.js';
import { useAuth } from '../../context/AuthContext';
import InterviewSessionRatingModal from './InterviewSessionRatingModal.jsx';

function ScheduledInterviewSection() {
  const [scheduled, setScheduled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [interviewerDirectory, setInterviewerDirectory] = useState(new Map());
  const [showAllModal, setShowAllModal] = useState(false);
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

  // If there are no scheduled interviews, do not render this section.
  // (Matches the Past Interviews components which return null when empty.)
  if (!user || visible.length === 0) return null;

  const displayedInterviews = visible.slice(0, 3);
  const hasMore = visible.length > 3;

  const InterviewCard = ({ s }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 font-medium mb-2">Requested for:</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-900 truncate">{s.company || s.subject || '—'}</span>
            <span className="text-gray-300">•</span>
            <span className="text-sm font-semibold text-gray-700 truncate">{s.position || s.topic || '—'}</span>
          </div>
        </div>
        <span className="px-3 py-1 bg-[rgb(30,58,138)] text-white text-xs font-semibold rounded-md whitespace-nowrap ml-3">
          {(s.status || 'Scheduled').charAt(0).toUpperCase() + (s.status || 'Scheduled').slice(1)}
        </span>
      </div>
      
      <div className="flex-1 space-y-3 mb-4">
        {/* Interviewer Details */}
        <div className="p-3 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-lg border border-gray-200">
          <div className="flex items-start gap-2.5">
            <FaUserTie className="text-[rgb(30,58,138)] text-sm mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-900 text-sm mb-2 truncate">
                {(() => {
                  try {
                    const other = s.assignedInterviewer;
                    if (!other) return 'TBD';
                    const name = other.username || `${other.firstName || ''} ${other.lastName || ''}`.trim() || other.firstName || 'TBD';
                    return name;
                  } catch (e) {
                    return 'TBD';
                  }
                })()}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {(() => {
                  const assignedId = s.assignedInterviewer?._id || s.assignedInterviewer;
                  const dir = assignedId ? interviewerDirectory.get(String(assignedId)) : null;
                  const interviewerCompany = s.interviewerApp?.company || dir?.company || '—';
                  const interviewerPosition = s.interviewerApp?.position || dir?.position || '—';
                  return (
                    <>
                      <div>
                        <div className="text-gray-500 text-[10px] font-medium mb-0.5">Company</div>
                        <div className="text-gray-900 font-semibold text-xs truncate">{interviewerCompany}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-[10px] font-medium mb-0.5">Position</div>
                        <div className="text-gray-900 font-semibold text-xs truncate">{interviewerPosition}</div>
                      </div>
                    </>
                  );
                })()}
                {s.interviewerStats && (
                  <>
                    <div>
                      <div className="text-gray-500 text-[10px] font-medium mb-0.5">Total Interviews</div>
                      <div className="text-gray-900 font-semibold text-xs">{s.interviewerStats.conductedInterviews || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-[10px] font-medium mb-0.5">Overall Rating</div>
                      <div className="flex items-center gap-1 text-gray-900 font-semibold text-xs">
                        <FaStar className="text-yellow-500 text-[10px]" />
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
        <div className="flex items-center gap-2 px-1">
          <FaCalendarAlt className="text-[rgb(30,58,138)] text-sm flex-shrink-0" />
          <span className="font-semibold text-xs text-gray-900">
            {s.scheduledAt ? new Date(s.scheduledAt).toLocaleString('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short'
            }) : 'Date TBD'}
          </span>
        </div>
        {s.message && (
          <div className="flex items-start gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-200">
            <FaComment className="text-[rgb(30,58,138)] text-xs flex-shrink-0 mt-0.5" />
            <span className="text-[11px] text-gray-700 line-clamp-2 leading-relaxed">{s.message}</span>
          </div>
        )}
      </div>
      
      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => navigate('/session-requests?tab=interview&view=received')}
          className="flex-1 py-2.5 bg-[rgb(30,58,138)] text-white rounded-lg font-semibold hover:bg-[rgb(37,70,165)] transition-all text-sm shadow-sm"
        >
          View Details →
        </button>
        
        {s.status === 'completed' && !s.rating && String(s.requester?._id || s.requester) === String(user._id) && (
          <button
            onClick={() => {
              setSelectedInterview(s);
              setShowRatingModal(true);
            }}
            className="py-2.5 px-4 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-all text-sm flex items-center gap-1.5 shadow-sm"
          >
            <FaStar className="text-xs" /> Rate
          </button>
        )}
        {s.rating && String(s.requester?._id || s.requester) === String(user._id) && (
          <div className="py-2.5 px-4 bg-green-50 border border-green-300 text-green-700 rounded-lg font-semibold text-sm flex items-center gap-1.5">
            <FaStar className="text-yellow-500 text-xs" /> {s.rating}/5
          </div>
        )}
      </div>
    </div>
  );

  return (
    <section className="w-full bg-home-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-2">
            Your Scheduled Interviews
          </h2>
          <p className="text-center text-gray-600 text-sm">Upcoming sessions and completed interviews</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {displayedInterviews.map((s) => (
            <InterviewCard key={s._id} s={s} />
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setShowAllModal(true)}
              className="px-8 py-3 bg-[rgb(30,58,138)] text-white font-bold rounded-lg hover:bg-[rgb(37,70,165)] transition-all flex items-center gap-2 text-sm shadow-lg"
            >
              View More ({visible.length - 3} more)
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}

        {/* All Interviews Modal */}
        {showAllModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAllModal(false)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-[rgb(30,58,138)] text-white p-5 sm:p-6 rounded-t-xl flex items-center justify-between z-10">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold">All Scheduled Interviews</h3>
                  <p className="text-blue-100 text-sm mt-1">{visible.length} upcoming and completed sessions</p>
                </div>
                <button 
                  onClick={() => setShowAllModal(false)} 
                  className="text-white hover:bg-[rgb(37,70,165)] p-2 rounded-lg transition-colors"
                >
                  <FaTimes size={22} />
                </button>
              </div>
              
              <div className="p-5 sm:p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visible.map((s) => (
                    <InterviewCard key={s._id} s={s} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {showRatingModal && selectedInterview && (
          <InterviewSessionRatingModal
            isOpen={showRatingModal}
            onClose={() => {
              setShowRatingModal(false);
              setSelectedInterview(null);
            }}
            interview={selectedInterview}
            onRatingSubmitted={handleRatingSubmitted}
          />
        )}
      </div>
    </section>
  );
}

export default ScheduledInterviewSection;

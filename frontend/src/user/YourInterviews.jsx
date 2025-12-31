import React, { useState, useEffect, useMemo } from 'react';
import { FaCalendarAlt, FaUser, FaClock, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaVideo, FaStar, FaComment, FaList, FaBullseye, FaUserCheck, FaHourglassStart, FaCalendarCheck, FaCheck, FaTimes, FaHistory, FaFilePdf } from 'react-icons/fa';
import { BACKEND_URL } from '../config.js';
import { useAuth } from '../context/AuthContext';

const YourInterviews = () => {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    fetchInterviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const fetchInterviews = async () => {
    setLoading(true);
    setError(null);
    try {
      let list = [];
      const res = await fetch(`${BACKEND_URL}/api/interview/my-interviews`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) list = data;
      }
      if (!list.length) {
        const r2 = await fetch(`${BACKEND_URL}/api/interview/requests`, { credentials: 'include' });
        if (r2.ok) {
          const d2 = await r2.json();
          const arr = Array.isArray(d2) ? d2 : [...(d2.sent || []), ...(d2.received || [])];
          const uid = user && user._id ? String(user._id) : null;
          list = uid ? arr.filter((i) => {
            const requesterId = i.requester && (i.requester._id || i.requester);
            const interId = i.assignedInterviewer && (i.assignedInterviewer._id || i.assignedInterviewer);
            return String(requesterId) === uid || String(interId) === uid;
          }) : arr;
        }
      }
      const normalized = (list || []).map((i) => {
        const requester = typeof i.requester === 'object' ? i.requester : { _id: i.requester };
        const interviewer = typeof i.assignedInterviewer === 'object' ? i.assignedInterviewer : { _id: i.assignedInterviewer };
        const createdAt = i.createdAt || i.created_at || null;
        const scheduledAt = i.scheduledAt || i.date || null;
        const status = (i.status || 'pending').toLowerCase();
        const company = i.company || i.subject || 'Interview Session';
        const position = i.position || i.topic || 'Position Not Specified';
        const message = i.message || i.notes || '';
        const feedback = i.feedback || '';
        const rating = i.rating || null;
        const _id = i._id || i.id || `${requester?._id || 'u'}_${interviewer?._id || 'i'}_${scheduledAt || createdAt || Math.random()}`;
        return { ...i, _id, requester, assignedInterviewer: interviewer, createdAt, scheduledAt, status, company, position, message, feedback, rating };
      });
      normalized.sort((a, b) => new Date(b.scheduledAt || b.updatedAt || b.createdAt || 0) - new Date(a.scheduledAt || a.updatedAt || a.createdAt || 0));
      setInterviews(normalized);
      if (normalized.length && !selectedId) setSelectedId(String(normalized[0]._id));
    } catch (e) {
      console.error('Failed to fetch interviews:', e);
      setError('Failed to load your interviews.');
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <FaCheckCircle className="text-emerald-600" />;
      case 'cancelled':
      case 'rejected':
        return <FaTimesCircle className="text-rose-500" />;
      case 'pending':
        return <FaHourglassHalf className="text-amber-500" />;
      case 'scheduled':
        return <FaCalendarAlt className="text-teal-600" />;
      default:
        return <FaHourglassHalf className="text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled':
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'scheduled':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const filteredInterviews = useMemo(() => {
    const uid = user && user._id ? String(user._id) : null;
    const now = Date.now();
    return (interviews || []).filter((interview) => {
      if (filter === 'all') return true;
      if (filter === 'conducted') {
        return String(interview.assignedInterviewer?._id || interview.assignedInterviewer) === String(uid);
      }
      if (filter === 'attended') {
        return String(interview.requester?._id || interview.requester) === String(uid);
      }
      if (filter === 'past') {
        const ts = new Date(interview.scheduledAt || interview.updatedAt || interview.createdAt || 0).getTime();
        const pastStatuses = new Set(['completed', 'ended', 'cancelled', 'declined', 'rejected', 'done', 'closed', 'finished']);
        return pastStatuses.has(interview.status) || (ts && ts < now);
      }
      return (interview.status || '').toLowerCase() === filter;
    });
  }, [filter, interviews, user]);

  const InterviewCard = ({ interview, onClick, isSelected }) => {
    const isConducted = String(interview.assignedInterviewer?._id || interview.assignedInterviewer) === String(user?._id);
    const otherPerson = isConducted ? interview.requester : interview.assignedInterviewer;

    return (
      <div 
        onClick={onClick}
        className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-6 border cursor-pointer ${
          isSelected ? 'border-[#1e3a8a] ring-2 ring-[#1e3a8a] ring-opacity-30' : 'border-gray-200 hover:border-[#1e3a8a]'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {getStatusIcon(interview.status)}
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
              {(interview.status || 'pending').toUpperCase()}
            </span>
          </div>
        </div>
        <h3 className="text-xl font-semibold text-[#1e3a8a] mb-2">{interview.company}</h3>
        <p className="text-gray-600 text-sm mb-4">{interview.position}</p>
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <FaCalendarAlt className="text-[#1e3a8a]" />
            <span>
              {interview.scheduledAt ? new Date(interview.scheduledAt).toLocaleDateString() : 'Not Scheduled'}
              {interview.scheduledAt && (
                <>
                  <span className="mx-2">•</span>
                  <FaClock className="text-[#1e3a8a]" />
                  <span>{new Date(interview.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </>
              )}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <FaUser className="text-[#1e3a8a]" />
            <div>
              <p className="text-xs text-gray-500">{isConducted ? 'Interviewee' : 'Interviewer'}</p>
              <p className="text-sm font-medium text-[#1e3a8a]">
                {otherPerson?.firstName || otherPerson?.username || 'N/A'} {otherPerson?.lastName || ''}
              </p>
            </div>
          </div>
        </div>
        {interview.message && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-[#1e3a8a] mb-1 flex items-center gap-1">
              <FaComment className="text-[#1e3a8a]" />
              Message
            </p>
            <p className="text-sm text-gray-600 line-clamp-2">{interview.message}</p>
          </div>
        )}
        {interview.feedback && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-[#1e3a8a] mb-1 flex items-center gap-1">
              <FaStar className="text-[#1e3a8a]" />
              Feedback
            </p>
            <p className="text-sm text-gray-600 line-clamp-2">{interview.feedback}</p>
            {interview.rating && (
              <div className="flex items-center gap-1 mt-2">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className={i < interview.rating ? 'text-[#1e3a8a]' : 'text-gray-300'} size={14} />
                ))}
              </div>
            )}
          </div>
        )}
        {interview.resumeUrl && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-[#1e3a8a] mb-1 flex items-center gap-1">
              <FaFilePdf className="text-[#1e3a8a]" />
              Resume
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(interview.resumeUrl, '_blank');
              }}
              className="text-sm text-blue-600 hover:text-blue-800 underline font-medium transition-colors"
            >
              {interview.resumeFileName || 'View Resume'}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 pt-16 md:pt-[72px] xl:pt-20">
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)]">
        {/* Sidebar */}
        <aside className="w-full lg:w-60 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex-shrink-0 lg:sticky lg:top-16 md:lg:top-20 lg:h-[calc(100vh-4rem)] md:lg:h-[calc(100vh-5rem)] lg:overflow-y-auto shadow-sm">
          <div className="px-4 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <h2 className="text-base font-semibold text-slate-700 flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                <FaVideo className="text-teal-600 text-sm" />
              </div>
              <span>Interview Dashboard</span>
            </h2>
          </div>
          <div className="p-3 space-y-1 max-h-[calc(100vh-14rem)] overflow-y-auto">
            {[
              { key: 'all', label: 'All Interviews', icon: <FaList className="w-3.5 h-3.5" /> },
              { key: 'conducted', label: 'Conducted', icon: <FaBullseye className="w-3.5 h-3.5" /> },
              { key: 'attended', label: 'Attended', icon: <FaUserCheck className="w-3.5 h-3.5" /> },
              { key: 'pending', label: 'Pending', icon: <FaHourglassStart className="w-3.5 h-3.5" /> },
              { key: 'scheduled', label: 'Scheduled', icon: <FaCalendarCheck className="w-3.5 h-3.5" /> },
              { key: 'completed', label: 'Completed', icon: <FaCheck className="w-3.5 h-3.5" /> },
              { key: 'cancelled', label: 'Cancelled', icon: <FaTimes className="w-3.5 h-3.5" /> },
              { key: 'past', label: 'Past', icon: <FaHistory className="w-3.5 h-3.5" /> },
            ].map((f) => {
              const count = filter === f.key ? filteredInterviews.length : 
                f.key === 'all' ? interviews.length :
                f.key === 'conducted' ? interviews.filter(i => String(i.assignedInterviewer?._id || i.assignedInterviewer) === String(user?._id)).length :
                f.key === 'attended' ? interviews.filter(i => String(i.requester?._id || i.requester) === String(user?._id)).length :
                f.key === 'past' ? interviews.filter(i => {
                  const ts = new Date(i.scheduledAt || i.updatedAt || i.createdAt || 0).getTime();
                  const pastStatuses = new Set(['completed', 'ended', 'cancelled', 'declined', 'rejected', 'done', 'closed', 'finished']);
                  return pastStatuses.has(i.status) || (ts && ts < Date.now());
                }).length :
                interviews.filter(i => (i.status || '').toLowerCase() === f.key).length;

              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-2.5 transition-all duration-200 ${
                    filter === f.key
                      ? 'bg-teal-50 text-teal-700 border border-teal-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800 border border-transparent'
                  }`}
                >
                  <div className={`flex-shrink-0 ${filter === f.key ? 'text-teal-600' : 'text-slate-400'}`}>
                    {f.icon}
                  </div>
                  <span className="flex-1 truncate">{f.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    filter === f.key 
                      ? 'bg-teal-100 text-teal-700' 
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-0.5">Total Interviews</p>
                <p className="text-2xl font-bold text-slate-800">{interviews.length}</p>
              </div>
              <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                <FaVideo className="text-teal-600 text-lg" />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-transparent">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">
                Your Interviews
              </h1>
              <p className="text-slate-500 text-sm md:text-base">Manage your mock interviews with ease</p>
            </div>
            {loading ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 flex flex-col items-center justify-center text-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-3 border-teal-500 border-t-transparent mb-4"></div>
                <p className="text-slate-600 text-base font-medium">Loading interviews...</p>
              </div>
            ) : error ? (
              <div className="bg-white rounded-xl shadow-sm border border-red-100 p-10 flex flex-col items-center justify-center text-center min-h-[50vh]">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <FaTimesCircle className="text-red-500 text-3xl" />
                </div>
                <p className="text-red-600 text-base font-medium mb-3">{error}</p>
                <button
                  onClick={fetchInterviews}
                  className="px-5 py-2.5 bg-slate-800 text-white rounded-lg font-medium text-sm hover:bg-slate-700 transition-all"
                >
                  Try Again
                </button>
              </div>
            ) : filteredInterviews.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 flex flex-col items-center justify-center text-center min-h-[50vh]">
                <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-4">
                  <FaVideo className="text-teal-600 text-3xl" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">No Interviews Found</h3>
                <p className="text-slate-500 mb-5 max-w-md text-sm">
                  {filter === 'all'
                    ? "You haven't conducted or attended any interviews yet. Start your journey now!"
                    : `No ${filter} interviews found. Try selecting a different filter.`}
                </p>
                {filter === 'all' && (
                  <button
                    onClick={() => (window.location.href = '/interview')}
                    className="px-6 py-2.5 bg-teal-600 text-white rounded-lg font-medium text-sm hover:bg-teal-700 transition-all"
                  >
                    📅 Book Your First Interview
                  </button>
                )}
              </div>
            ) : (
              <div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h2 className="text-lg md:text-xl font-semibold text-slate-800">
                        {filter.charAt(0).toUpperCase() + filter.slice(1)} Interviews
                      </h2>
                      <p className="text-slate-500 text-sm">
                        Showing {filteredInterviews.length} {filteredInterviews.length === 1 ? 'interview' : 'interviews'}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                      <FaVideo className="text-teal-600 text-lg" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredInterviews.map((interview) => (
                    <InterviewCard
                      key={interview._id}
                      interview={interview}
                      onClick={() => setSelectedId(String(interview._id))}
                      isSelected={selectedId === String(interview._id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default YourInterviews;
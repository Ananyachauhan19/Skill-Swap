import React, { useState, useEffect, useMemo } from 'react';
import { FaCalendarAlt, FaUser, FaClock, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaVideo, FaStar, FaComment, FaList, FaBullseye, FaUserCheck, FaHourglassStart, FaCalendarCheck, FaCheck, FaTimes, FaHistory } from 'react-icons/fa';
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
        return <FaCheckCircle className="text-[#1e3a8a]" />;
      case 'cancelled':
      case 'rejected':
        return <FaTimesCircle className="text-[#1e3a8a]" />;
      case 'pending':
        return <FaHourglassHalf className="text-[#1e3a8a]" />;
      case 'scheduled':
        return <FaCalendarAlt className="text-[#1e3a8a]" />;
      default:
        return <FaHourglassHalf className="text-[#1e3a8a]" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-50 text-[#1e3a8a] border-green-200';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-50 text-[#1e3a8a] border-red-200';
      case 'pending':
        return 'bg-yellow-50 text-[#1e3a8a] border-yellow-200';
      case 'scheduled':
        return 'bg-blue-50 text-[#1e3a8a] border-blue-200';
      default:
        return 'bg-gray-50 text-[#1e3a8a] border-gray-200';
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
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#e6f0fa] via-[#f0f6fc] to-[#e6f0fa] pt-16 md:pt-20">
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)]">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 bg-white shadow-xl border-b lg:border-b-0 lg:border-r border-gray-200 flex-shrink-0 lg:sticky lg:top-16 md:lg:top-20 lg:h-[calc(100vh-4rem)] md:lg:h-[calc(100vh-5rem)] lg:overflow-y-auto">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#1e3a8a] to-[#2563eb]">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <FaVideo className="text-white text-lg" />
              </div>
              <span>Interview Dashboard</span>
            </h2>
          </div>
          <div className="p-4 space-y-2 max-h-[calc(100vh-16rem)] overflow-y-auto">
            {[
              { key: 'all', label: 'All Interviews', icon: <FaList className="w-4 h-4" /> },
              { key: 'conducted', label: 'Conducted', icon: <FaBullseye className="w-4 h-4" /> },
              { key: 'attended', label: 'Attended', icon: <FaUserCheck className="w-4 h-4" /> },
              { key: 'pending', label: 'Pending', icon: <FaHourglassStart className="w-4 h-4" /> },
              { key: 'scheduled', label: 'Scheduled', icon: <FaCalendarCheck className="w-4 h-4" /> },
              { key: 'completed', label: 'Completed', icon: <FaCheck className="w-4 h-4" /> },
              { key: 'cancelled', label: 'Cancelled', icon: <FaTimes className="w-4 h-4" /> },
              { key: 'past', label: 'Past', icon: <FaHistory className="w-4 h-4" /> },
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
                  className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-sm flex items-center gap-3 transition-all duration-200 ${
                    filter === f.key
                      ? 'bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] text-white shadow-lg transform scale-105'
                      : 'text-[#1e3a8a] hover:bg-blue-50 hover:scale-102 border border-transparent hover:border-blue-200'
                  }`}
                >
                  <div className={`flex-shrink-0 ${filter === f.key ? 'text-white' : 'text-[#2563eb]'}`}>
                    {f.icon}
                  </div>
                  <span className="flex-1">{f.label}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    filter === f.key 
                      ? 'bg-white/20 text-white' 
                      : 'bg-blue-100 text-[#1e3a8a]'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="p-6 border-t-2 border-gray-200 bg-gradient-to-br from-blue-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Total Interviews</p>
                <p className="text-3xl font-black text-[#1e3a8a]">{interviews.length}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-[#1e3a8a] to-[#2563eb] rounded-xl flex items-center justify-center shadow-lg">
                <FaVideo className="text-white text-2xl" />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-transparent">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-[#1e3a8a] mb-2 flex items-center gap-3">
                <span>Your Interviews</span>
              </h1>
              <p className="text-gray-600 text-base md:text-lg">Manage your mock interviews with ease and precision</p>
            </div>
            {loading ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 flex flex-col items-center justify-center text-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1e3a8a] border-t-transparent mb-4"></div>
                <p className="text-gray-600 text-lg font-semibold">Loading interviews...</p>
              </div>
            ) : error ? (
              <div className="bg-white rounded-2xl shadow-xl border-2 border-red-200 p-12 flex flex-col items-center justify-center text-center min-h-[50vh]">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <FaTimesCircle className="text-red-600 text-5xl" />
                </div>
                <p className="text-red-600 text-lg font-semibold mb-3">{error}</p>
                <button
                  onClick={fetchInterviews}
                  className="px-6 py-3 bg-[#1e3a8a] text-white rounded-xl font-semibold hover:bg-[#1e3a8a]/90 transition-all shadow-lg"
                >
                  Try Again
                </button>
              </div>
            ) : filteredInterviews.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 flex flex-col items-center justify-center text-center min-h-[50vh]">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <FaVideo className="text-[#2563eb] text-5xl" />
                </div>
                <h3 className="text-2xl font-bold text-[#1e3a8a] mb-2">No Interviews Found</h3>
                <p className="text-gray-600 mb-6 max-w-md">
                  {filter === 'all'
                    ? "You haven't conducted or attended any interviews yet. Start your journey now!"
                    : `No ${filter} interviews found. Try selecting a different filter.`}
                </p>
                {filter === 'all' && (
                  <button
                    onClick={() => (window.location.href = '/interview')}
                    className="px-8 py-4 bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] text-white rounded-xl font-bold text-base hover:shadow-2xl transition-all hover:scale-105"
                  >
                    📅 Book Your First Interview
                  </button>
                )}
              </div>
            ) : (
              <div>
                <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-100 p-6 mb-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-[#1e3a8a] mb-1">
                        {filter.charAt(0).toUpperCase() + filter.slice(1)} Interviews
                      </h2>
                      <p className="text-gray-600">
                        Showing {filteredInterviews.length} {filteredInterviews.length === 1 ? 'interview' : 'interviews'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#1e3a8a] to-[#2563eb] rounded-xl flex items-center justify-center shadow-lg">
                        <FaVideo className="text-white text-xl" />
                      </div>
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
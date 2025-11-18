import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BACKEND_URL } from '../config.js';
import { useAuth } from '../context/AuthContext.jsx';

const statusTabs = [
  { id: 'all', label: 'All Applications' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

const categories = [
  { id: 'all', label: 'All Categories' },
  { id: 'interview-expert', label: 'Interview Expert' },
  { id: 'tutor', label: 'Users (Tutor)' },
];

export default function InterviewerApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [detailTab, setDetailTab] = useState('profile');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'week' | 'month' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const debounceRef = useRef(null);
  useAuth();

  // Helper to calculate date ranges
  const getDateRange = (filter) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let start = null, end = null;
    switch (filter) {
      case 'today':
        start = new Date(today);
        end = new Date(today);
        end.setDate(end.getDate() + 1);
        break;
      case 'week':
        start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        end = new Date(today);
        end.setDate(end.getDate() + 1);
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today);
        end.setDate(end.getDate() + 1);
        break;
      case 'custom':
        if (customStartDate) start = new Date(customStartDate);
        if (customEndDate) {
          end = new Date(customEndDate);
          end.setDate(end.getDate() + 1);
        }
        break;
      default:
        break;
    }
    return { start, end };
  };

  const selected = useMemo(() => applications.find(a => (a._id === selectedId)), [applications, selectedId]);

  const fetchApps = async (q = {}) => {
    const df = q.dateFilter ?? dateFilter;
    const { start, end } = getDateRange(df);
    const params = {
      status: q.status ?? status,
      category: q.category ?? category,
      search: q.search ?? search,
    };
    if (start) params.startDate = start.toISOString().split('T')[0];
    if (end) params.endDate = end.toISOString().split('T')[0];
    const qs = new URLSearchParams(params);
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${BACKEND_URL}/api/interview/applications?${qs.toString()}`, { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data && data.message) || 'Failed to load applications');
      const list = data.applications || data || [];
      setApplications(Array.isArray(list) ? list : []);
      if (list.length && !selectedId) setSelectedId(list[0]._id);
    } catch (e) {
      setApplications([]);
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchApps(); }, []);

  // React to filters with debounce for search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchApps({});
    }, 300);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, category, dateFilter, customStartDate, customEndDate]);

  const approve = async (id) => {
    if (!window.confirm('Approve this application?')) return;
    try {
      setActionLoading(prev => ({ ...prev, [id]: true }));
      const res = await fetch(`${BACKEND_URL}/api/interview/applications/${id}/approve`, { method: 'POST', credentials: 'include' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || 'Approve failed');
      await fetchApps({});
    } catch (e) {
      alert(e.message || 'Failed');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const reject = async (id) => {
    if (!window.confirm('Reject this application?')) return;
    try {
      setActionLoading(prev => ({ ...prev, [id]: true }));
      const res = await fetch(`${BACKEND_URL}/api/interview/applications/${id}/reject`, { method: 'POST', credentials: 'include' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || 'Reject failed');
      await fetchApps({});
    } catch (e) {
      alert(e.message || 'Failed');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const renderDetail = () => {
    if (!selected) return <div className="text-gray-500">Select an application to view details.</div>;
    switch (detailTab) {
      case 'profile':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden">
                {selected.user?.profilePic ? <img className="w-full h-full object-cover" src={selected.user.profilePic} alt="avatar" /> : null}
              </div>
              <div>
                <div className="font-medium">{selected.name || `${selected.user?.firstName || ''} ${selected.user?.lastName || ''}`.trim() || selected.user?.username}</div>
                <div className="text-xs text-gray-600">{selected.user?.email}</div>
              </div>
            </div>
            <div>Country: <span className="font-medium">{selected.user?.country || '—'}</span></div>
            <div>Category: <span className="font-medium">{selected.type === 'tutor' ? 'Users (Tutor)' : 'Interview Expert'}</span></div>
            <div>Company: <span className="font-medium">{selected.company || '—'}</span></div>
            <div>Position: <span className="font-medium">{selected.position || '—'}</span></div>
            <div>Qualification: <span className="font-medium">{selected.qualification || '—'}</span></div>
            <div>Status: <span className="font-medium">{selected.status}</span></div>
          </div>
        );
      case 'education':
        return (
          <div className="space-y-2">
            {(selected.user?.education || []).length === 0 && (
              <div className="text-gray-500">No education records.</div>
            )}
            {(selected.user?.education || []).map((e, idx) => (
              <div key={idx} className="border rounded p-2">
                <div className="font-medium">{e.course || 'Course'} {e.branch ? `• ${e.branch}` : ''}</div>
                <div className="text-xs text-gray-600">{e.college || '—'} {e.city ? `• ${e.city}` : ''} {e.passingYear ? `• ${e.passingYear}` : ''}</div>
              </div>
            ))}
          </div>
        );
      case 'experience':
        return (
          <div className="space-y-2">
            {(selected.user?.experience || []).length === 0 && (
              <div className="text-gray-500">No experience records.</div>
            )}
            {(selected.user?.experience || []).map((e, idx) => (
              <div key={idx} className="border rounded p-2">
                <div className="font-medium">{e.company || 'Company'} {e.position ? `• ${e.position}` : ''}</div>
                <div className="text-xs text-gray-600">{e.duration || ''}</div>
                {e.description && <div className="text-xs text-gray-700 mt-1">{e.description}</div>}
              </div>
            ))}
          </div>
        );
      case 'certificates':
        return (
          <div className="space-y-2">
            {(selected.user?.certificates || []).length === 0 && (
              <div className="text-gray-500">No certificates.</div>
            )}
            {(selected.user?.certificates || []).map((c, idx) => (
              <div key={idx} className="border rounded p-2">
                <div className="font-medium">{c.name || 'Certificate'} {c.issuer ? `• ${c.issuer}` : ''}</div>
                <div className="text-xs text-gray-600">{c.date || ''}</div>
                {c.url && <a href={c.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">View</a>}
              </div>
            ))}
          </div>
        );
      case 'resume':
        return (
          <div>
            {selected.resumeUrl ? (
              <a href={selected.resumeUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">Open Resume</a>
            ) : (
              <div className="text-gray-500">No resume provided.</div>
            )}
          </div>
        );
      case 'activity':
        return (
          <div className="space-y-2">
            <div>Total Past Interviews: <span className="font-medium">{typeof selected.totalPastInterviews === 'number' ? selected.totalPastInterviews : '—'}</span></div>
            <div>Average Rating: <span className="font-medium">{typeof selected.averageRating === 'number' ? selected.averageRating : '—'}</span></div>
            <div>Total Ratings: <span className="font-medium">{typeof selected.totalRatings === 'number' ? selected.totalRatings : '—'}</span></div>
            <div>Conducted Interviews: <span className="font-medium">{typeof selected.conductedInterviews === 'number' ? selected.conductedInterviews : '—'}</span></div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-5 shadow-sm w-full flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Applications Management</h1>
          {error && <span className="text-sm text-red-600 font-medium">{error}</span>}
        </div>
        
        {/* Search + Date Filter in Single Row */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
          {/* Search */}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, company, or position..."
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-1 md:flex-none md:w-96"
          />
          
          {/* Quick Date Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: 'custom', label: '📅 Custom' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setDateFilter(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border ${
                  dateFilter === opt.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Result Count */}
          <div className="text-sm text-gray-600 font-medium md:ml-auto">{loading ? 'Loading…' : `${applications.length} results`}</div>
        </div>

        {/* Custom Date Range (inline if custom selected) */}
        {dateFilter === 'custom' && (
          <div className="flex gap-3 mt-3 items-center">
            <label className="text-sm font-medium text-gray-700">From:</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">To:</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
      </div>

      {/* Main Content: Sidebar + List + Details */}
      <div className="flex flex-1 overflow-hidden w-full h-full">
        {/* Left Sidebar: Category + Status Filters */}
        <div className="w-48 h-full border-r border-gray-200 bg-white overflow-y-auto px-4 py-6 shadow-sm flex-shrink-0">
          {/* Category Filter */}
          <div className="mb-6">
            <div className="text-sm font-semibold text-gray-800 mb-3">Category</div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            >
              {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <div className="text-sm font-semibold text-gray-800 mb-3">Status</div>
            <div className="space-y-2">
              {statusTabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setStatus(t.id)}
                  className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium text-left transition border ${
                    status === t.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Application List */}
        <div className="flex-1 h-full border-r border-gray-200 bg-gray-50 overflow-y-auto">
          <div className="p-4">
            {loading ? (
              <div className="text-sm text-gray-500">Loading applications…</div>
            ) : applications.length === 0 ? (
              <div className="text-sm text-gray-600">No applications found.</div>
            ) : (
              <div className="space-y-3">
                {applications.map(app => (
                  <div
                    key={app._id}
                    onClick={() => setSelectedId(app._id)}
                    className={`bg-white border rounded-lg p-4 flex items-start gap-4 hover:shadow-md transition-all cursor-pointer ${
                      selectedId===app._id ? 'ring-2 ring-blue-500 shadow-lg border-blue-200' : 'border-gray-200'
                    }`}
                  >
                    <div className="w-12 h-12 flex-shrink-0">
                      {app.user?.profilePic ? (
                        <img src={app.user.profilePic} alt={app.name} className="w-12 h-12 rounded-full object-cover border-2 border-gray-100" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">{(app.name || app.user?.username || '?').charAt(0).toUpperCase()}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-base text-gray-900 truncate">{app.name || `${app.user?.firstName || ''} ${app.user?.lastName || ''}`.trim() || app.user?.username}</div>
                      <div className="text-sm text-gray-600 truncate mt-0.5">{app.user?.email}</div>
                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                        <span>{app.company || '—'}</span>
                        <span className="text-gray-300">•</span>
                        <span>{app.position || '—'}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      {app.status === 'pending' && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>}
                      {app.status === 'approved' && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>}
                      {app.status === 'rejected' && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Detail Panel */}
        <div className="w-96 h-full border-l border-gray-200 bg-white overflow-y-auto shadow-sm flex-shrink-0">
          {selected ? (
            <div className="flex flex-col h-full">
              {/* Detail header */}
              <div className="px-6 py-5 border-b bg-gradient-to-br from-gray-50 to-white flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 ring-2 ring-gray-200">
                    {selected?.user?.profilePic ? (
                      <img className="w-full h-full object-cover" src={selected.user.profilePic} alt="avatar" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-lg">{(selected?.name || selected?.user?.username || '?').charAt(0).toUpperCase()}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-gray-900 truncate">{selected?.name || `${selected?.user?.firstName || ''} ${selected?.user?.lastName || ''}`.trim() || selected?.user?.username}</div>
                    <div className="text-sm text-gray-600 truncate mt-0.5">{selected?.user?.email}</div>
                  </div>
                </div>
                <div className="mt-3">
                  {selected?.status === 'pending' && <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">Pending Review</span>}
                  {selected?.status === 'approved' && <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800">Approved</span>}
                  {selected?.status === 'rejected' && <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-800">Rejected</span>}
                </div>
              </div>

              {/* Detail tabs (compact) */}
              <div className="px-6 py-4 border-b bg-gray-50 flex-shrink-0">
                <div className="flex flex-wrap gap-2">
                  {['profile','education','experience','certificates','resume','activity'].map(t => (
                    <button
                      key={t}
                      onClick={() => setDetailTab(t)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${detailTab===t ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
                    >{t.charAt(0).toUpperCase()+t.slice(1)}</button>
                  ))}
                </div>
              </div>

              {/* Detail content */}
              <div className="px-6 py-5 text-sm overflow-y-auto flex-1">
                {renderDetail()}
              </div>

              {/* Actions (if interview-expert and pending) */}
              {selected?.type !== 'tutor' && selected?.status === 'pending' && (
                <div className="px-6 py-5 border-t bg-gradient-to-br from-gray-50 to-white flex-shrink-0 flex gap-3">
                  <button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
                    onClick={() => approve(selected._id)}
                    disabled={!!actionLoading[selected._id]}
                  >{actionLoading[selected._id] ? 'Approving…' : 'Approve Application'}</button>
                  <button
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
                    onClick={() => reject(selected._id)}
                    disabled={!!actionLoading[selected._id]}
                  >{actionLoading[selected._id] ? 'Rejecting…' : 'Reject Application'}</button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 px-6">
              <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-base font-medium">No Selection</p>
              <p className="text-sm mt-1">Select an application to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

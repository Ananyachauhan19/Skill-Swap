import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config.js';
import { useAuth } from '../context/AuthContext.jsx';
import InterviewerApproval from './InterviewerApproval.jsx';
import TutorVerification from './TutorVerification.jsx';

const statusTabs = [
  { id: 'all', label: 'All Applications' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

const categories = [
  { id: 'interview-expert', label: 'Interview Expert' },
  { id: 'tutor', label: 'Users (Tutor)' },
];

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('interview-expert');
  const [selectedId, setSelectedId] = useState(null);
  const [detailTab, setDetailTab] = useState('profile');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const debounceRef = useRef(null);
  useAuth();

  const getDateRange = (filter) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let start = null, end = null;
    switch (filter) {
      case 'today':
        start = new Date(today); end = new Date(today); end.setDate(end.getDate() + 1); break;
      case 'week':
        start = new Date(today); start.setDate(today.getDate() - today.getDay()); end = new Date(today); end.setDate(end.getDate() + 1); break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1); end = new Date(today); end.setDate(end.getDate() + 1); break;
      case 'custom':
        if (customStartDate) start = new Date(customStartDate);
        if (customEndDate) { end = new Date(customEndDate); end.setDate(end.getDate() + 1); }
        break;
      default: break;
    }
    return { start, end };
  };

  const selected = useMemo(() => applications.find(a => (a._id === selectedId)), [applications, selectedId]);

  const fetchApps = async (q = {}) => {
    const effectiveCategory = q.category ?? category;
    const effectiveStatus = q.status ?? status;
    const effectiveSearch = q.search ?? search;
    try {
      setLoading(true); setError(null);
      let list = [];
      if (effectiveCategory === 'tutor') {
        // Tutor applications use a separate admin endpoint without query filters.
        const res = await axios.get(`${BACKEND_URL}/api/admin/tutor/applications`, { withCredentials: true });
        list = Array.isArray(res.data) ? res.data : [];
        // Client-side filter by status
        if (effectiveStatus !== 'all') {
          list = list.filter(a => a.status === effectiveStatus);
        }
        // Client-side search (username / email / institution)
        if (effectiveSearch.trim()) {
          const ql = effectiveSearch.trim().toLowerCase();
            list = list.filter(a => {
              const u = a.user || {}; // populated user
              return [u.username, u.email, a.institutionName, u.firstName, u.lastName]
                .filter(Boolean)
                .some(v => v.toLowerCase().includes(ql));
            });
        }
      } else {
        // Interview expert applications original flow
        const df = q.dateFilter ?? dateFilter;
        const { start, end } = getDateRange(df);
        const params = {
          status: effectiveStatus,
          category: effectiveCategory,
          search: effectiveSearch,
        };
        if (start) params.startDate = start.toISOString().split('T')[0];
        if (end) params.endDate = end.toISOString().split('T')[0];
        const qs = new URLSearchParams(params);
        const res = await fetch(`${BACKEND_URL}/api/interview/applications?${qs.toString()}`, { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((data && data.message) || 'Failed to load applications');
        list = data.applications || data || [];
      }
      setApplications(list);
      if (list.length && !selectedId) setSelectedId(list[0]._id);
    } catch (e) {
      setApplications([]); setError(e.message || 'Failed to load');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchApps(); /* eslint-disable-next-line */ }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { fetchApps({}); }, 300);
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
    } catch (e) { alert(e.message || 'Failed'); }
    finally { setActionLoading(prev => ({ ...prev, [id]: false })); }
  };

  const reject = async (id) => {
    if (!window.confirm('Reject this application?')) return;
    try {
      setActionLoading(prev => ({ ...prev, [id]: true }));
      const res = await fetch(`${BACKEND_URL}/api/interview/applications/${id}/reject`, { method: 'POST', credentials: 'include' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || 'Reject failed');
      await fetchApps({});
    } catch (e) { alert(e.message || 'Failed'); }
    finally { setActionLoading(prev => ({ ...prev, [id]: false })); }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-5 shadow-sm w-full flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Applications Management</h1>
          {error && <span className="text-sm text-red-600 font-medium">{error}</span>}
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, company, or position..."
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-1 md:flex-none md:w-96"
          />
          <div className="flex items-center gap-2 flex-wrap">
            {[{ id: 'all', label: 'All Time' },{ id: 'today', label: 'Today' },{ id: 'week', label: 'This Week' },{ id: 'month', label: 'This Month' },{ id: 'custom', label: '📅 Custom' }].map(opt => (
              <button key={opt.id} onClick={() => setDateFilter(opt.id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border ${dateFilter === opt.id ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'}`}>{opt.label}</button>
            ))}
          </div>
          <div className="text-sm text-gray-600 font-medium md:ml-auto">{loading ? 'Loading…' : `${applications.length} results`}</div>
        </div>
        {dateFilter === 'custom' && (
          <div className="flex gap-3 mt-3 items-center">
            <label className="text-sm font-medium text-gray-700">From:</label>
            <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            <label className="text-sm font-medium text-gray-700">To:</label>
            <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden w-full h-full">
        <div className="w-48 h-full border-r border-gray-200 bg-white overflow-y-auto px-4 py-6 shadow-sm flex-shrink-0">
          <div className="mb-6">
            <div className="text-sm font-semibold text-gray-800 mb-3">Category</div>
            <select value={category} onChange={(e) => { setCategory(e.target.value); setSelectedId(null); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer">
              {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800 mb-3">Status</div>
            <div className="space-y-2">
              {statusTabs.map(t => (
                <button key={t.id} onClick={() => setStatus(t.id)} className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium text-left transition border ${status === t.id ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'}`}>{t.label}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 h-full border-r border-gray-200 bg-gray-50 overflow-y-auto">
          <div className="p-4">
            {loading ? (
              <div className="text-sm text-gray-500">Loading applications…</div>
            ) : applications.length === 0 ? (
              <div className="text-sm text-gray-600">No applications found.</div>
            ) : (
              <div className="space-y-3">
                {Array.isArray(applications) && applications.map(app => {
                  const isTutorCategory = category === 'tutor';
                  const tutorApp = isTutorCategory ? (app.tutorApplication || app) : null;
                  const statusValue = isTutorCategory ? (tutorApp?.status || app.status) : app.status;
                  return (
                    <div key={app._id} onClick={() => setSelectedId(app._id)} className={`bg-white border rounded-lg p-4 flex flex-col gap-3 hover:shadow-md transition-all cursor-pointer ${selectedId===app._id ? 'ring-2 ring-blue-500 shadow-lg border-blue-200' : 'border-gray-200'}`}>
                      <div className="flex items-start gap-4">
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
                          {!isTutorCategory && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                              <span>{app.company || '—'}</span>
                              <span className="text-gray-300">•</span>
                              <span>{app.position || '—'}</span>
                            </div>
                          )}
                          {isTutorCategory && tutorApp && (
                            <div className="mt-2 text-xs bg-gray-50 rounded p-2">
                              <span className="font-medium">Education:</span> {tutorApp.educationLevel} • {tutorApp.institutionName} • {tutorApp.classOrYear}
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          {statusValue === 'pending' && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>}
                          {statusValue === 'approved' && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>}
                          {statusValue === 'rejected' && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>}
                        </div>
                      </div>
                      {isTutorCategory && tutorApp && (
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(tutorApp?.skills) && tutorApp.skills.map((s,i)=>(
                            <span key={i} className="text-[11px] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                              {s?.class ? `${s.class} • ` : ''}{s?.subject}{s?.topic ? ` : ${s.topic === 'ALL' ? 'ALL Topics' : s.topic}` : ''}
                            </span>
                          ))}
                          {(!Array.isArray(tutorApp?.skills) || tutorApp.skills.length===0) && <span className="text-[11px] text-gray-400">No skills</span>}
                        </div>
                      )}
                      {isTutorCategory && tutorApp && (
                        <div className="flex gap-4 text-xs">
                          <a href={tutorApp.marksheetUrl} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} className="text-blue-600 underline">Marksheet</a>
                          <a href={tutorApp.videoUrl} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} className="text-blue-600 underline">Video</a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="w-96 h-full border-l border-gray-200 bg-white overflow-y-auto shadow-sm flex-shrink-0">
          {selected ? (
            category === 'tutor' ? (
              <TutorVerification selected={selected} detailTab={detailTab} setDetailTab={setDetailTab} />
            ) : (
              <InterviewerApproval selected={selected} detailTab={detailTab} setDetailTab={setDetailTab} approve={approve} reject={reject} actionLoading={actionLoading} />
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 px-6">
              <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <p className="text-base font-medium">No Selection</p>
              <p className="text-sm mt-1">Select an application to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

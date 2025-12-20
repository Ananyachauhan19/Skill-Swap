import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  FiSearch, FiFilter, FiCalendar, FiUser, FiUsers, FiBriefcase,
  FiAward, FiFileText, FiX, FiCheck, FiClock, FiChevronRight,
  FiMail, FiMapPin, FiGlobe, FiBook, FiVideo, FiGrid, FiList
} from 'react-icons/fi';

const statusOptions = [
  { id: 'all', label: 'All', color: 'gray' },
  { id: 'pending', label: 'Pending', color: 'yellow' },
  { id: 'approved', label: 'Approved', color: 'green' },
  { id: 'rejected', label: 'Rejected', color: 'red' },
];

const categoryOptions = [
  { id: 'interview-expert', label: 'Interview Expert', icon: FiBriefcase },
  { id: 'tutor', label: 'Tutor', icon: FiBook },
];

const dateRangeOptions = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'custom', label: 'Custom Range' },
];

export default function Applications({ mode = 'admin', allowedCategories, initialCategory }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailTab, setDetailTab] = useState('overview');
  // Restore category and status for admin, set sensible defaults for employee
  const [category, setCategory] = useState(initialCategory || 'interview-expert');
  const [status, setStatus] = useState('all');
  const [viewMode, setViewMode] = useState(mode === 'employee' ? 'comfortable' : 'comfortable');
  // Add search and date filter state for employee mode (since top bar is removed)
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  useAuth();

  const visibleCategoryOptions = useMemo(() => {
    if (!allowedCategories || !Array.isArray(allowedCategories) || !allowedCategories.length) {
      return categoryOptions;
    }
    return categoryOptions.filter(opt => allowedCategories.includes(opt.id));
  }, [allowedCategories]);

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

  const selected = useMemo(() => {
    const app = applications.find(a => a._id === selectedId);
    if (app && !drawerOpen) setDrawerOpen(true);
    return app;
  }, [applications, selectedId, drawerOpen]);

  const fetchApps = async (q = {}) => {
    const effectiveCategory = q.category ?? category;
    const effectiveStatus = q.status ?? status;
    const effectiveSearch = q.search ?? search;
    try {
      setLoading(true); setError(null);
      let list = [];
      if (effectiveCategory === 'tutor') {
        // Tutor applications use separate endpoints for admin vs employee.
        const tutorUrl =
          mode === 'employee'
            ? `${BACKEND_URL}/api/employee/tutor/applications`
            : `${BACKEND_URL}/api/admin/tutor/applications`;
        const res = await axios.get(tutorUrl, { withCredentials: true });
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
        const baseUrl =
          mode === 'employee'
            ? `${BACKEND_URL}/api/interview/employee/applications`
            : `${BACKEND_URL}/api/interview/applications`;
        const res = await fetch(`${baseUrl}?${qs.toString()}`, { credentials: 'include' });
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

  // Only use effect for admin mode filters
  // For employee mode, sidebar tab selection triggers fetchApps
  useEffect(() => {
    if (mode !== 'employee') {
      // debounce filter/search for admin mode
      const debounceRef = { current: null };
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => { fetchApps({}); }, 300);
      return () => debounceRef.current && clearTimeout(debounceRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const approve = async (id) => {
    if (!window.confirm('Approve this application?')) return;
    try {
      setActionLoading(prev => ({ ...prev, [id]: true }));
      if (category === 'tutor') {
        const tutorUrl =
          mode === 'employee'
            ? `${BACKEND_URL}/api/employee/tutor/applications/${id}/approve`
            : `${BACKEND_URL}/api/admin/tutor/applications/${id}/approve`;
        await axios.put(tutorUrl, {}, { withCredentials: true });
      } else {
        const baseUrl =
          mode === 'employee'
            ? `${BACKEND_URL}/api/interview/employee/applications/${id}/approve`
            : `${BACKEND_URL}/api/interview/applications/${id}/approve`;
        const res = await fetch(baseUrl, { method: 'POST', credentials: 'include' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || 'Approve failed');
      }
      await fetchApps({});
    } catch (e) { alert(e.message || 'Failed'); }
    finally { setActionLoading(prev => ({ ...prev, [id]: false })); }
  };

  const reject = async (id) => {
    const reason = category === 'tutor' ? (prompt('Rejection reason (optional)') || '') : null;
    if (!category !== 'tutor' && !window.confirm('Reject this application?')) return;
    try {
      setActionLoading(prev => ({ ...prev, [id]: true }));
      if (category === 'tutor') {
        const tutorUrl =
          mode === 'employee'
            ? `${BACKEND_URL}/api/employee/tutor/applications/${id}/reject`
            : `${BACKEND_URL}/api/admin/tutor/applications/${id}/reject`;
        await axios.put(tutorUrl, { reason }, { withCredentials: true });
      } else {
        const baseUrl =
          mode === 'employee'
            ? `${BACKEND_URL}/api/interview/employee/applications/${id}/reject`
            : `${BACKEND_URL}/api/interview/applications/${id}/reject`;
        const res = await fetch(baseUrl, { method: 'POST', credentials: 'include' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || 'Reject failed');
      }
      await fetchApps({});
    } catch (e) { alert(e.message || 'Failed'); }
    finally { setActionLoading(prev => ({ ...prev, [id]: false })); }
  };

  const getStatusBadge = (statusValue) => {
    const colors = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      approved: 'bg-green-50 text-green-700 border-green-200',
      rejected: 'bg-red-50 text-red-700 border-red-200',
    };
    const icons = {
      pending: FiClock,
      approved: FiCheck,
      rejected: FiX,
    };
    const Icon = icons[statusValue] || FiClock;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${colors[statusValue] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
        <Icon size={12} />
        {statusValue}
      </span>
    );
  };

  const renderApplicationCard = (app) => {
    const isTutorCategory = category === 'tutor';
    const tutorApp = isTutorCategory ? (app.tutorApplication || app) : null;
    const statusValue = isTutorCategory ? (tutorApp?.status || app.status) : app.status;
    const isSelected = selectedId === app._id;
    const isCompact = viewMode === 'compact';

    return (
      <div
        key={app._id}
        onClick={() => {
          setSelectedId(app._id);
          setDrawerOpen(true);
        }}
        className={`bg-white border rounded-lg transition-all cursor-pointer ${
          isSelected
            ? 'bg-blue-50 border-blue-300 shadow-sm'
            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        } ${isCompact ? 'p-3' : 'p-4'}`}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={`flex-shrink-0 ${isCompact ? 'w-10 h-10' : 'w-12 h-12'}`}>
            {app.user?.profilePic ? (
              <img
                src={app.user.profilePic}
                alt={app.name}
                className={`${isCompact ? 'w-10 h-10' : 'w-12 h-12'} rounded-full object-cover border-2 ${
                  isSelected ? 'border-blue-300' : 'border-gray-100'
                }`}
              />
            ) : (
              <div
                className={`${isCompact ? 'w-10 h-10 text-sm' : 'w-12 h-12 text-base'} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-sm`}
              >
                {(app.name || app.user?.username || '?').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Name */}
            <div className={`font-semibold text-gray-900 truncate ${isCompact ? 'text-sm' : 'text-base'}`}>
              {app.name || `${app.user?.firstName || ''} ${app.user?.lastName || ''}`.trim() || app.user?.username}
            </div>

            {/* Email */}
            <div className={`text-gray-500 truncate ${isCompact ? 'text-xs mt-0.5' : 'text-sm mt-1'}`}>
              {app.user?.email}
            </div>

            {/* Company/Position or Institution */}
            {!isTutorCategory && (app.company || app.position) && (
              <div className={`flex items-center gap-2 text-gray-600 ${isCompact ? 'text-xs mt-1' : 'text-sm mt-2'}`}>
                <FiBriefcase size={isCompact ? 12 : 14} className="flex-shrink-0" />
                <span className="truncate">
                  {app.company && app.position ? `${app.position} at ${app.company}` : app.company || app.position}
                </span>
              </div>
            )}

            {isTutorCategory && tutorApp && (
              <div className={`text-gray-600 ${isCompact ? 'text-xs mt-1' : 'text-xs mt-2'}`}>
                <span className="font-medium">{tutorApp.educationLevel}</span> • {tutorApp.institutionName}
              </div>
            )}

            {/* Skills for tutor */}
            {isTutorCategory && tutorApp && Array.isArray(tutorApp.skills) && tutorApp.skills.length > 0 && !isCompact && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tutorApp.skills.slice(0, 3).map((s, i) => (
                  <span key={i} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                    {s?.subject || 'Subject'}
                  </span>
                ))}
                {tutorApp.skills.length > 3 && (
                  <span className="text-[10px] text-gray-500">+{tutorApp.skills.length - 3} more</span>
                )}
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="flex-shrink-0">
            {getStatusBadge(statusValue)}
          </div>
        </div>
      </div>
    );
  };

  const renderDrawerContent = () => {
    if (!selected) return null;

    const isTutorCategory = category === 'tutor';
    const tutorApp = isTutorCategory ? (selected.tutorApplication || selected) : null;
    const user = selected.user || {};
    const statusValue = isTutorCategory ? (tutorApp?.status || selected.status) : selected.status;

    const tabs = isTutorCategory
      ? [
          { id: 'overview', label: 'Overview', icon: FiUser },
          { id: 'skills', label: 'Skills', icon: FiAward },
          { id: 'documents', label: 'Documents', icon: FiFileText },
        ]
      : [
          { id: 'overview', label: 'Overview', icon: FiUser },
          { id: 'education', label: 'Education', icon: FiBook },
          { id: 'experience', label: 'Experience', icon: FiBriefcase },
          { id: 'certificates', label: 'Certificates', icon: FiAward },
          { id: 'resume', label: 'Resume', icon: FiFileText },
        ];

    return (
      <div className="flex flex-col h-full">
        {/* Drawer Header */}
        <div className="flex-shrink-0 border-b border-gray-200 p-4 bg-white">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
                {user.profilePic ? (
                  <img src={user.profilePic} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                    {(selected.name || user.username || '?').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {selected.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(statusValue)}
                  {isTutorCategory && tutorApp?.applicationType === 'skills-update' && (
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                      Skills Update
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setDetailTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    detailTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {detailTab === 'overview' && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <FiMail size={14} className="text-gray-400" />
                    <span>{user.email || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <FiMapPin size={14} className="text-gray-400" />
                    <span>{user.country || '—'}</span>
                  </div>
                </div>
              </div>

              {!isTutorCategory && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Professional Details</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Company:</span>{' '}
                      <span className="text-gray-900 font-medium">{selected.company || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Position:</span>{' '}
                      <span className="text-gray-900 font-medium">{selected.position || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Qualification:</span>{' '}
                      <span className="text-gray-900 font-medium">{selected.qualification || '—'}</span>
                    </div>
                  </div>
                </div>
              )}

              {isTutorCategory && tutorApp && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Education Details</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Level:</span>{' '}
                      <span className="text-gray-900 font-medium">{tutorApp.educationLevel || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Institution:</span>{' '}
                      <span className="text-gray-900 font-medium">{tutorApp.institutionName || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Class/Year:</span>{' '}
                      <span className="text-gray-900 font-medium">{tutorApp.classOrYear || '—'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {detailTab === 'education' && !isTutorCategory && (
            <div className="space-y-3">
              {(user.education || []).length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-8">No education records</div>
              ) : (
                user.education.map((e, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="font-medium text-gray-900">
                      {e.course || 'Course'} {e.branch && `• ${e.branch}`}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {e.college || '—'} {e.city && `• ${e.city}`}
                    </div>
                    {e.passingYear && (
                      <div className="text-xs text-gray-500 mt-1">Graduated: {e.passingYear}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {detailTab === 'experience' && !isTutorCategory && (
            <div className="space-y-3">
              {(user.experience || []).length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-8">No experience records</div>
              ) : (
                user.experience.map((e, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="font-medium text-gray-900">{e.company || 'Company'}</div>
                    <div className="text-sm text-gray-600 mt-1">{e.position || 'Position'}</div>
                    {e.duration && <div className="text-xs text-gray-500 mt-1">{e.duration}</div>}
                    {e.description && (
                      <div className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">{e.description}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {detailTab === 'certificates' && !isTutorCategory && (
            <div className="space-y-3">
              {(user.certificates || []).length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-8">No certificates</div>
              ) : (
                user.certificates.map((c, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="font-medium text-gray-900">{c.name || 'Certificate'}</div>
                    {c.issuer && <div className="text-sm text-gray-600 mt-1">{c.issuer}</div>}
                    {c.date && <div className="text-xs text-gray-500 mt-1">{c.date}</div>}
                    {c.url && (
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-2"
                      >
                        View Certificate <FiChevronRight size={14} />
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {detailTab === 'resume' && !isTutorCategory && (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              {selected.resumeUrl ? (
                <div className="space-y-3">
                  <a
                    href={selected.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FiFileText size={16} />
                    View Resume
                  </a>
                  <div className="pt-4 border-t border-gray-200">
                    <iframe
                      src={selected.resumeUrl}
                      className="w-full h-96 border border-gray-300 rounded"
                      title="Resume Preview"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center py-8">No resume uploaded</div>
              )}
            </div>
          )}

          {detailTab === 'skills' && isTutorCategory && tutorApp && (
            <div className="space-y-3">
              {!Array.isArray(tutorApp.skills) || tutorApp.skills.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-8">No skills listed</div>
              ) : (
                tutorApp.skills.map((s, i) => (
                  <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FiBook className="text-blue-600" size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{s?.subject || 'Subject'}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {s?.class && `Class: ${s.class}`}
                          {s?.topic && ` • Topic: ${s.topic === 'ALL' ? 'All Topics' : s.topic}`}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {detailTab === 'documents' && isTutorCategory && tutorApp && (
            <div className="space-y-3">
              {tutorApp.marksheetUrl && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FiFileText className="text-gray-400" size={16} />
                    <span className="text-sm font-medium text-gray-900">Marksheet</span>
                  </div>
                  <a
                    href={tutorApp.marksheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    View Document <FiChevronRight size={14} />
                  </a>
                </div>
              )}
              {tutorApp.videoUrl && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FiVideo className="text-gray-400" size={16} />
                    <span className="text-sm font-medium text-gray-900">Introduction Video</span>
                  </div>
                  <a
                    href={tutorApp.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    Watch Video <FiChevronRight size={14} />
                  </a>
                </div>
              )}
              {!tutorApp.marksheetUrl && !tutorApp.videoUrl && (
                <div className="text-sm text-gray-500 text-center py-8">No documents available</div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Footer - Actions */}
        {statusValue === 'pending' && (
          <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-white">
            <div className="flex gap-3">
              <button
                onClick={() => reject(selected._id)}
                disabled={actionLoading[selected._id]}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <FiX size={16} />
                {actionLoading[selected._id] ? 'Rejecting...' : 'Reject'}
              </button>
              <button
                onClick={() => approve(selected._id)}
                disabled={actionLoading[selected._id]}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
              >
                <FiCheck size={16} />
                {actionLoading[selected._id] ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Top Control Bar: Only show for admin mode, not employee */}
      {mode !== 'employee' && <></>}

      {/* Main Content Area - Two Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Applications List */}
        <div
          className={`flex-shrink-0 bg-gray-50 overflow-y-auto transition-all duration-300 ${
            drawerOpen ? 'w-[calc(100%-400px)]' : 'w-full'
          }`}
        >
          <div className={`p-6 ${viewMode === 'compact' ? 'space-y-2' : 'space-y-3'}`}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <div className="mt-3 text-sm text-gray-600">Loading applications...</div>
                </div>
              </div>
            ) : applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FiUsers className="text-gray-400" size={32} />
                </div>
                <div className="text-base font-medium text-gray-900">No applications found</div>
                <div className="text-sm text-gray-600 mt-1">
                  Try adjusting your filters or search criteria
                </div>
              </div>
            ) : (
              applications.map((app) => renderApplicationCard(app))
            )}
          </div>
        </div>

        {/* Sliding Detail Drawer */}
        <div
          className={`flex-shrink-0 bg-white border-l border-gray-200 shadow-lg transition-all duration-300 overflow-hidden ${
            drawerOpen ? 'w-[400px]' : 'w-0'
          }`}
        >
          {drawerOpen && (
            <div className="h-full w-[400px]">{renderDrawerContent()}</div>
          )}
        </div>
      </div>
    </div>
  );
}

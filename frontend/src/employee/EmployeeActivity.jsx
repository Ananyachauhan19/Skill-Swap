import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { FiBarChart2, FiCheckCircle, FiClock, FiXCircle, FiFilter } from 'react-icons/fi';

const rangeOptions = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
  { id: '365d', label: 'Last year' },
  { id: 'all', label: 'All time' },
];

const applicationTypeOptions = [
  { id: 'tutor', label: 'Tutor Applications' },
  { id: 'interview', label: 'Interview Applications' },
];

const StatCard = ({ label, value, icon: Icon, color, subStats = null }) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
    <div className="flex-1">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {subStats && (
        <div className="mt-2 flex gap-3 text-xs">
          {subStats.map((stat, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <span className="text-gray-500">{stat.label}:</span>
              <span className="font-medium text-gray-700">{stat.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
    <div className={`p-3 rounded-full ${color}`}>
      <Icon className="text-white" size={20} />
    </div>
  </div>
);

export function ActivityProfileView({
  title = 'My Activity',
  loading,
  error,
  stats,
  access,
  lists,
  range,
  applicationType,
  onRangeChange,
  onApplicationTypeChange,
}) {
  const [activeTab, setActiveTab] = useState('approved');

  // Default values
  const safeAccess = access || { canTutor: false, canInterviewer: false, hasBothAccess: false };
  const safeStats = stats || { tutorStats: { total: 0 }, interviewStats: { total: 0 }, combinedStats: { total: 0, approved: 0, rejected: 0, pending: 0 } };
  const safeLists = lists || { approved: [], rejected: [], pending: [] };

  // Determine if filters should be shown
  const showApplicationTypeFilter = safeAccess.hasBothAccess;

  // Calculate displayed stats - KPI cards always show combined totals with breakdown
  let displayedStats;
  if (safeAccess.hasBothAccess) {
    // Always show combined stats with breakdown, regardless of filter
    displayedStats = {
      total: safeStats.combinedStats.total,
      approved: safeStats.combinedStats.approved,
      rejected: safeStats.combinedStats.rejected,
      pending: safeStats.combinedStats.pending,
      showBreakdown: true,
      tutorCount: safeStats.tutorStats.total,
      interviewCount: safeStats.interviewStats.total,
      approvedTutorCount: safeStats.tutorStats.approved,
      approvedInterviewCount: safeStats.interviewStats.approved,
      rejectedTutorCount: safeStats.tutorStats.rejected,
      rejectedInterviewCount: safeStats.interviewStats.rejected,
      pendingTutorCount: safeStats.tutorStats.pending,
      pendingInterviewCount: safeStats.interviewStats.pending,
    };
  } else if (safeAccess.canTutor) {
    displayedStats = {
      total: safeStats.tutorStats.total,
      approved: safeStats.tutorStats.approved,
      rejected: safeStats.tutorStats.rejected,
      pending: safeStats.tutorStats.pending,
    };
  } else if (safeAccess.canInterviewer) {
    displayedStats = {
      total: safeStats.interviewStats.total,
      approved: safeStats.interviewStats.approved,
      rejected: safeStats.interviewStats.rejected,
      pending: safeStats.interviewStats.pending,
    };
  } else {
    displayedStats = {
      total: 0,
      approved: 0,
      rejected: 0,
      pending: 0,
    };
  }

  const handleRangeChange = (e) => {
    const value = e.target.value;
    if (onRangeChange) {
      onRangeChange(value);
    }
  };

  const handleApplicationTypeChange = (e) => {
    const value = e.target.value;
    if (onApplicationTypeChange) {
      onApplicationTypeChange(value);
    }
  };

  // Render table based on application type filter
  const renderTableHeaders = () => {
    const activeFilter = applicationType || (safeAccess.canTutor ? 'tutor' : 'interview');
    
    if (activeFilter === 'tutor' && safeAccess.canTutor) {
      return (
        <>
          <th className="px-4 py-2.5">Applicant Name</th>
          <th className="px-4 py-2.5">Class</th>
          <th className="px-4 py-2.5">Subject(s)</th>
          <th className="px-4 py-2.5">Status</th>
          <th className="px-4 py-2.5">Reviewed At</th>
        </>
      );
    } else if (activeFilter === 'interview' && safeAccess.canInterviewer) {
      return (
        <>
          <th className="px-4 py-2.5">Applicant Name</th>
          <th className="px-4 py-2.5">Company</th>
          <th className="px-4 py-2.5">Position</th>
          <th className="px-4 py-2.5">Status</th>
          <th className="px-4 py-2.5">Reviewed At</th>
        </>
      );
    } else {
      // Mixed view
      return (
        <>
          <th className="px-4 py-2.5">Type</th>
          <th className="px-4 py-2.5">Applicant Name</th>
          <th className="px-4 py-2.5">Details</th>
          <th className="px-4 py-2.5">Status</th>
          <th className="px-4 py-2.5">Reviewed At</th>
        </>
      );
    }
  };

  const renderTableRow = (item) => {
    const activeFilter = applicationType || (safeAccess.canTutor ? 'tutor' : 'interview');
    
    if (activeFilter === 'tutor' && safeAccess.canTutor && item.type === 'tutor') {
      return (
        <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50">
          <td className="px-4 py-2.5 text-gray-700 font-medium">{item.applicantName || '—'}</td>
          <td className="px-4 py-2.5 text-gray-600">{item.class || '—'}</td>
          <td className="px-4 py-2.5 text-gray-600">{item.subjects || '—'}</td>
          <td className="px-4 py-2.5">
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
                item.status === 'approved'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : item.status === 'rejected'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </span>
          </td>
          <td className="px-4 py-2.5 text-gray-600">
            {item.reviewedAt
              ? new Date(item.reviewedAt).toLocaleString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'}
          </td>
        </tr>
      );
    } else if (activeFilter === 'interview' && safeAccess.canInterviewer && item.type === 'interview') {
      return (
        <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50">
          <td className="px-4 py-2.5 text-gray-700 font-medium">{item.applicantName || '—'}</td>
          <td className="px-4 py-2.5 text-gray-600">{item.company || '—'}</td>
          <td className="px-4 py-2.5 text-gray-600">{item.position || '—'}</td>
          <td className="px-4 py-2.5">
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
                item.status === 'approved'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : item.status === 'rejected'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </span>
          </td>
          <td className="px-4 py-2.5 text-gray-600">
            {item.reviewedAt
              ? new Date(item.reviewedAt).toLocaleString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'}
          </td>
        </tr>
      );
    } else {
      // Mixed view
      const details = item.type === 'tutor' 
        ? [item.class, item.subjects].filter(Boolean).join(' • ') 
        : [item.company, item.position].filter(Boolean).join(' • ');
      
      return (
        <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50">
          <td className="px-4 py-2.5 text-gray-800">
            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
              {item.type === 'tutor' ? 'Tutor' : 'Interviewer'}
            </span>
          </td>
          <td className="px-4 py-2.5 text-gray-700 font-medium">{item.applicantName || '—'}</td>
          <td className="px-4 py-2.5 text-gray-600">{details || '—'}</td>
          <td className="px-4 py-2.5">
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
                item.status === 'approved'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : item.status === 'rejected'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </span>
          </td>
          <td className="px-4 py-2.5 text-gray-600">
            {item.reviewedAt
              ? new Date(item.reviewedAt).toLocaleString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'}
          </td>
        </tr>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-600">Read-only analytics of approval work.</p>
        </div>
        <div className="flex items-center gap-3">
          {showApplicationTypeFilter && (
            <div className="flex items-center gap-2">
              <FiFilter className="text-blue-600" />
              <select
                value={applicationType || 'interview'}
                onChange={handleApplicationTypeChange}
                className="border border-gray-300 rounded-lg text-xs px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {applicationTypeOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <FiBarChart2 className="text-blue-600" />
            <select
              value={range}
              onChange={handleRangeChange}
              className="border border-gray-300 rounded-lg text-xs px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {rangeOptions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Applications"
          value={loading ? '…' : displayedStats.total}
          icon={FiBarChart2}
          color="bg-blue-500"
          subStats={displayedStats.showBreakdown ? [
            { label: 'Tutor', value: displayedStats.tutorCount },
            { label: 'Interview', value: displayedStats.interviewCount },
          ] : null}
        />
        <StatCard
          label="Approved"
          value={loading ? '…' : displayedStats.approved}
          icon={FiCheckCircle}
          color="bg-emerald-500"
          subStats={displayedStats.showBreakdown ? [
            { label: 'Tutor', value: displayedStats.approvedTutorCount },
            { label: 'Interview', value: displayedStats.approvedInterviewCount },
          ] : null}
        />
        <StatCard
          label="Rejected"
          value={loading ? '…' : displayedStats.rejected}
          icon={FiXCircle}
          color="bg-rose-500"
          subStats={displayedStats.showBreakdown ? [
            { label: 'Tutor', value: displayedStats.rejectedTutorCount },
            { label: 'Interview', value: displayedStats.rejectedInterviewCount },
          ] : null}
        />
        <StatCard
          label="Pending"
          value={loading ? '…' : displayedStats.pending}
          icon={FiClock}
          color="bg-amber-500"
          subStats={displayedStats.showBreakdown ? [
            { label: 'Tutor', value: displayedStats.pendingTutorCount },
            { label: 'Interview', value: displayedStats.pendingInterviewCount },
          ] : null}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-100 flex items-center justify-between px-4">
          <div className="flex gap-4 text-sm">
            {['approved', 'rejected', 'pending'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 border-b-2 -mb-px transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-700 font-medium'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            {safeLists[activeTab]?.length || 0} applications
          </p>
        </div>
        <div className="max-h-96 overflow-auto">
          {loading ? (
            <div className="p-6 text-sm text-gray-500">Loading activity…</div>
          ) : safeLists[activeTab]?.length ? (
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                <tr className="text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                  {renderTableHeaders()}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {safeLists[activeTab].map((item) => renderTableRow(item))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-sm text-gray-500">No activity for this range.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EmployeeActivity() {
  const [range, setRange] = useState('30d');
  const [applicationType, setApplicationType] = useState('interview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        setError('');
        const params = { range };
        if (applicationType) {
          params.applicationType = applicationType;
        }
        const res = await api.get('/api/employee/me/activity', { params });
        setData(res.data);
      } catch (e) {
        console.error('Failed to load activity', e);
        setError(e.response?.data?.message || 'Failed to load activity');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [range, applicationType]);

  const stats = data?.stats || { tutorStats: { total: 0 }, interviewStats: { total: 0 }, combinedStats: { total: 0, approved: 0, rejected: 0, pending: 0 } };
  const access = data?.access || { canTutor: false, canInterviewer: false, hasBothAccess: false };
  const lists = data?.lists || { approved: [], rejected: [], pending: [] };

  const handleRangeChange = (value) => {
    setRange(value);
  };

  const handleApplicationTypeChange = (value) => {
    setApplicationType(value);
  };

  return (
    <ActivityProfileView
      title="My Activity"
      loading={loading}
      error={error}
      stats={stats}
      access={access}
      lists={lists}
      range={range}
      applicationType={applicationType}
      onRangeChange={handleRangeChange}
      onApplicationTypeChange={handleApplicationTypeChange}
    />
  );
}

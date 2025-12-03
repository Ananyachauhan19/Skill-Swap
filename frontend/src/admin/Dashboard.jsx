import React, { useEffect, useState } from 'react';
import { BACKEND_URL } from '../config.js';

const numberFmt = (n) => (typeof n === 'number' ? n.toLocaleString() : '—');

const tabs = [
  { id: 'users', label: 'Users' },
  { id: 'experts', label: 'Experts' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'interviews', label: 'Interviews' },
];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${BACKEND_URL}/api/admin/stats`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load stats');
        const data = await res.json();
        if (!ignore) setStats(data.stats || null);
      } catch (e) {
        if (!ignore) setError(e.message || 'Error');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  const cardGroups = {
    users: [
      { label: 'Total Users', value: stats?.totalUsers },
      { label: 'Active Users', value: stats?.activeUsers },
      { label: 'Pending Users', value: stats?.pendingUsers },
    ],
    experts: [
      { label: 'Total Expert Applications', value: stats?.totalExperts },
      { label: 'Approved Experts', value: stats?.approvedExperts },
      { label: 'Pending Experts', value: stats?.pendingExperts },
      { label: 'Expert Users (Role)', value: stats?.expertUsers },
    ],
    sessions: [
      { label: 'Total Sessions', value: stats?.totalSessions },
      { label: 'Active Sessions', value: stats?.activeSessions },
      { label: 'Pending Sessions', value: stats?.pendingSessions },
    ],
    interviews: [
      { label: 'Total Interview Requests', value: stats?.totalInterviewRequests },
      { label: 'Pending Interview Requests', value: stats?.pendingInterviewRequests },
      { label: 'Assigned Interview Requests', value: stats?.assignedInterviewRequests },
    ],
  };

  const currentCards = cardGroups[activeTab] || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard Overview</h1>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Array.isArray(tabs) && tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition border ${
              activeTab === t.id
                ? 'bg-blue-600 text-white border-blue-600 shadow'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.isArray(currentCards) && currentCards.map(c => (
          <div key={c.label} className="p-4 rounded-lg bg-white border border-gray-100 shadow-sm flex flex-col">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{c.label}</p>
            <p className="mt-2 text-2xl font-bold text-blue-700">{loading ? '…' : numberFmt(c.value)}</p>
          </div>
        ))}
        {!loading && (!Array.isArray(currentCards) || currentCards.length === 0) && (
          <div className="p-4 rounded-lg bg-white border border-gray-100 shadow-sm text-sm text-gray-600">No data for this tab.</div>
        )}
      </div>

      <div className="p-4 rounded-lg bg-white border border-gray-100 shadow-sm text-xs text-gray-600">
        Charts & trend analysis are located in <a href="/admin/analytics" className="text-blue-600 underline">Analytics</a>.
      </div>
    </div>
  );
};

export default Dashboard;

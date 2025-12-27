import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { FiBarChart2, FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';

const rangeOptions = [
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
  { id: '365d', label: 'Last year' },
  { id: 'all', label: 'All time' },
];

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
    <div className={`p-3 rounded-full ${color}`}>
      <Icon className="text-white" size={20} />
    </div>
  </div>
);

export default function EmployeeActivityProfile() {
  const { employeeId } = useParams();
  const [range, setRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('approved');

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await axios.get(`${BACKEND_URL}/api/admin/employees/${employeeId}/activity`, {
          params: { range },
          withCredentials: true,
        });
        setData(res.data);
      } catch (e) {
        console.error('Failed to load employee activity', e);
        setError(e.response?.data?.message || 'Failed to load employee activity');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) {
      fetchActivity();
    }
  }, [employeeId, range]);

  const totals = data?.totals || { received: 0, approved: 0, rejected: 0, pending: 0 };
  const lists = data?.lists || { approved: [], rejected: [], pending: [] };
  const employee = data?.employee;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Activity</h1>
          {employee && (
            <p className="text-sm text-gray-600">
              {employee.name} • ID: <span className="font-mono">{employee.employeeId}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <FiBarChart2 className="text-blue-600" />
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Applications Touched" value={loading ? '…' : totals.received} icon={FiBarChart2} color="bg-blue-500" />
        <StatCard label="Approved" value={loading ? '…' : totals.approved} icon={FiCheckCircle} color="bg-emerald-500" />
        <StatCard label="Rejected" value={loading ? '…' : totals.rejected} icon={FiXCircle} color="bg-rose-500" />
        <StatCard label="Pending" value={loading ? '…' : totals.pending} icon={FiClock} color="bg-amber-500" />
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
            {lists[activeTab]?.length || 0} applications
          </p>
        </div>
        <div className="max-h-96 overflow-auto">
          {loading ? (
            <div className="p-6 text-sm text-gray-500">Loading activity…</div>
          ) : lists[activeTab]?.length ? (
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                <tr className="text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">User</th>
                  <th className="px-4 py-2.5">Class / Subject</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lists[activeTab].map((item) => (
                  <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-800">
                      <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                        {item.type === 'tutor' ? 'Tutor' : 'Interviewer'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-700">
                      {item.user
                        ? `${item.user.firstName || ''} ${item.user.lastName || ''}`.trim() || item.user.username || item.user.email
                        : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {item.class || item.subject
                        ? [item.class, item.subject].filter(Boolean).join(' • ')
                        : '—'}
                    </td>
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
                      {item.submittedAt
                        ? new Date(item.submittedAt).toLocaleString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))}
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

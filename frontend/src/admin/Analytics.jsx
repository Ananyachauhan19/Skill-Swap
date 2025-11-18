import React, { useEffect, useState } from 'react';
import { BACKEND_URL } from '../config.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, BarElement, LineElement, ArcElement, Tooltip, Legend);

const periods = [
  { label: 'Week', range: 'week' },
  { label: 'Month', range: 'month' },
  { label: 'Year', range: 'year' },
  { label: '14d', range: 'custom' },
];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [range, setRange] = useState('week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true); setError(null);
      const params = new URLSearchParams();
      if (range && range !== 'custom') params.append('range', range);
      if (startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      }
      const url = `${BACKEND_URL}/api/admin/analytics${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed');
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [range]);

  // Auto refresh every 60s if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => { fetchData(); }, 60000);
    return () => clearInterval(id);
  }, [autoRefresh, range, startDate, endDate]);

  const userDaily = data?.userDaily || [];
  const sessionDaily = data?.sessionDaily || [];
  const interviewDaily = data?.interviewDaily || [];
  const roleDistribution = data?.roleDistribution || [];

  const userLine = {
    labels: userDaily.map(d => d.date.slice(5)),
    datasets: [{ label: 'New Users', data: userDaily.map(d => d.count), borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.3)', tension: 0.3, fill: true }],
  };
  const sessionBar = {
    labels: sessionDaily.map(d => d.date.slice(5)),
    datasets: [{ label: 'Sessions', data: sessionDaily.map(d => d.count), backgroundColor: '#10b981' }],
  };
  const interviewBar = {
    labels: interviewDaily.map(d => d.date.slice(5)),
    datasets: [
      { label: 'Pending', data: interviewDaily.map(d => d.pending), backgroundColor: '#f59e0b' },
      { label: 'Assigned', data: interviewDaily.map(d => d.assigned), backgroundColor: '#6366f1' },
    ],
  };
  const rolePie = {
    labels: roleDistribution.map(r => r.role),
    datasets: [{ label: 'Users', data: roleDistribution.map(r => r.count), backgroundColor: ['#3b82f6', '#10b981', '#6366f1'] }],
  };

  const applyCustomRange = () => {
    if (!startDate || !endDate) return alert('Select both start and end dates');
    setRange('custom');
    fetchData();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Analytics</h1>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      {/* Period selectors */}
      <div className="flex flex-wrap gap-2 items-center" id="range">
        {periods.map(p => (
          <button
            key={p.range}
            onClick={() => { setStartDate(''); setEndDate(''); setRange(p.range); }}
            className={'px-3 py-2 text-sm rounded-md border transition ' + (range === p.range ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50')}
          >{p.label}</button>
        ))}
        <div className="flex items-center gap-2 ml-auto">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-2 py-1 text-sm border rounded" />
          <span className="text-gray-500">to</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-2 py-1 text-sm border rounded" />
          <button onClick={applyCustomRange} className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700">Apply</button>
          <button
            onClick={() => fetchData()}
            className="px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
            title="Manual refresh"
          >Refresh</button>
          <label className="flex items-center gap-1 text-xs text-gray-600">
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} /> Auto
          </label>
        </div>
      </div>
      {data?.meta && (
        <div className="text-xs text-gray-500">Range: {data.meta.start} → {data.meta.end} • Days: {data.meta.days}</div>
      )}

      {/* Charts */}
      <div className="grid gap-6 xl:grid-cols-2">
        <div id="user-growth" className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
          <h2 className="text-sm font-medium text-gray-700 mb-2">User Growth</h2>
          {loading ? <div className="text-xs text-gray-400">Loading…</div> : <Line data={userLine} options={{ plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />}
        </div>
        <div id="sessions" className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
          <h2 className="text-sm font-medium text-gray-700 mb-2">Sessions Created</h2>
          {loading ? <div className="text-xs text-gray-400">Loading…</div> : <Bar data={sessionBar} options={{ scales: { y: { beginAtZero: true } } }} />}
        </div>
        <div id="interviews" className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
          <h2 className="text-sm font-medium text-gray-700 mb-2">Interview Requests (Pending vs Assigned)</h2>
          {loading ? <div className="text-xs text-gray-400">Loading…</div> : <Bar data={interviewBar} options={{ scales: { y: { beginAtZero: true } } }} />}
        </div>
        <div id="roles" className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
          <h2 className="text-sm font-medium text-gray-700 mb-2">Role Distribution</h2>
          {loading ? <div className="text-xs text-gray-400">Loading…</div> : <Doughnut data={rolePie} />}
        </div>
      </div>
    </div>
  );
}

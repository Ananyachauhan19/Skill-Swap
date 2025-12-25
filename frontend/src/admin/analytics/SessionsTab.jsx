import React, { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { BACKEND_URL } from '../../config';
import { LoadingSpinner, commonChartOptions, lineChartColors } from './chartConfig.jsx';

export default function SessionsTab({ dateRange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange.range !== 'custom') {
        params.append('range', dateRange.range);
      } else if (dateRange.startDate && dateRange.endDate) {
        params.append('startDate', dateRange.startDate);
        params.append('endDate', dateRange.endDate);
      }
      
      const res = await fetch(`${BACKEND_URL}/api/admin/analytics/sessions?${params.toString()}`, {
        credentials: 'include'
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch sessions data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const sessionsOverTimeData = {
    labels: data?.sessionsOverTime?.map(d => d.date.slice(5)) || [],
    datasets: [{
      label: 'One-on-One Sessions',
      data: data?.sessionsOverTime?.map(d => d.count) || [],
      borderColor: lineChartColors.purple.border,
      backgroundColor: lineChartColors.purple.background,
      tension: 0.4,
      fill: true,
      pointRadius: 3,
      pointHoverRadius: 5,
      borderWidth: 2
    }]
  };

  const roleBreakdownData = {
    labels: data?.roleBreakdown?.map(d => d.date.slice(5)) || [],
    datasets: [
      {
        label: 'As Student',
        data: data?.roleBreakdown?.map(d => d.asStudent) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderWidth: 0
      },
      {
        label: 'As Tutor',
        data: data?.roleBreakdown?.map(d => d.asTutor) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderWidth: 0
      }
    ]
  };

  const statusData = {
    labels: data?.statusBreakdown?.map(s => s._id) || [],
    datasets: [{
      label: 'Sessions',
      data: data?.statusBreakdown?.map(s => s.count) || [],
      backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(239, 68, 68, 0.8)', 'rgba(245, 158, 11, 0.8)'],
      borderWidth: 0
    }]
  };

  const durationData = {
    labels: data?.durationDistribution?.map(d => d.range) || [],
    datasets: [{
      label: 'Sessions',
      data: data?.durationDistribution?.map(d => d.count) || [],
      backgroundColor: 'rgba(139, 92, 246, 0.8)',
      borderWidth: 0
    }]
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10"></div>
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-90">Total Sessions</div>
            <div className="text-4xl font-extrabold mt-2">{data?.summary?.total || 0}</div>
            <div className="text-xs opacity-75 mt-1">📚 All sessions</div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10"></div>
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-90">Completed</div>
            <div className="text-4xl font-extrabold mt-2">{data?.summary?.completed || 0}</div>
            <div className="text-xs opacity-75 mt-1">✅ Finished</div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10"></div>
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-90">Avg Duration</div>
            <div className="text-4xl font-extrabold mt-2">{data?.summary?.avgDuration || 0}<span className="text-2xl">m</span></div>
            <div className="text-xs opacity-75 mt-1">⏱️ Per session</div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10"></div>
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-90">Completion Rate</div>
            <div className="text-4xl font-extrabold mt-2">{data?.summary?.completionRate || 0}%</div>
            <div className="text-xs opacity-75 mt-1">🎯 Success rate</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow xl:col-span-2">
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-900">One-on-One Sessions Over Time</h3>
            <p className="text-xs text-gray-500 mt-0.5">Daily session activity</p>
          </div>
          <div className="h-64">
            <Line data={sessionsOverTimeData} options={{ ...commonChartOptions, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-900">Sessions by Role</h3>
            <p className="text-xs text-gray-500 mt-0.5">Student vs tutor participation</p>
          </div>
          <div className="h-64">
            <Bar data={roleBreakdownData} options={{ ...commonChartOptions, maintainAspectRatio: false, scales: { ...commonChartOptions.scales, y: { ...commonChartOptions.scales.y, stacked: true }, x: { ...commonChartOptions.scales.x, stacked: true } } }} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-900">Session Status Breakdown</h3>
            <p className="text-xs text-gray-500 mt-0.5">Completion metrics</p>
          </div>
          <div className="h-64">
            <Bar data={statusData} options={{ ...commonChartOptions, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow xl:col-span-2">
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-900">Session Duration Distribution</h3>
            <p className="text-xs text-gray-500 mt-0.5">Length of sessions</p>
          </div>
          <div className="h-64">
            <Bar data={durationData} options={{ ...commonChartOptions, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
    </div>
  );
}

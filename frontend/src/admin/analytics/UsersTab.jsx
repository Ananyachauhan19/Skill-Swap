import React, { useEffect, useState } from 'react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { BACKEND_URL } from '../../config';
import { LoadingSpinner, commonChartOptions, lineChartColors } from './chartConfig';

export default function UsersTab({ dateRange }) {
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
      
      const res = await fetch(`${BACKEND_URL}/api/admin/analytics/users?${params.toString()}`, {
        credentials: 'include'
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch users data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const registrationData = {
    labels: data?.registrations?.map(d => d.date.slice(5)) || [],
    datasets: [{
      label: 'New Registrations',
      data: data?.registrations?.map(d => d.count) || [],
      borderColor: lineChartColors.blue.border,
      backgroundColor: lineChartColors.blue.background,
      tension: 0.4,
      fill: true,
      pointRadius: 3,
      pointHoverRadius: 5,
      borderWidth: 2
    }]
  };

  const roleData = {
    labels: data?.roleDistribution?.map(r => r._id ? (r._id.charAt(0).toUpperCase() + r._id.slice(1)) : 'Unknown') || [],
    datasets: [{
      label: 'Users by Role',
      data: data?.roleDistribution?.map(r => r.count) || [],
      backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(139, 92, 246, 0.8)'],
      borderWidth: 0
    }]
  };

  const activityData = {
    labels: ['Daily Active', 'Weekly Active', 'Monthly Active', 'Inactive'],
    datasets: [{
      label: 'User Activity',
      data: [
        data?.activityFrequency?.find(f => f.frequency === 'Daily')?.count || 0,
        data?.activityFrequency?.find(f => f.frequency === 'Weekly')?.count || 0,
        data?.activityFrequency?.find(f => f.frequency === 'Monthly')?.count || 0,
        data?.activityFrequency?.find(f => f.frequency === 'Inactive')?.count || 0
      ],
      backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(239, 68, 68, 0.8)'],
      borderWidth: 0
    }]
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10"></div>
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-90">Total Users</div>
            <div className="text-4xl font-extrabold mt-2">{data?.summary?.total || 0}</div>
            <div className="text-xs opacity-75 mt-1">👥 All time</div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10"></div>
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-90">New This Period</div>
            <div className="text-4xl font-extrabold mt-2">{data?.summary?.newUsers || 0}</div>
            <div className="text-xs opacity-75 mt-1">📈 Growth</div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10"></div>
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-90">Active Users</div>
            <div className="text-4xl font-extrabold mt-2">{data?.summary?.activeUsers || 0}</div>
            <div className="text-xs opacity-75 mt-1">⚡ Engaged</div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10"></div>
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-90">Retention Rate</div>
            <div className="text-4xl font-extrabold mt-2">{data?.summary?.retentionRate || 0}%</div>
            <div className="text-xs opacity-75 mt-1">🎯 Loyalty</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow xl:col-span-2">
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-900">New User Registrations Over Time</h3>
            <p className="text-xs text-gray-500 mt-0.5">Daily registration trends</p>
          </div>
          <div className="h-64">
            <Line data={registrationData} options={{ ...commonChartOptions, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-900">User Roles Distribution</h3>
            <p className="text-xs text-gray-500 mt-0.5">Role breakdown across platform</p>
          </div>
          <div className="h-64">
            <Doughnut data={roleData} options={{ ...commonChartOptions, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-900">User Activity Frequency</h3>
            <p className="text-xs text-gray-500 mt-0.5">Engagement levels</p>
          </div>
          <div className="h-64">
            <Bar data={activityData} options={{ ...commonChartOptions, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
    </div>
  );
}

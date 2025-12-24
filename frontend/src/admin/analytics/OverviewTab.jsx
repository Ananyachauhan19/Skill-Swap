import React, { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { BACKEND_URL } from '../../config';

export default function OverviewTab({ dateRange }) {
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
      
      const res = await fetch(`${BACKEND_URL}/api/admin/analytics/overview?${params.toString()}`, {
        credentials: 'include'
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading overview data...</p>
        </div>
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: { size: 11, weight: '500' }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          font: { size: 11 },
          color: '#6b7280'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: { size: 11 },
          color: '#6b7280'
        }
      }
    }
  };

  const userGrowthData = {
    labels: data?.userGrowth?.map(d => d.date.slice(5)) || [],
    datasets: [{
      label: 'New Users',
      data: data?.userGrowth?.map(d => d.count) || [],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.15)',
      tension: 0.4,
      fill: true,
      pointRadius: 3,
      pointHoverRadius: 5,
      borderWidth: 2
    }]
  };

  const activeUsersData = {
    labels: ['Active', 'Inactive'],
    datasets: [{
      label: 'Users',
      data: [data?.activeVsInactive?.active || 0, data?.activeVsInactive?.inactive || 0],
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderWidth: 0
    }]
  };

  const activityTrendData = {
    labels: data?.activityTrends?.map(d => d.date.slice(5)) || [],
    datasets: [
      {
        label: 'Sessions',
        data: data?.activityTrends?.map(d => d.sessions) || [],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2
      },
      {
        label: 'Interviews',
        data: data?.activityTrends?.map(d => d.interviews) || [],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2
      }
    ]
  };

  const reportsData = {
    labels: ['Resolved', 'Unresolved'],
    datasets: [{
      label: 'Reports',
      data: [data?.reports?.resolved || 0, data?.reports?.unresolved || 0],
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderWidth: 0
    }]
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10"></div>
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-90">Total Users</div>
            <div className="text-4xl font-extrabold mt-2">{data?.summary?.totalUsers || 0}</div>
            <div className="text-xs opacity-75 mt-1">📊 Platform reach</div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10"></div>
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-90">Total Sessions</div>
            <div className="text-4xl font-extrabold mt-2">{data?.summary?.totalSessions || 0}</div>
            <div className="text-xs opacity-75 mt-1">📚 Learning activities</div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10"></div>
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-90">Total Interviews</div>
            <div className="text-4xl font-extrabold mt-2">{data?.summary?.totalInterviews || 0}</div>
            <div className="text-xs opacity-75 mt-1">💼 Career prep</div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10"></div>
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-90">Active Users</div>
            <div className="text-4xl font-extrabold mt-2">{data?.summary?.activeUsers || 0}</div>
            <div className="text-xs opacity-75 mt-1">⚡ Currently online</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-900">User Growth Over Time</h3>
            <p className="text-xs text-gray-500 mt-0.5">Daily new user registrations</p>
          </div>
          <div className="h-64">
            <Line data={userGrowthData} options={{ ...chartOptions, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-900">Active vs Inactive Users</h3>
            <p className="text-xs text-gray-500 mt-0.5">User engagement distribution</p>
          </div>
          <div className="h-64">
            <Bar data={activeUsersData} options={{ ...chartOptions, maintainAspectRatio: false, indexAxis: 'y' }} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-900">Sessions & Interviews Trend</h3>
            <p className="text-xs text-gray-500 mt-0.5">Platform activity over time</p>
          </div>
          <div className="h-64">
            <Line data={activityTrendData} options={{ ...chartOptions, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-900">Reports Status</h3>
            <p className="text-xs text-gray-500 mt-0.5">Resolution breakdown</p>
          </div>
          <div className="h-64">
            <Bar data={reportsData} options={{ ...chartOptions, maintainAspectRatio: false, indexAxis: 'y' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

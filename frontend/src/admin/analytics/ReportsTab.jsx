import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { BACKEND_URL } from '../../config';

export default function ReportsTab({ dateRange }) {
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
      
      const res = await fetch(`${BACKEND_URL}/api/admin/analytics/reports?${params.toString()}`, {
        credentials: 'include'
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading reports analytics...</div>;
  }

  const reportsOverTimeData = {
    labels: data?.reportsOverTime?.map(d => d.date.slice(5)) || [],
    datasets: [{
      label: 'Reports',
      data: data?.reportsOverTime?.map(d => d.count) || [],
      backgroundColor: '#ef4444'
    }]
  };

  const resolutionStatusData = {
    labels: ['Resolved', 'Unresolved', 'In Progress'],
    datasets: [{
      label: 'Reports',
      data: [
        data?.resolutionStatus?.resolved || 0,
        data?.resolutionStatus?.unresolved || 0,
        data?.resolutionStatus?.inProgress || 0
      ],
      backgroundColor: ['#10b981', '#ef4444', '#f59e0b']
    }]
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Total Reports</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{data?.summary?.total || 0}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Resolved</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{data?.summary?.resolved || 0}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Unresolved</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{data?.summary?.unresolved || 0}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Resolution Rate</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{data?.summary?.resolutionRate || 0}%</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Reports Over Time</h3>
          <Bar data={reportsOverTimeData} options={{ 
            responsive: true, 
            maintainAspectRatio: true,
            scales: { y: { beginAtZero: true } } 
          }} />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Resolved vs Unresolved Reports</h3>
          <Bar data={resolutionStatusData} options={{ 
            responsive: true, 
            maintainAspectRatio: true,
            scales: { y: { beginAtZero: true } } 
          }} />
        </div>

        {/* Users with Frequent Reports */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm xl:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Users with Frequent Reports or Low Ratings</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reports Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.problematicUsers?.map((user) => (
                  <tr key={user._id} className={user.reportCount >= 5 || user.avgRating < 2 ? 'bg-red-50' : user.reportCount >= 3 || user.avgRating < 3 ? 'bg-yellow-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.reportCount >= 5 ? 'bg-red-100 text-red-800' : 
                        user.reportCount >= 3 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.reportCount} reports
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-sm font-semibold ${
                          user.avgRating < 2 ? 'text-red-600' : 
                          user.avgRating < 3 ? 'text-yellow-600' : 
                          'text-green-600'
                        }`}>
                          {user.avgRating ? user.avgRating.toFixed(1) : 'N/A'} ⭐
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.reportCount >= 5 || user.avgRating < 2 ? 'bg-red-100 text-red-800' : 
                        user.reportCount >= 3 || user.avgRating < 3 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.reportCount >= 5 || user.avgRating < 2 ? 'Critical' : 
                         user.reportCount >= 3 || user.avgRating < 3 ? 'Warning' : 
                         'Normal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

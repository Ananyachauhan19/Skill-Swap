import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { BACKEND_URL } from '../../config';

export default function SkillsTab({ dateRange }) {
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
      
      const res = await fetch(`${BACKEND_URL}/api/admin/analytics/skills?${params.toString()}`, {
        credentials: 'include'
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch skills data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading skills analytics...</div>;
  }

  const mostRequestedData = {
    labels: data?.mostRequested?.map(s => s.skill) || [],
    datasets: [{
      label: 'Requests',
      data: data?.mostRequested?.map(s => s.count) || [],
      backgroundColor: '#3b82f6'
    }]
  };

  const leastUsedData = {
    labels: data?.leastUsed?.map(s => s.skill) || [],
    datasets: [{
      label: 'Sessions',
      data: data?.leastUsed?.map(s => s.count) || [],
      backgroundColor: '#ef4444'
    }]
  };

  const completionRateData = {
    labels: data?.completionRate?.map(s => s.skill) || [],
    datasets: [
      {
        label: 'Completed',
        data: data?.completionRate?.map(s => s.completed) || [],
        backgroundColor: '#10b981'
      },
      {
        label: 'Incomplete',
        data: data?.completionRate?.map(s => s.incomplete) || [],
        backgroundColor: '#f59e0b'
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Total Skills</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{data?.summary?.totalSkills || 0}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Active Skills</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{data?.summary?.activeSkills || 0}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Avg Completion Rate</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{data?.summary?.avgCompletionRate || 0}%</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Most Popular</div>
          <div className="text-xl font-bold text-purple-600 mt-1 truncate">{data?.summary?.mostPopular || 'N/A'}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm xl:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Most Requested Skills (Top 15)</h3>
          <Bar data={mostRequestedData} options={{ 
            responsive: true, 
            maintainAspectRatio: true, 
            indexAxis: 'y',
            scales: { x: { beginAtZero: true } } 
          }} />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm xl:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Least Used Skills (Bottom 10)</h3>
          <Bar data={leastUsedData} options={{ 
            responsive: true, 
            maintainAspectRatio: true,
            scales: { y: { beginAtZero: true } } 
          }} />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm xl:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Skill-wise Session Completion Rate</h3>
          <Bar data={completionRateData} options={{ 
            responsive: true, 
            maintainAspectRatio: true,
            scales: { 
              x: { stacked: true },
              y: { stacked: true, beginAtZero: true } 
            } 
          }} />
        </div>
      </div>
    </div>
  );
}

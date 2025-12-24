import React, { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { BACKEND_URL } from '../../config';

export default function RewardsTab({ dateRange }) {
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
      
      const res = await fetch(`${BACKEND_URL}/api/admin/analytics/rewards?${params.toString()}`, {
        credentials: 'include'
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch rewards data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading rewards analytics...</div>;
  }

  const coinsDistributionData = {
    labels: ['Silver Coins', 'Gold Coins'],
    datasets: [{
      label: 'Total Coins',
      data: [
        data?.coinsDistribution?.silver || 0,
        data?.coinsDistribution?.gold || 0
      ],
      backgroundColor: ['#94a3b8', '#f59e0b']
    }]
  };

  const coinsOverTimeData = {
    labels: data?.coinsOverTime?.map(d => d.date.slice(5)) || [],
    datasets: [
      {
        label: 'Silver Coins',
        data: data?.coinsOverTime?.map(d => d.silver) || [],
        borderColor: '#94a3b8',
        backgroundColor: 'rgba(148, 163, 184, 0.2)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Gold Coins',
        data: data?.coinsOverTime?.map(d => d.gold) || [],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Total Silver Coins</div>
          <div className="text-2xl font-bold text-gray-400 mt-1">{data?.summary?.totalSilver || 0}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Total Gold Coins</div>
          <div className="text-2xl font-bold text-amber-500 mt-1">{data?.summary?.totalGold || 0}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Active Earners</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{data?.summary?.activeEarners || 0}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Avg Per User</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">{data?.summary?.avgPerUser || 0}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Silver vs Gold Coins Distribution</h3>
          <Bar data={coinsDistributionData} options={{ 
            responsive: true, 
            maintainAspectRatio: true,
            scales: { y: { beginAtZero: true } } 
          }} />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">SkillCoins Earned Over Time</h3>
          <Line data={coinsOverTimeData} options={{ 
            responsive: true, 
            maintainAspectRatio: true,
            scales: { y: { beginAtZero: true } } 
          }} />
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm xl:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top SkillCoin Earners</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Silver Coins</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gold Coins</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.leaderboard?.map((user, index) => (
                  <tr key={user._id} className={index < 3 ? 'bg-amber-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {index === 0 && <span className="text-2xl mr-2">🥇</span>}
                        {index === 1 && <span className="text-2xl mr-2">🥈</span>}
                        {index === 2 && <span className="text-2xl mr-2">🥉</span>}
                        <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{user.silver}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-amber-600 font-semibold">{user.gold}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">{user.total}</span>
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

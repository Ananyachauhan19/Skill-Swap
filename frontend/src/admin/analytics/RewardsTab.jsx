import React, { useEffect, useState } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
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

  if (loading || !data) {
    return <div className="text-center py-8 text-gray-500">Loading rewards analytics...</div>;
  }


  const { 
    economyHealth, 
    silverGoldBalance, 
    earningTrend, 
    earningSources,
    topEarners,
    concentration,
    engagementCorrelation,
    abuseDetection,
    inactiveCoinHolders,
    retentionImpact
  } = data;

  // Economy Health Donut Chart
  const economyHealthData = {
    labels: ['Earning Coins', 'Non-Earners'],
    datasets: [{
      data: [economyHealth.totalEarners, economyHealth.nonEarners],
      backgroundColor: ['rgba(34, 197, 94, 0.7)', 'rgba(239, 68, 68, 0.5)'],
      borderColor: ['rgba(34, 197, 94, 1)', 'rgba(239, 68, 68, 1)'],
      borderWidth: 1,
    }]
  };

  // Earning Trend Chart
  const trendData = {
    labels: earningTrend.map(item => item.date.slice(5)),
    datasets: [
      {
        label: 'Silver Earned',
        data: earningTrend.map(item => item.silver),
        borderColor: 'rgba(192, 192, 192, 1)',
        backgroundColor: 'rgba(192, 192, 192, 0.1)',
        tension: 0.3,
      },
      {
        label: 'Gold Earned',
        data: earningTrend.map(item => item.gold),
        borderColor: 'rgba(255, 215, 0, 1)',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        tension: 0.3,
      },
    ],
  };

  // Earning Sources Chart
  const sourcesData = {
    labels: ['Sessions', 'Interviews', 'Teaching', 'Contributions'],
    datasets: [{
      label: 'Activities',
      data: [earningSources.sessions, earningSources.interviews, earningSources.teaching, earningSources.contributions],
      backgroundColor: [
        'rgba(59, 130, 246, 0.7)',
        'rgba(139, 92, 246, 0.7)',
        'rgba(34, 197, 94, 0.7)',
        'rgba(249, 115, 22, 0.7)'
      ],
      borderWidth: 1,
    }]
  };

  // Concentration Chart
  const concentrationData = {
    labels: ['Top 1%', 'Top 5%', 'Top 10%', 'Remaining'],
    datasets: [{
      data: [
        concentration.top1PercentShare,
        concentration.top5PercentShare - concentration.top1PercentShare,
        concentration.top10PercentShare - concentration.top5PercentShare,
        concentration.remainingUsersShare
      ],
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(249, 115, 22, 0.7)',
        'rgba(234, 179, 8, 0.7)',
        'rgba(34, 197, 94, 0.5)'
      ],
      borderWidth: 1,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Economy Health Overview */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">Economy Health Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{economyHealth.percentageEarningCoins}%</div>
            <div className="text-xs text-gray-500">Users Earning Coins</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-600">{economyHealth.percentageOnlySilver}%</div>
            <div className="text-xs text-gray-500">Silver Only</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{economyHealth.percentageEarningGold}%</div>
            <div className="text-xs text-gray-500">Earning Gold</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{economyHealth.totalEarners}</div>
            <div className="text-xs text-gray-500">Total Earners</div>
          </div>
          <div className="h-32 flex items-center justify-center">
            <Doughnut data={economyHealthData} options={{ ...chartOptions, maintainAspectRatio: true }} />
          </div>
        </div>
      </div>

      {/* 2. Silver vs Gold Balance + 3. Earning Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Silver vs Gold Balance</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Silver</span>
              <span className="font-bold text-gray-700">{silverGoldBalance.totalSilver.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Gold</span>
              <span className="font-bold text-yellow-600">{silverGoldBalance.totalGold.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Silver:Gold Ratio</span>
              <span className="font-bold text-blue-600">{silverGoldBalance.ratio}:1</span>
            </div>
            <div className="h-px bg-gray-200 my-2"></div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Silver/User</span>
              <span className="font-semibold">{silverGoldBalance.avgSilverPerUser}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Gold/User</span>
              <span className="font-semibold text-yellow-600">{silverGoldBalance.avgGoldPerUser}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Earning Rate Trend</h3>
          <div className="h-44">
            <Line data={trendData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* 4. Earning Sources + 6. Concentration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Earning Source Breakdown</h3>
          <div className="h-44">
            <Bar data={sourcesData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Concentration & Fairness</h3>
          <div className="flex items-center gap-4">
            <div className="h-44 w-44">
              <Doughnut data={concentrationData} options={chartOptions} />
            </div>
            <div className="flex-1 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-red-600">Top 1% holds</span>
                <span className="font-bold">{concentration.top1PercentShare}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-600">Top 5% holds</span>
                <span className="font-bold">{concentration.top5PercentShare}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-600">Top 10% holds</span>
                <span className="font-bold">{concentration.top10PercentShare}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">Remaining holds</span>
                <span className="font-bold">{concentration.remainingUsersShare}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Engagement vs Rewards Correlation */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">Engagement vs Rewards Correlation</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{engagementCorrelation.sessionsCompleted}</div>
            <div className="text-xs text-gray-500">Sessions Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{engagementCorrelation.interviewsCompleted}</div>
            <div className="text-xs text-gray-500">Interviews Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{engagementCorrelation.coinsEarned}</div>
            <div className="text-xs text-gray-500">Coins Earned</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">{engagementCorrelation.coinsPerSession}</div>
            <div className="text-xs text-gray-500">Coins/Session</div>
          </div>
        </div>
      </div>

      {/* 5. Top Earners Enhanced + 8. Abuse Detection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Top Earners Analysis</h3>
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-2 py-2 text-left font-medium text-gray-500">#</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-500">Name</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-500">Total</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-500">Rate/Day</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-500">Source</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-500">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topEarners.map((user, idx) => (
                  <tr key={user._id} className={`${user.highRateFlag ? 'bg-yellow-50' : ''} ${idx < 3 ? 'font-semibold' : ''}`}>
                    <td className="px-2 py-2">{idx + 1}</td>
                    <td className="px-2 py-2 truncate max-w-[100px]" title={user.name}>{user.name}</td>
                    <td className="px-2 py-2">{user.total}</td>
                    <td className="px-2 py-2">
                      {user.earnRate}
                      {user.highRateFlag && <span className="ml-1 text-red-500">⚠</span>}
                    </td>
                    <td className="px-2 py-2">{user.primarySource}</td>
                    <td className="px-2 py-2 text-gray-500">{user.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            Abuse & Anomaly Detection
            {abuseDetection.totalFlagged > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                {abuseDetection.totalFlagged} flagged
              </span>
            )}
          </h3>
          {abuseDetection.totalFlagged === 0 ? (
            <div className="flex items-center justify-center h-32 text-green-600">
              <div className="text-center">
                <div className="text-4xl mb-2">✓</div>
                <div className="text-sm">No suspicious activity detected</div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-80">
              <table className="min-w-full text-xs">
                <thead className="bg-red-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">Name</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">Avg/Day</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">Sessions</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {abuseDetection.suspiciousUsers.map((user) => (
                    <tr key={user.userId} className="hover:bg-red-50">
                      <td className="px-2 py-2 truncate max-w-[120px]" title={user.name}>{user.name}</td>
                      <td className="px-2 py-2 font-bold text-red-600">{user.avgDailyCoins}</td>
                      <td className="px-2 py-2">{user.sessionsCompleted}</td>
                      <td className="px-2 py-2 text-xs text-red-700">{user.flag}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 9. Inactive Holders + 10. Retention Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Inactive Coin Holders (30+ Days)</h3>
          {inactiveCoinHolders.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-green-600">
              <div className="text-center">
                <div className="text-sm">All coin holders are active</div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-80">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium text-gray-500">Name</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-500">Coins</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-500">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inactiveCoinHolders.map((user) => (
                    <tr key={user.userId}>
                      <td className="px-2 py-2 truncate max-w-[150px]" title={user.name}>{user.name}</td>
                      <td className="px-2 py-2 font-semibold">{user.coins}</td>
                      <td className="px-2 py-2 text-gray-500">{user.lastActive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Retention Impact</h3>
          <div className="space-y-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Users WITH Coins</span>
                <span className="text-2xl font-bold text-green-600">{retentionImpact.retentionRateWithCoins}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${retentionImpact.retentionRateWithCoins}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {retentionImpact.usersWithCoinsActive} active / {retentionImpact.usersWithCoinsTotal} total
              </div>
            </div>

            <div className="p-3 bg-red-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Users WITHOUT Coins</span>
                <span className="text-2xl font-bold text-red-600">{retentionImpact.retentionRateWithoutCoins}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full" 
                  style={{ width: `${retentionImpact.retentionRateWithoutCoins}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {retentionImpact.usersWithoutCoinsActive} active / {retentionImpact.usersWithoutCoinsTotal} total
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <div className="text-xs text-gray-600">Retention Difference</div>
              <div className="text-3xl font-bold text-blue-600">
                +{retentionImpact.retentionRateWithCoins - retentionImpact.retentionRateWithoutCoins}%
              </div>
              <div className="text-xs text-gray-500">Higher with gamification</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
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

  // 1. Session Activity Trend - completed vs cancelled
  const sessionTrendData = {
    labels: data?.sessionsOverTime?.map(d => d.date.slice(5)) || [],
    datasets: [
      {
        label: 'Completed',
        data: data?.sessionsOverTime?.map(d => d.completed) || [],
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        borderWidth: 2
      },
      {
        label: 'Rejected',
        data: data?.sessionsOverTime?.map(d => d.rejected) || [],
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        borderWidth: 2
      }
    ]
  };

  // 2. Role Participation
  const roleParticipationData = {
    labels: ['As Student', 'As Tutor'],
    datasets: [{
      label: 'Sessions',
      data: [
        data?.roleParticipation?.asStudent || 0,
        data?.roleParticipation?.asTutor || 0
      ],
      backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)']
    }]
  };

  // 3. Lifecycle Funnel
  const lifecycleFunnelData = {
    labels: data?.lifecycleFunnel?.map(s => s.stage) || [],
    datasets: [{
      label: 'Sessions',
      data: data?.lifecycleFunnel?.map(s => s.count) || [],
      backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(239, 68, 68, 0.8)']
    }]
  };

  // 5. Duration Quality
  const durationQualityData = {
    labels: data?.durationQuality?.distribution?.map(d => d.range) || [],
    datasets: [{
      label: 'Sessions',
      data: data?.durationQuality?.distribution?.map(d => d.count) || [],
      backgroundColor: 'rgba(139, 92, 246, 0.8)'
    }]
  };

  // 6. Repeat Behavior
  const repeatBehaviorData = {
    labels: ['One-Time', 'Repeat (Same Tutor)', 'Repeat (Different Tutors)'],
    datasets: [{
      data: [
        data?.repeatBehavior?.oneTime || 0,
        data?.repeatBehavior?.repeatSame || 0,
        data?.repeatBehavior?.repeatDifferent || 0
      ],
      backgroundColor: ['rgba(156, 163, 175, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(59, 130, 246, 0.8)']
    }]
  };

  // 7. Time Patterns
  const hourCounts = Array(24).fill(0);
  data?.timePatterns?.forEach(p => {
    hourCounts[p._id.hour] += p.count;
  });
  const timePatternData = {
    labels: hourCounts.map((_, i) => `${i}:00`),
    datasets: [{
      label: 'Sessions',
      data: hourCounts,
      backgroundColor: 'rgba(59, 130, 246, 0.8)'
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

      {/* Session Quality & Behavior Insights */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-xl border border-purple-100">
        <h2 className="text-lg font-bold mb-4 text-gray-900 flex items-center">
          <span className="mr-2">📊</span> Session Quality & Behavior Insights
        </h2>

        {/* Activity Trend + Lifecycle Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold mb-3 text-gray-800">Session Activity Trend</h3>
            <div className="h-44">
              <Line 
                data={sessionTrendData} 
                options={{ 
                  ...commonChartOptions,
                  maintainAspectRatio: false,
                  scales: { y: { beginAtZero: true } },
                  plugins: { 
                    legend: { 
                      position: 'bottom', 
                      labels: { boxWidth: 10, font: { size: 10 }, padding: 8 } 
                    } 
                  }
                }} 
              />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold mb-3 text-gray-800">Session Lifecycle Funnel</h3>
            <div className="h-44">
              <Bar 
                data={lifecycleFunnelData} 
                options={{ 
                  ...commonChartOptions,
                  maintainAspectRatio: false,
                  indexAxis: 'y',
                  scales: { x: { beginAtZero: true } },
                  plugins: { legend: { display: false } }
                }} 
              />
            </div>
          </div>
        </div>

        {/* Reliability Metrics + Role Participation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold mb-3 text-gray-800">Session Reliability Metrics</h3>
            <div className="space-y-3 py-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Completion Rate:</span>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-green-600">{data?.reliabilityMetrics?.completionRate || 0}%</span>
                  <span className={`ml-2 text-sm ${data?.reliabilityMetrics?.completionTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data?.reliabilityMetrics?.completionTrend >= 0 ? '↑' : '↓'} {Math.abs(data?.reliabilityMetrics?.completionTrend || 0)}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Rejection Rate:</span>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-orange-600">{data?.reliabilityMetrics?.cancellationRate || 0}%</span>
                  <span className={`ml-2 text-sm ${data?.reliabilityMetrics?.cancellationTrend <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data?.reliabilityMetrics?.cancellationTrend >= 0 ? '↑' : '↓'} {Math.abs(data?.reliabilityMetrics?.cancellationTrend || 0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold mb-3 text-gray-800">Role Participation Balance</h3>
            <div className="h-44">
              <Bar 
                data={roleParticipationData} 
                options={{ 
                  ...commonChartOptions,
                  maintainAspectRatio: false,
                  scales: { y: { beginAtZero: true } },
                  plugins: { legend: { display: false } }
                }} 
              />
            </div>
          </div>
        </div>

        {/* Duration Quality + Repeat Behavior */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold mb-3 text-gray-800">Session Duration Quality</h3>
            <div className="mb-2 text-xs text-gray-600">
              Short sessions (&lt;15min): <span className="font-bold text-orange-600">{data?.durationQuality?.shortSessions || 0}</span>
            </div>
            <div className="h-36">
              <Bar 
                data={durationQualityData} 
                options={{ 
                  ...commonChartOptions,
                  maintainAspectRatio: false,
                  scales: { y: { beginAtZero: true } },
                  plugins: { legend: { display: false } }
                }} 
              />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold mb-3 text-gray-800">Repeat Session Behavior</h3>
            <div className="h-44">
              <Doughnut 
                data={repeatBehaviorData} 
                options={{ 
                  ...commonChartOptions,
                  maintainAspectRatio: false,
                  plugins: { 
                    legend: { 
                      position: 'bottom', 
                      labels: { boxWidth: 10, font: { size: 10 }, padding: 8 } 
                    } 
                  }
                }} 
              />
            </div>
          </div>
        </div>

        {/* Time Patterns + Tutor Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold mb-3 text-gray-800">Peak Session Hours (UTC)</h3>
            <div className="h-44">
              <Bar 
                data={timePatternData} 
                options={{ 
                  ...commonChartOptions,
                  maintainAspectRatio: false,
                  scales: { y: { beginAtZero: true } },
                  plugins: { legend: { display: false } }
                }} 
              />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold mb-3 text-gray-800">Tutor Performance (Aggregated)</h3>
            <div className="space-y-3 py-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Avg Completion Rate:</span>
                <span className="text-2xl font-bold text-green-600">{data?.tutorPerformance?.avgCompletionRate || 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Avg Session Duration:</span>
                <span className="text-2xl font-bold text-indigo-600">{data?.tutorPerformance?.avgSessionDuration || 0}m</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Avg Rejection Rate:</span>
                <span className="text-2xl font-bold text-orange-600">{data?.tutorPerformance?.avgCancellationRate || 0}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Session Risk Alerts */}
        <div className="bg-white rounded-lg p-4 border border-red-200 shadow-sm">
          <h3 className="text-sm font-semibold mb-3 text-gray-800 flex items-center">
            <span className="mr-2">⚠️</span> Session Risk & Alerts
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">Tutors with High Rejection (40%+)</div>
              <div className="text-3xl font-bold text-orange-600">{data?.sessionRiskAlerts?.tutorsWithHighCancellation || 0}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">Students with High No-Show (40%+)</div>
              <div className="text-3xl font-bold text-red-600">{data?.sessionRiskAlerts?.studentsWithHighNoShow || 0}</div>
            </div>
            <div className="text-center border-l pl-4">
              <div className="text-xs text-gray-700 font-semibold mb-1">Total At Risk</div>
              <div className="text-4xl font-bold text-red-700">{data?.sessionRiskAlerts?.totalAtRisk || 0}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

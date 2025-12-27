import React, { useEffect, useState } from 'react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { BACKEND_URL } from '../../config';
import { LoadingSpinner, commonChartOptions, lineChartColors } from './chartConfig.jsx';

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

  // Behavioral Insights Data
  const roleEngagementData = {
    labels: data?.roleEngagement?.map(r => r.role) || [],
    datasets: [
      {
        label: 'Sessions Attended',
        data: data?.roleEngagement?.map(r => r.sessionsAttended) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)'
      },
      {
        label: 'Sessions Conducted',
        data: data?.roleEngagement?.map(r => r.sessionsConducted) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.8)'
      },
      {
        label: 'Interviews Requested',
        data: data?.roleEngagement?.map(r => r.interviewsRequested) || [],
        backgroundColor: 'rgba(245, 158, 11, 0.8)'
      },
      {
        label: 'Interviews Conducted',
        data: data?.roleEngagement?.map(r => r.interviewsConducted) || [],
        backgroundColor: 'rgba(139, 92, 246, 0.8)'
      }
    ]
  };

  const funnelData = {
    labels: data?.conversionFunnel?.map(s => s.stage) || [],
    datasets: [{
      label: 'Users',
      data: data?.conversionFunnel?.map(s => s.count) || [],
      backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(239, 68, 68, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(236, 72, 153, 0.8)']
    }]
  };

  const segmentationData = {
    labels: ['No Activity', 'One-Time', 'Repeat', 'Power Users'],
    datasets: [{
      data: [
        data?.userSegmentation?.noActivity || 0,
        data?.userSegmentation?.oneTime || 0,
        data?.userSegmentation?.repeat || 0,
        data?.userSegmentation?.power || 0
      ],
      backgroundColor: ['rgba(156, 163, 175, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)']
    }]
  };

  const transitionsData = {
    labels: ['Student  Tutor', 'Tutor  Interviewer'],
    datasets: [{
      label: 'Transitions',
      data: [
        data?.roleTransitions?.studentToTutor || 0,
        data?.roleTransitions?.tutorToInterviewer || 0
      ],
      backgroundColor: 'rgba(139, 92, 246, 0.8)'
    }]
  };

  const hourCounts = Array(24).fill(0);
  data?.timePatterns?.forEach(p => {
    hourCounts[p._id.hour] += p.count;
  });
  const timePatternData = {
    labels: hourCounts.map((_, i) => `${i}:00`),
    datasets: [{
      label: 'Activity',
      data: hourCounts,
      backgroundColor: 'rgba(59, 130, 246, 0.8)'
    }]
  };

  const reliabilityData = {
    labels: data?.reliabilityMetrics?.map(r => r.role) || [],
    datasets: [
      {
        label: 'Completion (%)',
        data: data?.reliabilityMetrics?.map(r => r.completionRate) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.8)'
      },
      {
        label: 'Cancellation (%)',
        data: data?.reliabilityMetrics?.map(r => r.cancellationRate) || [],
        backgroundColor: 'rgba(245, 158, 11, 0.8)'
      },
      {
        label: 'No-Show (%)',
        data: data?.reliabilityMetrics?.map(r => r.noShowRate) || [],
        backgroundColor: 'rgba(239, 68, 68, 0.8)'
      }
    ]
  };

  const newVsEstData = {
    labels: ['New (<7d)', 'Established'],
    datasets: [
      {
        label: 'Sessions',
        data: [
          data?.newVsEstablished?.newUsers?.sessions || 0,
          data?.newVsEstablished?.established?.sessions || 0
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.8)'
      },
      {
        label: 'Cancel Rate (%)',
        data: [
          data?.newVsEstablished?.newUsers?.cancellationRate || 0,
          data?.newVsEstablished?.established?.cancellationRate || 0
        ],
        backgroundColor: 'rgba(245, 158, 11, 0.8)'
      }
    ]
  };

  // Original Charts Data
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

      {/* Behavioral Insights Section */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-5 rounded-xl border border-purple-100">
        <h2 className="text-lg font-bold mb-4 text-gray-900 flex items-center">
          <span className="mr-2">🔍</span> Behavioral Insights
        </h2>
        
        {/* Role Engagement + Conversion Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold mb-3 text-gray-800">Role Engagement Matrix</h3>
            <div className="h-48">
              <Bar 
                data={roleEngagementData} 
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
            <h3 className="text-sm font-semibold mb-3 text-gray-800">User Conversion Funnel</h3>
            <div className="h-48">
              <Bar 
                data={funnelData} 
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

        {/* User Segmentation + Role Transitions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold mb-3 text-gray-800">Repeat vs One-Time Users</h3>
            <div className="h-48">
              <Doughnut 
                data={segmentationData} 
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
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold mb-3 text-gray-800">Cross-Role Transitions</h3>
            <div className="h-48">
              <Bar 
                data={transitionsData} 
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

        {/* Time Patterns + Reliability */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold mb-3 text-gray-800">Peak Activity Hours (UTC)</h3>
            <div className="h-48">
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
            <h3 className="text-sm font-semibold mb-3 text-gray-800">User Reliability by Role</h3>
            <div className="h-48">
              <Bar 
                data={reliabilityData} 
                options={{ 
                  ...commonChartOptions,
                  maintainAspectRatio: false,
                  scales: { y: { beginAtZero: true, max: 100 } },
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

        {/* New vs Established + Churn Risk */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold mb-3 text-gray-800">New vs Established Behavior</h3>
            <div className="h-48">
              <Bar 
                data={newVsEstData} 
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
            <h3 className="text-sm font-semibold mb-3 text-gray-800">Churn Risk Indicators</h3>
            <div className="space-y-4 py-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Inactive 14+ Days:</span>
                <span className="text-2xl font-bold text-orange-600">{data?.churnRisk?.inactiveUsers || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">High Cancellation (50%+):</span>
                <span className="text-2xl font-bold text-red-600">{data?.churnRisk?.highCancellationUsers || 0}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-3">
                <span className="text-sm font-semibold text-gray-800">Total At Risk:</span>
                <span className="text-3xl font-bold text-red-700">{data?.churnRisk?.totalAtRisk || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Original Charts */}
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

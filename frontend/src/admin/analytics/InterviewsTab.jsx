import React, { useEffect, useState } from 'react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { BACKEND_URL } from '../../config';
import { LoadingSpinner, commonChartOptions, lineChartColors } from './chartConfig.jsx';

export default function InterviewsTab({ dateRange }) {
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
      
      const res = await fetch(`${BACKEND_URL}/api/admin/analytics/interviews?${params.toString()}`, {
        credentials: 'include'
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch interviews data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // 1. Interview Activity Trend - scheduled, completed, expired, rejected
  const interviewTrendData = {
    labels: data?.interviewsOverTime?.map(d => d.date.slice(5)) || [],
    datasets: [
      {
        label: 'Completed',
        data: data?.interviewsOverTime?.map(d => d.completed) || [],
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        borderWidth: 2
      },
      {
        label: 'Scheduled',
        data: data?.interviewsOverTime?.map(d => d.scheduled) || [],
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        borderWidth: 2
      },
      {
        label: 'Expired (Auto)',
        data: data?.interviewsOverTime?.map(d => d.expired) || [],
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        borderWidth: 2
      },
      {
        label: 'Rejected',
        data: data?.interviewsOverTime?.map(d => d.rejected) || [],
        borderColor: 'rgba(245, 158, 11, 1)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        borderWidth: 2
      },
    ]
  };

  // 2. Participation Breakdown
  const participationData = {
    labels: ['As Requester', 'As Interviewer'],
    datasets: [{
      label: 'Participation',
      data: [
        data?.participation?.asRequester || 0,
        data?.participation?.asInterviewer || 0
      ],
      backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)']
    }]
  };

  // 3. Lifecycle Funnel
  const lifecycleFunnelData = {
    labels: data?.lifecycleFunnel?.map(s => s.stage) || [],
    datasets: [{
      label: 'Interviews',
      data: data?.lifecycleFunnel?.map(s => s.count) || [],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',   // Requested
        'rgba(16, 185, 129, 0.8)',   // Assigned
        'rgba(245, 158, 11, 0.8)',   // Scheduled
        'rgba(139, 92, 246, 0.8)',   // Conducted
        'rgba(34, 197, 94, 0.8)',    // Completed
        'rgba(239, 68, 68, 0.8)',    // Expired (Auto)
        'rgba(220, 38, 38, 0.8)',    // Rejected
      ]
    }]
  };

  // 4. Rating Distribution
  const ratingDistributionData = {
    labels: data?.ratingDistribution?.map(r => `${r.rating} ⭐`) || [],
    datasets: [{
      label: 'Interviews',
      data: data?.ratingDistribution?.map(r => r.count) || [],
      backgroundColor: 'rgba(245, 158, 11, 0.8)'
    }]
  };

  // Rating Trend
  const ratingTrendData = {
    labels: data?.ratingTrend?.map(d => d.date.slice(5)) || [],
    datasets: [{
      label: 'Avg Rating',
      data: data?.ratingTrend?.map(d => d.avgRating) || [],
      borderColor: 'rgba(245, 158, 11, 1)',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      tension: 0.4,
      fill: true,
      pointRadius: 2,
      borderWidth: 2
    }]
  };

  // 6. Duration Analysis
  const durationData = {
    labels: data?.durationAnalysis?.map(d => d.range) || [],
    datasets: [{
      label: 'Interviews',
      data: data?.durationAnalysis?.map(d => d.count) || [],
      backgroundColor: 'rgba(139, 92, 246, 0.8)'
    }]
  };

  // 7. Approval Pipeline
  const approvalPipelineData = {
    labels: data?.approvalPipeline?.map(s => s.stage) || [],
    datasets: [{
      label: 'Interviewers',
      data: data?.approvalPipeline?.map(s => s.count) || [],
      backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(34, 197, 94, 0.8)']
    }]
  };

  // 8. Repeat Behavior
  const repeatBehaviorData = {
    labels: ['One-Time Requesters', 'Repeat Requesters', 'One-Time Interviewers', 'Repeat Interviewers'],
    datasets: [{
      data: [
        data?.repeatBehavior?.requesters?.oneTime || 0,
        data?.repeatBehavior?.requesters?.repeat || 0,
        data?.repeatBehavior?.interviewers?.oneTime || 0,
        data?.repeatBehavior?.interviewers?.repeat || 0
      ],
      backgroundColor: ['rgba(156, 163, 175, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(203, 213, 225, 0.8)', 'rgba(16, 185, 129, 0.8)']
    }]
  };

  // 9. Time Patterns
  const hourCounts = Array(24).fill(0);
  data?.timePatterns?.forEach(p => {
    hourCounts[p._id.hour] += p.count;
  });
  const timePatternData = {
    labels: hourCounts.map((_, i) => `${i}:00`),
    datasets: [{
      label: 'Interviews',
      data: hourCounts,
      backgroundColor: 'rgba(59, 130, 246, 0.8)'
    }]
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10"></div>
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-90">Total Interviews</div>
            <div className="text-4xl font-extrabold mt-2">{data?.summary?.total || 0}</div>
            <div className="text-xs opacity-75 mt-1">💼 All requests</div>
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
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10"></div>
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-90">Scheduled</div>
            <div className="text-4xl font-extrabold mt-2">{data?.summary?.scheduled || 0}</div>
            <div className="text-xs opacity-75 mt-1">📅 Upcoming</div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10"></div>
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-90">Avg Rating</div>
            <div className="text-4xl font-extrabold mt-2">{data?.summary?.avgRating || 0} ⭐</div>
            <div className="text-xs opacity-75 mt-1">📈 Quality score</div>
          </div>
        </div>
      </div>

      {/* Interview Quality & Pipeline Health Insights */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-5 rounded-xl border border-amber-100">
        <h2 className="text-lg font-bold mb-4 text-gray-900 flex items-center">
          <span className="mr-2">🎯</span> Interview Quality & Pipeline Health
        </h2>

        {/* Activity Trend + Lifecycle Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold mb-3 text-gray-800">Interview Activity Trend</h3>
            <div className="h-44">
              <Line 
                data={interviewTrendData} 
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
            <h3 className="text-sm font-semibold mb-3 text-gray-800">Interview Lifecycle Funnel</h3>
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

        {/* Participation + Reliability */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold mb-3 text-gray-800">Interview Participation Balance</h3>
            <div className="h-44">
              <Bar 
                data={participationData} 
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
            <h3 className="text-sm font-semibold mb-3 text-gray-800">Interviewer Reliability Signals</h3>
            <div className="space-y-2 py-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Avg Completion Rate:</span>
                <span className={`text-xl font-bold ${data?.reliabilitySignals?.avgCompletionRate >= 70 ? 'text-green-600' : 'text-orange-600'}`}>
                  {data?.reliabilitySignals?.avgCompletionRate || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Avg Expiry Rate (Auto):</span>
                <span className={`text-xl font-bold ${data?.reliabilitySignals?.avgExpiryRate <= 15 ? 'text-green-600' : 'text-red-600'}`}>
                  {data?.reliabilitySignals?.avgExpiryRate || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Avg Rejection Rate:</span>
                <span className={`text-xl font-bold ${data?.reliabilitySignals?.avgRejectionRate <= 20 ? 'text-green-600' : 'text-orange-600'}`}>
                  {data?.reliabilitySignals?.avgRejectionRate || 0}%
                </span>
              </div>
            
            </div>
          </div>
        </div>

        {/* Rating Distribution + Rating Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold mb-3 text-gray-800">Interview Quality Ratings</h3>
            <div className="h-44">
              <Bar 
                data={ratingDistributionData} 
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
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold mb-3 text-gray-800">Rating Trend Over Time</h3>
            <div className="h-44">
              <Line 
                data={ratingTrendData} 
                options={{ 
                  ...commonChartOptions,
                  maintainAspectRatio: false,
                  scales: { y: { beginAtZero: true, max: 5 } },
                  plugins: { legend: { display: false } }
                }} 
              />
            </div>
          </div>
        </div>

        {/* Duration + Approval Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold mb-3 text-gray-800">Interview Duration Distribution</h3>
            <div className="h-44">
              <Bar 
                data={durationData} 
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
            <h3 className="text-sm font-semibold mb-3 text-gray-800">Interviewer Approval Pipeline</h3>
            <div className="h-44">
              <Bar 
                data={approvalPipelineData} 
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

        {/* Repeat Behavior + Time Patterns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold mb-3 text-gray-800">Repeat Interview Behavior</h3>
            <div className="h-44">
              <Doughnut 
                data={repeatBehaviorData} 
                options={{ 
                  ...commonChartOptions,
                  maintainAspectRatio: false,
                  plugins: { 
                    legend: { 
                      position: 'bottom', 
                      labels: { boxWidth: 10, font: { size: 9 }, padding: 6 } 
                    } 
                  }
                }} 
              />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold mb-3 text-gray-800">Peak Interview Hours (UTC)</h3>
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
        </div>

        {/* Interview Risk Alerts */}
        <div className="bg-white rounded-lg p-4 border border-red-200 shadow-sm">
          <h3 className="text-sm font-semibold mb-3 text-gray-800 flex items-center">
            <span className="mr-2">⚠️</span> Interview Risk & Alerts
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">Interviewers High Expiry (30%+)</div>
              <div className="text-2xl font-bold text-red-600">{data?.interviewRiskAlerts?.interviewersWithHighExpiry || 0}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">Interviewers High Rejection (30%+)</div>
              <div className="text-2xl font-bold text-orange-600">{data?.interviewRiskAlerts?.interviewersWithHighRejection || 0}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">Requesters High Expiry (30%+)</div>
              <div className="text-2xl font-bold text-red-600">{data?.interviewRiskAlerts?.requestersWithHighExpiry || 0}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">Requesters High Rejection (30%+)</div>
              <div className="text-2xl font-bold text-orange-600">{data?.interviewRiskAlerts?.requestersWithHighRejection || 0}</div>
            </div>
            <div className="text-center border-l pl-4">
              <div className="text-xs text-gray-700 font-semibold mb-1">Total At Risk</div>
              <div className="text-3xl font-bold text-red-700">{data?.interviewRiskAlerts?.totalAtRisk || 0}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

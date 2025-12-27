import React, { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { BACKEND_URL } from '../../config';
import { FiTrendingUp, FiTrendingDown, FiAlertCircle, FiCheckCircle, FiClock, FiActivity } from 'react-icons/fi';
import socket from '../../socket';

export default function OverviewTab({ dateRange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);
  const [sessionsData, setSessionsData] = useState(null);
  const [interviewsData, setInterviewsData] = useState(null);
  const [visitorData, setVisitorData] = useState(null);
  const [activeWindow, setActiveWindow] = useState('DAU');

  useEffect(() => {
    fetchData();
  }, [dateRange]);
  
  // Lightweight real-time refresh using sockets + polling
  useEffect(() => {
    const handleOnlineStatusChange = () => {
      // Silent refresh so UI doesn't flash loading state
      fetchData(true);
    };

    socket.on('user-online-status-changed', handleOnlineStatusChange);

    const intervalId = setInterval(() => {
      fetchData(true);
    }, 60000); // refresh every 60s

    return () => {
      socket.off('user-online-status-changed', handleOnlineStatusChange);
      clearInterval(intervalId);
    };
  }, [dateRange]);


  const fetchData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      const params = new URLSearchParams();
      if (dateRange.range !== 'custom') {
        params.append('range', dateRange.range);
      } else if (dateRange.startDate && dateRange.endDate) {
        params.append('startDate', dateRange.startDate);
        params.append('endDate', dateRange.endDate);
      }

      const query = params.toString();

      const [overviewRes, sessionsRes, visitorsRes, interviewsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/admin/analytics/overview?${query}`, {
          credentials: 'include'
        }),
        fetch(`${BACKEND_URL}/api/admin/analytics/sessions?${query}`, {
          credentials: 'include'
        }),
        fetch(`${BACKEND_URL}/api/admin/analytics/visitors?${query}`, {
          credentials: 'include'
        }),
        fetch(`${BACKEND_URL}/api/admin/analytics/interviews?${query}`, {
          credentials: 'include'
        })
      ]);

      const [overviewJson, sessionsJson, visitorsJson, interviewsJson] = await Promise.all([
        overviewRes.json(),
        sessionsRes.json(),
        visitorsRes.json(),
        interviewsRes.json()
      ]);

      if (overviewRes.ok) {
        setData(overviewJson);
        generateInsights(overviewJson);
      }

      if (sessionsRes.ok) {
        setSessionsData(sessionsJson);
      }

      if (visitorsRes.ok) {
        setVisitorData(visitorsJson);
      }

      if (interviewsRes.ok) {
        setInterviewsData(interviewsJson);
      }
    } catch (error) {
      console.error('Failed to fetch overview analytics data:', error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const generateInsights = (analyticsData) => {
    const insightsList = [];
    
    // Activity peak detection
    if (analyticsData?.activityTrends?.length > 0) {
      const maxActivity = Math.max(...analyticsData.activityTrends.map(d => d.sessions + d.interviews));
      const peakDay = analyticsData.activityTrends.find(d => (d.sessions + d.interviews) === maxActivity);
      if (peakDay) {
        insightsList.push(`🔥 Activity peaked on ${peakDay.date}`);
      }
    }
    
    // User engagement
    if (analyticsData?.activeVsInactive) {
      const activeRatio = Math.round((analyticsData.activeVsInactive.active / 
        (analyticsData.activeVsInactive.active + analyticsData.activeVsInactive.inactive)) * 100);
      insightsList.push(`⚡ ${activeRatio}% of users are actively engaged`);
    }
    
    // Reports resolution
    if (analyticsData?.reports) {
      const resolutionRate = analyticsData.reports.resolved / 
        (analyticsData.reports.resolved + analyticsData.reports.unresolved) * 100;
      if (resolutionRate > 80) {
        insightsList.push(`✅ High report resolution rate: ${Math.round(resolutionRate)}%`);
      } else if (resolutionRate < 50) {
        insightsList.push(`⚠️ Low report resolution rate: ${Math.round(resolutionRate)}%`);
      }
    }

    // DAU / MAU stickiness insight
    if (analyticsData?.activeUserAnalytics?.dau && analyticsData.activeUserAnalytics.mau) {
      const { dau, mau } = analyticsData.activeUserAnalytics;
      if (mau > 0) {
        const stickiness = Math.round((dau / mau) * 100);
        let label = 'needs improvement';
        if (stickiness >= 60) label = 'excellent stickiness';
        else if (stickiness >= 40) label = 'healthy stickiness';

        insightsList.push(`📌 DAU is ${stickiness}% of MAU – ${label}`);
      }
    }
    
    setInsights(insightsList);
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
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 10,
          font: { size: 10, weight: '500' }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: 10,
        cornerRadius: 6,
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 11 }
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
          font: { size: 10 },
          color: '#6b7280',
          padding: 6
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: { size: 10 },
          color: '#6b7280',
          padding: 6
        }
      }
    }
  };

  const activityTrendData = {
    labels: data?.activityTrends?.map(d => d.date.slice(5)) || [],
    datasets: [
      {
        label: 'Sessions',
        data: data?.activityTrends?.map(d => d.sessions) || [],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.3,
        fill: true,
        pointRadius: 2,
        borderWidth: 2
      },
      {
        label: 'Interviews',
        data: data?.activityTrends?.map(d => d.interviews) || [],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.3,
        fill: true,
        pointRadius: 2,
        borderWidth: 2
      }
    ]
  };

  const engagementRatio = data?.activeVsInactive ? 
    (data.activeVsInactive.active / (data.activeVsInactive.active + data.activeVsInactive.inactive)) * 100 : 0;

  // Derived metrics from additional analytics endpoints
  const completionRate = sessionsData?.summary?.completionRate ?? null;
  const totalSessions = sessionsData?.summary?.total || 0;
  const cancelledSessions = sessionsData?.statusBreakdown?.find(s => s._id === 'cancelled')?.count || 0;
  const cancellationRate = totalSessions > 0 ? Math.round((cancelledSessions / totalSessions) * 100) : 0;

  const avgResponseHours = interviewsData?.summary?.avgResponseTimeHours ?? null;

   const dau = data?.activeUserAnalytics?.dau ?? null;
   const wau = data?.activeUserAnalytics?.wau ?? null;
   const mau = data?.activeUserAnalytics?.mau ?? null;
   const realtimeActive = data?.activeUserAnalytics?.realtime ?? null;

   const totalUsers = data?.summary?.totalUsers ?? 0;

   const activeWindowValue =
     activeWindow === 'DAU' ? dau : activeWindow === 'WAU' ? wau : mau;

   const activeWindowLabel =
     activeWindow === 'DAU' ? 'Daily Active Users' : activeWindow === 'WAU' ? 'Weekly Active Users' : 'Monthly Active Users';

  return (
    <div className="space-y-5">
      {/* Intelligent Insights Feed */}
      {insights.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <FiActivity className="text-blue-600" size={18} />
            <h3 className="text-sm font-bold text-gray-900">Platform Insights</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {insights.map((insight, idx) => (
              <div key={idx} className="bg-white px-3 py-2 rounded-lg text-xs font-medium text-gray-700 shadow-sm">
                {insight}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Platform Activity - Compact Combined Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="mb-3">
          <h3 className="text-sm font-bold text-gray-900">Platform Activity Patterns</h3>
          <p className="text-xs text-gray-500 mt-0.5">Combined sessions and interview trends</p>
        </div>
        <div className="h-48">
          <Line data={activityTrendData} options={chartOptions} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* User Engagement Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-4">User Engagement Distribution</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-600">Active Users</span>
                <span className="text-xs font-bold text-green-600">{data?.activeVsInactive?.active || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${engagementRatio}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-600">Dormant Users</span>
                <span className="text-xs font-bold text-gray-500">{data?.activeVsInactive?.inactive || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-gray-400 to-gray-500 h-2 rounded-full transition-all"
                  style={{ width: `${100 - engagementRatio}%` }}
                ></div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-600">
                <span className="font-semibold text-gray-900">{Math.round(engagementRatio)}%</span> engagement rate
              </div>
            </div>
          </div>
        </div>

        {/* Active Users (DAU/WAU/MAU + Realtime) */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Active Users</h3>
              <p className="text-xs text-gray-500 mt-0.5">DAU / WAU / MAU with realtime online users</p>
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-full p-1">
              {['DAU', 'WAU', 'MAU'].map((window) => (
                <button
                  key={window}
                  type="button"
                  onClick={() => setActiveWindow(window)}
                  className={`px-2 py-1 rounded-full text-[11px] font-medium transition ${
                    activeWindow === window
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {window}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-start">
            <div>
              <div className="text-[11px] font-medium text-gray-500 mb-1">{activeWindowLabel}</div>
              <div className="text-3xl font-extrabold text-gray-900">
                {activeWindowValue != null ? activeWindowValue : '--'}
              </div>
              <div className="mt-2 text-[11px] text-gray-500">
                {totalUsers > 0 && activeWindowValue != null ? (
                  <>
                    <span className="font-semibold text-gray-900">
                      {Math.round((activeWindowValue / totalUsers) * 100)}%
                    </span>{' '}
                    of total registered users
                  </>
                ) : (
                  'No data yet'
                )}
              </div>
            </div>

            <div className="border-l border-gray-100 pl-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-gray-600 flex items-center gap-1">
                  <FiActivity className="text-green-500" size={12} />
                  Realtime Active (≈ last 10 min)
                </span>
                <span className="text-sm font-semibold text-green-600">
                  {realtimeActive != null ? realtimeActive : '--'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-1.5 rounded-full transition-all"
                  style={{
                    width:
                      totalUsers > 0 && realtimeActive != null
                        ? `${Math.min(100, Math.round((realtimeActive / totalUsers) * 100))}%`
                        : '0%',
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
                <span>Share of total user base</span>
                <span>
                  {totalUsers > 0 && realtimeActive != null
                    ? `${Math.round((realtimeActive / totalUsers) * 100)}%`
                    : '--%'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust & Safety + Visitor Analytics (Anonymous) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Trust & Safety */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Trust & Safety</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Resolved Reports</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${(data?.reports?.resolved / (data?.reports?.resolved + data?.reports?.unresolved + 0.01)) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs font-bold text-green-600">{data?.reports?.resolved || 0}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Unresolved Reports</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${(data?.reports?.unresolved / (data?.reports?.resolved + data?.reports?.unresolved + 0.01)) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs font-bold text-red-600">{data?.reports?.unresolved || 0}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">Resolution Velocity</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                  {data?.reports?.resolved > data?.reports?.unresolved ? 'Fast' : 'Needs Attention'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Anonymous Visitor Analytics */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-2">Anonymous Visitor Analytics</h3>
          <p className="text-xs text-gray-500 mb-4">
            Non-logged-in visitors discovering and flowing through the platform within the selected period.
          </p>

          {/* Summary Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <div className="text-[11px] text-gray-500 mb-0.5">Total visitors</div>
              <div className="text-lg font-bold text-gray-900">
                {visitorData?.summary?.totalVisitors ?? '--'}
              </div>
              <div className="text-[11px] text-gray-500">
                {visitorData?.summary ? (
                  <div className="space-y-0.5">
                    <div>
                      <span className="text-green-600 font-semibold">
                        {visitorData.summary.activeVisitors || 0}
                      </span>{' '}
                      active ·{' '}
                      <span className="text-gray-400">
                        {visitorData.summary.inactiveVisitors || 0}
                      </span>{' '}
                      bounce
                    </div>
                    <div>
                      <span className="text-indigo-600 font-semibold">
                        {visitorData.summary.uniqueVisitors || 0}
                      </span>{' '}
                      unique visitors
                    </div>
                  </div>
                ) : (
                  'No data yet'
                )}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-gray-500 mb-0.5">Avg time spent</div>
              <div className="text-lg font-bold text-gray-900">
                {visitorData?.summary?.avgTimeSpentPerVisitor
                  ? `${visitorData.summary.avgTimeSpentPerVisitor}s`
                  : '--'}
              </div>
              <div className="text-[11px] text-gray-500">
                {visitorData?.summary
                  ? `${visitorData.summary.avgVisitsPerVisitor || 0} avg visits/visitor`
                  : 'No data'}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-gray-500 mb-0.5">Conversion rate</div>
              <div className="text-lg font-bold text-gray-900">
                {visitorData?.summary
                  ? `${visitorData.summary.conversionRate || 0}%`
                  : '--'}
              </div>
              <div className="text-[11px] text-gray-500">
                {visitorData?.summary
                  ? `${visitorData.summary.conversions || 0} visitors signed up`
                  : 'No conversions'}
              </div>
            </div>
          </div>

          {/* Anonymous DAU/WAU/MAU */}
          {visitorData?.activeAnonymous && (
            <div className="mb-4 pb-4 border-b border-gray-100">
              <div className="text-[11px] font-semibold text-gray-700 mb-2">
                Active Anonymous Users (not converted)
              </div>
              <div className="flex gap-4 text-xs">
                <div>
                  <span className="text-gray-500">DAU:</span>{' '}
                  <span className="font-bold text-gray-900">
                    {visitorData.activeAnonymous.dau || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">WAU:</span>{' '}
                  <span className="font-bold text-gray-900">
                    {visitorData.activeAnonymous.wau || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">MAU:</span>{' '}
                  <span className="font-bold text-gray-900">
                    {visitorData.activeAnonymous.mau || 0}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Two-column section: Landing Pages + Traffic Sources */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span>
                <span className="font-semibold text-gray-800">Top landing pages</span>
              </div>
              {visitorData?.topLandingPages?.length ? (
                <ul className="space-y-1.5">
                  {visitorData.topLandingPages.slice(0, 5).map((item) => (
                    <li key={item.path} className="flex justify-between gap-2">
                      <span className="truncate max-w-[65%] text-[11px]">{item.path}</span>
                      <span className="text-[11px] text-gray-500">
                        {item.views}v · {item.avgTimeSpent}s
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-gray-500 mt-1">No landing page data yet.</p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                <span className="font-semibold text-gray-800">Traffic sources</span>
              </div>
              {visitorData?.topReferrers?.length ? (
                <ul className="space-y-1.5">
                  {visitorData.topReferrers.slice(0, 5).map((item) => (
                    <li key={item.source} className="flex justify-between gap-2">
                      <span className="truncate max-w-[70%] text-[11px] capitalize">
                        {item.source.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] text-gray-500">{item.visitors}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-gray-500 mt-1">No referrer data yet.</p>
              )}
            </div>
          </div>

          {/* Conversion Funnel: Pages before signup */}
          {visitorData?.topPagesBeforeConversion?.length > 0 && (
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-pink-500"></span>
                <span className="font-semibold text-gray-800 text-xs">
                  Top pages before signup
                </span>
              </div>
              <ul className="space-y-1 text-xs">
                {visitorData.topPagesBeforeConversion.slice(0, 4).map((item) => (
                  <li key={item.path} className="flex justify-between gap-2">
                    <span className="truncate max-w-[70%] text-[11px]">{item.path}</span>
                    <span className="text-[11px] text-pink-600 font-semibold">
                      {item.conversions} →
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Anonymous Visitor Analytics */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4">🌐 User Base Snapshot</h3>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-gray-600 mb-1">Registered Users</div>
            <div className="text-2xl font-bold text-purple-700">
              {data?.summary?.totalUsers ?? '--'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Active (30 days)</div>
            <div className="text-2xl font-bold text-pink-700">
              {data?.activeVsInactive?.active ?? '--'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Engagement Rate</div>
            <div className="text-2xl font-bold text-indigo-700">
              {Number.isFinite(engagementRatio) ? `${Math.round(engagementRatio)}%` : '--%'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Inactive Users</div>
            <div className="text-2xl font-bold text-red-700">
              {data?.activeVsInactive?.inactive ?? '--'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

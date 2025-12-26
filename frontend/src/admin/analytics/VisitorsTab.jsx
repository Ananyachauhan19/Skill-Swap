import React, { useState, useEffect } from 'react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { BACKEND_URL } from '../../config';

export default function VisitorsTab({ dateRange }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const buildQueryParams = () => {
    const today = new Date();
    let start = new Date();
    
    if (dateRange.range === 'custom' && dateRange.startDate && dateRange.endDate) {
      console.log('[VisitorsTab] Using custom date range:', dateRange.startDate, 'to', dateRange.endDate);
      return `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
    }
    
    switch (dateRange.range) {
      case 'week':
        start.setDate(today.getDate() - 7);
        break;
      case 'month':
        start.setMonth(today.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(today.getFullYear() - 1);
        break;
      default:
        start.setDate(today.getDate() - 7);
    }
    
    const startStr = start.toISOString().split('T')[0];
    const endStr = today.toISOString().split('T')[0];
    console.log('[VisitorsTab] Using date range:', dateRange.range, '-', startStr, 'to', endStr);
    return `?startDate=${startStr}&endDate=${endStr}`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const queryParams = buildQueryParams();
      
      console.log('[VisitorsTab] Fetching visitor data with params:', queryParams);
      
      const [statsRes, analyticsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/visitors/stats${queryParams}`, {
          credentials: 'include',
        }),
        fetch(`${BACKEND_URL}/api/visitors/analytics${queryParams}`, {
          credentials: 'include',
        })
      ]);

      console.log('[VisitorsTab] Response status - stats:', statsRes.status, 'analytics:', analyticsRes.status);

      if (statsRes.ok && analyticsRes.ok) {
        const statsData = await statsRes.json();
        const analyticsData = await analyticsRes.json();
        
        console.log('[VisitorsTab] Stats data received:', JSON.stringify(statsData, null, 2));
        console.log('[VisitorsTab] Analytics data received:', JSON.stringify(analyticsData, null, 2));
        
        // Check if data has the expected structure
        if (statsData && typeof statsData === 'object') {
          console.log('[VisitorsTab] Stats keys:', Object.keys(statsData));
          console.log('[VisitorsTab] totalVisitors:', statsData.totalVisitors);
          console.log('[VisitorsTab] uniqueVisitors:', statsData.uniqueVisitors);
          console.log('[VisitorsTab] returningVisitors:', statsData.returningVisitors);
          console.log('[VisitorsTab] todayVisitors:', statsData.todayVisitors);
        }
        
        setStats(statsData);
        setAnalytics(analyticsData.analytics);
      } else {
        console.error('[VisitorsTab] Failed to fetch data - stats:', statsRes.status, 'analytics:', analyticsRes.status);
      }
    } catch (error) {
      console.error('[VisitorsTab] Failed to fetch visitor analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!stats || !analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No visitor data available</p>
        <p className="text-sm text-gray-400">Debug: stats={JSON.stringify(!!stats)}, analytics={JSON.stringify(!!analytics)}</p>
      </div>
    );
  }

  console.log('[VisitorsTab] Rendering with data:', { stats, analytics });

  // Prepare chart data
  console.log('[VisitorsTab] analytics.dailyVisitors:', analytics.dailyVisitors);
  console.log('[VisitorsTab] stats.deviceStats:', stats.deviceStats);
  console.log('[VisitorsTab] stats.browserStats:', stats.browserStats);
  
  const dailyVisitorsData = {
    labels: analytics.dailyVisitors?.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }) || [],
    datasets: [
      {
        label: 'Total Visitors',
        data: analytics.dailyVisitors?.map(d => d.count) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Unique Visitors',
        data: analytics.dailyVisitors?.map(d => d.uniqueCount) || [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ],
  };
  
  console.log('[VisitorsTab] Daily visitors chart labels:', dailyVisitorsData.labels);
  console.log('[VisitorsTab] Daily visitors chart data:', dailyVisitorsData.datasets[0].data);

  const deviceData = {
    labels: stats.deviceStats?.map(d => d._id || 'Unknown') || [],
    datasets: [{
      data: stats.deviceStats?.map(d => d.count) || [],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(251, 146, 60, 0.8)',
      ],
      borderWidth: 2,
      borderColor: '#fff',
    }],
  };

  const browserData = {
    labels: stats.browserStats?.map(d => d._id || 'Unknown') || [],
    datasets: [{
      label: 'Visitors',
      data: stats.browserStats?.map(d => d.count) || [],
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 1,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Visitors</p>
              <p className="text-3xl font-bold mt-2">{stats.totalVisitors || 0}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Unique Visitors</p>
              <p className="text-3xl font-bold mt-2">{stats.uniqueVisitors || 0}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <span className="text-2xl">✨</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Returning Visitors</p>
              <p className="text-3xl font-bold mt-2">{stats.returningVisitors || 0}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <span className="text-2xl">🔄</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Today's Visitors</p>
              <p className="text-3xl font-bold mt-2">{stats.todayVisitors || 0}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <span className="text-2xl">📅</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Visitors Trend */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Visitor Trends</h3>
        <div className="h-80">
          <Line data={dailyVisitorsData} options={chartOptions} />
        </div>
      </div>

      {/* Device and Browser Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Distribution</h3>
          <div className="h-64">
            <Doughnut data={deviceData} options={doughnutOptions} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Browsers</h3>
          <div className="h-64">
            <Bar data={browserData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Top Countries */}
      {stats.topCountries && stats.topCountries.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Countries</h3>
          <div className="space-y-3">
            {stats.topCountries.map((country, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {country._id || 'Unknown'}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-48 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(country.count / stats.totalVisitors) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                    {country.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

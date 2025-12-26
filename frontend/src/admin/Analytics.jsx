import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Import all tab components
import OverviewTab from './analytics/OverviewTab';
import UsersTab from './analytics/UsersTab';
import SessionsTab from './analytics/SessionsTab';
import InterviewsTab from './analytics/InterviewsTab';
import SkillsTab from './analytics/SkillsTab';
import RewardsTab from './analytics/RewardsTab';
import ReportsTab from './analytics/ReportsTab';
import VisitorsTab from './analytics/VisitorsTab';

ChartJS.register(CategoryScale, LinearScale, PointElement, BarElement, LineElement, ArcElement, Tooltip, Legend, Filler);

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    range: 'week',
    startDate: '',
    endDate: ''
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'visitors', label: 'Visitors', icon: '👀' },
    { id: 'sessions', label: 'Sessions', icon: '📚' },
    { id: 'interviews', label: 'Interviews', icon: '💼' },
    { id: 'skills', label: 'Skills', icon: '🎯' },
    { id: 'rewards', label: 'Rewards', icon: '🏆' },
    { id: 'reports', label: 'Reports', icon: '⚠️' }
  ];

  const handleRangeChange = (newRange) => {
    setDateRange({ ...dateRange, range: newRange, startDate: '', endDate: '' });
  };

  const handleCustomDateApply = () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      alert('Please select both start and end dates');
      return;
    }
    setDateRange({ ...dateRange, range: 'custom' });
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab dateRange={dateRange} />;
      case 'users':
        return <UsersTab dateRange={dateRange} />;
      case 'visitors':
        return <VisitorsTab dateRange={dateRange} />;
      case 'sessions':
        return <SessionsTab dateRange={dateRange} />;
      case 'interviews':
        return <InterviewsTab dateRange={dateRange} />;
      case 'skills':
        return <SkillsTab dateRange={dateRange} />;
      case 'rewards':
        return <RewardsTab dateRange={dateRange} />;
      case 'reports':
        return <ReportsTab dateRange={dateRange} />;
      default:
        return <OverviewTab dateRange={dateRange} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Analytics Dashboard</h1>
              <p className="text-xs text-gray-500 mt-0.5">Real-time platform insights and metrics</p>
            </div>
            
            {/* Compact Date Range in Header */}
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-gray-400 text-xs">to</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleCustomDateApply}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Compact Time Period Filters */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600 mr-1">Quick Filter:</span>
            <button
              onClick={() => handleRangeChange('week')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                dateRange.range === 'week'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Last Week
            </button>
            <button
              onClick={() => handleRangeChange('month')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                dateRange.range === 'month'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Last Month
            </button>
            <button
              onClick={() => handleRangeChange('year')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                dateRange.range === 'year'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Last Year
            </button>
          </div>
        </div>

        {/* Pill-Style Sticky Tabs */}
        <div className="max-w-[1400px] mx-auto px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold whitespace-nowrap rounded-full transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {renderActiveTab()}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiUsers,
  FiUserCheck,
  FiUserPlus,
  FiCalendar,
  FiPackage,
  FiHelpCircle,
  FiTrendingUp,
  FiArrowRight,
  FiFileText,
  FiFilter,
  FiEye,
} from 'react-icons/fi';
import { BACKEND_URL } from '../config';

const StatCard = ({ title, value, icon: Icon, change, color, link, subtitle }) => (
  <Link
    to={link}
    className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      {typeof change === 'number' && change !== 0 && (
        <div
          className={`flex items-center gap-1 text-sm font-medium ${
            change > 0 ? 'text-green-600' : 'text-red-600'
          }`}
        >
          <FiTrendingUp size={16} />
          <span>{Math.abs(change)}%</span>
        </div>
      )}
    </div>
    <div className="mb-1">
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
    {subtitle && <p className="text-xs text-gray-500 mb-1">{subtitle}</p>}
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-600">{title}</p>
      <FiArrowRight
        size={16}
        className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"
      />
    </div>
  </Link>
);

const NewDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingApplications: 0,
    pendingTutorApplications: 0,
    pendingInterviewerApplications: 0,
    totalInterviews: 0,
    pendingInterviews: 0,
    completedInterviews: 0,
    totalPackages: 0,
    helpRequests: 0,
    employeesHired: 0,
    pendingEmployeeApplications: 0,
    pendingReports: 0,
    totalVisitors: 0,
    uniqueVisitors: 0,
    // Trend data (percentage changes)
    usersTrend: 0,
    activeUsersTrend: 0,
    interviewsTrend: 0,
    completedInterviewsTrend: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('overall');
  const [customDateRange, setCustomDateRange] = useState({ startDate: '', endDate: '' });
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Build query parameters based on filter
        let queryParams = '';
        if (dateFilter === 'today') {
          const today = new Date().toISOString().split('T')[0];
          queryParams = `?startDate=${today}&endDate=${today}`;
        } else if (dateFilter === 'weekly') {
          const today = new Date();
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          queryParams = `?startDate=${weekAgo.toISOString().split('T')[0]}&endDate=${today.toISOString().split('T')[0]}`;
        } else if (dateFilter === 'monthly') {
          const today = new Date();
          const monthAgo = new Date(today);
          monthAgo.setMonth(today.getMonth() - 1);
          queryParams = `?startDate=${monthAgo.toISOString().split('T')[0]}&endDate=${today.toISOString().split('T')[0]}`;
        } else if (dateFilter === 'custom' && customDateRange.startDate && customDateRange.endDate) {
          queryParams = `?startDate=${customDateRange.startDate}&endDate=${customDateRange.endDate}`;
        }

        const response = await fetch(`${BACKEND_URL}/api/admin/stats${queryParams}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }

        const data = await response.json();
        const statsData = data.stats || data;

        setStats({
          totalUsers: statsData.totalUsers || 0,
          activeUsers: statsData.activeUsers || 0,
          pendingApplications:
            (statsData.pendingTutorApplications || 0) +
            (statsData.pendingExperts || statsData.pendingInterviewerApplications || 0),
          pendingTutorApplications: statsData.pendingTutorApplications || 0,
          pendingInterviewerApplications:
            statsData.pendingExperts || statsData.pendingInterviewerApplications || 0,
          totalInterviews: statsData.totalInterviewRequests || 0,
          pendingInterviews: statsData.pendingInterviewRequests || 0,
          completedInterviews:
            (statsData.totalInterviewRequests || 0) -
            (statsData.pendingInterviewRequests || 0) -
            (statsData.assignedInterviewRequests || 0),
          totalPackages: statsData.totalPackages || 0,
          helpRequests: statsData.pendingHelpRequests || 0,
          employeesHired: statsData.employeesHired || statsData.totalEmployeesHired || 0,
          pendingEmployeeApplications:
            statsData.pendingEmployeeApplications || statsData.pendingRecruitmentApplications || 0,
          pendingReports: statsData.pendingReports || statsData.pendingReportCount || 0,
          totalVisitors: statsData.totalVisitors || 0,
          uniqueVisitors: statsData.uniqueVisitors || 0,
          usersTrend: statsData.usersTrend || 0,
          activeUsersTrend: statsData.activeUsersTrend || 0,
          interviewsTrend: statsData.interviewsTrend || 0,
          completedInterviewsTrend: statsData.completedInterviewsTrend || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [dateFilter, customDateRange]);

  const handleDateFilterChange = (filter) => {
    setDateFilter(filter);
    if (filter === 'custom') {
      setShowCustomDatePicker(true);
    } else {
      setShowCustomDatePicker(false);
    }
  };

  const handleCustomDateApply = () => {
    if (customDateRange.startDate && customDateRange.endDate) {
      setShowCustomDatePicker(false);
      // Trigger re-fetch by updating the dependency
      setDateFilter('custom');
    }
  };

  const getFilterLabel = () => {
    switch (dateFilter) {
      case 'today':
        return 'Today';
      case 'weekly':
        return 'Last 7 Days';
      case 'monthly':
        return 'Last 30 Days';
      case 'custom':
        return customDateRange.startDate && customDateRange.endDate
          ? `${customDateRange.startDate} to ${customDateRange.endDate}`
          : 'Custom Range';
      default:
        return 'All Time';
    }
  };

  const kpiCards = [
    {
      title: 'Total Users',
      value: loading ? '...' : stats.totalUsers,
      icon: FiUsers,
      color: 'bg-blue-500',
      link: '/admin/users',
      change: stats.usersTrend,
    },
    {
      title: 'Active Users',
      value: loading ? '...' : stats.activeUsers,
      icon: FiUserCheck,
      color: 'bg-green-500',
      link: '/admin/users',
      change: stats.activeUsersTrend,
    },
    {
      title: 'Website Visitors',
      value: loading ? '...' : stats.totalVisitors,
      subtitle: loading ? '' : `Unique visitors: ${stats.uniqueVisitors}`,
      icon: FiEye,
      color: 'bg-teal-500',
      link: '/admin/visitors',
    },
    {
      title: 'Pending Applications',
      value: loading ? '...' : stats.pendingApplications,
      subtitle: loading
        ? ''
        : `Tutor: ${stats.pendingTutorApplications} • Interviewer: ${stats.pendingInterviewerApplications}`,
      icon: FiUserPlus,
      color: 'bg-yellow-500',
      link: '/admin/applications',
    },
    {
      title: 'Total Interviews',
      value: loading ? '...' : stats.totalInterviews,
      subtitle: loading
        ? ''
        : `Pending: ${stats.pendingInterviews} • Completed: ${stats.completedInterviews}`,
      icon: FiCalendar,
      color: 'bg-purple-500',
      link: '/admin/interview-requests',
      change: stats.interviewsTrend,
    },
    {
      title: 'Active Packages',
      value: loading ? '...' : stats.totalPackages,
      icon: FiPackage,
      color: 'bg-indigo-500',
      link: '/admin/packages',
    },
    {
      title: 'Help Requests',
      value: loading ? '...' : stats.helpRequests,
      icon: FiHelpCircle,
      color: 'bg-red-500',
      link: '/admin/help-support',
    },
    {
      title: 'Pending Reports',
      value: loading ? '...' : stats.pendingReports,
      icon: FiFileText,
      color: 'bg-pink-500',
      link: '/admin/reports',
    },
    {
      title: 'Employees Hired',
      value: loading ? '...' : stats.employeesHired,
      subtitle: loading ? '' : `Pending applications: ${stats.pendingEmployeeApplications}`,
      icon: FiUsers,
      color: 'bg-cyan-500',
      link: '/admin/employees',
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's what's happening.</p>
          </div>
        </div>

        {/* Date Filter */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-gray-700">
              <FiFilter size={16} />
              <span className="text-xs font-semibold">Filter:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleDateFilterChange('overall')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  dateFilter === 'overall'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => handleDateFilterChange('today')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  dateFilter === 'today'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => handleDateFilterChange('weekly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  dateFilter === 'weekly'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => handleDateFilterChange('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  dateFilter === 'monthly'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => handleDateFilterChange('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  dateFilter === 'custom'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Custom Range
              </button>
            </div>
            <div className="flex-1" />
            <div className="text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <span className="font-semibold">Showing:</span> {getFilterLabel()}
            </div>
          </div>

          {/* Custom Date Picker */}
          {showCustomDatePicker && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customDateRange.startDate}
                    onChange={(e) =>
                      setCustomDateRange({ ...customDateRange, startDate: e.target.value })
                    }
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={customDateRange.endDate}
                    onChange={(e) =>
                      setCustomDateRange({ ...customDateRange, endDate: e.target.value })
                    }
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleCustomDateApply}
                  disabled={!customDateRange.startDate || !customDateRange.endDate}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Apply
                </button>
                <button
                  onClick={() => {
                    setShowCustomDatePicker(false);
                    setDateFilter('overall');
                  }}
                  className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => (
          <StatCard key={index} {...card} />
        ))}
      </div>

      <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/analytics"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
          >
            <FiTrendingUp className="text-green-600 mb-2" size={24} />
            <p className="font-medium text-gray-900">View Analytics</p>
            <p className="text-sm text-gray-600 mt-1">Platform insights & metrics</p>
          </Link>
          <Link
            to="/admin/applications"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
          >
            <FiFileText className="text-blue-600 mb-2" size={24} />
            <p className="font-medium text-gray-900">Review Applications</p>
            <p className="text-sm text-gray-600 mt-1">Process pending requests</p>
          </Link>
          <Link
            to="/admin/interview-requests"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
          >
            <FiCalendar className="text-purple-600 mb-2" size={24} />
            <p className="font-medium text-gray-900">Manage Interviews</p>
            <p className="text-sm text-gray-600 mt-1">Schedule and track</p>
          </Link>
          <Link
            to="/admin/packages"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all"
          >
            <FiPackage className="text-indigo-600 mb-2" size={24} />
            <p className="font-medium text-gray-900">Manage Packages</p>
            <p className="text-sm text-gray-600 mt-1">Create and edit</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NewDashboard;

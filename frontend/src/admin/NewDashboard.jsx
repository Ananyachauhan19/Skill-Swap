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
    // Trend data (percentage changes)
    usersTrend: 0,
    activeUsersTrend: 0,
    interviewsTrend: 0,
    completedInterviewsTrend: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/admin/stats`, {
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
  }, []);

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
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

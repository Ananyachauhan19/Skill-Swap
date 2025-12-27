import React, { useEffect, useState } from 'react';
import { useEmployeeAuth } from '../context/EmployeeAuthContext.jsx';
import { Link } from 'react-router-dom';
import {
  FiFileText,
  FiUsers,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiArrowRight,
  FiTrendingUp,
  FiBarChart2,
} from 'react-icons/fi';
import api from '../lib/api';

const StatCard = ({ title, value, icon: Icon, color, link, subtitle }) => (
  <Link
    to={link}
    className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
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

export default function EmployeeDashboard() {
  const { employee } = useEmployeeAuth();

  if (!employee) return null;

  const access = employee.accessPermissions || 'both';
  const canInterviewer = access === 'interviewer' || access === 'both';
  const canTutor = access === 'tutor' || access === 'both';

  const [interviewerStats, setInterviewerStats] = useState(null);
  const [tutorStats, setTutorStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInterviewerStats = async () => {
      try {
        const res = await api.get('/api/interview/employee/applications', {
          params: { category: 'interview-expert', status: 'all' },
        });
        const data = res.data;
        const apps = Array.isArray(data?.applications)
          ? data.applications
          : Array.isArray(data)
          ? data
          : [];

        const total = apps.length;
        const pending = apps.filter((a) => a.status === 'pending').length;
        const approved = apps.filter((a) => a.status === 'approved').length;
        const rejected = apps.filter((a) => a.status === 'rejected').length;

        setInterviewerStats({ total, pending, approved, rejected });
      } catch {
        setInterviewerStats({ total: 0, pending: 0, approved: 0, rejected: 0 });
      }
    };

    const fetchTutorStats = async () => {
      try {
        const res = await api.get('/api/employee/tutor/applications');
        const apps = Array.isArray(res.data) ? res.data : [];

        const total = apps.length;
        const pending = apps.filter((a) => a.status === 'pending').length;
        const approved = apps.filter((a) => a.status === 'approved').length;
        const rejected = apps.filter((a) => a.status === 'rejected').length;

        setTutorStats({ total, pending, approved, rejected });
      } catch {
        setTutorStats({ total: 0, pending: 0, approved: 0, rejected: 0 });
      }
    };

    const fetchData = async () => {
      setLoading(true);
      if (canInterviewer) await fetchInterviewerStats();
      if (canTutor) await fetchTutorStats();
      setLoading(false);
    };

    fetchData();
  }, [canInterviewer, canTutor]);

  // Build KPI cards based on access permissions
  const kpiCards = [];

  if (canInterviewer && interviewerStats) {
    kpiCards.push(
      {
        title: 'Total Interview Applications',
        value: loading ? '...' : interviewerStats.total,
        icon: FiFileText,
        color: 'bg-blue-500',
        link: '/employee/applications/interview-expert',
      },
      {
        title: 'Pending Interview Apps',
        value: loading ? '...' : interviewerStats.pending,
        icon: FiClock,
        color: 'bg-amber-500',
        link: '/employee/applications/interview-expert',
      },
      {
        title: 'Approved Interview Apps',
        value: loading ? '...' : interviewerStats.approved,
        icon: FiCheckCircle,
        color: 'bg-green-500',
        link: '/employee/applications/interview-expert',
      },
      {
        title: 'Rejected Interview Apps',
        value: loading ? '...' : interviewerStats.rejected,
        icon: FiXCircle,
        color: 'bg-red-500',
        link: '/employee/applications/interview-expert',
      }
    );
  }

  if (canTutor && tutorStats) {
    kpiCards.push(
      {
        title: 'Total Tutor Applications',
        value: loading ? '...' : tutorStats.total,
        icon: FiUsers,
        color: 'bg-purple-500',
        link: '/employee/applications/tutor',
      },
      {
        title: 'Pending Tutor Apps',
        value: loading ? '...' : tutorStats.pending,
        icon: FiClock,
        color: 'bg-yellow-500',
        link: '/employee/applications/tutor',
      },
      {
        title: 'Approved Tutor Apps',
        value: loading ? '...' : tutorStats.approved,
        icon: FiCheckCircle,
        color: 'bg-emerald-500',
        link: '/employee/applications/tutor',
      },
      {
        title: 'Rejected Tutor Apps',
        value: loading ? '...' : tutorStats.rejected,
        icon: FiXCircle,
        color: 'bg-rose-500',
        link: '/employee/applications/tutor',
      }
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Dashboard</h1>
        <p className="text-gray-600">Review and approve applications assigned to you.</p>
      </div>

      {/* Employee Info */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-semibold">
              {employee.name?.charAt(0).toUpperCase() || 'E'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{employee.name || 'Employee'}</p>
              <p className="text-xs text-gray-600">{employee.email}</p>
            </div>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-700">ID:</span>
              <span className="text-xs font-mono text-gray-900">{employee.employeeId}</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-indigo-200 shadow-sm">
              <span className="text-xs font-semibold text-indigo-700">Access:</span>
              <span className="text-xs font-medium text-indigo-900 capitalize">{access}</span>
            </div>
            <Link
              to="/employee/activity"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium shadow-sm hover:bg-blue-700"
            >
              <FiBarChart2 size={14} />
              My Activity
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiCards.map((card, index) => (
          <StatCard key={index} {...card} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {canInterviewer && (
            <Link
              to="/employee/applications/interview-expert"
              className="p-5 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <FiFileText className="text-blue-600 group-hover:scale-110 transition-transform" size={28} />
                <div className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded">
                  {interviewerStats?.pending || 0} Pending
                </div>
              </div>
              <p className="font-semibold text-gray-900 mb-1">Interview Expert Applications</p>
              <p className="text-sm text-gray-600">
                Review and approve interview expert applications
              </p>
            </Link>
          )}
          {canTutor && (
            <Link
              to="/employee/applications/tutor"
              className="p-5 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <FiUsers className="text-purple-600 group-hover:scale-110 transition-transform" size={28} />
                <div className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">
                  {tutorStats?.pending || 0} Pending
                </div>
              </div>
              <p className="font-semibold text-gray-900 mb-1">Tutor Applications</p>
              <p className="text-sm text-gray-600">
                Review and approve tutor applications
              </p>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

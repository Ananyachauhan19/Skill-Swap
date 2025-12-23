import React, { useEffect, useState } from 'react';
import { useEmployeeAuth } from '../context/EmployeeAuthContext.jsx';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function EmployeeDashboard() {
  const { employee } = useEmployeeAuth();

  if (!employee) return null;

  const access = employee.accessPermissions || 'both';
  const canInterviewer = access === 'interviewer' || access === 'both';
  const canTutor = access === 'tutor' || access === 'both';

  const [interviewerStats, setInterviewerStats] = useState(null);
  const [tutorStats, setTutorStats] = useState(null);

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
        setInterviewerStats(null);
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
        setTutorStats(null);
      }
    };

    if (canInterviewer) fetchInterviewerStats();
    if (canTutor) fetchTutorStats();
  }, [canInterviewer, canTutor]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-1">Overview</h2>
            <p className="text-sm text-slate-500">
              Use this panel to review and approve applications you have access to.
            </p>
          </div>
          <div className="flex flex-col sm:items-end gap-1 text-xs">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              <span className="font-semibold">ID:</span>
              <span className="font-mono text-[11px]">{employee.employeeId}</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              <span className="font-semibold">Email:</span>
              <span className="text-[11px] truncate max-w-[220px] sm:max-w-[260px]">{employee.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards for each accessible module */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {canInterviewer && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Interview Expert Applications</h3>
              <p className="text-xs text-slate-500">Summary of applications you can review.</p>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-500">Total</span>
                <span className="text-base font-semibold text-slate-900">
                  {interviewerStats ? interviewerStats.total : '—'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-amber-600">Pending</span>
                <span className="text-base font-semibold text-amber-700">
                  {interviewerStats ? interviewerStats.pending : '—'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-emerald-600">Approved</span>
                <span className="text-base font-semibold text-emerald-700">
                  {interviewerStats ? interviewerStats.approved : '—'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-rose-600">Rejected</span>
                <span className="text-base font-semibold text-rose-700">
                  {interviewerStats ? interviewerStats.rejected : '—'}
                </span>
              </div>
            </div>
          </div>
        )}

        {canTutor && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Tutor Applications</h3>
              <p className="text-xs text-slate-500">Summary of tutor approvals you can manage.</p>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-500">Total</span>
                <span className="text-base font-semibold text-slate-900">
                  {tutorStats ? tutorStats.total : '—'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-amber-600">Pending</span>
                <span className="text-base font-semibold text-amber-700">
                  {tutorStats ? tutorStats.pending : '—'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-emerald-600">Approved</span>
                <span className="text-base font-semibold text-emerald-700">
                  {tutorStats ? tutorStats.approved : '—'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-rose-600">Rejected</span>
                <span className="text-base font-semibold text-rose-700">
                  {tutorStats ? tutorStats.rejected : '—'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {canInterviewer && (
          <Link
            to="/employee/applications/interview-expert"
            className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition"
          >
            <h3 className="font-semibold text-slate-900 mb-1">Interview Expert Applications</h3>
            <p className="text-sm text-slate-500">
              Review and approve interview expert applications assigned to you.
            </p>
          </Link>
        )}
        {canTutor && (
          <Link
            to="/employee/applications/tutor"
            className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition"
          >
            <h3 className="font-semibold text-slate-900 mb-1">Tutor Applications</h3>
            <p className="text-sm text-slate-500">
              Review and approve tutor applications assigned to you.
            </p>
          </Link>
        )}
      </div>
    </div>
  );
}

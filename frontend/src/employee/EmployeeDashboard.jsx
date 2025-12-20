import React from 'react';
import { useEmployeeAuth } from '../context/EmployeeAuthContext.jsx';
import { Link } from 'react-router-dom';

export default function EmployeeDashboard() {
  const { employee } = useEmployeeAuth();

  if (!employee) return null;

  const access = employee.accessPermissions || 'both';
  const canInterviewer = access === 'interviewer' || access === 'both';
  const canTutor = access === 'tutor' || access === 'both';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-1">Overview</h2>
        <p className="text-sm text-slate-500">
          Use this panel to review and approve applications you have access to.
        </p>
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

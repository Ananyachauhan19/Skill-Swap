import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { BACKEND_URL } from '../config.js';

// Mapping top-level section to its sidebar subsections (placeholder groups for future expansion)
const sectionConfig = {
  dashboard: [
    { label: 'Overview', to: '/admin/dashboard' },
    { label: 'Analytics', to: '/admin/analytics' },
  ],
  applications: [
    { label: 'All Applications', to: '/admin/applications' },
    { label: 'Pending', to: '/admin/applications' },
    { label: 'Approved', to: '/admin/applications' },
    { label: 'Rejected', to: '/admin/applications' },
  ],
  'interview-requests': [
    { label: 'All Requests', to: '/admin/interview-requests' },
    // detailed status links (counts are computed dynamically below)
  ],
  'session-requests': [
    { label: 'All Session Requests', to: '/admin/session-requests' },
    { label: 'Pending', to: '/admin/session-requests' },
    { label: 'Scheduled', to: '/admin/session-requests' },
  ],
  'skillmate-requests': [
    { label: 'All SkillMate Requests', to: '/admin/skillmate-requests' },
    { label: 'Pending', to: '/admin/skillmate-requests' },
    { label: 'Approved', to: '/admin/skillmate-requests' },
  ],
  // analytics section removed; its items now live under dashboard
  users: [
    { label: 'All Users', to: '/admin/users' },
    // Dynamic category filters rendered in component
  ],
  settings: [
    { label: 'General', to: '/admin/settings' },
    { label: 'Security', to: '/admin/settings' },
  ],
};

function detectSection(pathname) {
  // pathname like /admin/interview-requests
  const parts = pathname.split('/').filter(Boolean); // ['admin','interview-requests']
  if (parts.length < 2) return 'dashboard';
  const section = parts[1];
  return sectionConfig[section] ? section : 'dashboard';
}

const AdminSidebar = () => {
  const location = useLocation();
  const currentSection = detectSection(location.pathname);
  const items = sectionConfig[currentSection] || [];
  const { user } = useAuth();
  const [counts, setCounts] = useState({
    all: 0,
    pending: 0,
    assigned: 0,
    scheduled: 0,
    completed: 0,
    rejected: 0,
    cancelled: 0,
  });

  useEffect(() => {
    let mounted = true;
    const loadCounts = async () => {
      try {
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || '';
        const isAdmin = user && user.email && adminEmail && user.email.toLowerCase() === adminEmail.toLowerCase();
        const endpoint = isAdmin ? '/api/interview/all-requests' : '/api/interview/requests';
        const res = await fetch(`${BACKEND_URL}${endpoint}`, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();

        let list = [];
        if (Array.isArray(data)) {
          list = data;
        } else if (data && (data.received || data.sent)) {
          list = [
            ...(data.received || []).map(r => ({ ...r })),
            ...(data.sent || []).map(r => ({ ...r })),
          ];
        }

        if (!mounted) return;
        const next = { all: list.length, pending: 0, assigned: 0, scheduled: 0, completed: 0, rejected: 0, cancelled: 0 };
        list.forEach(r => {
          const s = r.status || 'pending';
          if (next[s] !== undefined) next[s] += 1;
        });
        setCounts(next);
      } catch (e) {
        // ignore errors silently
      }
    };

    if (currentSection === 'interview-requests') loadCounts();
    return () => { mounted = false; };
  }, [currentSection, user]);

  return (
    <aside className="w-64 shrink-0 bg-white/90 backdrop-blur border-r border-gray-200 h-screen sticky top-0 flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{currentSection.replace('-', ' ')} Menu</h2>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {currentSection === 'interview-requests' ? (
          <div className="space-y-1">
            {[
              { key: 'all', label: 'All Requests' },
              { key: 'pending', label: 'Pending' },
              { key: 'assigned', label: 'Assigned' },
              { key: 'scheduled', label: 'Scheduled' },
              { key: 'completed', label: 'Completed' },
              { key: 'rejected', label: 'Rejected' },
              { key: 'cancelled', label: 'Cancelled' },
            ].map(entry => (
              <NavLink
                key={entry.key}
                to={`/admin/interview-requests${entry.key === 'all' ? '' : `?status=${entry.key}`}`}
                className={({ isActive }) =>
                  'flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ' +
                  (isActive ? 'bg-blue-600 text-white shadow' : 'text-gray-700 hover:bg-gray-50 hover:text-blue-700')
                }
              >
                <span>{entry.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${isNaN(counts[entry.key]) ? 'bg-gray-200 text-gray-600' : 'bg-gray-200 text-gray-700'}`}>
                  {counts[entry.key] ?? 0}
                </span>
              </NavLink>
            ))}
          </div>
        ) : currentSection === 'users' ? (
          <div className="space-y-1">
            {[
              { key: 'all', label: 'All Users' },
              { key: 'teacher', label: 'Tutors' },
              { key: 'learner', label: 'Learners' },
              { key: 'both', label: 'Both' },
              { key: 'expert', label: 'Experts' },
            ].map(entry => (
              <NavLink
                key={entry.key}
                to={`/admin/users${entry.key === 'all' ? '' : `?role=${entry.key}`}`}
                className={({ isActive }) =>
                  'flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ' +
                  (isActive ? 'bg-blue-600 text-white shadow' : 'text-gray-700 hover:bg-gray-50 hover:text-blue-700')
                }
              >
                <span>{entry.label}</span>
              </NavLink>
            ))}
          </div>
        ) : (
          items.map(link => (
            <NavLink
              key={link.label + link.to}
              to={link.to}
              end
              className={({ isActive }) =>
                'block rounded-md px-3 py-2 text-sm font-medium transition-colors ' +
                (isActive ? 'bg-blue-600 text-white shadow' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700')
              }
            >
              {link.label}
            </NavLink>
          ))
        )}
      </nav>
      <div className="px-4 py-3 text-xs text-gray-400 border-t border-gray-100">
        <p>Admin Console • v1</p>
      </div>
    </aside>
  );
};

export default AdminSidebar;

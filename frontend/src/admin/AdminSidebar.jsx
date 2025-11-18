import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

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
    { label: 'Pending', to: '/admin/interview-requests' },
    { label: 'Assigned', to: '/admin/interview-requests' },
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
    { label: 'Teachers (Soon)', to: '/admin/users' },
    { label: 'Learners (Soon)', to: '/admin/users' },
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

  return (
    <aside className="w-64 shrink-0 bg-white/90 backdrop-blur border-r border-gray-200 h-screen sticky top-0 flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{currentSection.replace('-', ' ')} Menu</h2>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {items.map(link => (
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
        ))}
      </nav>
      <div className="px-4 py-3 text-xs text-gray-400 border-t border-gray-100">
        <p>Admin Console • v1</p>
      </div>
    </aside>
  );
};

export default AdminSidebar;

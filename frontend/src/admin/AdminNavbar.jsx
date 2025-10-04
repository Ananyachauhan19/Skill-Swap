import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard', path: '/admin/dashboard' },
  { label: 'Users', path: '/admin/users' },
  { label: 'Interview Requests', path: '/admin/interviews' },
  { label: 'Session Requests', path: '/admin/sessions' },
  { label: 'SkillMate Requests', path: '/admin/skillmates' },
  { label: 'Settings', path: '/admin/settings' },
];

const AdminNavbar = () => {
  const location = useLocation();
  return (
    <nav className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between shadow-lg">
      <div className="font-bold text-xl">Admin Panel</div>
      <div className="flex gap-6">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`hover:underline px-2 py-1 rounded transition-all duration-200 ${location.pathname === item.path ? 'bg-blue-700' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default AdminNavbar;

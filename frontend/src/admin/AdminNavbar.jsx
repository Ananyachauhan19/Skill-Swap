import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Applications', to: '/admin/applications' },
  { label: 'Interview Requests', to: '/admin/interview-requests' },
  { label: 'Users', to: '/admin/users' },
  { label: 'Packages', to: '/admin/packages' },
  { label: 'Help', to: '/admin/help-support' },
  { label: 'Settings', to: '/admin/settings' },
];

const AdminNavbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-50 shadow-sm">
      {/* Left: Logo & Brand */}
      <div className="flex items-center gap-4 sm:gap-8">
        <button 
          onClick={() => navigate('/admin/dashboard')} 
          className="flex items-center gap-1.5 sm:gap-2 font-semibold text-blue-700 hover:text-blue-800 focus:outline-none transition"
        >
          <img src="/assets/skillswap-logo.webp" alt="SkillSwap" className="w-6 h-6 sm:w-8 sm:h-8 drop-shadow" />
          <span className="text-base sm:text-lg tracking-wide hidden xs:inline">Admin Console</span>
        </button>
        
        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                'px-4 py-2 rounded-lg text-sm font-medium transition-all ' +
                (isActive 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => navigate('/home')}
          className="hidden md:inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
          title="View user site"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <path d="M15 3h6v6"/>
            <path d="M10 14L21 3"/>
          </svg>
          <span className="hidden lg:inline">View Site</span>
        </button>
        
        <button
          onClick={logout}
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow transition-all"
          title="Logout"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <path d="M16 17l5-5-5-5"/>
            <path d="M21 12H9"/>
          </svg>
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default AdminNavbar;

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiChevronRight, FiHome } from 'react-icons/fi';

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const breadcrumbNameMap = {
    admin: 'Admin',
    dashboard: 'Dashboard',
    applications: 'Applications',
    'interview-requests': 'Interview Requests',
    users: 'Users',
    packages: 'Packages',
    'help-support': 'Help Requests',
    settings: 'Settings',
    analytics: 'Analytics',
    reports: 'Reports',
    'tutor-verification': 'Tutor Verification'
  };

  return (
    <nav className="flex items-center space-x-2 text-sm">
      <Link
        to="/admin/dashboard"
        className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
      >
        <FiHome size={16} />
      </Link>

      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const label = breadcrumbNameMap[value] || value;

        return (
          <React.Fragment key={to}>
            <FiChevronRight size={16} className="text-gray-400" />
            {last ? (
              <span className="text-gray-900 font-medium">{label}</span>
            ) : (
              <Link
                to={to}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;

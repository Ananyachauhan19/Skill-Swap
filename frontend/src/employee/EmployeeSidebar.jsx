import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiHome, FiFileText, FiUsers, FiLogOut, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { useEmployeeAuth } from '../context/EmployeeAuthContext.jsx';

const EmployeeSidebar = ({ collapsed, setCollapsed }) => {
  const { logout, employee } = useEmployeeAuth();
  const navigate = useNavigate();

  // Role-based menu
  const access = employee?.accessPermissions || 'both';
  const canInterviewer = access === 'interviewer' || access === 'both';
  const canTutor = access === 'tutor' || access === 'both';
  const menuItems = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', icon: FiHome, path: '/employee/dashboard' }
      ]
    },
    {
      title: 'Applications',
      items: [
        ...(canInterviewer ? [{ label: 'Interview Expert Applications', icon: FiFileText, path: '/employee/applications/interview-expert' }] : []),
        ...(canTutor ? [{ label: 'Tutor Applications', icon: FiUsers, path: '/employee/applications/tutor' }] : []),
      ]
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div
      className={`${
        collapsed ? 'w-20' : 'w-64'
      } bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col transition-all duration-300 ease-in-out`}
    >
      {/* Header */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src="https://res.cloudinary.com/dbltazdsa/image/upload/v1766589377/webimages/skillswap-logo.png" alt="SkillSwap" className="w-8 h-8" />
            <span className="font-bold text-blue-700 text-lg">Employee</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {collapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {menuItems.map((section, idx) => (
          <div key={idx} className="mb-6">
            {!collapsed && (
              <div className="px-3 mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {section.title}
                </span>
              </div>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                  title={collapsed ? item.label : ''}
                >
                  <item.icon size={20} className="flex-shrink-0" />
                  {!collapsed && <span className="text-sm">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full"
          title={collapsed ? 'Logout' : ''}
        >
          <FiLogOut size={20} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default EmployeeSidebar;

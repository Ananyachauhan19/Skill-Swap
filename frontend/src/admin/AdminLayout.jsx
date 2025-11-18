import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar.jsx';
import AdminNavbar from './AdminNavbar.jsx';

const AdminLayout = () => {
  const location = useLocation();
  const hideSidebarFor = ['/admin/applications'];
  const shouldHideSidebar = hideSidebarFor.some(p => location.pathname.startsWith(p));

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Common Admin Navbar */}
      <AdminNavbar />
      
      <div className="flex flex-1 overflow-hidden">
        {!shouldHideSidebar && <AdminSidebar />}
        <main className={`flex-1 overflow-auto ${shouldHideSidebar ? '' : 'p-6'}`}>
          <div className={shouldHideSidebar ? 'w-full h-full' : 'max-w-7xl mx-auto'}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

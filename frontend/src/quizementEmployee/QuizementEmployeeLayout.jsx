import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import QuizementEmployeeSidebar from './QuizementEmployeeSidebar.jsx';

const QuizementEmployeeLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <QuizementEmployeeSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
export default QuizementEmployeeLayout;
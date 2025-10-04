import React, { useState } from 'react';
import AdminNavbar from './AdminNavbar';
import InterviewRequests from './InterviewRequests';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-blue-50">
      <AdminNavbar />
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-blue-900">Admin Panel</h1>
          <div className="flex space-x-3">
            <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-1 rounded ${activeTab==='dashboard' ? 'bg-blue-900 text-white' : 'bg-white'}`}>Dashboard</button>
            <button onClick={() => setActiveTab('users')} className={`px-3 py-1 rounded ${activeTab==='users' ? 'bg-blue-900 text-white' : 'bg-white'}`}>Users</button>
            <button onClick={() => setActiveTab('interviews')} className={`px-3 py-1 rounded ${activeTab==='interviews' ? 'bg-blue-900 text-white' : 'bg-white'}`}>Interview Requests</button>
            <button onClick={() => setActiveTab('sessions')} className={`px-3 py-1 rounded ${activeTab==='sessions' ? 'bg-blue-900 text-white' : 'bg-white'}`}>Session Requests</button>
            <button onClick={() => setActiveTab('skillmates')} className={`px-3 py-1 rounded ${activeTab==='skillmates' ? 'bg-blue-900 text-white' : 'bg-white'}`}>SkillMate Requests</button>
            <button onClick={() => setActiveTab('settings')} className={`px-3 py-1 rounded ${activeTab==='settings' ? 'bg-blue-900 text-white' : 'bg-white'}`}>Settings</button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'dashboard' && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Dashboard</h2>
              <p className="text-gray-600">Update in future: Dashboard details will be implemented here.</p>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Users</h2>
              <p className="text-gray-600">Update in future: User management UI will be implemented here.</p>
            </div>
          )}

          {activeTab === 'interviews' && (
            <InterviewRequests />
          )}

          {activeTab === 'sessions' && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Session Requests</h2>
              <p className="text-gray-600">Update in future: Admin session requests view will be implemented here.</p>
            </div>
          )}

          {activeTab === 'skillmates' && (
            <div>
              <h2 className="text-xl font-semibold mb-2">SkillMate Requests</h2>
              <p className="text-gray-600">Update in future: Admin SkillMate requests view will be implemented here.</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Settings</h2>
              <p className="text-gray-600">Update in future: Admin settings will be implemented here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
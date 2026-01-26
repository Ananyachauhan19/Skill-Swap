import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizementEmployeeAuth } from '../context/QuizementEmployeeAuthContext.jsx';
import { FiActivity } from 'react-icons/fi';

const QuizementEmployeeDashboard = () => {
  const { employee } = useQuizementEmployeeAuth();
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Quizzment Employee Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Create and manage public Quizzment quizzes for all SkillSwap users.
          </p>
        </div>
        <button
          onClick={() => navigate('/quizement-employee/activity-log')}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          <FiActivity size={18} />
          View Activity Log
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-semibold uppercase">Role</p>
          <p className="mt-2 text-lg font-bold text-blue-900">Quizzment Employee</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-semibold uppercase">Name</p>
          <p className="mt-2 text-lg font-semibold text-gray-900">{employee?.fullName || '-'}</p>
          <p className="text-xs text-gray-500 mt-1">{employee?.email}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-semibold uppercase">Employee ID</p>
          <p className="mt-2 text-lg font-semibold text-gray-900">{employee?.employeeId || '-'}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">Getting started</h2>
        <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
          <li>Create a new quiz from the Create Quiz tab.</li>
          <li>Monitor quiz performance and attempts from Quiz Results.</li>
          <li>All quizzes are public and visible to logged-in users under the main Quizzment tab.</li>
        </ul>
      </div>
    </div>
  );
};

export default QuizementEmployeeDashboard;
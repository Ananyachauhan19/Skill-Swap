import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useQuizementEmployeeAuth } from '../context/QuizementEmployeeAuthContext.jsx';

export default function QuizementEmployeeRoute() {
  const { employee, loading } = useQuizementEmployeeAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <img
            src="https://res.cloudinary.com/dbltazdsa/image/upload/v1766589377/webimages/skillswap-logo.png"
            alt="SkillSwap Logo"
            className="w-24 h-24 object-contain drop-shadow-md"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-[6px] border-blue-900/20 border-t-blue-900 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
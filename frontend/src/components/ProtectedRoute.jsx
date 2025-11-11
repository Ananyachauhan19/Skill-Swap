import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-40">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <img
            src="/assets/skillswap-logo.webp"
            alt="SkillSwap Logo"
            className="w-20 h-20 object-contain drop-shadow"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full border-[5px] border-blue-900/25 border-t-blue-900 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && (!user?.isAdmin || user?.email !== 'skillswaphubb@gmail.com')) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default ProtectedRoute;
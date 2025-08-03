import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or a loading spinner
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && (!user.isAdmin || user.email !== 'skillswaphubb@gmail.com')) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default ProtectedRoute;

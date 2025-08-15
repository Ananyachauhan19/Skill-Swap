import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Replace with a proper loading spinner if needed
  }

  if (!user || !user._id) { // Additional check for valid user object
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && (!user.isAdmin || user.email !== 'skillswaphubb@gmail.com')) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default ProtectedRoute;
// filepath: d:\Skill-Swap\frontend\src\routes\AdminRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = () => {
  const { user, isAuthenticated, loading } = useAuth();

  // --- START DEBUG LOGS ---
  console.group('--- Admin Route Check ---');
  console.log('Loading State:', loading);
  console.log('Is Authenticated:', isAuthenticated);
  console.log('User Object from Context:', user);
  console.log('Admin Email from .env:', import.meta.env.VITE_ADMIN_EMAIL);
  // --- END DEBUG LOGS ---

  if (loading) {
    console.log('Result: Waiting for auth state to load...');
    console.groupEnd();
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    console.log('Result: Not authenticated or no user object. Redirecting to /login.');
    console.groupEnd();
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user.email?.toLowerCase() === (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase();

  if (!isAdmin) {
    console.log(`Result: Access DENIED. User email "${user.email}" does not match admin email. Redirecting to /home.`);
    console.groupEnd();
    return <Navigate to="/home" replace />;
  }

  console.log('Result: Access GRANTED.');
  console.groupEnd();
  return <Outlet />;
};

export default AdminRoute;
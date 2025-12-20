import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';

const EmployeeAuthCtx = createContext(null);

export function EmployeeAuthProvider({ children }) {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/employee/me', { withCredentials: true });
      const emp = res.data?.employee || res.data || null;
      setEmployee(emp);
    } catch (e) {
      setEmployee(null);
      // do not treat 401 as fatal error, just unauthenticated
      if (e.response && e.response.status !== 401) {
        setError(e.message || 'Failed to load employee');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, []);

  // Start employee login by validating credentials and triggering an OTP email.
  // The actual session is established when OTP is verified on /api/employee/verify-otp.
  const login = async (identifier, password) => {
    const res = await api.post(
      '/api/employee/login',
      { identifier, password },
      { withCredentials: true }
    );
    return res.data;
  };

  const logout = async () => {
    try {
      // backend may or may not implement this; ignore failures
      await api.post('/api/employee/logout', {}, { withCredentials: true });
    } catch (_) {}
    setEmployee(null);
  };

  const value = {
    employee,
    setEmployee,
    loading,
    error,
    login,
    logout,
  };

  return (
    <EmployeeAuthCtx.Provider value={value}>
      {children}
    </EmployeeAuthCtx.Provider>
  );
}

export const useEmployeeAuth = () => useContext(EmployeeAuthCtx);

export default EmployeeAuthProvider;

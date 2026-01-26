import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';

const InternCoordinatorAuthCtx = createContext(null);

export function InternCoordinatorAuthProvider({ children }) {
  const [coordinator, setCoordinator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMe = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/intern-coordinator/me', { withCredentials: true });
      const data = res.data || null;
      setCoordinator(data);
    } catch (e) {
      setCoordinator(null);
      if (e.response && e.response.status !== 401) {
        setError(e.message || 'Failed to load intern coordinator');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const logout = async () => {
    try {
      await api.post('/api/intern-coordinator/logout', {}, { withCredentials: true });
    } catch (_) {}
    setCoordinator(null);
  };

  const value = {
    coordinator,
    setCoordinator,
    loading,
    error,
    fetchMe,
    logout,
  };

  return (
    <InternCoordinatorAuthCtx.Provider value={value}>
      {children}
    </InternCoordinatorAuthCtx.Provider>
  );
}

export const useInternCoordinatorAuth = () => useContext(InternCoordinatorAuthCtx);

export default InternCoordinatorAuthProvider;

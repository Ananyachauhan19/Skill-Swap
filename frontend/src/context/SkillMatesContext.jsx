import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext.jsx';

const SkillMatesContext = createContext(null);

export const useSkillMates = () => useContext(SkillMatesContext);

export const SkillMatesProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchList = useCallback(async () => {
    // If the user is not authenticated, don't call the API; just reset state
    if (!isAuthenticated) {
      setList([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
	  const res = await api.get('/api/skillmates/list');
      setList(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      // For 401, treat it as "no SkillMates because not logged in" without surfacing an error
      if (e?.response?.status === 401) {
        setList([]);
        setError(null);
      } else {
        setError(e?.response?.data?.message || e?.message || 'Failed to fetch SkillMates');
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const open = useCallback(() => {
    setIsOpen(true);
    fetchList();
  }, [fetchList]);

  const close = useCallback(() => setIsOpen(false), []);

  const remove = useCallback(async (skillMateUserId) => {
    try {
      await api.post(`/api/skillmates/remove/${skillMateUserId}`);
      setList((prev) => prev.filter((u) => u._id !== skillMateUserId));
    } catch (e) {
      throw new Error(e?.response?.data?.message || e?.message || 'Failed to remove SkillMate');
    }
  }, []);

  // Optionally prefetch count once on mount for badge/button
  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const value = useMemo(() => ({
    isOpen,
    open,
    close,
    list,
    count: list.length,
    loading,
    error,
    refresh: fetchList,
    remove,
  }), [isOpen, open, close, list, loading, error, fetchList, remove]);

  return (
    <SkillMatesContext.Provider value={value}>
      {children}
    </SkillMatesContext.Provider>
  );
};

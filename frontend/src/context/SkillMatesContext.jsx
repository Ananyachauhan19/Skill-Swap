import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext.jsx';

const SkillMatesContext = createContext(null);

export const useSkillMates = () => useContext(SkillMatesContext);

export const SkillMatesProvider = ({ children }) => {
  const { isAuthenticated, setUser } = useAuth();
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
      const nextList = Array.isArray(res.data) ? res.data : [];
      setList(nextList);

      // Keep AuthContext user.skillMates consistent for badges/UI
      setUser((prev) => {
        if (!prev) return prev;
        return { ...prev, skillMates: nextList.map((u) => u?._id).filter(Boolean) };
      });
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

      setUser((prev) => {
        if (!prev) return prev;
        if (!Array.isArray(prev.skillMates)) return prev;
        return { ...prev, skillMates: prev.skillMates.filter((id) => String(id) !== String(skillMateUserId)) };
      });
    } catch (e) {
      throw new Error(e?.response?.data?.message || e?.message || 'Failed to remove SkillMate');
    }
  }, []);

  // Refresh when other parts of the app change SkillMates
  useEffect(() => {
    const onChanged = () => fetchList();
    window.addEventListener('skillmates-changed', onChanged);
    return () => window.removeEventListener('skillmates-changed', onChanged);
  }, [fetchList]);

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

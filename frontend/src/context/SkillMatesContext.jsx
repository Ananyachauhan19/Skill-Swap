import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';

const SkillMatesContext = createContext(null);

export const useSkillMates = () => useContext(SkillMatesContext);

export const SkillMatesProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
  const res = await api.get('/api/skillmates/list');
      setList(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to fetch SkillMates');
    } finally {
      setLoading(false);
    }
  }, []);

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

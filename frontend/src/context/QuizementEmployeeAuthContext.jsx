import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';

const QuizementEmployeeAuthCtx = createContext(null);

export function QuizementEmployeeAuthProvider({ children }) {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMe = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/quizement-employee/me', { withCredentials: true });
      const emp = res.data?.employee || null;
      setEmployee(emp);
    } catch (e) {
      setEmployee(null);
      if (e.response && e.response.status !== 401) {
        setError(e.message || 'Failed to load Quizzment employee');
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
      await api.post('/api/quizement-employee/logout', {}, { withCredentials: true });
    } catch (_) {}
    setEmployee(null);
  };

  const value = {
    employee,
    setEmployee,
    loading,
    error,
    fetchMe,
    logout,
  };

  return (
    <QuizementEmployeeAuthCtx.Provider value={value}>
      {children}
    </QuizementEmployeeAuthCtx.Provider>
  );
}

export const useQuizementEmployeeAuth = () => useContext(QuizementEmployeeAuthCtx);

export default QuizementEmployeeAuthProvider;

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const QuizementLanding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const isEmployee = user && (user.role === 'employee' || user.isEmployee);
    if (isEmployee) {
      navigate('/quizement/upload', { replace: true });
    } else {
      navigate('/quizement/tests', { replace: true });
    }
  }, [user, navigate]);

  return null;
};

export default QuizementLanding;

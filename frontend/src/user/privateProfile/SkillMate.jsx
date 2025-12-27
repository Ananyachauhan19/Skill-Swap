import React from 'react';
import { useNavigate } from 'react-router-dom';

// Deprecated: redirect legacy SkillMate routes to the full chat page.
const SkillMate = () => {
  const navigate = useNavigate();
  React.useEffect(() => {
    navigate('/chat', { replace: true });
  }, [navigate]);
  return null;
};

export default SkillMate;

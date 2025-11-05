import React from 'react';
import { useSkillMates } from '../../context/SkillMatesContext.jsx';

// This component is deprecated in favor of the global SkillMates modal.
// Keep it as a tiny bridge so any legacy links just open the modal.
const SkillMate = () => {
  const { open } = useSkillMates();
  React.useEffect(() => {
    open();
  }, [open]);
  return null;
};

export default SkillMate;

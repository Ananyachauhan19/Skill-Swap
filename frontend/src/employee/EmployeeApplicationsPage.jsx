import React from 'react';
import { useParams } from 'react-router-dom';
import Applications from '../admin/Applications.jsx';
import { useEmployeeAuth } from '../context/EmployeeAuthContext.jsx';

export default function EmployeeApplicationsPage() {
  const { category: routeCategory } = useParams();
  const { employee } = useEmployeeAuth();

  const access = employee?.accessPermissions || 'both';
  const allowedCategories = [];
  if (access === 'interviewer' || access === 'both') allowedCategories.push('interview-expert');
  if (access === 'tutor' || access === 'both') allowedCategories.push('tutor');

  let initialCategory = 'interview-expert';
  if (routeCategory === 'tutor' && allowedCategories.includes('tutor')) {
    initialCategory = 'tutor';
  } else if (!allowedCategories.includes(initialCategory) && allowedCategories.length) {
    initialCategory = allowedCategories[0];
  }

  return (
    <Applications
      key={initialCategory}
      mode="employee"
      allowedCategories={allowedCategories}
      initialCategory={initialCategory}
    />
  );
}

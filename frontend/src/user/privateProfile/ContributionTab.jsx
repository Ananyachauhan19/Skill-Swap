import React from 'react';
import ContributionCalendar from '../myprofile/ContributionCalendar';
import { useAuth } from '../../context/AuthContext';

const ContributionTab = () => {
  const { user } = useAuth();

  return (
    <div className="py-3 sm:py-4">
      <ContributionCalendar userId={user?._id} variant="transparent" />
    </div>
  );
};

export default ContributionTab;

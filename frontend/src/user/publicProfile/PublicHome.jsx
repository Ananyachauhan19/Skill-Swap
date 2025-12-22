import React, { useContext } from 'react';
import ContributionCalendar from '../myprofile/ContributionCalendar.jsx';
import { ProfileContext } from './SideBarPublic';

const PublicHome = () => {
  // Show contribution activity for the user whose public profile is being viewed
  const { profileUserId } = useContext(ProfileContext) || {};

  const urlParams = new URLSearchParams(window.location.search);
  const queryUserId = urlParams.get('userId');
  const effectiveUserId = profileUserId || queryUserId || undefined;

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 to-white min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full">
        <div className="mb-8">
          <ContributionCalendar userId={effectiveUserId} />
        </div>
      </div>
    </div>
  );
};

export default PublicHome;
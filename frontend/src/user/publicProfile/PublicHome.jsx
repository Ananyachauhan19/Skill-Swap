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
    <div className="w-full min-h-screen py-3 sm:py-8 px-0 sm:px-6 lg:px-10">
      <div className="max-w-5xl w-full mx-auto">
        <div className="mb-4 sm:mb-10">
          <ContributionCalendar userId={effectiveUserId} />
        </div>
      </div>
    </div>
  );
};

export default PublicHome;
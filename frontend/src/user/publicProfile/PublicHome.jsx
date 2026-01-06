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
    <div className="w-full py-3 sm:py-6">
      <div className="max-w-6xl w-full mx-auto lg:mx-0">
        <div className="mb-4 sm:mb-6">
          <ContributionCalendar userId={effectiveUserId} variant="transparent" />
        </div>
      </div>
    </div>
  );
};

export default PublicHome;
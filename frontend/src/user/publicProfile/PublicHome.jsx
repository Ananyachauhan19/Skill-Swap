import ContributionCalendar from '../myprofile/ContributionCalendar.jsx';

const PublicHome = () => {
  // Simplified Home: shows only Contribution Activity for now

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 to-cream-100 min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full">
        <div className="mb-8">
          {/* Pass the viewed user's id if available from query/path */}
          {(() => {
            const urlParams = new URLSearchParams(window.location.search);
            const userId = urlParams.get('userId');
            return <ContributionCalendar userId={userId || undefined} />;
          })()}
        </div>
      </div>
    </div>
  );
};

export default PublicHome;
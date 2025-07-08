import React, { useState, useEffect } from 'react';

const getProfilePic = (profilePic, name, bg = 'DBEAFE', color = '1E40AF') => {
  if (profilePic) return profilePic;
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bg}&color=${color}&bold=true`;
};

const GDCard = ({ gd }) => (
  <div className="bg-blue-50 rounded-xl shadow-md p-6 flex flex-col w-full max-w-xs border border-blue-200 relative transition-all duration-300 hover:shadow-lg hover:scale-105">
    <div className="flex items-center mb-3">
      <picture>
        <source srcSet={gd.expert.profilePic ? `${gd.expert.profilePic.replace('.jpg', '.webp')}` : ''} type="image/webp" />
        <img
          src={getProfilePic(gd.expert.profilePic, gd.expert.name)}
          alt={gd.expert.name}
          className="w-12 h-12 rounded-full object-cover border border-blue-200"
        />
      </picture>
      <div className="ml-3">
        <div className="font-semibold text-blue-900 text-base">{gd.expert.name}</div>
        <div className="text-xs text-gray-600 mt-1">{gd.expert.miniBio}</div>
      </div>
    </div>
    <div className="text-gray-700 text-sm mb-2 flex items-center gap-2">
      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      {new Date(gd.date).toLocaleDateString()} | 
      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {gd.time.replace('-', ' - ')}
    </div>
    <div className="text-gray-700 text-sm mb-2">
      <svg className="w-5 h-5 text-blue-600 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l4-4h4a1.994 1.994 0 01-1.414.586z" />
      </svg>
      {gd.seats}/{gd.totalSeats} Attendees
    </div>
    <div className="flex flex-wrap gap-2 mb-3">
      {gd.tags.map((tag, idx) => (
        <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">{tag}</span>
      ))}
    </div>
    <div className="flex gap-3 mt-auto">
      <button
        className="px-4 py-2 rounded-full font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all duration-300 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
        disabled={gd.seats === 0 || gd.expired}
      >
        Book Slot
      </button>
    </div>
    {gd.expired && (
      <span className="absolute top-2 right-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Expired</span>
    )}
  </div>
);

const GDListSection = () => {
  const [groupDiscussions, setGroupDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('http://localhost:5000/api/group-discussions/upcoming')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => setGroupDiscussions(data))
      .catch(err => setError('Could not load group discussions.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="w-full flex flex-col items-center py-12 bg-blue-50">
      <h3 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-8 text-center">Upcoming Group Discussions</h3>
      {loading ? (
        <div className="text-blue-700 text-lg font-semibold py-12">Loading...</div>
      ) : error ? (
        <div className="text-red-600 text-lg font-semibold py-12">{error}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-center w-full max-w-7xl px-4">
          {groupDiscussions.length === 0 ? (
            <div className="col-span-full text-gray-500 text-center">No upcoming group discussions found.</div>
          ) : (
            groupDiscussions.map(gd => (
              <GDCard key={gd.id} gd={gd} />
            ))
          )}
        </div>
      )}
    </section>
  );
};

export default GDListSection;
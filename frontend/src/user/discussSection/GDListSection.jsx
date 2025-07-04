import React, { useState } from 'react';

// Example static data for demo purposes
const demoGD = [
  {
    id: 1,
    expert: {
      name: 'Dr. Rohan Mehta',
      profilePic: 'https://randomuser.me/api/portraits/men/45.jpg',
      miniBio: 'AI Researcher, IIT Bombay',
    },
    date: '2025-07-05',
    time: '16:00-17:00',
    credits: 10,
    seats: 4,
    totalSeats: 8,
    tags: ['Career Prep', 'Tech'],
    expired: false,
  },
  {
    id: 2,
    expert: {
      name: 'Ananya Singh',
      profilePic: 'https://randomuser.me/api/portraits/women/33.jpg',
      miniBio: 'Debate Coach, DU',
    },
    date: '2025-07-06',
    time: '18:00-19:00',
    credits: 8,
    seats: 0,
    totalSeats: 8,
    tags: ['Debate', 'Communication'],
    expired: false,
  },
  {
    id: 3,
    expert: {
      name: 'Prof. S. Kumar',
      profilePic: '',
      miniBio: 'Tech Mentor, NIT',
    },
    date: '2025-07-03',
    time: '15:00-16:00',
    credits: 12,
    seats: 2,
    totalSeats: 8,
    tags: ['Tech', 'Coding'],
    expired: true,
  },
];

const GDRulesModal = ({ open, onClose }) => (
  open ? (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full border border-blue-200 relative">
        <button className="absolute top-3 right-3 text-gray-500 text-xl hover:text-gray-700 transition-colors" onClick={onClose}>
          ×
        </button>
        <h3 className="text-xl font-bold text-blue-900 mb-3">GD Rules & Guidelines</h3>
        <ul className="list-disc pl-5 text-gray-700 text-sm space-y-2">
          <li>Be respectful and let everyone speak.</li>
          <li>Stay on topic and avoid personal attacks.</li>
          <li>Keep your mic muted when not speaking.</li>
          <li>Follow the expert's instructions.</li>
          <li>No spamming or disruptive behavior.</li>
        </ul>
      </div>
    </div>
  ) : null
);

const MiniBioButton = ({ bio }) => {
  const [show, setShow] = useState(false);
  return (
    <>
      <button className="ml-2 text-xs text-blue-600 underline hover:text-blue-700 transition-colors" onClick={() => setShow(true)}>
        Mini Bio
      </button>
      {show && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 animate-scaleIn">
          <div className="bg-white rounded-xl shadow-lg p-4 max-w-xs w-full border border-blue-200 relative">
            <button className="absolute top-2 right-2 text-gray-500 text-xl hover:text-gray-700 transition-colors" onClick={() => setShow(false)}>
              ×
            </button>
            <div className="text-sm text-gray-700">{bio}</div>
          </div>
        </div>
      )}
    </>
  );
};

const GDCard = ({ gd, onRules }) => (
  <div className="bg-blue-50 rounded-xl shadow-md p-6 flex flex-col w-full max-w-xs border border-blue-200 relative transition-all duration-300 hover:shadow-lg hover:scale-105">
    <div className="flex items-center mb-3">
      <picture>
        <source srcSet={gd.expert.profilePic ? `${gd.expert.profilePic.replace('.jpg', '.webp')}` : ''} type="image/webp" />
        <img
          src={gd.expert.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(gd.expert.name)}&background=DBEAFE&color=1E40AF&bold=true`}
          alt={gd.expert.name}
          className="w-12 h-12 rounded-full object-cover border border-blue-200"
        />
      </picture>
      <div className="ml-3">
        <div className="font-semibold text-blue-900 text-base">{gd.expert.name}</div>
        <MiniBioButton bio={gd.expert.miniBio} />
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
    <div className="text-blue-900 font-semibold text-sm mb-2">
      <svg className="w-5 h-5 text-blue-600 inline-block mr-1" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92c-.25.25-.43.59-.43.92v.33h-2v-.33c0-.33.18-.67.43-.92l1.14-1.16c.36-.36.36-.94 0-1.3-.36-.36-.94-.36-1.3 0l-1.57 1.59c-.59.59-.59 1.54 0 2.13l.43.43H9v2h1.67l.43.43c.59.59 1.54.59 2.13 0l1.57-1.59c-.59-.59-.59-1.54 0-2.13z"/>
      </svg>
      {gd.credits} Credits
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
      <button
        className="px-3 py-2 rounded-full text-blue-700 border border-blue-300 bg-blue-50 hover:bg-blue-100 transition-all duration-300 text-xs font-semibold"
        onClick={onRules}
        type="button"
      >
        Rules
      </button>
    </div>
    {gd.expired && (
      <span className="absolute top-2 right-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Expired</span>
    )}
  </div>
);

const GDListSection = () => {
  const [showRules, setShowRules] = useState(false);

  return (
    <section className="w-full flex flex-col items-center py-12 bg-blue-50">
      <h3 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-8 text-center">Upcoming Group Discussions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-center w-full max-w-7xl px-4">
        {demoGD.map(gd => (
          <GDCard key={gd.id} gd={gd} onRules={() => setShowRules(true)} />
        ))}
      </div>
      <GDRulesModal open={showRules} onClose={() => setShowRules(false)} />
    </section>
  );
};

export default GDListSection;
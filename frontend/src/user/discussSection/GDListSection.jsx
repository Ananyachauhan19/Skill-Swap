import React, { useState, useEffect } from 'react';

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
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative">
        <button className="absolute top-2 right-2 text-gray-500 text-xl" onClick={onClose}>×</button>
        <h3 className="text-xl font-bold text-blue-900 mb-2">GD Rules & Guidelines</h3>
        <ul className="list-disc pl-5 text-gray-600 text-sm space-y-1">
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
      <button className="ml-2 text-xs text-blue-600 underline" onClick={() => setShow(true)}>Mini Bio</button>
      {show && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-4 max-w-xs w-full relative">
            <button className="absolute top-1 right-2 text-gray-500 text-xl" onClick={() => setShow(false)}>×</button>
            <div className="text-sm text-gray-600">{bio}</div>
          </div>
        </div>
      )}
    </>
  );
};

const GDCard = ({ gd, onRules }) => (
  <div className="bg-white rounded-lg shadow p-5 flex flex-col w-full max-w-xs border border-blue-100 relative">
    <div className="flex items-center mb-2">
      <img
        src={gd.expert.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(gd.expert.name)}&background=E0E7FF&color=1E40AF&bold=true`}
        alt={gd.expert.name}
        className="w-12 h-12 rounded-full object-cover border border-blue-200"
      />
      <div className="ml-3">
        <div className="font-semibold text-blue-900">{gd.expert.name}</div>
        <MiniBioButton bio={gd.expert.miniBio} />
      </div>
    </div>
    <div className="text-gray-600 text-sm mb-1 flex items-center gap-2">
      <span role="img" aria-label="calendar">📅</span> {new Date(gd.date).toLocaleDateString()} |
      <span role="img" aria-label="clock">🕒</span> {gd.time.replace('-', ' - ')}
    </div>
    <div className="text-blue-900 font-semibold text-sm mb-1"><span role="img" aria-label="credits">💰</span> {gd.credits} Credits</div>
    <div className="text-gray-600 text-sm mb-1"><span role="img" aria-label="seats">🎟</span> {gd.seats}/{gd.totalSeats} Remaining</div>
    <div className="flex flex-wrap gap-1 mb-2">
      {gd.tags.map((tag, idx) => (
        <span key={idx} className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full text-xs font-medium">{tag}</span>
      ))}
    </div>
    <div className="flex gap-2 mt-auto">
      <button
        className="px-4 py-1 rounded-full font-semibold text-white transition-colors bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
        disabled={gd.seats === 0 || gd.expired}
      >
        Book Slot
      </button>
      <button
        className="px-3 py-1 rounded-full text-blue-900 border border-blue-300 bg-blue-50 hover:bg-blue-100 text-xs font-semibold"
        onClick={onRules}
        type="button"
      >
        GD Rules/Guidelines
      </button>
    </div>
    {gd.expired && <span className="absolute top-2 right-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Expired</span>}
  </div>
);

const GDListSection = () => {
  // Backend-ready code (commented for now):
  // const [gdList, setGdList] = useState([]);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState('');
  // useEffect(() => {
  //   const fetchGD = async () => {
  //     setLoading(true);
  //     setError('');
  //     try {
  //       const res = await fetch('/api/group-discussions');
  //       if (!res.ok) throw new Error('Failed to fetch group discussions');
  //       const data = await res.json();
  //       setGdList(Array.isArray(data.gds) ? data.gds : []);
  //     } catch (err) {
  //       setError('Could not load group discussions.');
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchGD();
  // }, []);
  const [showRules, setShowRules] = useState(false);

  return (
    <>
      <section className="w-full flex flex-col items-center py-8 bg-blue-50 border-t border-blue-200">
        <h3 className="text-2xl font-bold text-blue-900 mb-6">Upcoming Group Discussions</h3>
        <div className="flex flex-wrap gap-6 justify-center w-full">
          {demoGD.map(gd => (
            <GDCard key={gd.id} gd={gd} onRules={() => setShowRules(true)} />
          ))}
        </div>
        <GDRulesModal open={showRules} onClose={() => setShowRules(false)} />
      </section>
    </>
  );
};

export default GDListSection;
import React, { useState } from 'react';

// Example static data for demo purposes
const demoInterviews = [
  {
    id: 1,
    expert: {
      name: 'Ms. Priya Sharma',
      profilePic: 'https://randomuser.me/api/portraits/women/44.jpg',
      miniBio: 'HR Lead, Infosys',
    },
    date: '2025-07-10',
    time: '14:00-15:00',
    credits: 15,
    seats: 1,
    totalSeats: 1,
    tags: ['HR', 'Mock Interview'],
    expired: false,
  },
  {
    id: 2,
    expert: {
      name: 'Mr. Arjun Patel',
      profilePic: '',
      miniBio: 'SDE2, Amazon',
    },
    date: '2025-07-12',
    time: '11:00-12:00',
    credits: 20,
    seats: 0,
    totalSeats: 1,
    tags: ['Tech', 'DSA'],
    expired: false,
  },
  {
    id: 3,
    expert: {
      name: 'Dr. Kavita Rao',
      profilePic: 'https://randomuser.me/api/portraits/women/55.jpg',
      miniBio: 'Behavioral Coach',
    },
    date: '2025-07-08',
    time: '17:00-18:00',
    credits: 18,
    seats: 1,
    totalSeats: 1,
    tags: ['Behavioral', 'HR'],
    expired: true,
  },
];

const InterviewRulesModal = ({ open, onClose }) => (
  open ? (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative">
        <button className="absolute top-2 right-2 text-gray-500 text-xl" onClick={onClose}>×</button>
        <h3 className="text-xl font-bold mb-2">Interview Rules & Guidelines</h3>
        <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1">
          <li>Be punctual and join on time.</li>
          <li>Dress appropriately for the interview.</li>
          <li>Keep your camera and mic ready.</li>
          <li>Be respectful and professional.</li>
          <li>Follow the expert's instructions.</li>
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
            <div className="text-sm text-gray-800">{bio}</div>
          </div>
        </div>
      )}
    </>
  );
};

const InterviewCard = ({ interview, onRules }) => (
  <div className="bg-white rounded-lg shadow p-5 flex flex-col w-full max-w-xs border border-green-100 relative">
    <div className="flex items-center mb-2">
      <img
        src={interview.expert.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(interview.expert.name)}&background=BBF7D0&color=166534&bold=true`}
        alt={interview.expert.name}
        className="w-12 h-12 rounded-full object-cover border border-green-200"
      />
      <div className="ml-3">
        <div className="font-semibold text-green-800">{interview.expert.name}</div>
        <MiniBioButton bio={interview.expert.miniBio} />
      </div>
    </div>
    <div className="text-gray-700 text-sm mb-1 flex items-center gap-2">
      <span role="img" aria-label="calendar">📅</span> {new Date(interview.date).toLocaleDateString()} |
      <span role="img" aria-label="clock">🕒</span> {interview.time.replace('-', ' - ')}
    </div>
    <div className="text-green-700 font-semibold text-sm mb-1"><span role="img" aria-label="credits">💰</span> {interview.credits} Credits</div>
    <div className="text-gray-700 text-sm mb-1"><span role="img" aria-label="seats">🎟</span> {interview.seats}/{interview.totalSeats} Remaining</div>
    <div className="flex flex-wrap gap-1 mb-2">
      {interview.tags.map((tag, idx) => (
        <span key={idx} className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">{tag}</span>
      ))}
    </div>
    <div className="flex gap-2 mt-auto">
      <button
        className="px-4 py-1 rounded-full font-semibold text-white transition-colors bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500"
        disabled={interview.seats === 0 || interview.expired}
      >
        Book Slot
      </button>
      <button
        className="px-3 py-1 rounded-full text-green-700 border border-green-300 bg-green-50 hover:bg-green-100 text-xs font-semibold"
        onClick={onRules}
        type="button"
      >
        Interview Rules/Guidelines
      </button>
    </div>
    {interview.expired && <span className="absolute top-2 right-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Expired</span>}
  </div>
);

const InterviewListSection = () => {
  const [showRules, setShowRules] = useState(false);
  // Backend-ready state (commented for now):
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState('');
  // const [interviews, setInterviews] = useState([]);

  return (
    <section className="w-full flex flex-col items-center py-8 bg-green-50 border-t border-green-200">
      <h3 className="text-2xl font-bold text-green-800 mb-6">Upcoming Mock Interviews</h3>
      <div className="flex flex-wrap gap-6 justify-center w-full">
        {demoInterviews.map(interview => (
          <InterviewCard key={interview.id} interview={interview} onRules={() => setShowRules(true)} />
        ))}
      </div>
      <InterviewRulesModal open={showRules} onClose={() => setShowRules(false)} />
    </section>
  );
};

export default InterviewListSection;

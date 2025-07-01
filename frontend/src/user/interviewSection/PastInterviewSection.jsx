import React, { useState } from 'react';

// Example static data for demo purposes
const demoPastInterviews = [
  {
    id: 1,
    expert: {
      name: 'Ms. Priya Sharma',
      profilePic: 'https://randomuser.me/api/portraits/women/44.jpg',
    },
    date: '2025-06-18',
    attendees: 1,
    experience: 'Realistic HR round, got valuable feedback on my answers.'
  },
  {
    id: 2,
    expert: {
      name: 'Mr. Arjun Patel',
      profilePic: '',
    },
    date: '2025-06-12',
    attendees: 1,
    experience: 'Challenging DSA questions, great for practice.'
  },
  {
    id: 3,
    expert: {
      name: 'Dr. Kavita Rao',
      profilePic: 'https://randomuser.me/api/portraits/women/55.jpg',
    },
    date: '2025-06-05',
    attendees: 1,
    experience: 'Behavioral interview tips were very helpful.'
  },
];

// Backend-ready code (commented for now):
// import React, { useState, useEffect } from 'react';
// const [pastInterviews, setPastInterviews] = useState([]);
// const [loading, setLoading] = useState(true);
// const [error, setError] = useState('');
// useEffect(() => {
//   const fetchPastInterviews = async () => {
//     setLoading(true);
//     setError('');
//     try {
//       const res = await fetch('/api/past-interview-sessions');
//       if (!res.ok) throw new Error('Failed to fetch past interviews');
//       const data = await res.json();
//       setPastInterviews(Array.isArray(data.sessions) ? data.sessions : []);
//     } catch (err) {
//       setError('Could not load past interviews.');
//     } finally {
//       setLoading(false);
//     }
//   };
//   fetchPastInterviews();
// }, []);

const PastInterviewSection = () => {
  // Backend-ready state (commented for now):
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState('');
  // const [pastInterviews, setPastInterviews] = useState([]);

  return (
    <section className="w-full flex flex-col items-center py-8 bg-green-100 border-t border-green-200">
      <h3 className="text-2xl font-bold text-green-800 mb-6">Past Mock Interview Sessions</h3>
      <div className="flex flex-wrap gap-6 justify-center w-full">
        {demoPastInterviews.map(session => (
          <div key={session.id} className="bg-white rounded-lg shadow p-5 flex flex-col w-full max-w-xs border border-green-100 relative">
            <div className="flex items-center mb-2">
              <img
                src={session.expert.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.expert.name)}&background=BBF7D0&color=166534&bold=true`}
                alt={session.expert.name}
                className="w-12 h-12 rounded-full object-cover border border-green-200"
              />
              <div className="ml-3">
                <div className="font-semibold text-green-800">{session.expert.name}</div>
                <div className="text-xs text-gray-500">{new Date(session.date).toLocaleDateString()}</div>
              </div>
            </div>
            <div className="text-gray-700 text-sm mb-1"><span role="img" aria-label="attendees">👥</span> {session.attendees} Attendee</div>
            <div className="text-gray-700 text-sm mb-1"><span role="img" aria-label="experience">📝</span> {session.experience}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PastInterviewSection;

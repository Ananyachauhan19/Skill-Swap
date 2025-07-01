import React, { useState } from 'react';

// Example static data for demo purposes
const demoPastGD = [
  {
    id: 1,
    expert: {
      name: 'Dr. Rohan Mehta',
      profilePic: 'https://randomuser.me/api/portraits/men/45.jpg',
    },
    date: '2025-06-20',
    attendees: 12,
    experience: 'Very interactive session, learned a lot about AI trends.'
  },
  {
    id: 2,
    expert: {
      name: 'Ananya Singh',
      profilePic: 'https://randomuser.me/api/portraits/women/33.jpg',
    },
    date: '2025-06-15',
    attendees: 9,
    experience: 'Great debate on communication skills, everyone participated.'
  },
  {
    id: 3,
    expert: {
      name: 'Prof. S. Kumar',
      profilePic: '',
    },
    date: '2025-06-10',
    attendees: 7,
    experience: 'Insightful coding discussion, practical examples shared.'
  },
];

// Backend-ready code (commented for now):
// import React, { useState, useEffect } from 'react';
// const [pastSessions, setPastSessions] = useState([]);
// const [loading, setLoading] = useState(true);
// const [error, setError] = useState('');
// useEffect(() => {
//   const fetchPastGD = async () => {
//     setLoading(true);
//     setError('');
//     try {
//       const res = await fetch('/api/past-group-discussions');
//       if (!res.ok) throw new Error('Failed to fetch past sessions');
//       const data = await res.json();
//       setPastSessions(Array.isArray(data.sessions) ? data.sessions : []);
//     } catch (err) {
//       setError('Could not load past sessions.');
//     } finally {
//       setLoading(false);
//     }
//   };
//   fetchPastGD();
// }, []);

const PastGDSection = () => {
  // Backend-ready state (commented for now):
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState('');
  // const [pastSessions, setPastSessions] = useState([]);

  return (
    <section className="w-full flex flex-col items-center py-8 bg-blue-100 border-t border-blue-200">
      <h3 className="text-2xl font-bold text-blue-800 mb-6">Past Group Discussion Sessions</h3>
      <div className="flex flex-wrap gap-6 justify-center w-full">
        {demoPastGD.map(session => (
          <div key={session.id} className="bg-white rounded-lg shadow p-5 flex flex-col w-full max-w-xs border border-blue-100 relative">
            <div className="flex items-center mb-2">
              <img
                src={session.expert.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.expert.name)}&background=E0E7FF&color=1E40AF&bold=true`}
                alt={session.expert.name}
                className="w-12 h-12 rounded-full object-cover border border-blue-200"
              />
              <div className="ml-3">
                <div className="font-semibold text-blue-800">{session.expert.name}</div>
                <div className="text-xs text-gray-500">{new Date(session.date).toLocaleDateString()}</div>
              </div>
            </div>
            <div className="text-gray-700 text-sm mb-1"><span role="img" aria-label="attendees">👥</span> {session.attendees} Attendees</div>
            <div className="text-gray-700 text-sm mb-1"><span role="img" aria-label="experience">📝</span> {session.experience}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PastGDSection;

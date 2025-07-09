import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from '../../../config.js';

const PastGDSection = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPastGD = async () => {
      setLoading(true);
      setError(null);
      try {
        // Replace with your backend API endpoint
        const res = await fetch(`${BACKEND_URL}/api/group-discussions/past`);
        if (!res.ok) throw new Error('Failed to fetch past group discussions');
        const data = await res.json();
        setSessions(data);
      } catch (err) {
        setError('Could not load past group discussions.');
      } finally {
        setLoading(false);
      }
    };
    fetchPastGD();
  }, []);

  return (
    <section className="w-full flex flex-col items-center py-12 bg-blue-50">
      <h3 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-8 text-center">Past Group Discussion Sessions</h3>
      {loading ? (
        <div className="text-blue-700 text-lg font-semibold py-12">Loading...</div>
      ) : error ? (
        <div className="text-red-600 text-lg font-semibold py-12">{error}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-center w-full max-w-7xl px-4">
          {sessions.length === 0 ? (
            <div className="col-span-full text-gray-500 text-center">No past group discussions found.</div>
          ) : (
            sessions.map(session => (
              <div
                key={session.id}
                className="bg-blue-50 rounded-xl shadow-md p-6 flex flex-col w-full max-w-xs border border-blue-200 relative transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <div className="flex items-center mb-3">
                  <picture>
                    <source srcSet={session.expert.profilePic ? `${session.expert.profilePic.replace('.jpg', '.webp')}` : ''} type="image/webp" />
                    <img
                      src={session.expert.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.expert.name)}&background=DBEAFE&color=1E40AF&bold=true`}
                      alt={session.expert.name}
                      className="w-12 h-12 rounded-full object-cover border border-blue-200"
                    />
                  </picture>
                  <div className="ml-3">
                    <div className="font-semibold text-blue-900 text-base">{session.expert.name}</div>
                    <div className="text-sm text-gray-700">{new Date(session.date).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="text-gray-700 text-sm mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {session.attendees} Attendees
                </div>
                <div className="text-gray-700 text-sm">
                  <svg className="w-5 h-5 text-blue-600 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l4-4h4a1.994 1.994 0 01-1.414.586z" />
                  </svg>
                  {session.experience}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
};

export default PastGDSection;
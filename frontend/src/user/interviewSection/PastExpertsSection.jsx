import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from '../../config.js';

const getProfilePic = (profilePic, name) => {
  if (profilePic) return profilePic;
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=DBEAFE&color=1E40AF&bold=true`;
};

const PastExpertsSection = () => {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${BACKEND_URL}/api/interview/past-experts`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch past experts');
        return res.json();
      })
      .then(data => setExperts(Array.isArray(data) ? data : []))
      .catch(() => setError('Could not load past experts.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="w-full bg-home-bg py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h4 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-2">Past Expert Interviewers</h4>
          <p className="text-center text-gray-600">Professionals who conducted mock interviews</p>
        </div>
        {loading ? (
          <div className="text-gray-600 py-12 text-center">Loading...</div>
        ) : error ? (
          <div className="text-red-600 py-12 text-center">{error}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {experts.length === 0 ? (
              <div className="col-span-full text-gray-500 text-center py-8">No data found</div>
            ) : (
              experts.map((expert, idx) => (
                <div key={idx} className="flex flex-col items-center bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 transition-colors">
                  <img
                    src={getProfilePic(expert.profilePic, expert.name)}
                    alt={expert.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-blue-200 mb-4"
                  />
                  <div className="font-semibold text-gray-900 text-center text-base mb-2">{expert.name}</div>
                  <div className="text-xs text-gray-600 text-center mb-3">{expert.miniBio}</div>
                  <div className="text-sm text-gray-700 text-center bg-blue-50 rounded-lg p-3 border border-blue-200 w-full">{expert.description}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default PastExpertsSection;

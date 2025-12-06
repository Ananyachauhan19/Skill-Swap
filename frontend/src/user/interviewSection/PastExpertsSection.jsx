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
    <section className="bg-gradient-to-br from-white via-blue-50/20 to-slate-50/50 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-5 lg:p-8 border border-slate-200/50 shadow-sm">
      <div className="mb-4 sm:mb-6">
        <h4 className="text-base sm:text-xl lg:text-2xl xl:text-3xl font-bold text-slate-900 text-center mb-1 sm:mb-2 tracking-tight">Past Expert Interviewers</h4>
        <p className="text-center text-slate-500 text-[10px] sm:text-xs lg:text-sm">Professionals who conducted mock interviews</p>
      </div>
      {loading ? (
        <div className="text-slate-600 py-12 text-center text-sm">Loading...</div>
      ) : error ? (
        <div className="text-red-600 py-12 text-center text-sm">{error}</div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
          {experts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="w-16 h-16 bg-blue-900/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-slate-500 text-sm">No data found</p>
            </div>
          ) : (
            experts.map((expert, idx) => (
              <div key={idx} className="flex flex-col items-center bg-white rounded-lg p-2 sm:p-3 lg:p-4 border border-slate-200/50 hover:border-blue-900/30 transition-all hover:shadow-lg">
                <img
                  src={getProfilePic(expert.profilePic, expert.name)}
                  alt={expert.name}
                  className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full object-cover border-2 border-blue-900/20 mb-2"
                />
                <div className="font-semibold text-slate-900 text-center text-[10px] sm:text-xs lg:text-sm mb-1 truncate w-full px-1">{expert.name}</div>
                <div className="text-[8px] sm:text-[10px] text-slate-600 text-center mb-2 line-clamp-2">{expert.miniBio}</div>
                <div className="text-[8px] sm:text-[10px] lg:text-xs text-slate-700 text-center bg-blue-900/5 rounded p-1.5 sm:p-2 border border-blue-900/10 w-full line-clamp-3">{expert.description}</div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
};

export default PastExpertsSection;

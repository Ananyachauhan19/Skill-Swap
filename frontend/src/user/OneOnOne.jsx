import React, { useState } from 'react';

const OneOnOne = () => {
  const [search, setSearch] = useState('');
  return (
    <div className="min-h-screen flex flex-col bg-blue-50">
      <div className="w-full flex justify-center pt-10 pb-6 bg-blue-50">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search for an expert, skill, or topic..."
          className="w-full max-w-xl px-5 py-3 rounded-full border border-blue-200 shadow focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg bg-white"
        />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg text-center">
          <h1 className="text-3xl font-bold mb-4">1-on-1 Live Session</h1>
          <p className="text-lg text-gray-700">Connect with an expert for a personalized, real-time learning experience. Coming soon!</p>
        </div>
      </div>
    </div>
  );
};

export default OneOnOne;
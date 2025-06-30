import React, { useEffect } from "react";

const GamificationStats = ({ credits, badges, rank }) => {
  // Simulate fetching gamification stats from backend
  useEffect(() => {
    // Example: fetchGamificationStats().then(({ credits, badges, rank }) => ...);
    // For now, static data is used from props
  }, []);

  return (
    <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col gap-4 items-center">
      {/* Credits and Rank in one row */}
      <div className="flex w-full justify-between items-center gap-8">
        <div className="flex flex-col items-center flex-1">
          <span className="text-lg font-bold text-blue-700">Credits</span>
          <span className="text-2xl font-extrabold text-blue-900">{credits}</span>
        </div>
        <div className="flex flex-col items-center flex-1">
          <span className="text-lg font-bold text-blue-700">Rank</span>
          <span className="text-xl font-bold text-blue-900">{rank}</span>
        </div>
      </div>
      {/* Badges below */}
      <div className="flex flex-col items-center w-full">
        <span className="text-lg font-bold text-blue-700">Badges</span>
        <div className="flex gap-2 mt-1 flex-wrap justify-center">
          {badges.length > 0 ? badges.map((b, i) => (
            <span key={i} className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">{b}</span>
          )) : <span className="text-gray-400">No badges yet</span>}
        </div>
      </div>
    </div>
  );
};

export default GamificationStats;

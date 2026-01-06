import React from 'react';

const CoinsBadges = ({ silver, gold, bronze = 0, profile }) => {
  const rank = profile?.rank || "Unranked";
  const badges = Array.isArray(profile?.badges) ? profile.badges : [];
  return (
    <div className="bg-transparent rounded-2xl border border-blue-100 p-3 sm:p-6 flex flex-col sm:flex-row gap-3 sm:gap-5"> 
      <div className="flex-1 bg-blue-50/70 p-3 sm:p-5 rounded-xl border border-blue-100 text-center min-w-[120px]">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <span className="text-lg sm:text-xl">🥈</span>
          <h3 className="text-sm sm:text-base font-semibold text-blue-900">Silver Skill Coins</h3>
        </div>
        <p className="text-lg sm:text-xl font-bold text-gray-800">{silver}</p>
      </div>
      <div className="flex-1 bg-blue-50/70 p-3 sm:p-5 rounded-xl border border-blue-100 text-center min-w-[120px]">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <span className="text-lg sm:text-xl">🥇</span>
          <h3 className="text-sm sm:text-base font-semibold text-yellow-700">Golden Skill Coins</h3>
        </div>
        <p className="text-lg sm:text-xl font-bold text-gray-800">{gold}</p>
      </div>
      <div className="flex-1 bg-blue-50/70 p-3 sm:p-5 rounded-xl border border-blue-100 text-center min-w-[120px]">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <span className="text-lg sm:text-xl">🥉</span>
          <h3 className="text-sm sm:text-base font-semibold text-orange-700">Bronze Skill Coins</h3>
        </div>
        <p className="text-lg sm:text-xl font-bold text-gray-800">{bronze}</p>
      </div>
      <div className="flex-1 bg-blue-50/70 p-3 sm:p-5 rounded-xl border border-blue-100 text-center min-w-[120px]">
        <h3 className="text-sm sm:text-base font-semibold text-blue-900">Rank</h3>
        <p className="text-lg sm:text-xl font-bold text-gray-800">{rank}</p>
      </div>
      <div className="flex-1 bg-blue-50/70 p-3 sm:p-5 rounded-xl border border-blue-100 text-center min-w-[120px]">
        <h3 className="text-sm sm:text-base font-semibold text-blue-900">Badges</h3>
        <p className="text-lg sm:text-xl font-bold text-gray-800">{badges.length}</p>
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 justify-center">
          {badges.map((badge, idx) => (
            <span key={idx} className="bg-blue-200/70 border border-blue-200 text-gray-800 text-[11px] sm:text-xs px-2 py-0.5 rounded-full">
              {badge}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CoinsBadges;
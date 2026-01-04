import React from 'react';

const CoinsBadges = ({ silver, gold, bronze = 0, profile }) => {
  const rank = profile?.rank || "Unranked";
  const badges = Array.isArray(profile?.badges) ? profile.badges : [];
  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-blue-100 p-4 sm:p-8 flex flex-col sm:flex-row gap-4 sm:gap-8`}> 
      <div className="flex-1 bg-blue-50 p-4 sm:p-6 rounded-lg text-center min-w-[120px]">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <span className="text-xl sm:text-2xl">🥈</span>
          <h3 className="text-base sm:text-lg font-semibold text-blue-900">Silver Skill Coins</h3>
        </div>
        <p className="text-xl sm:text-2xl font-bold text-gray-700">{silver}</p>
      </div>
      <div className="flex-1 bg-blue-50 p-4 sm:p-6 rounded-lg text-center min-w-[120px]">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <span className="text-xl sm:text-2xl">🥇</span>
          <h3 className="text-base sm:text-lg font-semibold text-yellow-700">Golden Skill Coins</h3>
        </div>
        <p className="text-xl sm:text-2xl font-bold text-gray-700">{gold}</p>
      </div>
      <div className="flex-1 bg-blue-50 p-4 sm:p-6 rounded-lg text-center min-w-[120px]">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <span className="text-xl sm:text-2xl">🥉</span>
          <h3 className="text-base sm:text-lg font-semibold text-orange-700">Bronze Skill Coins</h3>
        </div>
        <p className="text-xl sm:text-2xl font-bold text-gray-700">{bronze}</p>
      </div>
      <div className="flex-1 bg-blue-50 p-4 sm:p-6 rounded-lg text-center min-w-[120px]">
        <h3 className="text-base sm:text-lg font-semibold text-blue-900">Rank</h3>
        <p className="text-xl sm:text-2xl font-bold text-gray-700">{rank}</p>
      </div>
      <div className="flex-1 bg-blue-50 p-4 sm:p-6 rounded-lg text-center min-w-[120px]">
        <h3 className="text-base sm:text-lg font-semibold text-blue-900">Badges</h3>
        <p className="text-xl sm:text-2xl font-bold text-gray-700">{badges.length}</p>
        <div className="flex flex-wrap gap-2 sm:gap-3 mt-2 sm:mt-3 justify-center">
          {badges.map((badge, idx) => (
            <span key={idx} className="bg-blue-200 text-gray-700 text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full">
              {badge}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CoinsBadges;
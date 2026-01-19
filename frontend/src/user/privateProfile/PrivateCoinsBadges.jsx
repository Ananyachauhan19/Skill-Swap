import React from 'react';

const Stat = ({ label, value }) => {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-[11px] text-gray-600 font-medium">{label}</div>
      <div className="text-sm font-semibold text-gray-900 leading-5">{value}</div>
    </div>
  );
};

const PrivateCoinsBadges = ({ silver = 0, bronze = 0, rank = 'Unranked', badges = [] }) => {
  const badgeCount = Array.isArray(badges) ? badges.length : 0;

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg border border-blue-100 bg-transparent p-3">
          <Stat label="Silver Coins" value={silver} />
        </div>
        <div className="rounded-lg border border-blue-100 bg-transparent p-3">
          <Stat label="Bronze Coins" value={bronze} />
        </div>
        <div className="rounded-lg border border-blue-100 bg-transparent p-3">
          <Stat label="Rank" value={rank} />
        </div>
        <div className="rounded-lg border border-blue-100 bg-transparent p-3">
          <Stat label="Badges" value={badgeCount} />
          {badgeCount > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {badges.slice(0, 6).map((badge, idx) => (
                <span
                  key={`${badge}-${idx}`}
                  className="text-[10px] leading-4 px-2 py-0.5 rounded-full border border-blue-100 text-blue-900 bg-transparent"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrivateCoinsBadges;

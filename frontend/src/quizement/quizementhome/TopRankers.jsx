import React, { useMemo } from 'react';

const TopRankers = ({ leaders, loading, error }) => {
  const top3 = useMemo(() => leaders.slice(0, 3), [leaders]);
  const rest = useMemo(() => leaders.slice(3), [leaders]);

  const getInitials = (name) => name?.charAt(0).toUpperCase() || 'U';

  if (loading) {
    return (
      <div className="py-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-900 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return <div className="py-4 text-center text-sm text-red-600">{error}</div>;
  }

  if (leaders.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Top 3 Podium - 3D Design with reduced sizes */}
      {leaders.length > 0 && (
        <div className="flex items-end justify-center gap-3 mb-8 px-4">
          {/* 2nd Place */}
          {top3[1] && (
            <div className="flex flex-col items-center transform hover:scale-105 transition-transform duration-300">
              <div className="relative mb-2">
                {/* Medal/Badge on top */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-6 bg-gradient-to-br from-gray-200 to-gray-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-10">
                  <span className="text-white text-[10px] font-bold">2</span>
                </div>

                {/* Avatar with 3D effect */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full blur-md opacity-50"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-2xl border-3 border-white transform">
                    {top3[1].avatar ? (
                      <img src={top3[1].avatar} alt={top3[1].name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-white text-xl font-bold">{getInitials(top3[1].name)}</span>
                    )}
                  </div>
                  {/* 3D depth ring */}
                  <div className="absolute inset-0 rounded-full border-3 border-blue-300 opacity-30 transform translate-y-1"></div>
                </div>
              </div>

              {/* Info Card with 3D effect */}
              <div className="relative">
                <div className="absolute inset-0 bg-gray-200 rounded-xl blur-sm transform translate-y-1"></div>
                <div className="relative bg-white rounded-xl px-3 py-2 shadow-xl text-center min-w-[90px] border border-gray-100">
                  <div className="text-xs font-bold text-gray-900 truncate">{top3[1].name}</div>
                  <div className="text-[10px] text-gray-600 font-semibold">{top3[1].totalScore}</div>
                </div>
              </div>
            </div>
          )}

          {/* 1st Place - Taller */}
          {top3[0] && (
            <div className="flex flex-col items-center transform hover:scale-105 transition-transform duration-300 -mt-4">
              <div className="relative mb-2">
                {/* Crown on top */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shadow-xl border-2 border-white z-10">
                  <span className="text-xl">👑</span>
                </div>

                {/* Avatar with 3D effect - Larger */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full blur-lg opacity-50"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-yellow-400 transform">
                    {top3[0].avatar ? (
                      <img src={top3[0].avatar} alt={top3[0].name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-white text-2xl font-bold">{getInitials(top3[0].name)}</span>
                    )}
                  </div>
                  {/* 3D depth ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-yellow-300 opacity-30 transform translate-y-1"></div>
                </div>
              </div>

              {/* Info Card with 3D effect */}
              <div className="relative">
                <div className="absolute inset-0 bg-gray-200 rounded-xl blur-sm transform translate-y-1"></div>
                <div className="relative bg-white rounded-xl px-4 py-2.5 shadow-2xl text-center min-w-[100px] border border-yellow-200">
                  <div className="text-sm font-bold text-gray-900 truncate">{top3[0].name}</div>
                  <div className="text-xs text-gray-600 font-semibold">{top3[0].totalScore}</div>
                </div>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <div className="flex flex-col items-center transform hover:scale-105 transition-transform duration-300">
              <div className="relative mb-2">
                {/* Medal/Badge on top */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-6 bg-gradient-to-br from-orange-300 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-10">
                  <span className="text-white text-[10px] font-bold">3</span>
                </div>

                {/* Avatar with 3D effect */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full blur-md opacity-50"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl border-3 border-white transform">
                    {top3[2].avatar ? (
                      <img src={top3[2].avatar} alt={top3[2].name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-white text-xl font-bold">{getInitials(top3[2].name)}</span>
                    )}
                  </div>
                  {/* 3D depth ring */}
                  <div className="absolute inset-0 rounded-full border-3 border-indigo-300 opacity-30 transform translate-y-1"></div>
                </div>
              </div>

              {/* Info Card with 3D effect */}
              <div className="relative">
                <div className="absolute inset-0 bg-gray-200 rounded-xl blur-sm transform translate-y-1"></div>
                <div className="relative bg-white rounded-xl px-3 py-2 shadow-xl text-center min-w-[90px] border border-gray-100">
                  <div className="text-xs font-bold text-gray-900 truncate">{top3[2].name}</div>
                  <div className="text-[10px] text-gray-600 font-semibold">{top3[2].totalScore}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard List - All Remaining Positions */}
      {rest.length > 0 && (
        <div className="space-y-2">
          {rest.map((user) => (
            <div
              key={user.rank}
              className="bg-white rounded-lg px-4 py-3 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3"
            >
              <div className="text-lg font-bold text-gray-500 w-8">{user.rank}</div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-sm overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  getInitials(user.name)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-gray-900 truncate">{user.name}</div>
                <div className="text-xs text-gray-500">
                  Score: <span className="font-semibold text-gray-700">{user.totalScore}</span> •
                  Attempts: <span className="font-semibold text-gray-700">{user.attempts}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopRankers;

import React, { useState, useEffect } from 'react';
import { FaStar, FaVideo } from 'react-icons/fa';
import { BACKEND_URL } from '../../config.js';

const TopInterviewers = () => {
  const [topConducted, setTopConducted] = useState([]);
  const [topRequested, setTopRequested] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopInterviewers();
  }, []);

  const fetchTopInterviewers = async () => {
    setLoading(true);
    try {
      let res = await fetch(`${BACKEND_URL}/api/interview/my-interviews`, { credentials: 'include' });
      let list = [];
      
      if (res.ok) {
        const data = await res.json();
        list = Array.isArray(data) ? data : [];
      } else {
        res = await fetch(`${BACKEND_URL}/api/interview/requests`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          list = Array.isArray(data) ? data : [...(data.sent || []), ...(data.received || [])];
        }
      }

      if (!list || list.length === 0) {
        setTopConducted([]);
        setTopRequested([]);
        setLoading(false);
        return;
      }

      const byInterviewer = new Map();
      const byCandidate = new Map();
      const interviewerStatsMap = new Map();
      
      for (const r of list) {
        // Count interviewer conducted when status completed or scheduled/assigned
        const inter = r.assignedInterviewer && (r.assignedInterviewer._id || r.assignedInterviewer);
        if (inter) {
          byInterviewer.set(String(inter), (byInterviewer.get(String(inter)) || 0) + 1);
          // Store interviewer stats if available
          if (r.interviewerStats && !interviewerStatsMap.has(String(inter))) {
            interviewerStatsMap.set(String(inter), r.interviewerStats);
          }
        }
        const cand = r.requester && (r.requester._id || r.requester);
        if (cand) byCandidate.set(String(cand), (byCandidate.get(String(cand)) || 0) + 1);
      }
      // Build user maps from first occurrence
      const userMap = new Map();
      for (const r of list) {
        const interObj = r.assignedInterviewer && (typeof r.assignedInterviewer === 'object' ? r.assignedInterviewer : null);
        if (interObj && interObj._id && !userMap.has(String(interObj._id))) userMap.set(String(interObj._id), interObj);
        const candObj = r.requester && (typeof r.requester === 'object' ? r.requester : null);
        if (candObj && candObj._id && !userMap.has(String(candObj._id))) userMap.set(String(candObj._id), candObj);
      }
      const conductedArr = Array.from(byInterviewer.entries()).map(([id, count]) => {
        const stats = interviewerStatsMap.get(id);
        return {
          user: userMap.get(id) || { _id: id },
          count,
          avgRating: stats?.averageRating || 0,
          totalInterviews: stats?.conductedInterviews || count
        };
      });
      const requestedArr = Array.from(byCandidate.entries()).map(([id, count]) => ({ user: userMap.get(id) || { _id: id }, count }));
      conductedArr.sort((a, b) => b.count - a.count);
      requestedArr.sort((a, b) => b.count - a.count);
      setTopConducted(conductedArr.slice(0, 3));
      setTopRequested(requestedArr.slice(0, 3));
    } catch (error) {
      console.error('Failed to compute top interviewers:', error);
      setTopConducted([]);
      setTopRequested([]);
    } finally {
      setLoading(false);
    }
  };

  const getTrophyColor = (index) => {
    switch (index) {
      case 0: return { text: 'text-yellow-400', bg: 'from-yellow-400 to-yellow-600', icon: '🥇' }; // Gold
      case 1: return { text: 'text-gray-400', bg: 'from-gray-300 to-gray-500', icon: '🥈' }; // Silver
      case 2: return { text: 'text-orange-500', bg: 'from-orange-400 to-orange-600', icon: '🥉' }; // Bronze
      default: return { text: 'text-blue-600', bg: 'from-blue-400 to-blue-600', icon: '🏅' };
    }
  };

  const InterviewerCard = ({ person, index, type }) => {
    const trophy = getTrophyColor(index);
    
    return (
      <div
        className="relative bg-white rounded-2xl p-4 sm:p-6 border-2 border-[#93c5fd] shadow-md overflow-hidden"
      >
        {/* Rank Badge */}
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 text-2xl sm:text-4xl">{trophy.icon}</div>
        
        {/* Gradient accent */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#3b82f6] to-[#2563eb]`}></div>
        
        <div className="flex items-center gap-3 sm:gap-4 mb-4 relative z-10">
          <div className="relative flex-shrink-0">
            <div className={`absolute inset-0 bg-gradient-to-br from-[#3b82f6] to-[#2563eb] opacity-20 rounded-full blur-md`}></div>
            <img
              src={person.user?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.user?.firstName || person.user?.username || 'User')}&background=3b82f6&color=fff&bold=true`}
              alt={person.user?.firstName || person.user?.username || 'User'}
              className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-3 border-white shadow-lg ring-2 ring-[#3b82f6]"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm sm:text-lg font-bold text-[#1e3a8a] truncate">
              {person.user?.firstName || person.user?.username || 'N/A'} {person.user?.lastName || ''}
            </h4>
            <p className="text-xs sm:text-sm text-[#2563eb] font-semibold flex items-center gap-1">
              {type === 'conducted' ? '🎯 Top Interviewer' : '⭐ Top Candidate'}
            </p>
          </div>
        </div>

        <div className="space-y-2 sm:space-y-3 relative z-10">
          <div className="flex items-center justify-between p-2 sm:p-3 bg-[#f0f9ff] border border-[#93c5fd] rounded-lg sm:rounded-xl">
            <span className="text-xs sm:text-sm text-[#1e3a8a] font-bold flex items-center gap-1 sm:gap-2">
              <FaVideo className="text-[#3b82f6] text-xs sm:text-base" />
              <span className="hidden sm:inline">{type === 'conducted' ? 'Conducted' : 'Attended'}</span>
              <span className="sm:hidden">{type === 'conducted' ? 'Done' : 'Joined'}</span>
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#2563eb]">{person.count || 0}</span>
          </div>

          {person.avgRating > 0 && (
            <div className="flex items-center justify-between p-2 sm:p-3 bg-[#f0f9ff] border border-[#93c5fd] rounded-lg sm:rounded-xl">
              <span className="text-xs sm:text-sm text-[#1e3a8a] font-bold flex items-center gap-1 sm:gap-2">
                <FaStar className="text-[#3b82f6] text-xs sm:text-base" />
                Rating
              </span>
              <div className="flex items-center gap-0.5 sm:gap-1">
                <span className="text-lg sm:text-2xl font-black text-[#1e40af]">{person.avgRating.toFixed(1)}</span>
                <span className="text-xs sm:text-sm text-[#2563eb]">/5</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <section className="bg-white rounded-3xl p-4 sm:p-6 lg:p-10 shadow-lg mb-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#3b82f6] border-t-transparent"></div>
          <p className="text-[#4b5563] font-semibold mt-4 text-sm sm:text-base">Loading top performers...</p>
        </div>
      </section>
    );
  }

  if (topConducted.length === 0 && topRequested.length === 0) {
    return null;
  }

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#f0f9ff] via-[#e0f2fe] to-[#e0f2fe]">
      <div className="relative z-10 px-4 sm:px-8 lg:px-12 py-8 sm:py-12 flex flex-col gap-8 sm:gap-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 mb-4 sm:mb-6">
          <div className="flex items-center justify-center gap-2 sm:gap-3 w-full flex-wrap">
            <div className="w-6 sm:w-8 h-0.5 bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent rounded-full"></div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1e3a8a] text-center">
              🏆 Top Performers
            </h2>
            <div className="w-6 sm:w-8 h-0.5 bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent rounded-full"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Top Interviewers */}
          {topConducted.length > 0 && (
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 p-3 sm:p-4 bg-[#f0f9ff] border-2 border-[#93c5fd] rounded-xl sm:rounded-2xl">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#3b82f6] to-[#2563eb] rounded-lg sm:rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-lg flex-shrink-0">
                  🎯
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-[#1e3a8a]">Top Interviewers</h3>
                  <p className="text-xs sm:text-sm text-[#2563eb] truncate">Most experienced professionals</p>
                </div>
              </div>
              <div className="space-y-4">
                {topConducted.map((person, index) => (
                  <InterviewerCard key={person.user?._id || index} person={person} index={index} type="conducted" />
                ))}
              </div>
            </div>
          )}

          {/* Top Candidates */}
          {topRequested.length > 0 && (
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 p-3 sm:p-4 bg-[#f0f9ff] border-2 border-[#93c5fd] rounded-xl sm:rounded-2xl">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#3b82f6] to-[#2563eb] rounded-lg sm:rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-lg flex-shrink-0">
                  ⭐
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-[#1e3a8a]">Top Candidates</h3>
                  <p className="text-xs sm:text-sm text-[#2563eb] truncate">Most active seekers</p>
                </div>
              </div>
              <div className="space-y-4">
                {topRequested.map((person, index) => (
                  <InterviewerCard key={person.user?._id || index} person={person} index={index} type="requested" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TopInterviewers;

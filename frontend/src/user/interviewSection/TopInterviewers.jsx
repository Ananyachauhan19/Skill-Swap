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
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="absolute top-4 right-4 text-3xl">{trophy.icon}</div>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-shrink-0">
            <img
              src={person.user?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.user?.firstName || person.user?.username || 'User')}&background=3b82f6&color=fff&bold=true`}
              alt={person.user?.firstName || person.user?.username || 'User'}
              className="w-16 h-16 rounded-full object-cover border-2 border-blue-200"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-lg font-semibold text-gray-900 truncate">
              {person.user?.firstName || person.user?.username || 'N/A'} {person.user?.lastName || ''}
            </h4>
            <p className="text-sm text-gray-600 flex items-center gap-1">
              {type === 'conducted' ? 'Top Interviewer' : 'Top Candidate'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm text-gray-900 font-medium flex items-center gap-2">
              <FaVideo className="text-blue-600" />
              {type === 'conducted' ? 'Conducted' : 'Attended'}
            </span>
            <span className="text-xl font-bold text-blue-600">{person.count || 0}</span>
          </div>

          {person.avgRating > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm text-gray-900 font-medium flex items-center gap-2">
                <FaStar className="text-yellow-500" />
                Rating
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold text-gray-900">{person.avgRating.toFixed(1)}</span>
                <span className="text-sm text-gray-600">/5</span>
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
    <section className="bg-home-bg py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-2">
            Top Performers
          </h2>
          <p className="text-center text-gray-600 text-sm">Outstanding interviewers and active candidates</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {topConducted.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                  🎯
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Top Interviewers</h3>
                  <p className="text-sm text-gray-600">Most experienced professionals</p>
                </div>
              </div>
              <div className="space-y-4">
                {topConducted.map((person, index) => (
                  <InterviewerCard key={person.user?._id || index} person={person} index={index} type="conducted" />
                ))}
              </div>
            </div>
          )}

          {topRequested.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                  ⭐
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Top Candidates</h3>
                  <p className="text-sm text-gray-600">Most active seekers</p>
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

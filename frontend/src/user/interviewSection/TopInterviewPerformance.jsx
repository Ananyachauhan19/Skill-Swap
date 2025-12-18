import React, { useEffect, useState } from 'react';
import { BACKEND_URL } from '../../config.js';
import { FaStar } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const TopInterviewPerformance = () => {
  const [topInterviewers, setTopInterviewers] = useState([]);
  const [topCandidates, setTopCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/interview/top-performers`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch top performers');
        const data = await res.json();
        if (!mounted) return;
        setTopInterviewers(data.topInterviewers || []);
        setTopCandidates(data.topCandidates || []);
      } catch (e) {
        console.error('TopInterviewPerformance fetch error:', e);
        if (!mounted) return;
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchData();
    return () => { mounted = false; };
  }, []);

  const handleProfileClick = (user) => {
    const username = user?.username;
    const userId = user?._id;
    if (username) {
      navigate(`/profile/${username}`);
    } else if (userId) {
      navigate(`/profile/${userId}`);
    }
  };

  const PerformerCard = ({ person, type }) => {
    const name = `${person.user?.firstName || person.user?.username || 'User'}${person.user?.lastName ? ` ${person.user.lastName}` : ''}`;
    const avatar = person.user?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff&bold=true`;
    const company = person.user?.company || 'Company';
    const position = person.user?.position || type === 'interviewer' ? 'Interviewer' : 'Candidate';

    return (
      <div
        onClick={() => handleProfileClick(person.user)}
        className="relative bg-white rounded-sm border-2 border-gray-200 hover:border-brand-primary shadow-sm hover:shadow-lg transition-all duration-200 p-3 cursor-pointer overflow-hidden group"
      >
        {/* Background pattern design */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-brand-primary -translate-y-10 translate-x-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-brand-secondary translate-y-8 -translate-x-8"></div>
        </div>
        
        {/* Decorative lines */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-100 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-100 to-transparent"></div>
        
        {/* Side accent bars */}
        <div className="absolute top-3 right-0 w-1 h-12 bg-gradient-to-b from-brand-primary to-transparent opacity-30"></div>
        <div className="absolute bottom-3 left-0 w-1 h-12 bg-gradient-to-t from-brand-secondary to-transparent opacity-30"></div>
        
        {/* Avatar & Name */}
        <div className="flex items-start gap-2 mb-2 relative z-10">
          <img
            src={avatar}
            alt={name}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-blue-100 ring-1 ring-blue-50"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate leading-tight">
              {name}
            </h3>
          </div>
        </div>

        {/* Company & Position - Compact boxes */}
        <div className="space-y-1.5 mb-2 relative z-10">
          <div className="bg-gradient-to-r from-blue-50/50 to-transparent border-l-2 border-brand-primary/30 pl-2 py-1">
            <p className="text-[10px] text-gray-500 leading-none mb-0.5">Company</p>
            <p className="text-xs font-medium text-gray-900 leading-tight">{company}</p>
          </div>
          <div className="bg-gradient-to-r from-purple-50/50 to-transparent border-l-2 border-purple-400/30 pl-2 py-1">
            <p className="text-[10px] text-gray-500 leading-none mb-0.5">Position</p>
            <p className="text-xs font-medium text-gray-900 leading-tight">{position}</p>
          </div>
        </div>

        {/* Stats Row - Enhanced with backgrounds */}
        <div className="grid grid-cols-2 gap-2 mb-2 relative z-10">
          <div className="bg-blue-50/50 rounded px-2 py-1.5 border border-blue-100/50">
            <p className="text-[10px] text-gray-500 mb-0.5">Interviews</p>
            <p className="text-sm font-bold text-gray-900">{person.count || 0}</p>
          </div>
          <div className="bg-yellow-50/50 rounded px-2 py-1.5 border border-yellow-100/50">
            <p className="text-[10px] text-gray-500 mb-0.5">Rating</p>
            <div className="flex items-center gap-0.5">
              <FaStar className="text-yellow-400 text-[10px]" />
              <span className="text-sm font-bold text-gray-900">
                {person.avgRating ? person.avgRating.toFixed(1) : '0.0'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons - More compact */}
        <div className="space-y-1 relative z-10">
          <button className="w-full py-1.5 bg-gray-50 text-gray-700 rounded text-[11px] font-medium hover:bg-gray-100 transition-colors border border-gray-200">
            View Profile
          </button>
          <button className="w-full py-1.5 bg-yellow-50 text-yellow-700 rounded text-[11px] font-medium hover:bg-yellow-100 transition-colors flex items-center justify-center gap-1 border border-yellow-200">
            <FaStar className="text-yellow-500 text-[9px]" />
            See Feedback
          </button>
          <button className="w-full py-1.5 bg-brand-primary text-white rounded text-[11px] font-medium hover:bg-brand-primary/90 transition-colors">
            Book Session
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-3 border-gray-300 border-t-brand-primary"></div>
            <p className="text-gray-600 mt-4 text-sm">Loading top performers...</p>
          </div>
        </div>
      </section>
    );
  }

  const hasInterviewers = topInterviewers.length > 0;
  const hasCandidates = topCandidates.length > 0;

  if (!hasInterviewers && !hasCandidates) return null;

  return (
    <section className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Top Performers
          </h2>
          <p className="text-gray-600">
            Outstanding interviewers and active candidates
          </p>
        </div>

        {/* Top Interviewers Section */}
        {hasInterviewers && (
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Top Interviewers</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topInterviewers.slice(0, 3).map((person, index) => (
                <PerformerCard key={person.user?._id || index} person={person} index={index} type="interviewer" />
              ))}
            </div>
          </div>
        )}

        {/* Top Candidates Section */}
        {hasCandidates && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Top Candidates</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topCandidates.slice(0, 3).map((person, index) => (
                <PerformerCard key={person.user?._id || index} person={person} index={index} type="candidate" />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default TopInterviewPerformance;

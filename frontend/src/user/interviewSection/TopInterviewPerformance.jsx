import React, { useEffect, useState } from 'react';
import { BACKEND_URL } from '../../config.js';
import { FaStar, FaAward } from 'react-icons/fa';
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

  const InterviewerCard = ({ person, rank }) => {
    const name = `${person.user?.firstName || person.user?.username || 'User'}${person.user?.lastName ? ` ${person.user.lastName}` : ''}`;
    const avatar = person.user?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e40af&color=fff&bold=true`;
    const company = person.company || 'Company not specified';
    const position = person.position || 'Position not specified';
    const feedbackSummary = person.avgRating ? `${person.avgRating.toFixed(1)} ⭐ (${person.count} interviews)` : 'No feedback yet';

    return (
      <div className="relative bg-white rounded-lg border border-gray-200 hover:border-blue-500 shadow-sm hover:shadow-md transition-all duration-300 p-2 sm:p-3 lg:p-4 group">
        {/* Top-left corner edge design */}
        <div className="absolute top-0 left-0 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 border-t-4 border-l-4 border-blue-600 rounded-tl-lg"></div>
        
        {/* Rank Badge */}
        <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full">
          #{rank}
        </div>

        {/* Profile Section */}
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 mt-2">
          <img
            src={avatar}
            alt={name}
            className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full object-cover border-2 border-gray-200"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-black truncate">{name}</h3>
          </div>
        </div>

        {/* Company */}
        <div className="mb-1.5 sm:mb-2">
          <p className="text-[10px] sm:text-xs text-gray-500">Company</p>
          <p className="text-xs sm:text-sm font-semibold text-black truncate">{company}</p>
        </div>

        {/* Position */}
        <div className="mb-1.5 sm:mb-2">
          <p className="text-[10px] sm:text-xs text-gray-500">Position</p>
          <p className="text-xs sm:text-sm font-semibold text-black truncate">{position}</p>
        </div>

        {/* Feedback Summary */}
        <div className="mb-2 sm:mb-3 pb-2 sm:pb-3 border-b border-gray-100">
          <p className="text-[10px] sm:text-xs text-gray-500 mb-1">Feedback</p>
          <div className="flex items-center gap-1">
            <FaStar className="text-yellow-500 text-[10px] sm:text-xs" />
            <p className="text-[10px] sm:text-xs text-gray-700 truncate">{feedbackSummary}</p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => handleProfileClick(person.user)}
          className="w-full py-1.5 sm:py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-md text-[10px] sm:text-xs lg:text-sm font-medium transition-colors"
        >
          View Profile
        </button>
      </div>
    );
  };

  const CandidateCard = ({ person, rank }) => {
    const name = `${person.user?.firstName || person.user?.username || 'User'}${person.user?.lastName ? ` ${person.user.lastName}` : ''}`;
    const avatar = person.user?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e40af&color=fff&bold=true`;
    const company = person.company || 'Various companies';
    const position = person.position || 'Multiple positions';

    return (
      <div className="relative bg-white rounded-lg border border-gray-200 hover:border-blue-500 shadow-sm hover:shadow-md transition-all duration-300 p-2 sm:p-3 lg:p-4 group">
        {/* Top-left corner edge design */}
        <div className="absolute top-0 left-0 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 border-t-4 border-l-4 border-blue-600 rounded-tl-lg"></div>
        
        {/* Rank Badge */}
        <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full">
          #{rank}
        </div>

        {/* Profile Section */}
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 mt-2">
          <img
            src={avatar}
            alt={name}
            className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full object-cover border-2 border-gray-200"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-black truncate">{name}</h3>
          </div>
        </div>

        {/* Most Applied Company */}
        <div className="mb-1.5 sm:mb-2">
          <p className="text-[10px] sm:text-xs text-gray-500">Most Applied Company</p>
          <p className="text-xs sm:text-sm font-semibold text-black truncate">{company}</p>
        </div>

        {/* Applied Position */}
        <div className="mb-3 sm:mb-4">
          <p className="text-[10px] sm:text-xs text-gray-500">Applied Position</p>
          <p className="text-xs sm:text-sm font-semibold text-black truncate">{position}</p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => handleProfileClick(person.user)}
          className="w-full py-1.5 sm:py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-md text-[10px] sm:text-xs lg:text-sm font-medium transition-colors"
        >
          View Profile
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-800"></div>
            <p className="text-gray-600 mt-3 text-sm">Loading top performers...</p>
          </div>
        </div>
      </section>
    );
  }

  const hasInterviewers = topInterviewers.length > 0;
  const hasCandidates = topCandidates.length > 0;

  if (!hasInterviewers && !hasCandidates) return null;

  return (
    <section className="bg-gradient-to-br from-gray-50 to-white rounded-lg shadow-sm border border-gray-200 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Centered Main Heading */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-black mb-2">
            Top Performers of Interviews
          </h1>
          <p className="text-gray-600 text-sm">
            Meet our outstanding interviewers and active candidates
          </p>
        </div>

        {/* Top Interviewers Section - 3 Cards in Single Row */}
        {hasInterviewers && (
          <div className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-black mb-1 flex items-center gap-2">
                <FaAward className="text-blue-600 text-xl" />
                Top Interviewers
              </h2>
              <p className="text-sm text-gray-500">Our most experienced interviewers</p>
            </div>
            
            <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
              {topInterviewers.slice(0, 3).map((person, index) => (
                <InterviewerCard key={person.user?._id || index} person={person} rank={index + 1} />
              ))}
            </div>
          </div>
        )}

        {/* Top Candidates Section - 3 Cards in Single Row */}
        {hasCandidates && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-black mb-1 flex items-center gap-2">
                <FaAward className="text-blue-600 text-xl" />
                Top Candidates
              </h2>
              <p className="text-sm text-gray-500">Most active candidates on the platform</p>
            </div>
            
            <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
              {topCandidates.slice(0, 3).map((person, index) => (
                <CandidateCard key={person.user?._id || index} person={person} rank={index + 1} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default TopInterviewPerformance;
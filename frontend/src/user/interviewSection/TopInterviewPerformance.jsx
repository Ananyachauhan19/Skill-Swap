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
    const company = person.user?.company || 'Not specified';
    const position = person.user?.position || 'Not specified';

    return (
      <div
        onClick={() => handleProfileClick(person.user)}
        className="relative bg-white rounded border border-gray-200 hover:border-blue-400 shadow-sm hover:shadow-md transition-all duration-200 p-3 cursor-pointer overflow-hidden group"
      >
        {/* Subtle background decoration */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-blue-500 -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-purple-500 translate-y-12 -translate-x-12"></div>
        </div>
        
        {/* Avatar & Name Section */}
        <div className="flex items-center gap-3 mb-3 relative z-10">
          <img
            src={avatar}
            alt={name}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-gray-200"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {name}
            </h3>
          </div>
        </div>

        {/* Company Section */}
        <div className="mb-2 relative z-10 border-l-2 border-blue-500 pl-2">
          <p className="text-xs text-gray-500 mb-0.5">Company</p>
          <p className="text-sm font-medium text-gray-900">{company}</p>
        </div>

        {/* Position Section */}
        <div className="mb-3 relative z-10 border-l-2 border-blue-500 pl-2">
          <p className="text-xs text-gray-500 mb-0.5">Position</p>
          <p className="text-sm font-medium text-gray-900">{position}</p>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between mb-0.5 relative z-10">
          <p className="text-xs text-gray-500">Interviews</p>
          <p className="text-xs text-gray-500">Rating</p>
        </div>

        <div className="flex items-center justify-between mb-3 relative z-10">
          <p className="text-lg font-semibold text-gray-900">{person.count || 0}</p>
          <div className="flex items-center gap-1">
            <FaStar className="text-yellow-400 text-xs" />
            <span className="text-lg font-semibold text-gray-900">
              {person.avgRating ? person.avgRating.toFixed(1) : '0.0'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-1.5 relative z-10">
          <button className="w-full py-1.5 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200 transition-colors">
            View Profile
          </button>
          <button className="w-full py-1.5 bg-yellow-50 text-yellow-700 rounded text-xs font-medium hover:bg-yellow-100 transition-colors flex items-center justify-center gap-1">
            <FaStar className="text-yellow-500 text-[10px]" />
            See Feedback
          </button>
          <button className="w-full py-1.5 bg-brand-primary text-white rounded text-xs font-medium hover:bg-brand-primary/90 transition-colors">
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

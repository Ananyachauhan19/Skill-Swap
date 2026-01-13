import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import { BACKEND_URL } from '../../config.js';
import { useAuth } from '../../context/AuthContext';
import InterviewerCard from './InterviewerCard';

function BrowseInterviewersSection({ onBookSession }) {
  const [allInterviewers, setAllInterviewers] = useState([]);
  const [searchMode, setSearchMode] = useState('company');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);
  const [modalSearchText, setModalSearchText] = useState('');
  const navigate = useNavigate();

  // Load all interviewers on mount
  const { user } = useAuth();
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${BACKEND_URL}/api/interview/interviewers`, { credentials: 'include' });
        if (!res.ok) { setAllInterviewers([]); return; }
        const data = await res.json();
        let filtered = data || [];
        // Exclude current user from the list
        const currentUserId = user?._id;
        if (currentUserId) {
          filtered = filtered.filter(m => {
            const interviewerUserId = m.user?._id || m.user;
            return String(interviewerUserId) !== String(currentUserId);
          });
        }
        if (searchText.trim()) {
          const lower = searchText.toLowerCase();
          filtered = filtered.filter(m => {
            if (searchMode === 'company') {
              const cName = m.application?.company || m.user?.college || '';
              return cName.toLowerCase().includes(lower);
            } else {
              const pos = m.application?.position || m.application?.qualification || '';
              return pos.toLowerCase().includes(lower);
            }
          });
        }
        setAllInterviewers(filtered);
      } catch (e) {
        console.error('Failed to load interviewers', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [searchText, searchMode, user?._id]);

  const modalFilteredInterviewers = useMemo(() => {
    const query = modalSearchText.trim();
    if (!query) return allInterviewers;
    const term = query.toLowerCase();
    return allInterviewers.filter(m => {
      const firstName = (m.user?.firstName || '').toLowerCase();
      const lastName = (m.user?.lastName || '').toLowerCase();
      const username = (m.user?.username || '').toLowerCase();
      const company = (m.application?.company || '').toLowerCase();
      const position = (m.application?.position || '').toLowerCase();
      const qualification = (m.application?.qualification || '').toLowerCase();

      return (
        firstName.includes(term) ||
        lastName.includes(term) ||
        username.includes(term) ||
        company.includes(term) ||
        position.includes(term) ||
        qualification.includes(term)
      );
    });
  }, [modalSearchText, allInterviewers]);

  return (
    <section className="bg-gradient-to-br from-white via-blue-50/20 to-slate-50/50 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-5 lg:p-8 border border-slate-200/50 shadow-sm">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-1 sm:mb-2 tracking-tight">
          Browse Expert Interviewers
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
          Discover and connect with approved experts for your mock interview sessions
        </p>
      </div>

      {/* Search Controls */}
      <div className="bg-white rounded-lg p-3 sm:p-4 border border-slate-200/50 mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder={`Search by ${searchMode}...`}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none hover:border-slate-400 transition-colors text-sm"
          />
          <select
            value={searchMode}
            onChange={e => setSearchMode(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none bg-white hover:border-slate-400 transition-colors"
          >
            <option value="company">Company</option>
            <option value="position">Position</option>
          </select>
        </div>
      </div>

      {/* Interviewers Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : allInterviewers.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-slate-600 text-sm">No interviewers found matching your criteria</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
            {allInterviewers.slice(0, 4).map((m) => (
              <InterviewerCard key={m.application?._id || m.user?._id} interviewer={m} onBookSession={onBookSession} navigate={navigate} />
            ))}
          </div>
          
          {allInterviewers.length > 4 && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setShowAllModal(true)}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-900 to-blue-800 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-2 text-sm"
              >
                View More Interviewers ({allInterviewers.length - 4} more)
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}

          {/* View All Interviewers Modal */}
          {showAllModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAllModal(false)}>
              <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-blue-900 text-white p-4 sm:p-6 rounded-t-xl flex items-center justify-between z-10">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold">All Expert Interviewers</h3>
                    <p className="text-blue-100 text-sm mt-1">{allInterviewers.length} approved professionals</p>
                  </div>
                  <button 
                    onClick={() => setShowAllModal(false)} 
                    className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <FaTimes size={20} />
                  </button>
                </div>
                
                <div className="p-3 sm:p-6 overflow-y-auto space-y-4" style={{ maxHeight: 'calc(90vh - 120px)' }}>
                  {/* Modal search bar for interviewer name / company / position */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={modalSearchText}
                      onChange={e => setModalSearchText(e.target.value)}
                      placeholder="Search interviewer by name, company, or position..."
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none hover:border-slate-400 transition-colors text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                    {modalFilteredInterviewers.map((m) => (
                      <InterviewerCard key={m.application?._id || m.user?._id} interviewer={m} onBookSession={onBookSession} navigate={navigate} onModalAction={() => setShowAllModal(false)} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default BrowseInterviewersSection;

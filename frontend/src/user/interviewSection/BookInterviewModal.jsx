import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import { AnimatePresence } from 'framer-motion';
import { FaTimes, FaCheckCircle, FaStar } from 'react-icons/fa';
import { BACKEND_URL } from '../../config.js';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ToastContext';
import { COMPANIES, POSITIONS } from '../../constants/interviewData';

function BookInterviewModal({ isOpen, onClose, preSelectedInterviewer, preFilledData }) {
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [matchedInterviewers, setMatchedInterviewers] = useState([]);
  const [selectedInterviewer, setSelectedInterviewer] = useState('');
  const { user } = useAuth() || {};
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Pre-select interviewer when provided
  useEffect(() => {
    if (preSelectedInterviewer) {
      setSelectedInterviewer(String(preSelectedInterviewer.user?._id || ''));
      setMatchedInterviewers([preSelectedInterviewer]);
    }
  }, [preSelectedInterviewer]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Small delay to avoid visual glitch
      setTimeout(() => {
        if (!isOpen) {
          setCompany('');
          setPosition('');
          setMessage('');
          setSelectedInterviewer('');
          setMatchedInterviewers([]);
        }
      }, 300);
    }
  }, [isOpen]);

  // Dropdown states
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showPositionDropdown, setShowPositionDropdown] = useState(false);
  const [highlightedCompanyIdx, setHighlightedCompanyIdx] = useState(-1);
  const [highlightedPositionIdx, setHighlightedPositionIdx] = useState(-1);
  const companyInputRef = useRef();
  const positionInputRef = useRef();

  // Fuse.js instances for fuzzy search
  const fuseCompanies = useMemo(() => {
    return new Fuse(COMPANIES, {
      threshold: 0.3,
      distance: 100,
      keys: ['']
    });
  }, []);

  const fusePositions = useMemo(() => {
    return new Fuse(POSITIONS, {
      threshold: 0.3,
      distance: 100,
      keys: ['']
    });
  }, []);

  // Filtered lists using Fuse.js
  const companyList = useMemo(() => {
    if ((company || '').trim() === '') return COMPANIES;
    const results = fuseCompanies.search(company);
    return results.map(result => result.item);
  }, [company, fuseCompanies]);

  const positionList = useMemo(() => {
    if ((position || '').trim() === '') return POSITIONS;
    const results = fusePositions.search(position);
    return results.map(result => result.item);
  }, [position, fusePositions]);

  // Keyboard navigation for company
  const handleCompanyKeyDown = (e) => {
    if (!showCompanyDropdown || companyList.length === 0) return;
    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      setHighlightedCompanyIdx(idx => (idx + 1) % companyList.length);
    } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault();
      setHighlightedCompanyIdx(idx => (idx - 1 + companyList.length) % companyList.length);
    } else if (e.key === 'Enter') {
      if (highlightedCompanyIdx >= 0 && highlightedCompanyIdx < companyList.length) {
        setCompany(companyList[highlightedCompanyIdx]);
        setShowCompanyDropdown(false);
        setHighlightedCompanyIdx(-1);
      }
    }
  };

  // Keyboard navigation for position
  const handlePositionKeyDown = (e) => {
    if (!showPositionDropdown || positionList.length === 0) return;
    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      setHighlightedPositionIdx(idx => (idx + 1) % positionList.length);
    } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault();
      setHighlightedPositionIdx(idx => (idx - 1 + positionList.length) % positionList.length);
    } else if (e.key === 'Enter') {
      if (highlightedPositionIdx >= 0 && highlightedPositionIdx < positionList.length) {
        setPosition(positionList[highlightedPositionIdx]);
        setShowPositionDropdown(false);
        setHighlightedPositionIdx(-1);
      }
    }
  };

  const handleSubmit = async () => {
    if (!company || !position) {
      addToast({
        title: 'Missing details',
        message: 'Please enter both the company name and the role.',
        variant: 'warning',
        timeout: 3500,
      });
      return;
    }
    
    // Store values before clearing
    const requestCompany = company;
    const requestPosition = position;
    const requestMessage = message;
    const requestInterviewer = selectedInterviewer;
    
    // Close modal immediately for better UX
    onClose();
    
    // Reset form state immediately
    setCompany('');
    setPosition('');
    setMessage('');
    setMatchedInterviewers([]);
    setSelectedInterviewer('');
    
    // Show immediate feedback that request is being processed
    addToast({
      title: 'Submitting Request...',
      message: `Processing your interview request for ${requestCompany} — ${requestPosition}`,
      variant: 'info',
      timeout: 2000,
    });
    
    // Make API call
    try {
      const res = await fetch(`${BACKEND_URL}/api/interview/create`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          company: requestCompany, 
          position: requestPosition, 
          message: requestMessage, 
          assignedInterviewer: requestInterviewer || undefined 
        }),
      });
      let json = null;
      try { json = await res.json(); } catch (_) { /* non-json response */ }
      if (!res.ok) throw new Error((json && json.message) || (await res.text()) || 'Failed to request');

      // Success - show feedback to user
      addToast({
        title: 'Request Sent Successfully',
        message: `Your mock interview request for ${requestCompany} — ${requestPosition} was submitted successfully.`,
        variant: 'success',
        timeout: 5000,
        actions: [
          {
            label: 'View Requests',
            variant: 'primary',
            onClick: () => navigate('/session-requests?tab=interview&view=sent'),
          },
        ],
      });
    } catch (err) {
      console.error(err);
      addToast({
        title: 'Request failed',
        message: err?.message || 'Unable to submit your interview request. Please try again.',
        variant: 'error',
        timeout: 4500,
      });
    }
  };

  useEffect(() => {
    const fetchMatched = async () => {
      // If there's a preselected interviewer (coming from an interviewer card),
      // show only that interviewer in the list instead of generic recommendations.
      if (preSelectedInterviewer) {
        setMatchedInterviewers([preSelectedInterviewer]);
        return;
      } else {
        // Normal behavior when no preselected interviewer
        if (!company && !position) { setMatchedInterviewers([]); return; }
        try {
          const q = new URLSearchParams({ company: company || '', position: position || '' }).toString();
          const res = await fetch(`${BACKEND_URL}/api/interview/interviewers?${q}`, { credentials: 'include' });
          if (!res.ok) return setMatchedInterviewers([]);
          const data = await res.json();
          setMatchedInterviewers(data || []);
        } catch (e) {
          console.error('Failed to fetch interviewers', e);
          setMatchedInterviewers([]);
        }
      }
    };
    const t = setTimeout(fetchMatched, 400);
    return () => clearTimeout(t);
  }, [company, position, preSelectedInterviewer]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-blue-900 text-white p-6 rounded-t-xl flex items-center justify-between z-10">
            <h3 className="text-xl font-bold">
              Request Mock Interview
            </h3>
            <button onClick={onClose} className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors">
              <FaTimes size={18} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-slate-600 text-sm">Fill in the details below to request a mock interview session with an expert</p>
            
            <>
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-semibold text-slate-900 mb-2">Company Name *</label>
                <input
                  ref={companyInputRef}
                  type="text"
                  value={company}
                  onChange={e => {
                    setCompany(e.target.value);
                    setShowCompanyDropdown(true);
                    setHighlightedCompanyIdx(-1);
                  }}
                  onFocus={() => setShowCompanyDropdown(true)}
                  onBlur={() => setTimeout(() => { setShowCompanyDropdown(false); setHighlightedCompanyIdx(-1); }, 150)}
                  onKeyDown={handleCompanyKeyDown}
                  placeholder="Search company..."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-sm outline-none hover:border-slate-400 transition-colors"
                  autoComplete="off"
                />
                {showCompanyDropdown && companyList.length > 0 && (
                  <ul className="absolute z-20 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-2">
                    {companyList.map((c, idx) => (
                      <li
                        key={idx}
                        className={`px-4 py-2.5 text-slate-700 hover:bg-blue-50 cursor-pointer text-sm transition-colors ${highlightedCompanyIdx === idx ? 'bg-blue-100' : ''}`}
                        onMouseDown={() => {
                          setCompany(c);
                          setShowCompanyDropdown(false);
                          setHighlightedCompanyIdx(-1);
                        }}
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-semibold text-slate-900 mb-2">Position *</label>
                <input
                  ref={positionInputRef}
                  type="text"
                  value={position}
                  onChange={e => {
                    setPosition(e.target.value);
                    setShowPositionDropdown(true);
                    setHighlightedPositionIdx(-1);
                  }}
                  onFocus={() => setShowPositionDropdown(true)}
                  onBlur={() => setTimeout(() => { setShowPositionDropdown(false); setHighlightedPositionIdx(-1); }, 150)}
                  onKeyDown={handlePositionKeyDown}
                  placeholder="Search position..."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-sm outline-none hover:border-slate-400 transition-colors"
                  autoComplete="off"
                />
                {showPositionDropdown && positionList.length > 0 && (
                  <ul className="absolute z-20 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-2">
                    {positionList.map((p, idx) => (
                      <li
                        key={idx}
                        className={`px-4 py-2.5 text-slate-700 hover:bg-blue-50 cursor-pointer text-sm transition-colors ${highlightedPositionIdx === idx ? 'bg-blue-100' : ''}`}
                        onMouseDown={() => {
                          setPosition(p);
                          setShowPositionDropdown(false);
                          setHighlightedPositionIdx(-1);
                        }}
                      >
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-900 mb-2 block">
                  Additional Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Any specific topics or areas you'd like to focus on..."
                  rows="4"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-sm outline-none resize-none hover:border-slate-400 transition-colors"
                />
              </div>

              {matchedInterviewers && matchedInterviewers.length > 0 && (
                <div className="bg-blue-900/5 p-4 rounded-lg border border-blue-900/10">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">
                    {preSelectedInterviewer ? 'Selected Interviewer' : 'Recommended Interviewers'}
                  </h4>
                  {!preSelectedInterviewer && (
                    <p className="text-xs text-slate-600 mb-3">
                      💡 <strong>Tip:</strong> If you don't select an interviewer, our admin will assign a suitable expert for you.
                    </p>
                  )}
                  <div className="space-y-2">{matchedInterviewers.filter(m => m.user && m.user._id).map((m) => (
                      <label
                        key={m.application._id}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedInterviewer === String(m.user._id)
                            ? 'bg-blue-900 text-white'
                            : 'bg-white hover:bg-blue-50 border border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="radio"
                            name="selectedInterviewer"
                            value={m.user._id}
                            checked={selectedInterviewer === String(m.user._id)}
                            onChange={() => setSelectedInterviewer(String(m.user._id))}
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <div className="font-semibold flex items-center gap-2">
                              {m.user?.firstName || m.user?.username} {m.user?.lastName || ''}
                              {m.stats && m.stats.averageRating > 0 && (
                                <span className={`flex items-center gap-1 text-xs ${
                                  selectedInterviewer === String(m.user._id) ? 'text-yellow-300' : 'text-yellow-500'
                                }`}>
                                  <FaStar className="text-xs" />
                                  {m.stats.averageRating.toFixed(1)}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 text-sm">
                              <div>
                                <div className={`${selectedInterviewer === String(m.user._id) ? 'text-blue-100' : 'text-gray-500'}`}>Company</div>
                                <div className={`${selectedInterviewer === String(m.user._id) ? 'text-blue-50' : 'text-gray-800'} font-medium`}>{m.application?.company || m.user?.college || '—'}</div>
                              </div>
                              <div>
                                <div className={`${selectedInterviewer === String(m.user._id) ? 'text-blue-100' : 'text-gray-500'}`}>Position</div>
                                <div className={`${selectedInterviewer === String(m.user._id) ? 'text-blue-50' : 'text-gray-800'} font-medium`}>{m.application?.position || m.application?.qualification || '—'}</div>
                              </div>
                              <div>
                                <div className={`${selectedInterviewer === String(m.user._id) ? 'text-blue-100' : 'text-gray-500'}`}>Total Interviews</div>
                                <div className={`${selectedInterviewer === String(m.user._id) ? 'text-blue-50' : 'text-gray-800'} font-medium`}>{m.stats?.conductedInterviews || 0}</div>
                              </div>
                              <div>
                                <div className={`${selectedInterviewer === String(m.user._id) ? 'text-blue-100' : 'text-gray-500'}`}>Overall Rating</div>
                                <div className={`flex items-center gap-1 ${selectedInterviewer === String(m.user._id) ? 'text-blue-50' : 'text-gray-800'} font-medium`}>
                                  <FaStar className={`${selectedInterviewer === String(m.user._id) ? 'text-yellow-300' : 'text-yellow-500'}`} />
                                  {(m.stats?.averageRating || 0).toFixed(1)}
                                </div>
                              </div>
                            </div>
                            <div className={`text-xs mt-2 flex items-center gap-3 ${selectedInterviewer === String(m.user._id) ? 'text-blue-200' : 'text-gray-500'}`}>
                              {m.stats?.totalRatings > 0 && (
                                <span>
                                  • Total : {m.stats.totalRatings} rating{m.stats.totalRatings !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {selectedInterviewer === String(m.user._id) && (
                          <FaCheckCircle className="text-white" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Show message when no interviewers match but company/position entered */}
              {company && position && (!matchedInterviewers || matchedInterviewers.length === 0) && !preSelectedInterviewer && (
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-800">
                    <strong>No interviewers found for this combination.</strong> Don't worry! You can still submit your request, and our admin will assign a suitable interviewer for you.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !company || !position}
                className="flex-1 px-6 py-3 bg-blue-900 text-white rounded-lg font-medium hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
            </>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
}

export default BookInterviewModal;

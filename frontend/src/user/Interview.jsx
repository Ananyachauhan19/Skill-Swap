/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Fuse from 'fuse.js';
import { FaTimes, FaCheckCircle, FaUserTie, FaCalendarAlt, FaComment, FaClock, FaStar, FaVideo } from 'react-icons/fa';
import { BACKEND_URL } from "../config.js";
import { useAuth } from "../context/AuthContext";
import { COMPANIES, POSITIONS } from "../constants/interviewData";
import StatsSection from "./interviewSection/StatsSection";
import PastInterviewsPreview from "./interviewSection/PastInterviewsPreview";
import TopInterviewers from "./interviewSection/TopInterviewers";
import FAQSection from "./interviewSection/FAQ";


const howItWorksSteps = [
  {
    icon: <FaCalendarAlt className="w-8 h-8" />, 
    title: "📅 Book Interview",
    desc: "Choose your domain and schedule with an expert interviewer",
    emoji: "📅",
    bgGradient: "from-[#3b82f6] to-[#2563eb]",
    lightBg: "from-[#dbeafe] to-[#bfdbfe]",
    borderColor: "border-[#93c5fd]",
    textColor: "text-[#1e40af]"
  },
  {
    icon: <FaVideo className="w-8 h-8" />, 
    title: "🎥 Live Session",
    desc: "Attend a real-time mock interview and get actionable feedback",
    emoji: "🎥",
    bgGradient: "from-[#2563eb] to-[#1e40af]",
    lightBg: "from-[#bfdbfe] to-[#93c5fd]",
    borderColor: "border-[#60a5fa]",
    textColor: "text-[#1e3a8a]"
  },
  {
    icon: <FaCheckCircle className="w-8 h-8" />, 
    title: "✅ Get Evaluated",
    desc: "Receive detailed feedback and improvement suggestions",
    emoji: "✅",
    bgGradient: "from-[#1e40af] to-[#1e3a8a]",
    lightBg: "from-[#93c5fd] to-[#60a5fa]",
    borderColor: "border-[#3b82f6]",
    textColor: "text-[#1e3a8a]"
  },
  {
    icon: <FaClock className="w-8 h-8" />, 
    title: "💰 ₹500 Session",
    desc: "Affordable pricing for quality interview preparation",
    emoji: "💰",
    bgGradient: "from-[#3b82f6] to-[#2563eb]",
    lightBg: "from-[#dbeafe] to-[#bfdbfe]",
    borderColor: "border-[#60a5fa]",
    textColor: "text-[#1e40af]"
  },
];

const HowItWorks = () => (
  <section className="bg-home-bg py-12 sm:py-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-3">
          How It Works
        </h2>
        <p className="text-center text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
          Get ready for your dream job with our expert-led, interactive mock interviews
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {howItWorksSteps.map((item, index) => (
          <div
            key={index}
            className="flex flex-col items-center text-center p-6 bg-white rounded-xl border border-gray-200"
          >
            <div className="text-4xl mb-3">
              {item.emoji}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {item.title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Book Mock Interview Modal
function BookInterviewModal({ isOpen, onClose }) {
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [matchedInterviewers, setMatchedInterviewers] = useState([]);
  const [selectedInterviewer, setSelectedInterviewer] = useState('');
  const { user } = useAuth() || {};

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
    if (!company || !position) return alert('Please provide company and position');
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/interview/create`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, position, message, assignedInterviewer: selectedInterviewer || undefined }),
      });
      let json = null;
      try { json = await res.json(); } catch (_) { /* non-json response */ }
      if (!res.ok) throw new Error((json && json.message) || (await res.text()) || 'Failed to request');
      alert('Interview request submitted successfully!');
      setCompany(''); setPosition(''); setMessage('');
      setMatchedInterviewers([]);
      setSelectedInterviewer('');
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error submitting request');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchMatched = async () => {
      if (!company && !position) { setMatchedInterviewers([]); return; }
      try {
        const q = new URLSearchParams({ company: company || '', position: position || '' }).toString();
        const res = await fetch(`${BACKEND_URL}/api/interview/interviewers?${q}`, { credentials: 'include' });
        if (!res.ok) return setMatchedInterviewers([]);
        const data = await res.json();
        console.log('Matched interviewers data:', data); // Debug log
        setMatchedInterviewers(data || []);
      } catch (e) {
        console.error('Failed to fetch interviewers', e);
        setMatchedInterviewers([]);
      }
    };
    const t = setTimeout(fetchMatched, 400);
    return () => clearTimeout(t);
  }, [company, position]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-blue-600 text-white p-6 rounded-t-xl flex items-center justify-between z-10">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <FaCalendarAlt />
              Book Mock Interview
            </h3>
            <button onClick={onClose} className="text-white hover:bg-blue-700 p-2 rounded-lg transition-colors">
              <FaTimes size={18} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-gray-600 text-sm mb-4">Fill in the details below to request a mock interview session</p>

            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Company Name *</label>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  autoComplete="off"
                />
                {showCompanyDropdown && companyList.length > 0 && (
                  <ul className="absolute z-20 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-2">
                    {companyList.map((c, idx) => (
                      <li
                        key={idx}
                        className={`px-4 py-2.5 text-gray-700 hover:bg-blue-50 cursor-pointer text-sm transition-colors ${highlightedCompanyIdx === idx ? 'bg-blue-100' : ''}`}
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
                <label className="block text-sm font-semibold text-gray-900 mb-2">Position *</label>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  autoComplete="off"
                />
                {showPositionDropdown && positionList.length > 0 && (
                  <ul className="absolute z-20 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-2">
                    {positionList.map((p, idx) => (
                      <li
                        key={idx}
                        className={`px-4 py-2.5 text-gray-700 hover:bg-blue-50 cursor-pointer text-sm transition-colors ${highlightedPositionIdx === idx ? 'bg-blue-100' : ''}`}
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
                <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <FaComment />
                  Additional Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Any specific topics or areas you'd like to focus on..."
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
              </div>

              {matchedInterviewers && matchedInterviewers.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FaUserTie />
                    Recommended Interviewers
                  </h4>
                  <div className="space-y-2">
                    {matchedInterviewers.filter(m => m.user && m.user._id).map((m) => (
                      <label
                        key={m.application._id}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedInterviewer === String(m.user._id)
                            ? 'bg-blue-600 text-white'
                            : 'bg-white hover:bg-blue-50 border border-gray-200'
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
                              {/* Rating Display */}
                              {m.stats && m.stats.averageRating > 0 && (
                                <span className={`flex items-center gap-1 text-xs ${
                                  selectedInterviewer === String(m.user._id) ? 'text-yellow-300' : 'text-yellow-500'
                                }`}>
                                  <FaStar className="text-xs" />
                                  {m.stats.averageRating.toFixed(1)}
                                </span>
                              )}
                            </div>
                            <div className={`text-sm ${selectedInterviewer === String(m.user._id) ? 'text-blue-100' : 'text-gray-600'}`}>
                              {m.user?.college || m.application?.company} • {m.application?.qualification}
                            </div>
                            {/* Interview Count - Always show */}
                            <div className={`text-xs mt-1 flex items-center gap-3 ${selectedInterviewer === String(m.user._id) ? 'text-blue-200' : 'text-gray-500'}`}>
                              <span>
                                📊 {m.stats?.conductedInterviews || 0} interview{(m.stats?.conductedInterviews || 0) !== 1 ? 's' : ''}
                              </span>
                              {m.stats?.totalRatings > 0 && (
                                <span>
                                  • {m.stats.totalRatings} rating{m.stats.totalRatings !== 1 ? 's' : ''}
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
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !company || !position}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
}

// Register as Interviewer Modal
function RegisterInterviewerModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth() || {};

  useEffect(() => {
    try {
      window.dispatchEvent(new Event('authChanged'));
    } catch (e) {
      // ignore
    }
  }, []);

  const isApproved = user && (user.role === 'interviewer' || user.role === 'both' || (Array.isArray(user.roles) && user.roles.includes('interviewer')));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-lg w-full">
          <div className="bg-blue-600 text-white p-6 rounded-t-xl flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <FaUserTie />
              Become an Interviewer
            </h3>
            <button onClick={onClose} className="text-white hover:bg-blue-700 p-2 rounded-lg transition-colors">
              <FaTimes size={18} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {isApproved ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCheckCircle className="text-blue-600 text-3xl" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">You're Already an Approved Interviewer!</h4>
                <p className="text-gray-600 text-sm">You can start conducting mock interviews right away.</p>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Why Become an Interviewer?</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-[#2563eb] mt-1">✓</span>
                      <span>Share your industry experience and help others succeed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#2563eb] mt-1">✓</span>
                      <span>Earn while conducting mock interviews</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#2563eb] mt-1">✓</span>
                      <span>Build your professional network</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#2563eb] mt-1">✓</span>
                      <span>Flexible scheduling based on your availability</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> Your application will be reviewed by our admin team. You'll be notified once approved.
                  </p>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
              {!isApproved && (
                <button
                  onClick={() => {
                    navigate('/register-interviewer');
                    onClose();
                  }}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Apply Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
}

// Scheduled Interviews Section
function ScheduledInterviewSection() {
  const [scheduled, setScheduled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const { user } = useAuth() || {};
  const navigate = useNavigate();

  const handleRateClick = (interview) => {
    setSelectedInterview(interview);
    setShowRatingModal(true);
  };

  const handleRatingSubmitted = (data) => {
    console.log('Rating submitted:', data);
    // Refresh the scheduled interviews
    fetchScheduled();
  };

  const fetchScheduled = async () => {
    setLoading(true);
    try {
      // First try dedicated scheduled endpoint
      let res = await fetch(`${BACKEND_URL}/api/interview/scheduled`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        console.log('Scheduled interviews with stats:', data); // Debug log
        setScheduled(Array.isArray(data) ? data : []);
        setLoading(false);
        return;
      }

      // Fallback to my-interviews and filter for scheduled
      res = await fetch(`${BACKEND_URL}/api/interview/my-interviews`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        const scheduledOnly = list.filter(item => {
          const status = (item.status || '').toLowerCase();
          return status === 'scheduled' || (item.scheduledAt && new Date(item.scheduledAt) > new Date());
        });
        setScheduled(scheduledOnly);
        setLoading(false);
        return;
      }

      // Final fallback to requests endpoint
      res = await fetch(`${BACKEND_URL}/api/interview/requests`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [...(data.sent || []), ...(data.received || [])];
        const scheduledOnly = list.filter(item => {
          const status = (item.status || '').toLowerCase();
          return status === 'scheduled' || (item.scheduledAt && new Date(item.scheduledAt) > new Date());
        });
        setScheduled(scheduledOnly);
      } else {
        setScheduled([]);
      }
    } catch (e) {
      console.error('Failed to fetch scheduled interviews', e);
      setScheduled([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchScheduled(); }, []);

  if (loading) return (
    <div className="text-center py-12">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#3b82f6] border-t-transparent"></div>
      <p className="text-gray-600 mt-4 text-sm sm:text-base">Loading scheduled interviews...</p>
    </div>
  );

  const visible = (scheduled || []).filter(s => {
    if (!user) return false;
    const uid = String(user._id);
    const requesterId = s.requester?._id || s.requester;
    const assignedId = s.assignedInterviewer?._id || s.assignedInterviewer;
    return String(requesterId) === uid || String(assignedId) === uid;
  });

  return (
    <section className="w-full bg-home-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-2">
            Your Scheduled Interviews
          </h2>
          <p className="text-center text-gray-600 text-sm">Upcoming sessions and completed interviews</p>
        </div>

      {visible.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCalendarAlt className="text-blue-600 text-2xl" />
          </div>
          <p className="text-gray-900 text-lg font-semibold">No scheduled interviews yet</p>
          <p className="text-gray-600 text-sm mt-2">Book your first mock interview to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visible.map((s, idx) => (
            <div
              key={s._id}
              className="bg-white border border-gray-200 rounded-xl p-6"
            >

              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {s.company || s.subject || 'Interview Session'}
                  </h3>
                  {(s.position || s.topic) && (
                    <p className="text-sm text-gray-600 mt-1">
                      {s.position || s.topic}
                    </p>
                  )}
                </div>
                <span className="px-2.5 py-1 bg-blue-600 text-white text-xs font-medium rounded-md whitespace-nowrap ml-2">
                  {(s.status || 'Scheduled').charAt(0).toUpperCase() + (s.status || 'Scheduled').slice(1)}
                </span>
              </div>
              
              <div className="space-y-3 text-sm text-gray-700 mb-5">
                <div className="flex items-center gap-2">
                  <FaUserTie className="text-blue-600 text-sm" />
                  <span className="font-medium flex items-center gap-2 flex-wrap">
                    <span>With: {(() => {
                      try {
                        const uid = String(user._id);
                        const requesterId = s.requester?._id || s.requester;
                        const assignedId = s.assignedInterviewer?._id || s.assignedInterviewer;
                        let other = null;
                        let isInterviewer = false;
                        if (String(assignedId) === uid) {
                          other = s.requester;
                        } else {
                          other = s.assignedInterviewer;
                          isInterviewer = true;
                        }
                        if (!other) return 'TBD';
                        const name = other.username || `${other.firstName || ''} ${other.lastName || ''}`.trim() || other.firstName || 'TBD';
                        return name;
                      } catch (e) {
                        return 'TBD';
                      }
                    })()}</span>
                    {/* Show interviewer stats if current user is the requester */}
                    {String(s.requester?._id || s.requester) === String(user._id) && s.interviewerStats && (
                      <span className="flex items-center gap-2 text-xs">
                        {s.interviewerStats.averageRating > 0 && (
                          <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                            <FaStar className="text-xs" />
                            {s.interviewerStats.averageRating.toFixed(1)}
                          </span>
                        )}
                        <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          📊 {s.interviewerStats.conductedInterviews || 0} interviews
                        </span>
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="text-blue-600 text-sm" />
                  <span className="font-medium">
                    {s.scheduledAt ? new Date(s.scheduledAt).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    }) : 'Date TBD'}
                  </span>
                </div>
                {s.message && (
                  <div className="flex items-start gap-2 mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <FaComment className="text-blue-600 text-sm flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-700 line-clamp-2">{s.message}</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/session-requests')}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                >
                  View Details →
                </button>
                {s.status === 'completed' && !s.rating && String(s.requester?._id || s.requester) === String(user._id) && (
                  <button
                    onClick={() => handleRateClick(s)}
                    className="py-2.5 px-4 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors text-sm flex items-center gap-2"
                  >
                    <FaStar /> Rate
                  </button>
                )}
                {s.rating && String(s.requester?._id || s.requester) === String(user._id) && (
                  <div className="py-2.5 px-4 bg-green-50 border border-green-200 text-green-700 rounded-lg font-medium text-sm flex items-center gap-2">
                    <FaStar className="text-yellow-500" /> {s.rating}/5
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </section>
  );
}

const Interview = () => {
  // Modal states
  const [showBookModal, setShowBookModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // 3D tilt effect on mouse move
  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth - 0.5) * 20;
      const y = (clientY / window.innerHeight - 0.5) * 20;
      setMousePosition({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen w-full bg-home-bg">
      {/* Full Viewport Hero Section - Shifted Up */}
      <section className="relative min-h-[85vh] w-full flex items-center justify-center overflow-hidden pt-16 sm:pt-20 pb-6 sm:pb-8 bg-home-bg">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-blue-200/20 to-transparent rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-blue-200/20 to-transparent rounded-full blur-3xl"
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8 lg:gap-12">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex-1 text-center lg:text-left space-y-4 sm:space-y-6 max-w-2xl w-full"
            >
              {/* Main Heading */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight mb-4 sm:mb-6 px-2 sm:px-0">
                  <span className="text-[#1e3a8a] block">Master Your</span>
                  <span className="block text-[#2563eb]">
                    Interviews 🚀
                  </span>
                </h1>
                <p className="text-lg sm:text-xl lg:text-2xl text-[#4b5563] leading-relaxed max-w-xl mx-auto lg:mx-0 px-2 sm:px-0">
                  Practice with industry experts, get real feedback, land your dream job
                </p>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2 sm:pt-4 px-2 sm:px-0"
              >
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowBookModal(true)}
                  className="group relative w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white rounded-2xl font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <FaCalendarAlt className="text-lg" />
                    <span>Book Interview</span>
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowRegisterModal(true)}
                  className="group relative w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white text-[#2563eb] border-2 border-[#2563eb] rounded-2xl font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-[#2563eb] hover:text-white"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <FaUserTie className="text-lg" />
                    <span>Be Interviewer</span>
                  </span>
                </motion.button>
              </motion.div>

              {/* Dynamic Stats Inline */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <StatsSection />
              </motion.div>
            </motion.div>

            {/* Right Image with 3D Effect */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="flex-1 relative hidden lg:block"
              style={{
                transform: `perspective(1000px) rotateY(${mousePosition.x * 0.02}deg) rotateX(${-mousePosition.y * 0.02}deg)`,
                transition: 'transform 0.1s ease-out'
              }}
            >
              <div className="relative">
                {/* Glow Effect */}
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 bg-gradient-to-br from-blue-400/40 to-blue-300/40 rounded-full blur-3xl"
                />
                
                {/* Main Image */}
                <motion.img
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  transition={{ duration: 0.3 }}
                  src="/assets/interview-illustration.webp"
                  alt="Mock Interview Illustration"
                  className="relative z-10 w-full max-w-lg mx-auto object-contain drop-shadow-2xl"
                />

                {/* Floating Elements */}
                <motion.div
                  animate={{
                    y: [0, -20, 0],
                    rotate: [0, 5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute top-10 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-white/80 backdrop-blur-sm rounded-2xl p-2 sm:p-3 border border-blue-200 shadow-lg"
                >
                  <FaCheckCircle className="w-full h-full text-[#2563eb]" />
                </motion.div>

                <motion.div
                  animate={{
                    y: [0, 20, 0],
                    rotate: [0, -5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                  className="absolute bottom-10 left-0 w-16 h-16 sm:w-20 sm:h-20 bg-white/80 backdrop-blur-sm rounded-2xl p-2 sm:p-3 border border-blue-200 shadow-lg"
                >
                  <FaStar className="w-full h-full text-[#3b82f6]" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 1,
            delay: 0.8,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2 text-[#4b5563]">
            <span className="text-xs sm:text-sm font-medium">Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="w-5 sm:w-6 h-9 sm:h-10 border-2 border-[#2563eb] rounded-full flex items-start justify-center p-1">
                <div className="w-1 sm:w-1.5 h-2 sm:h-3 bg-[#2563eb] rounded-full"></div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Main Content Sections - Full Width */}
      <main className="w-full flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <ScheduledInterviewSection />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <PastInterviewsPreview />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <TopInterviewers />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <HowItWorks />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <FAQSection />
        </motion.div>
      </main>

      {/* Modals */}
      <BookInterviewModal isOpen={showBookModal} onClose={() => setShowBookModal(false)} />
      <RegisterInterviewerModal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)} />
    </div>
  );
};

export default Interview;
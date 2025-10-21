import React, { useState, useRef, forwardRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import coursesData from '../../../src/courses_300.json';

// Build dropdown data from courses_300.json
const courseSet = new Set();
const STATIC_UNITS = {};
const STATIC_TOPICS = {};
coursesData.forEach(item => {
  const course = item.course || '';
  const unit = item.unit || '';
  const topic = item.topic || '';
  if (course) courseSet.add(course);
  if (course && unit) {
    if (!STATIC_UNITS[course]) STATIC_UNITS[course] = [];
    if (!STATIC_UNITS[course].includes(unit)) STATIC_UNITS[course].push(unit);
  }
  if (unit && topic) {
    if (!STATIC_TOPICS[unit]) STATIC_TOPICS[unit] = [];
    if (!STATIC_TOPICS[unit].includes(topic)) STATIC_TOPICS[unit].push(topic);
  }
});
const STATIC_COURSES = Array.from(courseSet);


// Add state for question description and photo
const SearchBar = forwardRef(({ courseValue, setCourseValue, unitValue, setUnitValue, topicValue, setTopicValue, onFindTutor }, ref) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [highlightedCourseIdx, setHighlightedCourseIdx] = useState(-1);
  const [highlightedUnitIdx, setHighlightedUnitIdx] = useState(-1);
  const [highlightedTopicIdx, setHighlightedTopicIdx] = useState(-1);
  const courseInputRef = useRef();
  const unitInputRef = useRef();
  const topicInputRef = useRef();
  // New state for description and photo
  const [questionValue, setQuestionValue] = useState("");
  const [questionPhoto, setQuestionPhoto] = useState(null);

  // Filtered lists (show all if input is empty)
  const filteredSuggestions = (courseValue || '').trim() === ''
    ? STATIC_COURSES
    : STATIC_COURSES.filter(
        (s) => s.toLowerCase().includes((courseValue || '').toLowerCase())
      );
  const courseList = filteredSuggestions;

  const unitList = courseValue ? (STATIC_UNITS[courseValue] || []) : [];
  const filteredUnitSuggestions = (unitValue || '').trim() === ''
    ? unitList
    : unitList.filter(
        (u) => u.toLowerCase().includes((unitValue || '').toLowerCase())
      );
  const unitDropdownList = filteredUnitSuggestions;

  const topicList = unitValue ? (STATIC_TOPICS[unitValue] || []) : [];
  const filteredTopicSuggestions = (topicValue || '').trim() === ''
    ? topicList
    : topicList.filter(
        (t) => t.toLowerCase().includes((topicValue || '').toLowerCase())
      );
  const topicDropdownList = filteredTopicSuggestions;

  // Keyboard navigation for course
  const handleCourseKeyDown = (e) => {
    if (!showDropdown || courseList.length === 0) return;
    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      setHighlightedCourseIdx(idx => (idx + 1) % courseList.length);
    } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault();
      setHighlightedCourseIdx(idx => (idx - 1 + courseList.length) % courseList.length);
    } else if (e.key === 'Enter') {
      if (highlightedCourseIdx >= 0 && highlightedCourseIdx < courseList.length) {
        setCourseValue(courseList[highlightedCourseIdx]);
        setShowDropdown(false);
        setHighlightedCourseIdx(-1);
        setUnitValue('');
        setTopicValue('');
        setTimeout(() => unitInputRef.current && unitInputRef.current.focus(), 0);
      }
    }
  };

  // Keyboard navigation for unit
  const handleUnitKeyDown = (e) => {
    if (!showUnitDropdown || unitDropdownList.length === 0) return;
    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      setHighlightedUnitIdx(idx => (idx + 1) % unitDropdownList.length);
    } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault();
      setHighlightedUnitIdx(idx => (idx - 1 + unitDropdownList.length) % unitDropdownList.length);
    } else if (e.key === 'Enter') {
      if (highlightedUnitIdx >= 0 && highlightedUnitIdx < unitDropdownList.length) {
        setUnitValue(unitDropdownList[highlightedUnitIdx]);
        setShowUnitDropdown(false);
        setHighlightedUnitIdx(-1);
        setTopicValue('');
        setTimeout(() => topicInputRef.current && topicInputRef.current.focus(), 0);
      }
    }
  };

  // Keyboard navigation for topic
  const handleTopicKeyDown = (e) => {
    if (!showTopicDropdown || topicDropdownList.length === 0) return;
    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      setHighlightedTopicIdx(idx => (idx + 1) % topicDropdownList.length);
    } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault();
      setHighlightedTopicIdx(idx => (idx - 1 + topicDropdownList.length) % topicDropdownList.length);
    } else if (e.key === 'Enter') {
      if (highlightedTopicIdx >= 0 && highlightedTopicIdx < topicDropdownList.length) {
        setTopicValue(topicDropdownList[highlightedTopicIdx]);
        setShowTopicDropdown(false);
        setHighlightedTopicIdx(-1);
      }
    }
  };

  // Animation variants for dropdown
  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } },
  };

  return (
    <div ref={ref} className="flex flex-col gap-6 p-6 sm:p-8 bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-lg border-2 border-blue-100 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Course Input */}
        <div className="relative flex-1">
          <label className="block text-sm font-bold text-[#1e3a8a] mb-2">Course / Subject</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3b82f6]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </span>
            <input
              ref={courseInputRef}
              type="text"
              value={courseValue}
              onChange={e => {
                setCourseValue(e.target.value);
                setShowDropdown(true);
                setUnitValue('');
                setTopicValue('');
                setHighlightedCourseIdx(-1);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => { setShowDropdown(false); setHighlightedCourseIdx(-1); }, 120)}
            onKeyDown={handleCourseKeyDown}
            placeholder="Search Course/Subject..."
            className="pl-12 pr-4 py-3 rounded-xl bg-white border-2 border-blue-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] text-base font-medium w-full transition-all duration-300"
            autoComplete="off"
          />
          <AnimatePresence>
            {showDropdown && courseList.length > 0 && (
              <motion.ul
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute z-10 left-0 right-0 bg-white border-2 border-blue-200 rounded-xl shadow-xl max-h-60 overflow-y-auto mt-2"
              >
                {courseList.map((s, idx) => (
                  <motion.li
                    key={idx}
                    className={`px-4 py-3 text-gray-700 hover:bg-blue-50 cursor-pointer text-base font-medium transition-colors ${highlightedCourseIdx === idx ? 'bg-blue-100' : ''}`}
                    onMouseDown={() => {
                      setCourseValue(s);
                      setShowDropdown(false);
                      setHighlightedCourseIdx(-1);
                      setUnitValue('');
                      setTopicValue('');
                      setTimeout(() => unitInputRef.current && unitInputRef.current.focus(), 0);
                    }}
                  >
                    {s}
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
          </div>
        </div>

        {/* Unit Input */}
        <div className="relative flex-1">
          <label className="block text-sm font-bold text-[#1e3a8a] mb-2">Unit / Chapter</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3b82f6]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <input
              ref={unitInputRef}
              type="text"
              value={unitValue}
              onChange={e => {
                setUnitValue(e.target.value);
                setShowUnitDropdown(true);
                setHighlightedUnitIdx(-1);
                setTopicValue('');
              }}
              onFocus={() => setShowUnitDropdown(true)}
              onBlur={() => setTimeout(() => { setShowUnitDropdown(false); setHighlightedUnitIdx(-1); }, 120)}
              onKeyDown={handleUnitKeyDown}
              placeholder="Search Unit/Chapter..."
              className="pl-12 pr-4 py-3 rounded-xl bg-white border-2 border-blue-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] text-base font-medium w-full transition-all duration-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
              autoComplete="off"
              disabled={!courseValue || !unitList.length}
            />
            <AnimatePresence>
              {showUnitDropdown && courseValue && unitList.length > 0 && (
                <motion.ul
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute z-10 left-0 right-0 bg-white border-2 border-blue-200 rounded-xl shadow-xl max-h-60 overflow-y-auto mt-2"
                >
                  {unitDropdownList.map((u, idx) => (
                    <motion.li
                      key={idx}
                      className={`px-4 py-3 text-gray-700 hover:bg-blue-50 cursor-pointer text-base font-medium transition-colors ${highlightedUnitIdx === idx ? 'bg-blue-100' : ''}`}
                      onMouseDown={() => {
                        setUnitValue(u);
                        setShowUnitDropdown(false);
                        setHighlightedUnitIdx(-1);
                        setTopicValue('');
                        setTimeout(() => topicInputRef.current && topicInputRef.current.focus(), 0);
                      }}
                    >
                      {u}
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Topic Input */}
        <div className="relative flex-1">
          <label className="block text-sm font-bold text-[#1e3a8a] mb-2">Topic / Subtopic</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3b82f6]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </span>
            <input
              ref={topicInputRef}
              type="text"
              value={topicValue}
              onChange={e => {
                setTopicValue(e.target.value);
                setShowTopicDropdown(true);
                setHighlightedTopicIdx(-1);
              }}
              onFocus={() => setShowTopicDropdown(true)}
              onBlur={() => setTimeout(() => { setShowTopicDropdown(false); setHighlightedTopicIdx(-1); }, 150)}
              onKeyDown={handleTopicKeyDown}
              placeholder="Search Subtopic..."
              className="pl-12 pr-4 py-3 rounded-xl bg-white border-2 border-blue-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] text-base font-medium w-full transition-all duration-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
              autoComplete="off"
              disabled={!unitValue || !topicList.length}
            />
            <AnimatePresence>
              {showTopicDropdown && unitValue && topicList.length > 0 && (
                <motion.ul
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute z-10 left-0 right-0 bg-white border-2 border-blue-200 rounded-xl shadow-xl max-h-60 overflow-y-auto mt-2"
                >
                  {topicDropdownList.map((t, idx) => (
                    <motion.li
                      key={idx}
                      className={`px-4 py-3 text-gray-700 hover:bg-blue-50 cursor-pointer text-base font-medium transition-colors ${highlightedTopicIdx === idx ? 'bg-blue-100' : ''}`}
                      onMouseDown={e => {
                        e.preventDefault();
                        setTopicValue(t);
                        setShowTopicDropdown(false);
                        setHighlightedTopicIdx(-1);
                      }}
                    >
                      {t}
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Description and Photo Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
        <div>
          <label htmlFor="question" className="block text-sm font-bold text-[#1e3a8a] mb-2">
            Your Question (Optional)
          </label>
          <textarea
            id="question"
            value={questionValue}
            onChange={e => setQuestionValue(e.target.value)}
            placeholder="Describe your question or doubt in detail..."
            className="block w-full rounded-xl border-2 border-blue-200 shadow-sm focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6] text-base p-3 placeholder-gray-400 transition-all duration-300 resize-none"
            rows="3"
          />
        </div>
        <div>
          <label htmlFor="questionPhoto" className="block text-sm font-bold text-[#1e3a8a] mb-2">
            Upload Photo (Optional)
          </label>
          <div className="flex items-center justify-center w-full">
            <label htmlFor="questionPhoto" className="flex flex-col items-center justify-center w-full h-[108px] border-2 border-blue-200 border-dashed rounded-xl cursor-pointer bg-white hover:bg-blue-50 transition-all duration-300">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-2 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-xs text-gray-500">{questionPhoto ? questionPhoto.name : 'Click to upload'}</p>
              </div>
              <input
                id="questionPhoto"
                type="file"
                accept="image/*"
                onChange={e => setQuestionPhoto(e.target.files[0])}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Find Tutor Button */}
      <button
        type="button"
        className="mt-6 w-full px-8 py-4 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 hover:scale-102 active:scale-98"
        onClick={() => {
          if (onFindTutor) onFindTutor({ questionValue, questionPhoto });
        }}
        disabled={!courseValue || !unitValue || !topicValue}
      >
        🔍 Find Expert Tutors
      </button>
    </div>
  );
});

export default SearchBar;
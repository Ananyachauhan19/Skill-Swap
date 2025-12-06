import React, { useState, useRef, forwardRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Fuse from 'fuse.js';
import { BACKEND_URL } from '../../config';

// Fetch data from Google Sheet via backend API instead of static JSON


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

  // Lists fetched from backend (Google Sheet)
  const [classes, setClasses] = useState([]); // was courses
  const [subjectsByClass, setSubjectsByClass] = useState({}); // was units per course
  const [topicsBySubject, setTopicsBySubject] = useState({}); // was topics per unit

  useEffect(() => {
    let aborted = false;
    const fetchLists = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/skills-list`);
        if (!res.ok) throw new Error('Failed to load skills list');
        const json = await res.json();
        if (aborted) return;
        console.log('✅ Loaded skills from Google Sheet:', json);
        setClasses(Array.isArray(json.classes) ? json.classes : []);
        setSubjectsByClass(json.subjectsByClass || {});
        setTopicsBySubject(json.topicsBySubject || {});
      } catch (e) {
        console.error('❌ Failed to fetch skills list:', e);
      }
    };
    fetchLists();
    return () => { aborted = true; };
  }, []);

  // Initialize Fuse.js instances for fuzzy search
  const fuseClasses = useMemo(() => {
    return new Fuse(classes, {
      threshold: 0.3, // Lower = stricter matching
      distance: 100,
      keys: ['']  // Search the string directly
    });
  }, [classes]);

  const fuseSubjects = useMemo(() => {
    const subjectList = courseValue ? (subjectsByClass[courseValue] || []) : [];
    return new Fuse(subjectList, {
      threshold: 0.3,
      distance: 100,
      keys: ['']
    });
  }, [courseValue, subjectsByClass]);

  const fuseTopics = useMemo(() => {
    const topicList = unitValue ? (topicsBySubject[unitValue] || []) : [];
    return new Fuse(topicList, {
      threshold: 0.3,
      distance: 100,
      keys: ['']
    });
  }, [unitValue, topicsBySubject]);

  // Filtered lists using Fuse.js fuzzy search
  const courseList = useMemo(() => {
    if ((courseValue || '').trim() === '') return classes;
    const results = fuseClasses.search(courseValue);
    return results.map(result => result.item);
  }, [courseValue, classes, fuseClasses]);

  const unitDropdownList = useMemo(() => {
    const unitList = courseValue ? (subjectsByClass[courseValue] || []) : [];
    if ((unitValue || '').trim() === '') return unitList;
    const results = fuseSubjects.search(unitValue);
    return results.map(result => result.item);
  }, [unitValue, courseValue, subjectsByClass, fuseSubjects]);

  const topicDropdownList = useMemo(() => {
    const topicList = unitValue ? (topicsBySubject[unitValue] || []) : [];
    if ((topicValue || '').trim() === '') return topicList;
    const results = fuseTopics.search(topicValue);
    return results.map(result => result.item);
  }, [topicValue, unitValue, topicsBySubject, fuseTopics]);

  // Base lists for checking if dropdown should be enabled
  const unitList = useMemo(() => 
    courseValue ? (subjectsByClass[courseValue] || []) : []
  , [courseValue, subjectsByClass]);

  const topicList = useMemo(() => 
    unitValue ? (topicsBySubject[unitValue] || []) : []
  , [unitValue, topicsBySubject]);

  // Filtered lists (show all if input is empty) - OLD CODE REMOVED

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
    <div ref={ref} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Course Input */}
        <div className="relative flex-1">
          <label className="block text-sm font-semibold text-slate-900 mb-2">Class</label>
          <div className="relative">
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
            placeholder="Select your class..."
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-sm outline-none hover:border-slate-400 transition-colors"
            autoComplete="off"
          />
          <AnimatePresence>
            {showDropdown && courseList.length > 0 && (
              <motion.ul
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute z-20 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-2"
              >
                {courseList.map((s, idx) => (
                  <motion.li
                    key={idx}
                    className={`px-4 py-2.5 text-slate-700 hover:bg-blue-50 cursor-pointer text-sm transition-colors ${highlightedCourseIdx === idx ? 'bg-blue-100' : ''}`}
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
          <label className="block text-sm font-semibold text-slate-900 mb-2">Subject</label>
          <div className="relative">
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
              placeholder="Select subject..."
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-sm outline-none hover:border-slate-400 transition-colors disabled:bg-slate-100 disabled:cursor-not-allowed"
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
                  className="absolute z-20 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-2"
                >
                  {unitDropdownList.map((u, idx) => (
                    <motion.li
                      key={idx}
                      className={`px-4 py-2.5 text-slate-700 hover:bg-blue-50 cursor-pointer text-sm transition-colors ${highlightedUnitIdx === idx ? 'bg-blue-100' : ''}`}
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
          <label className="block text-sm font-semibold text-slate-900 mb-2">Topic</label>
          <div className="relative">
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
              placeholder="Select topic..."
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-sm outline-none hover:border-slate-400 transition-colors disabled:bg-slate-100 disabled:cursor-not-allowed"
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
                  className="absolute z-20 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-2"
                >
                  {topicDropdownList.map((t, idx) => (
                    <motion.li
                      key={idx}
                      className={`px-4 py-2.5 text-slate-700 hover:bg-blue-50 cursor-pointer text-sm transition-colors ${highlightedTopicIdx === idx ? 'bg-blue-100' : ''}`}
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

      {/* Find Expert Button */}
      <button
        type="button"
        className="mt-2 w-full px-6 py-3 bg-blue-900 text-white rounded-lg font-semibold text-base hover:bg-blue-800 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => {
          if (onFindTutor) onFindTutor({ questionValue, questionPhoto });
        }}
        disabled={!courseValue || !unitValue || !topicValue}
      >
        Search Available Sessions
      </button>
    </div>
  );
});

export default SearchBar;
import React, { useState, useRef, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Static data for demo
const STATIC_COURSES = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English',
  'Economics', 'History', 'Geography', 'Psychology', 'Business Studies',
  'Political Science', 'Sociology', 'Accountancy', 'Statistics',
];
const STATIC_UNITS = {
  Mathematics: ['Algebra', 'Calculus', 'Geometry', 'Trigonometry', 'Probability', 'Statistics'],
  Physics: ['Mechanics', 'Optics', 'Thermodynamics', 'Electromagnetism', 'Modern Physics'],
  Chemistry: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Analytical Chemistry'],
  Biology: ['Botany', 'Zoology', 'Genetics', 'Ecology', 'Cell Biology'],
  'Computer Science': ['Data Structures', 'Algorithms', 'Operating Systems', 'Databases', 'Networking'],
  English: ['Grammar', 'Literature', 'Writing Skills', 'Comprehension'],
  Economics: ['Microeconomics', 'Macroeconomics', 'International Economics', 'Econometrics'],
  History: ['Ancient History', 'Medieval History', 'Modern History', 'World History'],
  Geography: ['Physical Geography', 'Human Geography', 'Cartography', 'GIS'],
  Psychology: ['Cognitive Psychology', 'Developmental Psychology', 'Clinical Psychology'],
  'Business Studies': ['Business Environment', 'Management', 'Marketing', 'Finance'],
  'Political Science': ['Political Theory', 'Comparative Politics', 'International Relations'],
  Sociology: ['Social Structure', 'Social Change', 'Research Methods'],
  Accountancy: ['Financial Accounting', 'Cost Accounting', 'Auditing'],
  Statistics: ['Descriptive Statistics', 'Inferential Statistics', 'Probability Theory'],
};
const STATIC_TOPICS = {
  Algebra: ['Linear Equations', 'Quadratic Equations', 'Polynomials'],
  Calculus: ['Limits', 'Derivatives', 'Integrals'],
  Geometry: ['Triangles', 'Circles', 'Polygons'],
  Trigonometry: ['Sine', 'Cosine', 'Tangent'],
  Probability: ['Permutations', 'Combinations', 'Probability Distributions'],
  Statistics: ['Mean', 'Median', 'Mode'],
  Mechanics: ['Kinematics', 'Dynamics', 'Work & Energy'],
  Optics: ['Reflection', 'Refraction', 'Lenses'],
  Thermodynamics: ['Laws of Thermodynamics', 'Heat Transfer'],
  Electromagnetism: ['Electric Fields', 'Magnetism', 'Circuits'],
  'Modern Physics': ['Relativity', 'Quantum Mechanics'],
  'Organic Chemistry': ['Hydrocarbons', 'Alcohols', 'Amines', 'Aldehydes', 'Ketones', 'Carboxylic Acids'],
  'Inorganic Chemistry': ['Periodic Table', 'Coordination Compounds', 'Metals', 'Non-metals', 'Acids & Bases'],
  'Physical Chemistry': ['Thermodynamics', 'Electrochemistry', 'Chemical Kinetics', 'Surface Chemistry'],
  'Analytical Chemistry': ['Spectroscopy', 'Chromatography', 'Titration'],
  Botany: ['Plant Physiology', 'Plant Anatomy'],
  Zoology: ['Animal Physiology', 'Animal Classification'],
  Genetics: ['Mendelian Genetics', 'DNA Structure'],
  Ecology: ['Ecosystems', 'Biodiversity'],
  'Cell Biology': ['Cell Structure', 'Cell Division'],
  'Data Structures': ['BST', 'Heap', 'Trie', 'Hash Table', 'Stack', 'Queue', 'Graph'],
  Algorithms: ['Dijkstra', 'Floyd Warshall', 'A* Search', 'Kruskal', 'Prim', 'Bellman-Ford', 'DFS', 'BFS'],
  'Operating Systems': ['Processes', 'Threads', 'Deadlock', 'Memory Management'],
  Databases: ['SQL', 'Normalization', 'Transactions', 'Indexing'],
  Networking: ['OSI Model', 'TCP/IP', 'Routing'],
  Grammar: ['Tenses', 'Parts of Speech', 'Voice'],
  Literature: ['Poetry', 'Drama', 'Prose'],
  'Writing Skills': ['Essay', 'Letter', 'Report'],
  Comprehension: ['Passage Analysis', 'Summary'],
  Microeconomics: ['Demand', 'Supply', 'Elasticity'],
  Macroeconomics: ['GDP', 'Inflation', 'Unemployment'],
  'International Economics': ['Trade', 'Exchange Rates'],
  Econometrics: ['Regression', 'Time Series'],
  'Ancient History': ['Indus Valley', 'Egyptian Civilization'],
  'Medieval History': ['Delhi Sultanate', 'Mughal Empire'],
  'Modern History': ['World Wars', 'Indian Independence'],
  'World History': ['Renaissance', 'Industrial Revolution'],
  'Physical Geography': ['Landforms', 'Climate'],
  'Human Geography': ['Population', 'Urbanization'],
  Cartography: ['Map Projections', 'GIS Basics'],
  GIS: ['Remote Sensing', 'Spatial Analysis'],
  'Cognitive Psychology': ['Memory', 'Perception'],
  'Developmental Psychology': ['Child Development', 'Adolescence'],
  'Clinical Psychology': ['Disorders', 'Therapies'],
  'Business Environment': ['Business Types', 'Business Ethics'],
  Management: ['Leadership', 'Motivation'],
  Marketing: ['Market Research', 'Branding'],
  Finance: ['Accounting', 'Investment'],
  'Political Theory': ['Democracy', 'Justice'],
  'Comparative Politics': ['Political Systems', 'Constitutions'],
  'International Relations': ['UN', 'Globalization'],
  'Social Structure': ['Family', 'Caste'],
  'Social Change': ['Modernization', 'Social Movements'],
  'Research Methods': ['Surveys', 'Fieldwork'],
  'Financial Accounting': ['Balance Sheet', 'Ledger'],
  'Cost Accounting': ['Cost Sheet', 'Budgeting'],
  Auditing: ['Internal Audit', 'External Audit'],
  'Descriptive Statistics': ['Mean', 'Variance'],
  'Inferential Statistics': ['Hypothesis Testing', 'Confidence Intervals'],
  'Probability Theory': ['Random Variables', 'Probability Distributions'],
};


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

  // Filtered lists
  const filteredSuggestions = STATIC_COURSES.filter(
    (s) => (courseValue || '').toLowerCase().includes((s || '').toLowerCase()) && (courseValue || '').trim() !== ''
  );
  const courseList = (courseValue || '').trim() === '' ? STATIC_COURSES : filteredSuggestions;

  const unitList = courseValue ? (STATIC_UNITS[courseValue] || []) : [];
  const filteredUnitSuggestions = unitList.filter(
    (u) => (unitValue || '').toLowerCase().includes((u || '').toLowerCase()) && (unitValue || '').trim() !== ''
  );
  const unitDropdownList = (unitValue || '').trim() === '' ? unitList : filteredUnitSuggestions;

  const topicList = unitValue ? (STATIC_TOPICS[unitValue] || []) : [];
  const filteredTopicSuggestions = topicList.filter(
    (t) => (topicValue || '').toLowerCase().includes((t || '').toLowerCase()) && (topicValue || '').trim() !== ''
  );
  const topicDropdownList = (topicValue || '').trim() === '' ? topicList : filteredTopicSuggestions;

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
    <div ref={ref} className="flex flex-col gap-4 p-6 bg-blue-50 rounded-xl shadow-lg border border-blue-200/50 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Course Input */}
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500">
            <svg className="w-6 h-6 hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 16.65z" />
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
            className="pl-12 pr-4 py-3 rounded-xl bg-white/80 backdrop-blur-sm border border-blue-200/50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium w-full transition-all duration-300 hover:shadow-md"
            autoComplete="off"
          />
          <AnimatePresence>
            {showDropdown && (
              <motion.ul
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute z-10 left-0 right-0 bg-white/95 backdrop-blur-md border border-blue-200/50 rounded-xl shadow-xl max-h-48 overflow-y-auto mt-2"
              >
                {courseList.map((s, idx) => (
                  <motion.li
                    key={idx}
                    className={`px-4 py-2.5 text-gray-600 hover:bg-blue-100/80 cursor-pointer text-base font-medium transition-all duration-300 hover:scale-102 ${highlightedCourseIdx === idx ? 'bg-blue-100/80' : ''}`}
                    onMouseDown={() => {
                      setCourseValue(s);
                      setShowDropdown(false);
                      setHighlightedCourseIdx(-1);
                      setUnitValue('');
                      setTopicValue('');
                      setTimeout(() => unitInputRef.current && unitInputRef.current.focus(), 0);
                    }}
                    whileHover={{ scale: 1.02 }}
                  >
                    {s}
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
        {/* Unit Input */}
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500">
            <svg className="w-6 h-6 hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
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
            placeholder="Search Unit/Topic..."
            className="pl-12 pr-4 py-3 rounded-xl bg-white/80 backdrop-blur-sm border border-blue-200/50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium w-full transition-all duration-300 hover:shadow-md"
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
                className="absolute z-10 left-0 right-0 bg-white/95 backdrop-blur-md border border-blue-200/50 rounded-xl shadow-xl max-h-48 overflow-y-auto mt-2"
              >
                {unitDropdownList.map((u, idx) => (
                  <motion.li
                    key={idx}
                    className={`px-4 py-2.5 text-gray-600 hover:bg-blue-100/80 cursor-pointer text-base font-medium transition-all duration-300 hover:scale-102 ${highlightedUnitIdx === idx ? 'bg-blue-100/80' : ''}`}
                    onMouseDown={() => {
                      setUnitValue(u);
                      setShowUnitDropdown(false);
                      setHighlightedUnitIdx(-1);
                      setTopicValue('');
                      setTimeout(() => topicInputRef.current && topicInputRef.current.focus(), 0);
                    }}
                    whileHover={{ scale: 1.02 }}
                  >
                    {u}
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
        {/* Topic Input */}
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500">
            <svg className="w-6 h-6 hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
              <circle cx="12" cy="12" r="10" />
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
            className="pl-12 pr-4 py-3 rounded-xl bg-white/80 backdrop-blur-sm border border-blue-200/50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium w-full transition-all duration-300 hover:shadow-md"
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
                className="absolute z-10 left-0 right-0 bg-white/95 backdrop-blur-md border border-blue-200/50 rounded-xl shadow-xl max-h-48 overflow-y-auto mt-2"
              >
                {topicDropdownList.map((t, idx) => (
                  <motion.li
                    key={idx}
                    className={`px-4 py-2.5 text-gray-600 hover:bg-blue-100/80 cursor-pointer text-base font-medium transition-all duration-300 hover:scale-102 ${highlightedTopicIdx === idx ? 'bg-blue-100/80' : ''}`}
                    onMouseDown={e => {
                      e.preventDefault();
                      setTopicValue(t);
                      setShowTopicDropdown(false);
                      setHighlightedTopicIdx(-1);
                    }}
                    whileHover={{ scale: 1.02 }}
                  >
                    {t}
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>
      {/* Description and Photo Upload */}
      <div className="mt-4">
        <label htmlFor="question" className="block text-sm font-medium text-gray-700 opacity-90">
          Your Question
        </label>
        <textarea
          id="question"
          value={questionValue}
          onChange={e => setQuestionValue(e.target.value)}
          placeholder="Describe your question or doubt in detail..."
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 placeholder-gray-400 transition-all duration-300"
          rows="4"
        />
      </div>
      <div className="mt-2">
        <label htmlFor="questionPhoto" className="block text-sm font-medium text-gray-700 opacity-90">
          Upload Question Photo (Optional)
        </label>
        <input
          id="questionPhoto"
          type="file"
          accept="image/*"
          onChange={e => setQuestionPhoto(e.target.files[0])}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all duration-300"
        />
      </div>
      {/* Find Tutor Button */}
      <motion.button
        type="button"
        className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        onClick={() => {
          if (onFindTutor) onFindTutor({ questionValue, questionPhoto });
        }}
        disabled={!courseValue || !unitValue || !topicValue}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Find Tutor
      </motion.button>
    </div>
  );
});

export default SearchBar;
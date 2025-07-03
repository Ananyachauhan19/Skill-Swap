import React, { useState, useRef } from 'react';

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
  // Mathematics
  Algebra: ['Linear Equations', 'Quadratic Equations', 'Polynomials'],
  Calculus: ['Limits', 'Derivatives', 'Integrals'],
  Geometry: ['Triangles', 'Circles', 'Polygons'],
  Trigonometry: ['Sine', 'Cosine', 'Tangent'],
  Probability: ['Permutations', 'Combinations', 'Probability Distributions'],
  Statistics: ['Mean', 'Median', 'Mode'],
  // Physics
  Mechanics: ['Kinematics', 'Dynamics', 'Work & Energy'],
  Optics: ['Reflection', 'Refraction', 'Lenses'],
  Thermodynamics: ['Laws of Thermodynamics', 'Heat Transfer'],
  Electromagnetism: ['Electric Fields', 'Magnetism', 'Circuits'],
  'Modern Physics': ['Relativity', 'Quantum Mechanics'],
  // Chemistry
  'Organic Chemistry': ['Hydrocarbons', 'Alcohols', 'Amines', 'Aldehydes', 'Ketones', 'Carboxylic Acids'],
  'Inorganic Chemistry': ['Periodic Table', 'Coordination Compounds', 'Metals', 'Non-metals', 'Acids & Bases'],
  'Physical Chemistry': ['Thermodynamics', 'Electrochemistry', 'Chemical Kinetics', 'Surface Chemistry'],
  'Analytical Chemistry': ['Spectroscopy', 'Chromatography', 'Titration'],
  // Biology
  Botany: ['Plant Physiology', 'Plant Anatomy'],
  Zoology: ['Animal Physiology', 'Animal Classification'],
  Genetics: ['Mendelian Genetics', 'DNA Structure'],
  Ecology: ['Ecosystems', 'Biodiversity'],
  'Cell Biology': ['Cell Structure', 'Cell Division'],
  // Computer Science
  'Data Structures': ['BST', 'Heap', 'Trie', 'Hash Table', 'Stack', 'Queue', 'Graph'],
  Algorithms: ['Dijkstra', 'Floyd Warshall', 'A* Search', 'Kruskal', 'Prim', 'Bellman-Ford', 'DFS', 'BFS'],
  'Operating Systems': ['Processes', 'Threads', 'Deadlock', 'Memory Management'],
  Databases: ['SQL', 'Normalization', 'Transactions', 'Indexing'],
  Networking: ['OSI Model', 'TCP/IP', 'Routing'],
  // English
  Grammar: ['Tenses', 'Parts of Speech', 'Voice'],
  Literature: ['Poetry', 'Drama', 'Prose'],
  'Writing Skills': ['Essay', 'Letter', 'Report'],
  Comprehension: ['Passage Analysis', 'Summary'],
  // Economics
  Microeconomics: ['Demand', 'Supply', 'Elasticity'],
  Macroeconomics: ['GDP', 'Inflation', 'Unemployment'],
  'International Economics': ['Trade', 'Exchange Rates'],
  Econometrics: ['Regression', 'Time Series'],
  // History
  'Ancient History': ['Indus Valley', 'Egyptian Civilization'],
  'Medieval History': ['Delhi Sultanate', 'Mughal Empire'],
  'Modern History': ['World Wars', 'Indian Independence'],
  'World History': ['Renaissance', 'Industrial Revolution'],
  // Geography
  'Physical Geography': ['Landforms', 'Climate'],
  'Human Geography': ['Population', 'Urbanization'],
  Cartography: ['Map Projections', 'GIS Basics'],
  GIS: ['Remote Sensing', 'Spatial Analysis'],
  // Psychology
  'Cognitive Psychology': ['Memory', 'Perception'],
  'Developmental Psychology': ['Child Development', 'Adolescence'],
  'Clinical Psychology': ['Disorders', 'Therapies'],
  // Business Studies
  'Business Environment': ['Business Types', 'Business Ethics'],
  Management: ['Leadership', 'Motivation'],
  Marketing: ['Market Research', 'Branding'],
  Finance: ['Accounting', 'Investment'],
  // Political Science
  'Political Theory': ['Democracy', 'Justice'],
  'Comparative Politics': ['Political Systems', 'Constitutions'],
  'International Relations': ['UN', 'Globalization'],
  // Sociology
  'Social Structure': ['Family', 'Caste'],
  'Social Change': ['Modernization', 'Social Movements'],
  'Research Methods': ['Surveys', 'Fieldwork'],
  // Accountancy
  'Financial Accounting': ['Balance Sheet', 'Ledger'],
  'Cost Accounting': ['Cost Sheet', 'Budgeting'],
  Auditing: ['Internal Audit', 'External Audit'],
  // Statistics
  'Descriptive Statistics': ['Mean', 'Variance'],
  'Inferential Statistics': ['Hypothesis Testing', 'Confidence Intervals'],
  'Probability Theory': ['Random Variables', 'Probability Distributions'],
};

const SearchBar = ({ courseValue, setCourseValue, unitValue, setUnitValue, topicValue, setTopicValue, onFindTutor }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [highlightedCourseIdx, setHighlightedCourseIdx] = useState(-1);
  const [highlightedUnitIdx, setHighlightedUnitIdx] = useState(-1);
  const [highlightedTopicIdx, setHighlightedTopicIdx] = useState(-1);
  const courseInputRef = useRef();
  const unitInputRef = useRef();
  const topicInputRef = useRef();

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

  return (
    <>
      <div className="w-full flex justify-center pt-10 pb-6 bg-blue-50">
        <div className="flex gap-4 w-full max-w-2xl items-center">
          {/* Course Dropdown */}
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xl">🔍</span>
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
              className="pl-10 pr-4 py-3 rounded-full border border-blue-200 shadow focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg bg-white w-full"
              autoComplete="off"
            />
            {showDropdown && (
              <ul className="absolute z-10 left-0 right-0 bg-white border border-blue-200 rounded-b-lg shadow max-h-48 overflow-y-auto mt-1">
                {courseList.map((s, idx) => (
                  <li
                    key={idx}
                    className={`px-4 py-2 hover:bg-blue-100 cursor-pointer text-base ${highlightedCourseIdx === idx ? 'bg-blue-100' : ''}`}
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
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Unit Dropdown */}
          <div className="relative flex-1">
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
              className="px-5 py-3 rounded-full border border-blue-200 shadow focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg bg-white w-full"
              autoComplete="off"
              disabled={!courseValue || !unitList.length}
            />
            {showUnitDropdown && courseValue && unitList.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 bg-white border border-blue-200 rounded-b-lg shadow max-h-48 overflow-y-auto mt-1">
                {unitDropdownList.map((u, idx) => (
                  <li
                    key={idx}
                    className={`px-4 py-2 hover:bg-blue-100 cursor-pointer text-base ${highlightedUnitIdx === idx ? 'bg-blue-100' : ''}`}
                    onMouseDown={() => {
                      setUnitValue(u);
                      setShowUnitDropdown(false);
                      setHighlightedUnitIdx(-1);
                      setTopicValue('');
                      setTimeout(() => topicInputRef.current && topicInputRef.current.focus(), 0);
                    }}
                  >
                    {u}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Topic Dropdown */}
          <div className="relative flex-1">
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
              className="px-5 py-3 rounded-full border border-blue-200 shadow focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg bg-white w-full"
              autoComplete="off"
              disabled={!unitValue || !topicList.length}
            />
            {showTopicDropdown && unitValue && topicList.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 bg-white border border-blue-200 rounded-b-lg shadow max-h-48 overflow-y-auto mt-1">
                {topicDropdownList.map((t, idx) => (
                  <li
                    key={idx}
                    className={`px-4 py-2 hover:bg-blue-100 cursor-pointer text-base ${highlightedTopicIdx === idx ? 'bg-blue-100' : ''}`}
                    onMouseDown={e => {
                      e.preventDefault();
                      setTopicValue(t);
                      setShowTopicDropdown(false);
                      setHighlightedTopicIdx(-1);
                    }}
                  >
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            className="ml-2 px-6 py-3 rounded-full bg-blue-600 text-white font-semibold text-lg shadow hover:bg-blue-700 transition-colors"
            onClick={() => {
              if (onFindTutor) onFindTutor();
              // Backend-ready: send courseValue, unitValue, topicValue to backend API
            }}
            disabled={!courseValue || !unitValue || !topicValue}
          >
            Find Tutor
          </button>
        </div>
      </div>
    </>
  );
};

export default SearchBar;

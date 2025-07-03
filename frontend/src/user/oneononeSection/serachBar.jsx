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

const SearchBar = ({ courseValue, setCourseValue, unitValue, setUnitValue, onFindTutor }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [highlightedCourseIdx, setHighlightedCourseIdx] = useState(-1);
  const [highlightedUnitIdx, setHighlightedUnitIdx] = useState(-1);
  // const [courseSuggestions, setCourseSuggestions] = useState([]);
  // const [unitList, setUnitList] = useState([]);
  const courseInputRef = useRef();
  const unitInputRef = useRef();

  // // Fetch courses from backend on mount
  // useEffect(() => {
  //   const fetchCourses = async () => {
  //     try {
  //       const res = await fetch('/api/courses');
  //       if (!res.ok) throw new Error('Failed to fetch courses');
  //       const data = await res.json();
  //       setCourseSuggestions(Array.isArray(data.courses) ? data.courses : []);
  //     } catch (err) {
  //       setCourseSuggestions([]);
  //     }
  //   };
  //   fetchCourses();
  // }, []);

  // // Fetch units/topics for selected course
  // useEffect(() => {
  //   if (!courseValue) {
  //     setUnitList([]);
  //     return;
  //   }
  //   const fetchUnits = async () => {
  //     try {
  //       const res = await fetch(`/api/units?course=${encodeURIComponent(courseValue)}`);
  //       if (!res.ok) throw new Error('Failed to fetch units');
  //       const data = await res.json();
  //       setUnitList(Array.isArray(data.units) ? data.units : []);
  //     } catch (err) {
  //       setUnitList([]);
  //     }
  //   };
  //   fetchUnits();
  // }, [courseValue]);

  // Use static data for now
  const courseSuggestions = STATIC_COURSES;
  const unitList = courseValue ? (STATIC_UNITS[courseValue] || []) : [];

  const filteredSuggestions = courseSuggestions.filter(
    (s) => s.toLowerCase().includes(courseValue.toLowerCase()) && courseValue.trim() !== ''
  );
  const courseList = courseValue.trim() === '' ? courseSuggestions : filteredSuggestions;

  const filteredUnitSuggestions = unitList.filter(
    (u) => u.toLowerCase().includes(unitValue.toLowerCase()) && unitValue.trim() !== ''
  );
  const unitDropdownList = unitValue.trim() === '' ? unitList : filteredUnitSuggestions;

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
      }
    }
  };

  return (
    <>
      <div className="w-full flex justify-center pt-10 pb-6 bg-blue-50">
        <div className="flex gap-4 w-full max-w-2xl items-center">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xl">🔍</span>
            <input
              ref={courseInputRef}
              type="text"
              value={courseValue}
              onChange={e => {
                setCourseValue(e.target.value);
                setShowDropdown(true);
                setUnitValue(''); // Reset unit when course changes
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
                      setTimeout(() => unitInputRef.current && unitInputRef.current.focus(), 0);
                    }}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="relative flex-1">
            <input
              ref={unitInputRef}
              type="text"
              value={unitValue}
              onChange={e => {
                setUnitValue(e.target.value);
                setShowUnitDropdown(true);
                setHighlightedUnitIdx(-1);
              }}
              onFocus={() => {
                if (courseValue && unitList.length) setShowUnitDropdown(true);
              }}
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
                    }}
                  >
                    {u}
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
              // Backend-ready: send courseValue and unitValue to backend API
              /*
              try {
                const response = await fetch('/api/find-tutor', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ course: courseValue, unit: unitValue }),
                });
                if (!response.ok) throw new Error('Failed to search tutors');
                const data = await response.json();
                // You can handle the data (e.g., show results, navigate, etc.)
                alert(`Found ${data.tutors?.length || 0} tutors for ${courseValue}${unitValue ? ' - ' + unitValue : ''}`);
              } catch (err) {
                alert('Error searching for tutors: ' + err.message);
              }
              */
              // alert(`Searching for tutors in ${courseValue}${unitValue ? ' - ' + unitValue : ''}`);
            }}
            disabled={!courseValue}
          >
            Find Tutor
          </button>
        </div>
      </div>
     
    </>
  );
};

export default SearchBar;

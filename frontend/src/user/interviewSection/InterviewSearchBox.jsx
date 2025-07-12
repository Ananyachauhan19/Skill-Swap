import React, { useState, useRef, useEffect } from "react";
import InterviewListSection from './InterviewListSection';
import { BACKEND_URL } from '../../config.js';

// Static data for suggestions
const jobOptions = [
  "Engineer", "Business Analyst", "Product Manager", "Designer", "Consultant", "Data Scientist", "Developer", "Other Job"
];
const jobData = {
  "Engineer": ["Software Engineer", "Mechanical Engineer", "Civil Engineer", "Electrical Engineer"],
  "Business Analyst": ["IT Business Analyst", "Finance Analyst", "Market Analyst"],
  "Product Manager": ["Associate PM", "Senior PM", "Technical PM"],
  "Designer": ["UI Designer", "UX Designer", "Graphic Designer"],
  "Consultant": ["Management Consultant", "Strategy Consultant"],
  "Data Scientist": ["ML Engineer", "Data Analyst"],
  "Developer": ["Frontend Developer", "Backend Developer", "Full Stack Developer"],
  "Other Job": ["Other"]
};
const courseOptions = [
  "BTech", "MBA", "MCA", "BSc", "BBA", "MTech", "PhD", "Other Course"
];
const courseData = {
  "BTech": ["CSE", "ECE", "Mechanical", "Civil", "Electrical"],
  "MBA": ["Marketing", "Finance", "HR", "Operations"],
  "MCA": ["Computer Applications"],
  "BSc": ["Physics", "Chemistry", "Maths", "Biology"],
  "BBA": ["General", "International Business"],
  "MTech": ["CSE", "Mechanical", "Civil"],
  "PhD": ["Engineering", "Science", "Management"],
  "Other Course": ["Other"]
};
// Example static session data
const sessionTitles = [
  "Frontend Developer Interview with Google",
  "MBA Marketing Mock Interview",
  "CSE BTech Placement Session",
  "Data Science Case Study Round",
  "Product Manager Interview Prep"
];

const allSuggestions = [
  ...jobOptions,
  ...Object.values(jobData).flat(),
  ...courseOptions,
  ...Object.values(courseData).flat(),
  ...sessionTitles
];

const InterviewSearchBox = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [interviews, setInterviews] = useState([]);
  const [filteredInterviews, setFilteredInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${BACKEND_URL}/api/interviews`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch interviews');
        return res.json();
      })
      .then(data => setInterviews(Array.isArray(data) ? data : []))
      .catch(() => setError('Could not load interviews.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    if (searchTerm.trim() === "") {
      // Show nothing by default (no sessions visible until search)
      setFilteredSuggestions([]);
      setShowSuggestions(false);
      setActiveSuggestion(0);
      setFilteredInterviews([]);
      return;
    }
    const filtered = allSuggestions.filter(option =>
      option.toLowerCase().includes(lower)
    );
    setFilteredSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    setActiveSuggestion(0);

    // Filter interviews: upcoming first, then expired, both matching search
    const matchingUpcoming = interviews.filter(intvw =>
      !intvw.expired && (
        intvw.expert.name.toLowerCase().includes(lower) ||
        intvw.expert.miniBio.toLowerCase().includes(lower) ||
        intvw.tags.some(tag => tag.toLowerCase().includes(lower)) ||
        intvw.date.includes(lower) ||
        intvw.time.includes(lower)
      )
    );
    const matchingExpired = interviews.filter(intvw =>
      intvw.expired && (
        intvw.expert.name.toLowerCase().includes(lower) ||
        intvw.expert.miniBio.toLowerCase().includes(lower) ||
        intvw.tags.some(tag => tag.toLowerCase().includes(lower)) ||
        intvw.date.includes(lower) ||
        intvw.time.includes(lower)
      )
    );
    setFilteredInterviews([...matchingUpcoming, ...matchingExpired]);
  }, [searchTerm, interviews]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (showSuggestions && filteredSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestion(idx => (idx + 1) % filteredSuggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestion(idx => (idx - 1 + filteredSuggestions.length) % filteredSuggestions.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredSuggestions[activeSuggestion]) {
          handleSuggestionSelect(filteredSuggestions[activeSuggestion]);
        }
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
        setActiveSuggestion(0);
      } else if (e.key === "Tab") {
        setShowSuggestions(false);
        setActiveSuggestion(0);
      }
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    setActiveSuggestion(0);
    if (onSearch) onSearch(suggestion);
    setTimeout(() => {
      if (searchInputRef.current) searchInputRef.current.blur();
    }, 0);
  };

  const handleSearch = () => {
    if (onSearch) onSearch(searchTerm);
    setSearchTerm("");
    setShowSuggestions(false);
    setActiveSuggestion(0);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-4 max-w-6xl w-full mx-auto mt-8 sm:p-8 md:p-10 lg:p-12 xl:p-16">
        <div className="relative w-full max-w-3xl mx-auto flex items-center gap-2">
          <input
            ref={searchInputRef}
            className="px-4 py-3 rounded-lg border border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base shadow-sm w-full transition-all duration-200 bg-blue-50 hover:bg-blue-100"
            placeholder="Search by job, course, branch, or session title..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onFocus={() => setShowSuggestions(filteredSuggestions.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          <button
            onClick={handleSearch}
            className="ml-2 px-4 py-3 rounded-lg bg-green-600 text-white font-semibold shadow-md hover:bg-green-700 transition-all duration-200 whitespace-nowrap"
          >
            Search
          </button>
        </div>
      </div>
      <InterviewListSection
        interviews={searchTerm.trim() === "" ? interviews : filteredInterviews}
        loading={loading}
        error={error}
        directionMsg={searchTerm.trim() === "" ? undefined : (filteredInterviews.length === 0 ? "No upcoming mock interview sessions found." : undefined)}
      />
    </>
  );
};

export default InterviewSearchBox;

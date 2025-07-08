import React, { useState, useRef } from 'react';

// TODO: Replace with backend API call to upload video

// Example: fetch('/api/upload-video', { method: 'POST', ... })
// For now, static upload simulation is used.

// Static data 
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

const UploadRecordedSession = () => {
  const [form, setForm] = useState({
    subject: '',
    topic: '',
    subtopic: '',
    description: '',
    video: null,
  });
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showSubtopicDropdown, setShowSubtopicDropdown] = useState(false);
  const [highlightedCourseIdx, setHighlightedCourseIdx] = useState(-1);
  const [highlightedUnitIdx, setHighlightedUnitIdx] = useState(-1);
  const [highlightedSubtopicIdx, setHighlightedSubtopicIdx] = useState(-1);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadedVideos, setUploadedVideos] = useState([
    // Example static data for uploaded videos
    {
      id: 1,
      subject: 'Mathematics',
      topic: 'Algebra',
      subtopic: 'Linear Equations',
      description: 'Solving linear equations step by step.',
      filename: 'linear-equations.mp4',
      uploadedAt: '2025-07-08',
    },
    {
      id: 2,
      subject: 'Physics',
      topic: 'Mechanics',
      subtopic: 'Kinematics',
      description: 'Introduction to kinematics.',
      filename: 'kinematics.mp4',
      uploadedAt: '2025-07-07',
    },
  ]); // New: store uploaded videos
  const fileInputRef = useRef();

  // Filtered lists for cascading dropdowns
  const filteredCourseSuggestions = STATIC_COURSES.filter(
    (s) => (form.subject || '').toLowerCase().includes((s || '').toLowerCase()) && (form.subject || '').trim() !== ''
  );
  const courseList = (form.subject || '').trim() === '' ? STATIC_COURSES : filteredCourseSuggestions;

  const unitList = form.subject ? (STATIC_UNITS[form.subject] || []) : [];
  const filteredUnitSuggestions = unitList.filter(
    (u) => (form.topic || '').toLowerCase().includes((u || '').toLowerCase()) && (form.topic || '').trim() !== ''
  );
  const unitDropdownList = (form.topic || '').trim() === '' ? unitList : filteredUnitSuggestions;

  const topicList = form.topic ? (STATIC_TOPICS[form.topic] || []) : [];
  const filteredTopicSuggestions = topicList.filter(
    (t) => (form.subtopic || '').toLowerCase().includes((t || '').toLowerCase()) && (form.subtopic || '').trim() !== ''
  );
  const topicDropdownList = (form.subtopic || '').trim() === '' ? topicList : filteredTopicSuggestions;

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => {
      if (name === 'subject') return { ...prev, subject: value, topic: '', subtopic: '' };
      if (name === 'topic') return { ...prev, topic: value, subtopic: '' };
      return { ...prev, [name]: value };
    });
  };

  const handleFileChange = e => {
    setForm(prev => ({ ...prev, video: e.target.files[0] }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.subject || !form.topic || !form.subtopic || !form.description || !form.video) {
      alert('Please fill all fields and select a video file.');
      return;
    }
    setUploading(true);
    // TODO: Replace setTimeout with actual API call for upload
    setTimeout(() => {
      setUploading(false);
      setSuccess(true);
      setUploadedVideos(prev => [
        {
          id: Date.now(),
          subject: form.subject,
          topic: form.topic,
          subtopic: form.subtopic,
          description: form.description,
          filename: form.video.name,
          uploadedAt: new Date().toISOString().slice(0, 10),
        },
        ...prev,
      ]);
      setForm({ subject: '', topic: '', subtopic: '', description: '', video: null });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 2000);
  };

  return (
    <div className="w-full flex flex-col md:flex-row gap-8 md:gap-12 px-2 md:px-8 mt-10 mb-16">
      {/* Left: Upload Card */}
      <div className="md:w-1/2 w-full max-w-xl bg-white rounded-2xl shadow-xl p-8 border border-blue-200 animate-slide-up self-start">
        <h1 className="text-2xl font-bold text-blue-900 mb-6 text-center md:text-left">Upload a Recorded Session</h1>
        {success ? (
          <div className="text-green-700 text-center font-semibold mb-4">Video uploaded successfully!</div>
        ) : null}
        <form className="flex flex-col gap-5" onSubmit={handleSubmit} autoComplete="off">
          {/* Subject Dropdown */}
          <div className="relative">
            <label className="block text-blue-900 font-medium mb-1">Subject / Course</label>
            <input
              type="text"
              name="subject"
              value={form.subject}
              onChange={e => { handleChange(e); setShowCourseDropdown(true); setHighlightedCourseIdx(-1); }}
              onFocus={() => setShowCourseDropdown(true)}
              onBlur={() => setTimeout(() => { setShowCourseDropdown(false); setHighlightedCourseIdx(-1); }, 120)}
              onKeyDown={e => {
                if (!showCourseDropdown || courseList.length === 0) return;
                if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
                  e.preventDefault();
                  setHighlightedCourseIdx(idx => (idx + 1) % courseList.length);
                } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
                  e.preventDefault();
                  setHighlightedCourseIdx(idx => (idx - 1 + courseList.length) % courseList.length);
                } else if (e.key === 'Enter') {
                  if (highlightedCourseIdx >= 0 && highlightedCourseIdx < courseList.length) {
                    setForm(prev => ({ ...prev, subject: courseList[highlightedCourseIdx], topic: '', subtopic: '' }));
                    setShowCourseDropdown(false);
                    setHighlightedCourseIdx(-1);
                  }
                }
              }}
              placeholder="e.g. Mathematics"
              className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80"
              required
              autoComplete="off"
            />
            {showCourseDropdown && (
              <ul className="absolute z-10 left-0 right-0 bg-white/95 border border-blue-200 rounded-b-lg shadow-lg max-h-48 overflow-y-auto mt-1 animate-fade-in">
                {courseList.map((s, idx) => (
                  <li
                    key={idx}
                    className={`px-4 py-2 hover:bg-blue-100 cursor-pointer text-base transition duration-150 ${highlightedCourseIdx === idx ? 'bg-blue-200' : ''}`}
                    onMouseDown={() => {
                      setForm(prev => ({ ...prev, subject: s, topic: '', subtopic: '' }));
                      setShowCourseDropdown(false);
                      setHighlightedCourseIdx(-1);
                    }}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Topic Dropdown */}
          <div className="relative">
            <label className="block text-blue-900 font-medium mb-1">Topic / Unit</label>
            <input
              type="text"
              name="topic"
              value={form.topic}
              onChange={e => { handleChange(e); setShowUnitDropdown(true); setHighlightedUnitIdx(-1); }}
              onFocus={() => { if (form.subject && unitList.length) setShowUnitDropdown(true); }}
              onBlur={() => setTimeout(() => { setShowUnitDropdown(false); setHighlightedUnitIdx(-1); }, 120)}
              onKeyDown={e => {
                if (!showUnitDropdown || unitDropdownList.length === 0) return;
                if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
                  e.preventDefault();
                  setHighlightedUnitIdx(idx => (idx + 1) % unitDropdownList.length);
                } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
                  e.preventDefault();
                  setHighlightedUnitIdx(idx => (idx - 1 + unitDropdownList.length) % unitDropdownList.length);
                } else if (e.key === 'Enter') {
                  if (highlightedUnitIdx >= 0 && highlightedUnitIdx < unitDropdownList.length) {
                    setForm(prev => ({ ...prev, topic: unitDropdownList[highlightedUnitIdx], subtopic: '' }));
                    setShowUnitDropdown(false);
                    setHighlightedUnitIdx(-1);
                  }
                }
              }}
              placeholder="e.g. Algebra, Calculus"
              className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80"
              required
              autoComplete="off"
              disabled={!form.subject || !unitList.length}
            />
            {showUnitDropdown && form.subject && unitList.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 bg-white/95 border border-blue-200 rounded-b-lg shadow-lg max-h-48 overflow-y-auto mt-1 animate-fade-in">
                {unitDropdownList.map((u, idx) => (
                  <li
                    key={idx}
                    className={`px-4 py-2 hover:bg-blue-100 cursor-pointer text-base transition duration-150 ${highlightedUnitIdx === idx ? 'bg-blue-200' : ''}`}
                    onMouseDown={() => {
                      setForm(prev => ({ ...prev, topic: u, subtopic: '' }));
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
          {/* Subtopic Dropdown */}
          <div className="relative">
            <label className="block text-blue-900 font-medium mb-1">Subtopic</label>
            <input
              type="text"
              name="subtopic"
              value={form.subtopic}
              onChange={e => { handleChange(e); setShowSubtopicDropdown(true); setHighlightedSubtopicIdx(-1); }}
              onFocus={() => setShowSubtopicDropdown(true)}
              onBlur={() => setTimeout(() => { setShowSubtopicDropdown(false); setHighlightedSubtopicIdx(-1); }, 120)}
              onKeyDown={e => {
                if (!showSubtopicDropdown || topicDropdownList.length === 0) return;
                if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
                  e.preventDefault();
                  setHighlightedSubtopicIdx(idx => (idx + 1) % topicDropdownList.length);
                } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
                  e.preventDefault();
                  setHighlightedSubtopicIdx(idx => (idx - 1 + topicDropdownList.length) % topicDropdownList.length);
                } else if (e.key === 'Enter') {
                  if (highlightedSubtopicIdx >= 0 && highlightedSubtopicIdx < topicDropdownList.length) {
                    setForm(prev => ({ ...prev, subtopic: topicDropdownList[highlightedSubtopicIdx] }));
                    setShowSubtopicDropdown(false);
                    setHighlightedSubtopicIdx(-1);
                  }
                }
              }}
              placeholder="e.g. Linear Equations, Trees, SQL"
              className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80"
              required={!!form.topic}
              autoComplete="off"
              disabled={!form.topic}
            />
            {showSubtopicDropdown && topicList.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 bg-white/95 border border-blue-200 rounded-b-lg shadow-lg max-h-48 overflow-y-auto mt-1 animate-fade-in">
                {topicDropdownList.map((t, idx) => (
                  <li
                    key={idx}
                    className={`px-4 py-2 hover:bg-blue-100 cursor-pointer text-base transition duration-150 ${highlightedSubtopicIdx === idx ? 'bg-blue-200' : ''}`}
                    onMouseDown={() => {
                      setForm(prev => ({ ...prev, subtopic: t }));
                      setShowSubtopicDropdown(false);
                      setHighlightedSubtopicIdx(-1);
                    }}
                  >
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Description */}
          <div>
            <label className="block text-blue-900 font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full border border-blue-200 rounded-lg px-3 py-2 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80"
              placeholder="Describe your video content..."
              maxLength={500}
              required
            />
          </div>
          {/* Video Upload */}
          <div>
            <label className="block text-blue-900 font-medium mb-1">Upload Video</label>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="w-full border border-blue-200 rounded-lg px-3 py-2 bg-white/80"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-2 rounded-lg font-semibold hover:scale-105 hover:shadow-lg transition duration-200 transform"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Video'}
          </button>
        </form>
      </div>
      {/* Right: Uploaded Videos List */}
      <div className="md:w-1/2 w-full flex flex-col">
        <h2 className="text-2xl font-bold text-blue-900 mb-4 text-center md:text-left">Your Recorded Sessions</h2>
        <div className="flex flex-col gap-4">
          {uploadedVideos.length === 0 ? (
            <div className="text-gray-500 text-center md:text-left">No videos uploaded yet.</div>
          ) : (
            uploadedVideos.map(video => (
              <div key={video.id} className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-start md:items-center shadow-sm">
                <div className="flex-1">
                  <div className="font-semibold text-blue-800">{video.subject} &rarr; {video.topic} &rarr; {video.subtopic}</div>
                  <div className="text-gray-700 text-sm mb-1">{video.description}</div>
                  <div className="text-xs text-gray-500">Uploaded: {video.uploadedAt}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-blue-700 font-mono">{video.filename}</span>
                  {/* TODO: Add video preview or download link if needed */}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadRecordedSession;

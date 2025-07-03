import React, { useState,useEffect } from 'react';

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

const CreateSession = () => {
  const [form, setForm] = useState({
    subject: '',
    topic: '',
    subtopic: '',
    description: '',
    date: '',
    time: '',
  });
  const [scheduled, setScheduled] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showSubtopicDropdown, setShowSubtopicDropdown] = useState(false);
  const [highlightedCourseIdx, setHighlightedCourseIdx] = useState(-1);
  const [highlightedUnitIdx, setHighlightedUnitIdx] = useState(-1);
  const [highlightedSubtopicIdx, setHighlightedSubtopicIdx] = useState(-1);
  const [scheduledSessions, setScheduledSessions] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ subject: '', topic: '', description: '', date: '', time: '' });
  

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
    if (name === 'subject') setForm(prev => ({ ...prev, topic: '' }));
  };
const getTodayDate = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getCurrentTime = () => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
};

const handleSubmit = async e => {
  e.preventDefault();

  // Prevent scheduling in the past
  const today = getTodayDate();
  const now = getCurrentTime();
  if (form.date < today || (form.date === today && form.time < now)) {
    alert('Cannot schedule a session in the past. Please select a valid date and time.');
    return;
  }

  try {
    const token = localStorage.getItem('token'); 
    const response = await fetch('http://localhost:5000/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });



    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to create session');
    }

    const data = await response.json();
console.log('Fetched sessions:', data);
    setScheduled(true);
    setForm({
      subject: '',
      topic: '',
      subtopic: '',
      description: '',
      date: '',
      time: '',
    });
    
    fetchUserSessions();

  } catch (error) {
    console.error('Error creating session:', error.message);
    alert('Error: ' + error.message);
  }
};


  const handleEdit = (session) => {
    setEditId(session._id);
    setEditForm({
      subject: session.subject,
      topic: session.topic,
      description: session.description,
      date: session.date,
      time: session.time,
    });
  };

  const handleEditChange = e => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };


const handleEditSave = async (id) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/api/sessions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(editForm),
    });

    if (!res.ok) throw new Error('Failed to update session');

    // Get updated session from response or just update state
    const updatedSession = await res.json();

    setScheduledSessions(prev =>
      prev.map(s => s._id === id ? updatedSession : s)
    );

    setEditId(null);
  } catch (err) {
    console.error('Error updating session:', err);
  }
};


  const handleDelete = async (id) => {

    setScheduledSessions(prev => prev.filter(s => s._id !== id));
    if (editId === id) setEditId(null);
  };

   const fetchUserSessions = async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:5000/api/sessions/mine', {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    const data = await res.json();
    setScheduledSessions(data); // update state to show in UI
  } catch (err) {
    console.error('Error fetching sessions:', err);
  }
};

useEffect(() => {
  fetchUserSessions();
}, []);



  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="bg-white/90 rounded-2xl shadow-xl p-10 border border-blue-100 w-full max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-blue-900 mb-8 text-center">Create Your Own 1-on-1 Session</h1>
        {/* Schedule Session Section */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-blue-800 mb-4 border-b border-blue-100 pb-2">Schedule Your Session</h2>
          {scheduled ? (
            <div className="text-center">
              <p className="text-green-700 font-semibold mb-4">Session scheduled successfully!</p>
              <button
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                onClick={() => {
                  setScheduled(false);
                  setForm({ subject: '', topic: '', subtopic: '', description: '', date: '', time: '' });
                }}
              >
                Schedule Another
              </button>
            </div>
          ) : (
            <form className="flex flex-col gap-5" onSubmit={handleSubmit} autoComplete="off">
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
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  required
                  autoComplete="off"
                />
                {showCourseDropdown && (
                  <ul className="absolute z-10 left-0 right-0 bg-white border border-blue-200 rounded-b-lg shadow max-h-48 overflow-y-auto mt-1">
                    {courseList.map((s, idx) => (
                      <li
                        key={idx}
                        className={`px-4 py-2 hover:bg-blue-100 cursor-pointer text-base ${highlightedCourseIdx === idx ? 'bg-blue-100' : ''}`}
                        onMouseDown={() => {
                          setForm(prev => ({ ...prev, subject: s, topic: '', subtopic: '' }));
                          setShowCourseDropdown(false);
                          setHighlightedCourseIdx(-1);
                        }}
                      >
                        {s}
                      </li>
                ))
                }
                  </ul>
                )}
              </div>
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
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  required
                  autoComplete="off"
                  disabled={!form.subject || !unitList.length}
                />
                {showUnitDropdown && form.subject && unitList.length > 0 && (
                  <ul className="absolute z-10 left-0 right-0 bg-white border border-blue-200 rounded-b-lg shadow max-h-48 overflow-y-auto mt-1">
                    {unitDropdownList.map((u, idx) => (
                      <li
                        key={idx}
                        className={`px-4 py-2 hover:bg-blue-100 cursor-pointer text-base ${highlightedUnitIdx === idx ? 'bg-blue-100' : ''}`}
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
              {/* Subtopic field */}
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
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  required={!!form.topic}
                  autoComplete="off"
                  disabled={!form.topic}
                />
                {showSubtopicDropdown && topicList.length > 0 && (
                  <ul className="absolute z-10 left-0 right-0 bg-white border border-blue-200 rounded-b-lg shadow max-h-48 overflow-y-auto mt-1">
                    {topicDropdownList.map((t, idx) => (
                      <li
                        key={idx}
                        className={`px-4 py-2 hover:bg-blue-100 cursor-pointer text-base ${highlightedSubtopicIdx === idx ? 'bg-blue-100' : ''}`}
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
              <div>
                <label className="block text-blue-900 font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="Describe your learning goals or questions..."
                  maxLength={500}
                  required
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-blue-900 font-medium mb-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    required
                    min={getTodayDate()}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-blue-900 font-medium mb-1">Time</label>
                  <input
                    type="time"
                    name="time"
                    value={form.time}
                    onChange={handleChange}
                    className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    required
                    min={form.date === getTodayDate() ? getCurrentTime() : undefined}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="mt-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Schedule Session
              </button>
            </form>
          )}
        </section>
        {/* Scheduled Sessions Section */}
        <section>
          <h2 className="text-lg font-semibold text-blue-800 mb-4 border-b border-blue-100 pb-2">Scheduled Sessions</h2>
          {scheduledSessions.length > 0 ? (
            <ul className="space-y-4">
              {scheduledSessions.map(session => (
                <li key={session._id} className="border border-blue-100 rounded-lg p-4 bg-blue-50/60">
                  {editId === session._id ? (
                    <form className="flex flex-col gap-2" onSubmit={e => { e.preventDefault(); handleEditSave(session._id); }}>
                      <input
                        type="text"
                        name="subject"
                        value={editForm.subject}
                        onChange={handleEditChange}
                        className="border border-blue-200 rounded px-2 py-1 mb-1"
                        required
                      />
                      <input
                        type="text"
                        name="topic"
                        value={editForm.topic}
                        onChange={handleEditChange}
                        className="border border-blue-200 rounded px-2 py-1 mb-1"
                        required
                      />
                      <input
                        type="text"
                        name="subtopic"
                        value={editForm.subtopic}
                        onChange={handleEditChange}
                        className="border border-blue-200 rounded px-2 py-1 mb-1"
                        required
                      />
                      <textarea
                        name="description"
                        value={editForm.description}
                        onChange={handleEditChange}
                        className="border border-blue-200 rounded px-2 py-1 mb-1"
                        required
                      />
                      <div className="flex gap-2 mb-2">
                        <input
                          type="date"
                          name="date"
                          value={editForm.date}
                          onChange={handleEditChange}
                          className="border border-blue-200 rounded px-2 py-1"
                          required
                        />
                        <input
                          type="time"
                          name="time"
                          value={editForm.time}
                          onChange={handleEditChange}
                          className="border border-blue-200 rounded px-2 py-1"
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Save</button>
                        <button type="button" className="bg-gray-200 px-3 py-1 rounded" onClick={() => setEditId(null)}>Cancel</button>
                      </div>
                    </form>
                  ) : (
<>
  <div className={`text-xs font-medium mb-1 ${session.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
    {session.status.toUpperCase()}
  </div>
  <div className="font-medium text-blue-900 mb-1">
    {[session.subject, session.topic, session.subtopic].filter(x => x && x.trim()).join(' - ')}
  </div>
  <div className="text-blue-700 text-sm mb-1">{session.description}</div>
  <div className="text-gray-600 text-xs mb-2">{session.date} at {session.time}</div>
  <div className="flex gap-2">
    <button className="text-blue-600 hover:underline text-sm" onClick={() => handleEdit(session)}>Edit</button>
    <button className="text-red-600 hover:underline text-sm" onClick={() => handleDelete(session._id)}>Delete</button>
  </div>
  {/* Start Session Button */}
  <div className="mt-4 flex justify-end">
    <button
      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition shadow"
      title="Start Session"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-7.5A2.25 2.25 0 003.75 5.25v13.5A2.25 2.25 0 006 21h7.5a2.25 2.25 0 002.25-2.25V15m0-6l5.25-3.75v13.5L15.75 15" />
      </svg>
      Start Session
    </button>
  </div>
</>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500 text-center">No sessions scheduled yet.</div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CreateSession;

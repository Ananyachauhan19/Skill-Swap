import React, { useState } from 'react';

// Backend-ready: fetch these from backend
// const [courses, setCourses] = useState([]);
// const [units, setUnits] = useState([]);
// useEffect(() => {
//   async function fetchCourses() {
//     const res = await fetch('/api/courses');
//     const data = await res.json();
//     setCourses(data.courses);
//   }
//   fetchCourses();
// }, []);
// useEffect(() => {
//   if (!form.subject) return setUnits([]);
//   async function fetchUnits() {
//     const res = await fetch(`/api/units?course=${encodeURIComponent(form.subject)}`);
//     const data = await res.json();
//     setUnits(data.units);
//   }
//   fetchUnits();
// }, [form.subject]);

const CreateSession = () => {
  const [form, setForm] = useState({
    subject: '',
    topic: '',
    description: '',
    date: '',
    time: '',
  });
  const [scheduled, setScheduled] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [highlightedCourseIdx, setHighlightedCourseIdx] = useState(-1);
  const [highlightedUnitIdx, setHighlightedUnitIdx] = useState(-1);
  const [scheduledSessions, setScheduledSessions] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ subject: '', topic: '', description: '', date: '', time: '' });

  // Backend-ready: replace with fetched data
  const courseSuggestions = [
    "Data Structures",
    "Algorithms",
    "Operating Systems",
    "Database Management",
    "Web Development",
    "Machine Learning"
  ];
  const unitList = form.subject === "Data Structures" ? [
    "Arrays",
    "Linked Lists",
    "Stacks",
    "Queues",
    "Trees",
    "Graphs"
  ] : form.subject === "Algorithms" ? [
    "Sorting",
    "Searching",
    "Dynamic Programming",
    "Greedy Algorithms"
  ] : form.subject === "Operating Systems" ? [
    "Processes",
    "Threads",
    "Memory Management",
    "File Systems"
  ] : form.subject === "Database Management" ? [
    "SQL",
    "Normalization",
    "Transactions",
    "Indexing"
  ] : form.subject === "Web Development" ? [
    "HTML",
    "CSS",
    "JavaScript",
    "React"
  ] : form.subject === "Machine Learning" ? [
    "Regression",
    "Classification",
    "Clustering",
    "Neural Networks"
  ] : [];
  // const courseSuggestions = courses;
  // const unitList = units;

  const filteredSuggestions = courseSuggestions.filter(
    (s) => s.toLowerCase().includes(form.subject.toLowerCase()) && form.subject.trim() !== ''
  );
  const courseList = form.subject.trim() === '' ? courseSuggestions : filteredSuggestions;
  const filteredUnitSuggestions = unitList.filter(
    (u) => u.toLowerCase().includes(form.topic.toLowerCase()) && form.topic.trim() !== ''
  );
  const unitDropdownList = form.topic.trim() === '' ? unitList : filteredUnitSuggestions;

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'subject') setForm(prev => ({ ...prev, topic: '' }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setScheduled(true);
    // Backend-ready: send form data to backend
    // const res = await fetch('/api/schedule-session', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(form),
    // });
    // const data = await res.json();
    // setScheduledSessions(prev => [...prev, data.session]);
    setScheduledSessions(prev => [
      ...prev,
      {
        ...form,
        id: Date.now(),
      },
    ]);
  };

  const handleEdit = (session) => {
    setEditId(session.id);
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
    // Backend-ready: update session in backend
    // await fetch(`/api/schedule-session/${id}`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(editForm),
    // });
    setScheduledSessions(prev => prev.map(s => s.id === id ? { ...s, ...editForm } : s));
    setEditId(null);
  };

  const handleDelete = async (id) => {
    // Backend-ready: delete session in backend
    // await fetch(`/api/schedule-session/${id}`, { method: 'DELETE' });
    setScheduledSessions(prev => prev.filter(s => s.id !== id));
    if (editId === id) setEditId(null);
  };

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
                  setForm({ subject: '', topic: '', description: '', date: '', time: '' });
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
                        setForm(prev => ({ ...prev, subject: courseList[highlightedCourseIdx], topic: '' }));
                        setShowCourseDropdown(false);
                        setHighlightedCourseIdx(-1);
                      }
                    }
                  }}
                  placeholder="e.g. Data Structures"
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
                          setForm(prev => ({ ...prev, subject: s, topic: '' }));
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
                        setForm(prev => ({ ...prev, topic: unitDropdownList[highlightedUnitIdx] }));
                        setShowUnitDropdown(false);
                        setHighlightedUnitIdx(-1);
                      }
                    }
                  }}
                  placeholder="e.g. Trees, Graphs"
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
                          setForm(prev => ({ ...prev, topic: u }));
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
                <li key={session.id} className="border border-blue-100 rounded-lg p-4 bg-blue-50/60">
                  {editId === session.id ? (
                    <form className="flex flex-col gap-2" onSubmit={e => { e.preventDefault(); handleEditSave(session.id); }}>
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
                      <div className="font-medium text-blue-900 mb-1">{session.subject} - {session.topic}</div>
                      <div className="text-blue-700 text-sm mb-1">{session.description}</div>
                      <div className="text-gray-600 text-xs mb-2">{session.date} at {session.time}</div>
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:underline text-sm" onClick={() => handleEdit(session)}>Edit</button>
                        <button className="text-red-600 hover:underline text-sm" onClick={() => handleDelete(session.id)}>Delete</button>
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

/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";

// --- Static mock data for user session history ---
const STATIC_HISTORY = [
  {
    date: "2025-07-05",
    sessions: [
      {
        id: 1,
        type: "one-on-one",
        with: "Alice Smith",
        when: "2025-07-05T10:00:00Z",
        duration: 45,
        credits: 10,
        subject: "Mathematics",
        topic: "Algebra",
        subtopic: "Linear Equations",
        rating: 5,
        notes: "Discussed solving linear equations with variables on both sides."
      },
      {
        id: 2,
        type: "interview",
        with: "Bob Lee",
        when: "2025-07-05T14:00:00Z",
        duration: 30,
        credits: 15,
        rating: 4,
        notes: "Mock interview for software engineering role."
      },
      {
        id: 3,
        type: "gd",
        with: ["Alice Smith", "Bob Lee", "Charlie Kim"],
        when: "2025-07-05T16:00:00Z",
        duration: 60,
        credits: 5,
        notes: "Group discussion on project management."
      },
    ],
  },
  {
    date: "2025-07-04",
    sessions: [
      {
        id: 4,
        type: "one-on-one",
        with: "Charlie Kim",
        when: "2025-07-04T09:00:00Z",
        duration: 30,
        credits: 8,
        subject: "Physics",
        topic: "Optics",
        subtopic: "Lenses",
        rating: 4,
        notes: "Covered lens formula and ray diagrams."
      },
    ],
  },
];

const DEMO_SESSIONS = [
  {
    id: 1,
    title: 'Algebra 101',
    tutor: 'John Doe',
    course: 'Mathematics',
    unit: 'Algebra',
    topic: 'Introduction to Algebra',
    date: '2025-07-10',
    time: '10:00 AM',
    status: 'Upcoming',
  },
  {
    id: 2,
    title: 'Calculus: The Basics',
    tutor: 'Jane Smith',
    course: 'Mathematics',
    unit: 'Calculus',
    topic: 'Limits and Continuity',
    date: '2025-07-12',
    time: '2:00 PM',
    status: 'Upcoming',
  },
  {
    id: 3,
    title: 'Physics: Motion in One Dimension',
    tutor: 'Albert Einstein',
    course: 'Physics',
    unit: 'Kinematics',
    topic: 'Introduction to Motion',
    date: '2025-07-15',
    time: '1:00 PM',
    status: 'Completed',
  },
];

// Merge completed sessions into STATIC_HISTORY
const completedSessions = DEMO_SESSIONS.filter(s => s.status === 'Completed').map(s => ({
  id: s.id,
  type: 'one-on-one',
  with: s.tutor,
  when: `${s.date}T${s.time.replace(/\s*AM|\s*PM/i, '')}:00Z`,
  duration: 60,
  credits: 10,
  subject: s.course,
  topic: s.unit,
  subtopic: s.topic,
  rating: 5,
  notes: s.title,
}));

const SESSIONS_HISTORY = [
  ...STATIC_HISTORY,
  ...(
    completedSessions.length > 0
      ? [{
          date: completedSessions[0].when.split('T')[0],
          sessions: completedSessions,
        }]
      : []
  ),
];

export async function fetchUserHistory() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(SESSIONS_HISTORY), 400);
  });
}

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [hoveredDate, setHoveredDate] = useState(null);
  const [expandedSession, setExpandedSession] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchUserHistory()
      .then((data) => {
        setHistory(data);
        setFilteredHistory(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let filtered = history;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.map((entry) => ({
        ...entry,
        sessions: entry.sessions.filter(
          (s) =>
            s.with.toString().toLowerCase().includes(searchLower) ||
            (s.subject && s.subject.toLowerCase().includes(searchLower)) ||
            (s.topic && s.topic.toLowerCase().includes(searchLower)) ||
            (s.subtopic && s.subtopic.toLowerCase().includes(searchLower))
        ),
      }));
    }

    if (selectedDate) {
      filtered = filtered.filter((entry) => entry.date === selectedDate);
    }

    setFilteredHistory(filtered.filter((entry) => entry.sessions.length > 0));
  }, [search, selectedDate, history]);

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const sessionTypeLabel = (type) => {
    const icons = {
      "one-on-one": "👤",
      "interview": "🎤",
      "gd": "👥"
    };
    return (
      <span className="inline-block mr-2 text-2xl">
        {icons[type] || null}
      </span>
    );
  };

  const SkeletonLoader = () => (
    <div className="space-y-8 animate-pulse">
      {[...Array(2)].map((_, idx) => (
        <div key={idx} className="bg-gray-100 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-6 w-16 bg-gray-200 rounded"></div>
            <div className="h-6 w-40 bg-gray-200 rounded"></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 h-40">
                <div className="space-y-3">
                  <div className="h-5 w-3/4 bg-gray-200 rounded"></div>
                  <div className="h-4 w-full bg-gray-200 rounded"></div>
                  <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
                  <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-blue-50 pt-20 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Session History</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Review your past learning sessions, interviews, and group discussions
          </p>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-grow w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                placeholder="Search sessions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="date"
                className="border border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-gray-50"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition duration-200 whitespace-nowrap"
                onClick={() => {
                  setSearch("");
                  setSelectedDate("");
                }}
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Date Quick Filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${!selectedDate ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setSelectedDate("")}
            >
              All Dates
            </button>
            {history.slice(0, 5).map((entry) => (
              <button
                key={entry.date}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedDate === entry.date
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setSelectedDate(entry.date)}
              >
                {new Date(entry.date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <SkeletonLoader />
          ) : error ? (
            <div className="p-8 text-center">
              <div className="text-red-500 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading history</h3>
              <p className="text-gray-600">{error}</p>
              <button 
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-blue-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search or date filters</p>
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
                onClick={() => {
                  setSearch("");
                  setSelectedDate("");
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredHistory.map((entry, idx) => (
                <li key={idx} className="p-6 hover:bg-blue-50 transition duration-150">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-blue-900">
                      {new Date(entry.date).toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {entry.sessions.length} session{entry.sessions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {entry.sessions.map((s) => (
                      <div 
                        key={s.id}
                        className={`bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition duration-200 ${expandedSession === s.id ? 'ring-2 ring-blue-500' : 'border-gray-200'}`}
                      >
                        <div 
                          className="p-4 cursor-pointer"
                          onClick={() => setExpandedSession(expandedSession === s.id ? null : s.id)}
                        >
                          <div className="flex items-start">
                            <div className="mr-3">
                              {sessionTypeLabel(s.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <h4 className="font-medium text-gray-900">
                                  {s.type === 'gd' ? 'Group Discussion' : 
                                   s.type === 'interview' ? 'Interview Session' : '1-on-1 Session'}
                                </h4>
                                {s.rating && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    {s.rating} ★
                                  </span>
                                )}
                              </div>
                              
                              <p className="text-sm text-gray-600 mt-1">
                                {s.type === 'gd' ? 
                                  `With ${Array.isArray(s.with) ? s.with.join(', ') : s.with}` : 
                                  `With ${s.with}`}
                              </p>
                              
                              <div className="mt-2 flex flex-wrap gap-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {formatTime(s.when)}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  {s.duration} min
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                  {s.credits} credits
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {s.subject && (
                            <div className="mt-3">
                              <div className="text-sm text-gray-700">
                                <span className="font-medium">Subject:</span> {s.subject}
                                {s.topic && ` • ${s.topic}`}
                                {s.subtopic && ` • ${s.subtopic}`}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {expandedSession === s.id && (
                          <div className="bg-gray-50 border-t border-gray-200 p-4 animate-fade-in">
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Session Notes</h5>
                            <p className="text-sm text-gray-600">
                              {s.notes || "No additional notes provided for this session."}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="max-w-7xl mx-auto mt-8 bg-blue-100 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:mr-6 mb-4 md:mb-0">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-blue-900 mb-2">Need help with your session history?</h3>
            <p className="text-blue-800 mb-4">
              If you notice any discrepancies or have questions about your session records, our support team is here to help.
            </p>
            <button className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium border border-blue-200 transition duration-200">
              Contact Support
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default HistoryPage;
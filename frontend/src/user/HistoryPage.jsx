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

// Import or define DEMO_SESSIONS from Sessions.jsx
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
  duration: 60, // Example duration
  credits: 10, // Example credits
  subject: s.course,
  topic: s.unit,
  subtopic: s.topic,
  rating: 5, // Example rating
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

// --- Fetch user history (using static data) ---
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

  // Filter history based on search and selected date
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

  // Helper to format time
  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Helper to get session type label/icon
  const sessionTypeLabel = (type) => {
    if (type === "one-on-one")
      return (
        <span title="1-on-1" className="inline-block mr-2 text-blue-900 text-2xl">
          👤
        </span>
      );
    if (type === "interview")
      return (
        <span title="Interview" className="inline-block mr-2 text-blue-900 text-2xl">
          🎤
        </span>
      );
    if (type === "gd")
      return (
        <span title="Group Discussion" className="inline-block mr-2 text-blue-900 text-2xl">
          👥
        </span>
      );
    return null;
  };

  // Skeleton Loader Component with Shimmer Effect
  const SkeletonLoader = () => (
    <div className="space-y-8">
      {[...Array(2)].map((_, idx) => (
        <div key={idx} className="bg-gray-100 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-6 w-16 bg-blue-100 rounded"></div>
            <div className="h-6 w-40 bg-blue-100 rounded"></div>
          </div>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-start gap-4 bg-white/80 rounded-lg p-4">
                <div className="w-8 h-8 bg-blue-100 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-64 bg-blue-100 rounded"></div>
                  <div className="flex gap-2">
                    <div className="h-5 w-24 bg-blue-100 rounded"></div>
                    <div className="h-5 w-24 bg-blue-100 rounded"></div>
                    <div className="h-5 w-24 bg-blue-100 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-100 pt-20 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto bg-white/90 rounded-2xl shadow-xl border border-blue-100 p-6 sm:p-8">
        {/* Header */}
        <h2 className="text-3xl font-bold text-blue-900 mb-6 animate-fade-in relative">
          Your Session History
          <span className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full w-0 group-hover:w-full transition-all duration-300"></span>
        </h2>

        {/* Search and Date Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 sticky top-16 bg-gradient-to-r from-blue-50 to-blue-100 z-10 p-4 -mx-6 sm:-mx-8 rounded-t-2xl shadow-sm">
          <input
            type="text"
            className="border border-blue-200 rounded-lg px-4 py-2 w-full sm:w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80"
            placeholder="Search by tutor, subject, or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            type="date"
            className="border border-blue-200 rounded-lg px-4 py-2 w-full sm:w-1/4 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <button
            className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-2 rounded-lg font-medium hover:scale-105 hover:shadow-lg transition duration-200 transform"
            onClick={() => {
              setSearch("");
              setSelectedDate("");
            }}
          >
            Clear
          </button>
        </div>

        {/* Date Hover Selection */}
        <div className="flex flex-wrap gap-2 mb-8">
          {history.map((entry) => (
            <button
              key={entry.date}
              className={`px-4 py-2 rounded-full text-sm font-medium transition duration-200 transform hover:scale-105 hover:shadow-md ${
                selectedDate === entry.date
                  ? "bg-gradient-to-r from-blue-600 to-blue-800 text-white"
                  : hoveredDate === entry.date
                  ? "bg-blue-200 text-blue-900"
                  : "bg-blue-50 text-blue-900"
              }`}
              onClick={() => setSelectedDate(entry.date)}
              onMouseEnter={() => setHoveredDate(entry.date)}
              onMouseLeave={() => setHoveredDate(null)}
            >
              {new Date(entry.date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </button>
          ))}
        </div>

        {/* History Content */}
        {loading ? (
          <SkeletonLoader />
        ) : error ? (
          <div className="text-red-600 text-center animate-fade-in">{error}</div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-gray-500 text-center animate-fade-in">No history found.</div>
        ) : (
          <ul className="space-y-8">
            {filteredHistory.map((entry, idx) => (
              <React.Fragment key={idx}>
                <li className="bg-gradient-to-br from-blue-50 to-gray-50 rounded-xl p-6 shadow-md border border-blue-200 transform transition-all duration-500 animate-slide-up">
                  <div className="flex items-center gap-3 mb-4 group relative">
                    <div className="font-bold text-blue-900 text-lg">
                      {entry.date.split("-").slice(1).join("/")}
                    </div>
                    <div className="font-semibold text-blue-900 text-xl">
                      {new Date(entry.date).toLocaleDateString(undefined, {
                        weekday: "long",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                      <span className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full w-0 group-hover:w-full transition-all duration-300"></span>
                    </div>
                  </div>
                  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {entry.sessions.map((s) => (
                      <li
                        key={s.id}
                        className={`bg-white/80 rounded-lg p-4 border border-blue-200 shadow-sm hover:shadow-xl hover:scale-105 transition duration-300 transform cursor-pointer ${
                          expandedSession === s.id ? "animate-flip" : ""
                        }`}
                        onClick={() => setExpandedSession(expandedSession === s.id ? null : s.id)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="pt-1 text-2xl">{sessionTypeLabel(s.type)}</div>
                          <div className="flex-1">
                            <div className="font-semibold text-blue-900 text-base mb-2 flex items-center gap-2">
                              {s.type === "gd" ? (
                                <>
                                  <span className="bg-gradient-to-r from-blue-200 to-blue-400 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                    Group Discussion
                                  </span>
                                  <span className="text-gray-600 font-normal">
                                    with {Array.isArray(s.with) ? s.with.join(", ") : s.with}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      s.type === "one-on-one"
                                        ? "bg-gradient-to-r from-green-200 to-green-400 text-green-800"
                                        : "bg-gradient-to-r from-yellow-200 to-yellow-400 text-yellow-800"
                                    }`}
                                  >
                                    {s.type === "one-on-one" ? "1-on-1" : "Interview"}
                                  </span>
                                  <span className="text-gray-600 font-normal">with {s.with}</span>
                                </>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 text-gray-600 text-sm">
                              <span className="inline-flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                                <span className="text-blue-900">🕒</span> {formatTime(s.when)}{" "}
                                <span className="text-gray-500">({s.duration} min)</span>
                              </span>
                              <span className="inline-flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                                <span className="text-blue-900">💳</span> {s.credits} credits
                              </span>
                              {s.subject && (
                                <span className="inline-flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                                  <span className="text-blue-900">📚</span> {s.subject}
                                </span>
                              )}
                              {s.topic && (
                                <span className="inline-flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                                  <span className="text-blue-900">🔖</span> {s.topic}
                                </span>
                              )}
                              {s.subtopic && (
                                <span className="inline-flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                                  <span className="text-blue-900">📌</span> {s.subtopic}
                                </span>
                              )}
                              {typeof s.rating === "number" && (
                                <span className="inline-flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                                  <span className="text-yellow-500">⭐</span> {s.rating}
                                </span>
                              )}
                            </div>
                            {expandedSession === s.id && (
                              <div className="mt-3 text-gray-600 text-sm animate-fade-in">
                                <span className="font-medium">Notes: </span>
                                {s.notes || "No additional notes provided."}
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </li>
                {idx < filteredHistory.length - 1 && (
                  <hr className="my-6 border-blue-200 opacity-50" />
                )}
              </React.Fragment>
            ))}
          </ul>
        )}
      </div>

      {/* Inline CSS for Animations */}
      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in;
        }
        .animate-slide-up {
          animation: slideUp 0.5s ease-out;
        }
        .animate-flip {
          animation: flip 0.3s ease-in-out;
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes flip {
          from {
            transform: perspective(400px) rotateY(90deg);
            opacity: 0;
          }
          to {
            transform: perspective(400px) rotateY(0deg);
            opacity: 1;
          }
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};

export default HistoryPage;
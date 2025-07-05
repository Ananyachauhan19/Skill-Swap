import React, { useEffect, useState } from "react";

// --- Static mock data for user session history (replace with backend data later) ---
const STATIC_HISTORY = [
  {
    date: "2025-07-05",
    sessions: [
      {
        type: "one-on-one",
        with: "Alice Smith",
        when: "2025-07-05T10:00:00Z",
        duration: 45, // minutes
        credits: 10,
        subject: "Mathematics",
        topic: "Algebra",
        subtopic: "Linear Equations",
        rating: 5
      },
      {
        type: "interview",
        with: "Bob Lee",
        when: "2025-07-05T14:00:00Z",
        duration: 30,
        credits: 15,
        rating: 4
      },
      {
        type: "gd",
        with: ["Alice Smith", "Bob Lee", "Charlie Kim"],
        when: "2025-07-05T16:00:00Z",
        duration: 60,
        credits: 5
      }
    ]
  },
  {
    date: "2025-07-04",
    sessions: [
      {
        type: "one-on-one",
        with: "Charlie Kim",
        when: "2025-07-04T09:00:00Z",
        duration: 30,
        credits: 8,
        subject: "Physics",
        topic: "Optics",
        subtopic: "Lenses",
        rating: 4
      }
    ]
  }
];

// --- Function to fetch user history
export async function fetchUserHistory() {
  // Simulate network delay
  return new Promise((resolve) => {
    setTimeout(() => resolve(STATIC_HISTORY), 400);
  });
}

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserHistory()
      .then(data => setHistory(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Helper to format time
  function formatTime(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Helper to get session type label/icon
  function sessionTypeLabel(type) {
    if (type === 'one-on-one') return <span title="1-on-1" className="inline-block mr-2">👤</span>;
    if (type === 'interview') return <span title="Interview" className="inline-block mr-2">🎤</span>;
    if (type === 'gd') return <span title="Group Discussion" className="inline-block mr-2">👥</span>;
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-12">
      <div className="max-w-10xl mx-auto bg-white/80 rounded-2xl shadow-lg border border-blue-100 p-8">
        <h2 className="text-2xl font-bold text-blue-900 mb-6">Your Daily History</h2>
        {loading ? (
          <div className="text-blue-700">Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : history.length === 0 ? (
          <div className="text-gray-500">No history found.</div>
        ) : (
          <ul className="space-y-8">
            {history.map((entry, idx) => (
              <li key={idx} className="bg-blue-50 rounded-lg p-4 shadow border border-blue-100">
                <div className="font-semibold text-blue-800 mb-2 text-lg">{entry.date}</div>
                <ul className="space-y-3">
                  {entry.sessions.map((s, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="pt-1">{sessionTypeLabel(s.type)}</div>
                      <div className="flex-1">
                        <div className="font-medium text-blue-900">
                          {s.type === 'gd' ? (
                            <>Group Discussion with {Array.isArray(s.with) ? s.with.join(', ') : s.with}</>
                          ) : (
                            <>
                              {s.type === 'one-on-one' ? '1-on-1 with ' : 'Interview with '}
                              {s.with}
                            </>
                          )}
                        </div>
                        <div className="text-gray-700 text-sm mt-1">
                          <span className="inline-block mr-4">🕒 {formatTime(s.when)} ({s.duration} min)</span>
                          <span className="inline-block mr-4">💳 {s.credits} credits</span>
                          {s.subject && <span className="inline-block mr-4">📚 {s.subject}</span>}
                          {s.topic && <span className="inline-block mr-4">🔖 {s.topic}</span>}
                          {s.subtopic && <span className="inline-block mr-4">📌 {s.subtopic}</span>}
                          {typeof s.rating === 'number' && <span className="inline-block">⭐ {s.rating}</span>}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;

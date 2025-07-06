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

// --- Function to fetch user history from backend (commented for now) ---
// export async function fetchUserHistory({ search = "", date = "" } = {}) {
//   let url = "/history";
//   const params = [];
//   if (search) params.push(`search=${encodeURIComponent(search)}`);
//   if (date) params.push(`date=${encodeURIComponent(date)}`);
//   if (params.length) url += `?${params.join("&")}`;
//   const response = await fetch(url);
//   if (!response.ok) throw new Error("Failed to fetch history");
//   return await response.json();
// }

// --- Use static data for now ---
export async function fetchUserHistory() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(STATIC_HISTORY), 400);
  });
}

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    setLoading(true);
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
        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <input
            type="text"
            className="border border-blue-200 rounded-md px-4 py-2 w-full md:w-1/3"
            placeholder="Search by tutor name, subject, or topic..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <input
            type="date"
            className="border border-blue-200 rounded-md px-4 py-2 w-full md:w-1/4"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition"
            onClick={() => { setSearch(""); setDate(""); }}
            title="Clear search and date"
          >
            Clear
          </button>
        </div>
        {loading ? (
          <div className="text-blue-700">Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : history.length === 0 ? (
          <div className="text-gray-500">No history found.</div>
        ) : (
          <ul className="space-y-12">
            {history.map((entry, idx) => (
              <React.Fragment key={idx}>
                <li className="bg-gradient-to-br from-blue-100/60 to-blue-50/80 rounded-2xl p-6 shadow-lg border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-200 text-blue-900 font-bold text-lg shadow">
                      {entry.date.split('-').slice(1).join('/')} {/* MM/DD */}
                    </div>
                    <div className="font-semibold text-blue-800 text-lg tracking-wide">
                      {new Date(entry.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <ul className="space-y-4">
                    {entry.sessions.map((s, i) => (
                      <li key={i} className="flex items-start gap-4 bg-white/80 rounded-xl p-4 border border-blue-100 shadow-sm hover:shadow-md transition">
                        <div className="pt-1 text-2xl">
                          {sessionTypeLabel(s.type)}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-blue-900 text-base mb-1 flex items-center gap-2">
                            {s.type === 'gd' ? (
                              <>
                                <span className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">Group Discussion</span>
                                <span className="text-gray-700 font-normal">with {Array.isArray(s.with) ? s.with.join(', ') : s.with}</span>
                              </>
                            ) : (
                              <>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.type === 'one-on-one' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{s.type === 'one-on-one' ? '1-on-1' : 'Interview'}</span>
                                <span className="text-gray-700 font-normal">with {s.with}</span>
                              </>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-3 text-gray-700 text-sm mt-2">
                            <span className="inline-flex items-center gap-1 bg-blue-50 px-2 py-1 rounded"><span className="text-blue-700">🕒</span> {formatTime(s.when)} <span className="text-gray-400">({s.duration} min)</span></span>
                            <span className="inline-flex items-center gap-1 bg-blue-50 px-2 py-1 rounded"><span className="text-blue-700">💳</span> {s.credits} credits</span>
                            {s.subject && <span className="inline-flex items-center gap-1 bg-blue-50 px-2 py-1 rounded"><span className="text-blue-700">📚</span> {s.subject}</span>}
                            {s.topic && <span className="inline-flex items-center gap-1 bg-blue-50 px-2 py-1 rounded"><span className="text-blue-700">🔖</span> {s.topic}</span>}
                            {s.subtopic && <span className="inline-flex items-center gap-1 bg-blue-50 px-2 py-1 rounded"><span className="text-blue-700">📌</span> {s.subtopic}</span>}
                            {typeof s.rating === 'number' && <span className="inline-flex items-center gap-1 bg-blue-50 px-2 py-1 rounded"><span className="text-yellow-500">⭐</span> {s.rating}</span>}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </li>
                {idx < history.length - 1 && (
                  <hr className="my-8 border-blue-300 opacity-60" />
                )}
              </React.Fragment>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;

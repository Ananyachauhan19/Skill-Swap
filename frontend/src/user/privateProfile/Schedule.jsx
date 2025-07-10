import React, { useEffect, useState } from "react";

const Schedule = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // const fetchScheduledSessions = async () => {
    //   setLoading(true);
    //   setError(null);
    //   try {
    //     const res = await fetch("/api/live/scheduled");
    //     if (!res.ok) throw new Error("Failed to fetch scheduled sessions");
    //     const data = await res.json();
    //     const now = new Date();
    //     const upcoming = data.filter(
    //       (session) =>
    //         session.scheduledTime &&
    //         (!session.started || session.started === false) &&
    //         new Date(session.scheduledTime) > now
    //     );
    //     setSessions(upcoming);
    //   } catch (err) {
    //     setError(err.message);
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchScheduledSessions();
    // --- Static data for development/demo ---
    setLoading(true);
    setTimeout(() => {
      setSessions([
        {
          id: 1,
          title: "React Basics Live Q&A",
          scheduledTime: new Date(Date.now() + 3600 * 1000).toISOString(),
          hostName: "Ananya Sharma",
          started: false,
        },
        {
          id: 2,
          title: "Advanced Node.js Workshop",
          scheduledTime: new Date(Date.now() + 7200 * 1000).toISOString(),
          host: "Rahul Verma",
          started: false,
        },
      ]);
      setLoading(false);
    },0);
  }, []);

  return (
    <div className="space-y-6 w-full max-w-2xl mx-auto px-2 sm:px-4 md:px-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center sm:text-left">
        Upcoming Scheduled Live Sessions
      </h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {sessions.length === 0 && !loading && (
        <p>No upcoming scheduled sessions.</p>
      )}
      <ul className="space-y-4">
        {sessions.map((session) => (
          <li
            key={session.id}
            className="bg-blue-50 p-3 sm:p-4 rounded shadow flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
          >
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-blue-900 truncate">
                {session.title}
              </h3>
              <p className="text-gray-700 text-xs sm:text-sm break-words">
                Scheduled for:{" "}
                {new Date(session.scheduledTime).toLocaleString()}
              </p>
              <p className="text-gray-500 text-xs sm:text-sm">
                Host: {session.hostName || session.host || "Unknown"}
              </p>
            </div>
            <div className="mt-2 sm:mt-0 flex-shrink-0 w-full sm:w-auto">
              <button className="w-full sm:w-auto bg-blue-600 text-white px-3 sm:px-4 py-2 rounded hover:bg-blue-700 transition text-xs sm:text-base">
                View Details
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Schedule;

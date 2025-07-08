import React, { useEffect, useState } from "react";

// Backend function: Fetch 1-on-1 sessions
// async function fetchOneOnOneSessions() {
//   const res = await fetch('/api/sessions/one-on-one');
//   return res.json();
// }
// Backend function: Fetch live sessions
// async function fetchLiveSessions() {
//   const res = await fetch('/api/sessions/live');
//   return res.json();
// }
// Backend function: Fetch recorded sessions
// async function fetchRecordedSessions() {
//   const res = await fetch('/api/sessions/recorded');
//   return res.json();
// }

const MySessions = () => {
  // Static fallback data for development/demo
  const [oneOnOne, setOneOnOne] = useState([]);
  const [live, setLive] = useState([]);
  const [recorded, setRecorded] = useState([]);

  // useEffect(() => {
  //   fetchOneOnOneSessions().then(setOneOnOne);
  //   fetchLiveSessions().then(setLive);
  //   fetchRecordedSessions().then(setRecorded);
  // }, []);

  return (
    <div className="space-y-8 w-full max-w-4xl mx-auto px-2 sm:px-6 py-6">
      <section>
        <h2 className="text-lg sm:text-xl font-bold mb-2 text-blue-900">1-on-1 Sessions</h2>
        {/* Render 1-on-1 sessions here */}
        <div className="bg-blue-50 rounded p-4 min-h-[60px] text-sm sm:text-base overflow-x-auto">{oneOnOne.length ? oneOnOne.map(s => <div key={s.id} className="truncate">{s.title}</div>) : <span className="text-gray-500">No 1-on-1 sessions found.</span>}</div>
      </section>
      <section>
        <h2 className="text-lg sm:text-xl font-bold mb-2 text-green-900">Live Sessions</h2>
        {/* Render live sessions here */}
        <div className="bg-green-50 rounded p-4 min-h-[60px] text-sm sm:text-base overflow-x-auto">{live.length ? live.map(s => <div key={s.id} className="truncate">{s.title}</div>) : <span className="text-gray-500">No live sessions found.</span>}</div>
      </section>
      <section>
        <h2 className="text-lg sm:text-xl font-bold mb-2 text-purple-900">Recorded Sessions</h2>
        {/* Render recorded sessions here */}
        <div className="bg-purple-50 rounded p-4 min-h-[60px] text-sm sm:text-base overflow-x-auto">{recorded.length ? recorded.map(s => <div key={s.id} className="truncate">{s.title}</div>) : <span className="text-gray-500">No recorded sessions found.</span>}</div>
      </section>
    </div>
  );
};

export default MySessions;

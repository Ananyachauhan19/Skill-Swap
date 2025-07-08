import React, { useEffect, useState } from "react";

// Backend function: Fetch 1-on-1 past bookings
// async function fetchOneOnOnePastBookings() {
//   const res = await fetch('/api/bookings/one-on-one/past');
//   return res.json();
// }
// Backend function: Fetch live session past bookings
// async function fetchLivePastBookings() {
//   const res = await fetch('/api/bookings/live/past');
//   return res.json();
// }
// Backend function: Fetch recorded session past bookings
// async function fetchRecordedPastBookings() {
//   const res = await fetch('/api/bookings/recorded/past');
//   return res.json();
// }

const PastBookings = () => {
  // Static fallback data for development/demo
  const [oneOnOne, setOneOnOne] = useState([]);
  const [live, setLive] = useState([]);
  const [recorded, setRecorded] = useState([]);

  // useEffect(() => {
  //   fetchOneOnOnePastBookings().then(setOneOnOne);
  //   fetchLivePastBookings().then(setLive);
  //   fetchRecordedPastBookings().then(setRecorded);
  // }, []);

  return (
    <div className="space-y-8 w-full max-w-4xl mx-auto px-2 sm:px-6 py-6">
      <section>
        <h2 className="text-lg sm:text-xl font-bold mb-2 text-blue-900">1-on-1 Sessions</h2>
        {/* Render 1-on-1 past bookings here */}
        <div className="bg-blue-50 rounded p-4 min-h-[60px] text-sm sm:text-base overflow-x-auto">{oneOnOne.length ? oneOnOne.map(s => <div key={s.id} className="truncate">{s.title}</div>) : <span className="text-gray-500">No 1-on-1 bookings found.</span>}</div>
      </section>
      <section>
        <h2 className="text-lg sm:text-xl font-bold mb-2 text-green-900">Live Sessions</h2>
        {/* Render live session past bookings here */}
        <div className="bg-green-50 rounded p-4 min-h-[60px] text-sm sm:text-base overflow-x-auto">{live.length ? live.map(s => <div key={s.id} className="truncate">{s.title}</div>) : <span className="text-gray-500">No live bookings found.</span>}</div>
      </section>
      <section>
        <h2 className="text-lg sm:text-xl font-bold mb-2 text-purple-900">Recorded Sessions</h2>
        {/* Render recorded session past bookings here */}
        <div className="bg-purple-50 rounded p-4 min-h-[60px] text-sm sm:text-base overflow-x-auto">{recorded.length ? recorded.map(s => <div key={s.id} className="truncate">{s.title}</div>) : <span className="text-gray-500">No recorded bookings found.</span>}</div>
      </section>
    </div>
  );
};

export default PastBookings;

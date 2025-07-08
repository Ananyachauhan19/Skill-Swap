import React, { useEffect, useState } from "react";

// Backend function: Fetch 1-on-1 session badges/certifications
// async function fetchOneOnOneBadges() {
//   const res = await fetch('/api/badges/one-on-one');
//   return res.json();
// }
// Backend function: Fetch live session badges/certifications
// async function fetchLiveBadges() {
//   const res = await fetch('/api/badges/live');
//   return res.json();
// }
// Backend function: Fetch recorded session badges/certifications
// async function fetchRecordedBadges() {
//   const res = await fetch('/api/badges/recorded');
//   return res.json();
// }

const SkillBadges = () => {
  // Static fallback data for development/demo
  const [oneOnOne, setOneOnOne] = useState([]);
  const [live, setLive] = useState([]);
  const [recorded, setRecorded] = useState([]);

  // useEffect(() => {
  //   fetchOneOnOneBadges().then(setOneOnOne);
  //   fetchLiveBadges().then(setLive);
  //   fetchRecordedBadges().then(setRecorded);
  // }, []);

  return (
    <div className="space-y-8 w-full max-w-4xl mx-auto px-2 sm:px-6 py-6">
      <section>
        <h2 className="text-lg sm:text-xl font-bold mb-2 text-blue-900">1-on-1 Sessions</h2>
        {/* Render 1-on-1 badges/certifications here */}
        <div className="bg-blue-50 rounded p-4 min-h-[60px] text-sm sm:text-base overflow-x-auto">{oneOnOne.length ? oneOnOne.map(b => <div key={b.id} className="truncate">{b.title}</div>) : <span className="text-gray-500">No 1-on-1 badges found.</span>}</div>
      </section>
      <section>
        <h2 className="text-lg sm:text-xl font-bold mb-2 text-green-900">Live Sessions</h2>
        {/* Render live badges/certifications here */}
        <div className="bg-green-50 rounded p-4 min-h-[60px] text-sm sm:text-base overflow-x-auto">{live.length ? live.map(b => <div key={b.id} className="truncate">{b.title}</div>) : <span className="text-gray-500">No live badges found.</span>}</div>
      </section>
      <section>
        <h2 className="text-lg sm:text-xl font-bold mb-2 text-purple-900">Recorded Sessions</h2>
        {/* Render recorded badges/certifications here */}
        <div className="bg-purple-50 rounded p-4 min-h-[60px] text-sm sm:text-base overflow-x-auto">{recorded.length ? recorded.map(b => <div key={b.id} className="truncate">{b.title}</div>) : <span className="text-gray-500">No recorded badges found.</span>}</div>
      </section>
    </div>
  );
};

export default SkillBadges;

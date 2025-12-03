import React, { useEffect, useMemo, useState } from 'react';
import { BACKEND_URL } from '../../config.js';
import { FaStar, FaTable, FaTrophy } from 'react-icons/fa';

// Contract:
// - Fetch top interviewers and top candidates from backend
// - Merge by user to compute overall "activity" (conducted + attended)
// - Show top 3 in a table with: rank, avatar, name, stars (avg), total interviews

const TopInterviewPerformance = () => {
  const [conducted, setConducted] = useState([]); // [{ user, count, avgRating? }]
  const [attended, setAttended] = useState([]);  // [{ user, count, avgRating? }]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      setLoading(true); setError('');
      try {
        const res = await fetch(`${BACKEND_URL}/api/interview/requests`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (!mounted) return;
        const list = Array.isArray(data) ? data : [...(data.sent || []), ...(data.received || [])];
        const byInterviewer = new Map();
        const byCandidate = new Map();
        const userMap = new Map();
        for (const r of list) {
          const interObj = typeof r.assignedInterviewer === 'object' ? r.assignedInterviewer : null;
          const candObj = typeof r.requester === 'object' ? r.requester : null;
          const interId = r.assignedInterviewer && (r.assignedInterviewer._id || r.assignedInterviewer);
          const candId = r.requester && (r.requester._id || r.requester);
          if (interId) byInterviewer.set(String(interId), (byInterviewer.get(String(interId)) || 0) + 1);
          if (candId) byCandidate.set(String(candId), (byCandidate.get(String(candId)) || 0) + 1);
          if (interObj && interObj._id && !userMap.has(String(interObj._id))) userMap.set(String(interObj._id), interObj);
          if (candObj && candObj._id && !userMap.has(String(candObj._id))) userMap.set(String(candObj._id), candObj);
        }
        const conductedArr = Array.from(byInterviewer.entries()).map(([id, count]) => ({ user: userMap.get(id) || { _id: id }, count }));
        const attendedArr = Array.from(byCandidate.entries()).map(([id, count]) => ({ user: userMap.get(id) || { _id: id }, count }));
        setConducted(conductedArr);
        setAttended(attendedArr);
      } catch (e) {
        console.error('TopInterviewPerformance fetch error:', e);
        if (!mounted) return;
        setError('Failed to load top performers');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchData();
    return () => { mounted = false; };
  }, []);

  const merged = useMemo(() => {
    // Map by user._id and sum counts; prefer rating from conducted, fallback to attended
    const byId = new Map();
    const add = (arr, kind) => {
      for (const item of arr || []) {
        const id = String(item.user?._id || item.user?.id || item.user || item._id || Math.random());
        const prev = byId.get(id) || { user: item.user, conducted: 0, attended: 0, rating: null };
        if (kind === 'conducted') prev.conducted += item.count || 0; else prev.attended += item.count || 0;
        // prefer rating from conducted; else keep best available
        if (prev.rating == null) prev.rating = typeof item.avgRating === 'number' ? item.avgRating : null;
        // keep richer user object if available
        prev.user = prev.user || item.user;
        byId.set(id, prev);
      }
    };
    add(conducted, 'conducted');
    add(attended, 'attended');
    const all = Array.from(byId.values()).map(r => ({
      ...r,
      total: (r.conducted || 0) + (r.attended || 0),
    }));
    // sort by total desc; take top 3
    return all.sort((a, b) => b.total - a.total).slice(0, 3);
  }, [conducted, attended]);

  if (loading) {
    return (
      <section className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 mt-4">Loading top interview performance...</p>
        </div>
      </section>
    );
  }

  if (error || merged.length === 0) return null;

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-8">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-2">Top Interview Performance</h2>
        <p className="text-center text-gray-600 text-sm">Overall activity rankings</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Rank</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Rating</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {merged.map((row, idx) => {
              const name = (row.user?.firstName || row.user?.username || 'User') + (row.user?.lastName ? ` ${row.user.lastName}` : '');
              const avatar = row.user?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=DBEAFE&color=1E40AF&bold=true`;
              const stars = typeof row.rating === 'number' ? Math.round(row.rating) : null;
              return (
                <tr key={row.user?._id || idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    <div className="flex items-center gap-2">
                      <span>#{idx + 1}</span>
                      {idx < 3 && <FaTrophy className={`${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : 'text-orange-600'}`} />}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" />
                      <div>
                        <div className="text-gray-900 font-medium">{name}</div>
                        <div className="text-xs text-gray-500">{row.conducted || 0} conducted • {row.attended || 0} attended</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {stars == null ? (
                        <span className="text-gray-500 text-sm">N/A</span>
                      ) : (
                        [...Array(5)].map((_, i) => (
                          <FaStar key={i} className={i < stars ? 'text-yellow-500' : 'text-gray-300'} size={14} />
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-semibold">{row.total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default TopInterviewPerformance;

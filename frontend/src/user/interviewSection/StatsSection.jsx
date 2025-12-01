import React, { useEffect, useState } from "react";
import { BACKEND_URL } from "../../config.js";

const StatsSection = () => {
  const [stats, setStats] = useState({
    totalInterviews: null,
    successRate: null,
    totalExperts: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchStats() {
      setStats(s => ({ ...s, loading: true, error: null }));
      try {
        let statsData = null;
        try {
          const statsRes = await fetch(`${BACKEND_URL}/api/interview/stats`, { credentials: 'include' });
          if (statsRes.ok) {
            statsData = await statsRes.json();
          }
        } catch (err) {
          console.log('Stats endpoint error:', err);
        }

        if (statsData) {
          setStats({
            totalInterviews: statsData.totalInterviews || 0,
            totalExperts: statsData.totalExperts || 0,
            successRate: statsData.successRate || 0,
            loading: false,
            error: null,
          });
        } else {
          // Fallback: compute stats client-side from my-interviews endpoint
          const res = await fetch(`${BACKEND_URL}/api/interview/my-interviews`, { credentials: 'include' });
          if (!res.ok) {
            // Second fallback: use requests endpoint
            const res2 = await fetch(`${BACKEND_URL}/api/interview/requests`, { credentials: 'include' });
            if (!res2.ok) throw new Error('Failed to load interview data');
            const data2 = await res2.json();
            const list = Array.isArray(data2) ? data2 : [...(data2.sent || []), ...(data2.received || [])];
            const byId = new Map();
            let completed = 0;
            let experts = new Set();
            for (const r of list) {
              byId.set(String(r._id || Math.random()), true);
              if ((r.status || '').toLowerCase() === 'completed') completed += 1;
              const inter = r.assignedInterviewer && (r.assignedInterviewer._id || r.assignedInterviewer);
              if (inter) experts.add(String(inter));
            }
            const totalUnique = byId.size;
            const successRate = totalUnique > 0 ? Math.round((completed / totalUnique) * 100) : 0;
            setStats({
              totalInterviews: totalUnique,
              totalExperts: experts.size,
              successRate,
              loading: false,
              error: null,
            });
          } else {
            const data = await res.json();
            const list = Array.isArray(data) ? data : [];
            const byId = new Map();
            let completed = 0;
            let experts = new Set();
            for (const r of list) {
              byId.set(String(r._id || Math.random()), true);
              if ((r.status || '').toLowerCase() === 'completed') completed += 1;
              const inter = r.assignedInterviewer && (r.assignedInterviewer._id || r.assignedInterviewer);
              if (inter) experts.add(String(inter));
            }
            const totalUnique = byId.size;
            const successRate = totalUnique > 0 ? Math.round((completed / totalUnique) * 100) : 0;
            setStats({
              totalInterviews: totalUnique,
              totalExperts: experts.size,
              successRate,
              loading: false,
              error: null,
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
        setStats(s => ({ ...s, loading: false, error: 'Failed to load stats' }));
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 sm:gap-8 pt-4 sm:pt-6">
      <div className="text-center">
        <p className="text-3xl sm:text-4xl font-bold text-[#1e3a8a]">
          {stats.loading ? '...' : stats.totalInterviews ?? 0}
        </p>
        <p className="text-sm text-[#6b7280] mt-1">Mock Interviews</p>
      </div>
      <div className="w-px h-12 bg-blue-200"></div>
      <div className="text-center">
        <p className="text-3xl sm:text-4xl font-bold text-[#1e3a8a]">
          {stats.loading ? '...' : (stats.successRate != null ? `${stats.successRate}%` : '0%')}
        </p>
        <p className="text-sm text-[#6b7280] mt-1">Success Rate</p>
      </div>
      <div className="w-px h-12 bg-blue-200"></div>
      <div className="text-center">
        <p className="text-3xl sm:text-4xl font-bold text-[#1e3a8a]">
          {stats.loading ? '...' : stats.totalExperts ?? 0}
        </p>
        <p className="text-sm text-[#6b7280] mt-1">Expert Interviewers</p>
      </div>
    </div>
  );
};

export default StatsSection;
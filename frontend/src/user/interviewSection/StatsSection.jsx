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
            let completed = 0;
            let hosted = 0;
            let scheduled = 0;
            const currentUserId = list[0]?.requester?._id || list[0]?.assignedInterviewer?._id;
            for (const r of list) {
              if ((r.status || '').toLowerCase() === 'completed') completed += 1;
              if ((r.status || '').toLowerCase() === 'scheduled' || (r.status || '').toLowerCase() === 'completed') scheduled += 1;
              const interId = r.assignedInterviewer && (r.assignedInterviewer._id || r.assignedInterviewer);
              if (interId && String(interId) === String(currentUserId)) {
                hosted += 1;
              }
            }
            const completionRate = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;
            setStats({
              totalInterviews: completed,
              totalExperts: hosted,
              successRate: completionRate,
              loading: false,
              error: null,
            });
          } else {
            const data = await res.json();
            const list = Array.isArray(data) ? data : [];
            let completed = 0;
            let hosted = 0;
            let scheduled = 0;
            // Get current user ID from auth context
            const currentUserId = list[0]?.requester?._id || list[0]?.assignedInterviewer?._id;
            for (const r of list) {
              if ((r.status || '').toLowerCase() === 'completed') completed += 1;
              if ((r.status || '').toLowerCase() === 'scheduled' || (r.status || '').toLowerCase() === 'completed') scheduled += 1;
              // Count interviews where current user was the interviewer
              const interId = r.assignedInterviewer && (r.assignedInterviewer._id || r.assignedInterviewer);
              if (interId && String(interId) === String(currentUserId)) {
                hosted += 1;
              }
            }
            const completionRate = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;
            setStats({
              totalInterviews: completed,
              totalExperts: hosted,
              successRate: completionRate,
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
        <p className="text-sm text-[#6b7280] mt-1">Total Interviews</p>
      </div>
      <div className="w-px h-12 bg-blue-200"></div>
      <div className="text-center">
        <p className="text-3xl sm:text-4xl font-bold text-[#1e3a8a]">
          {stats.loading ? '...' : stats.totalExperts ?? 0}
        </p>
        <p className="text-sm text-[#6b7280] mt-1">Interviews Hosted</p>
      </div>
      <div className="w-px h-12 bg-blue-200"></div>
      <div className="text-center">
        <p className="text-3xl sm:text-4xl font-bold text-[#1e3a8a]">
          {stats.loading ? '...' : (stats.successRate != null ? `${stats.successRate}%` : '0%')}
        </p>
        <p className="text-sm text-[#6b7280] mt-1">Completion Rate</p>
      </div>
    </div>
  );
};

export default StatsSection;
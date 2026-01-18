import React, { useEffect, useState } from 'react';
import { BACKEND_URL } from '../../config.js';
import { Award, TrendingUp } from 'lucide-react';

const CampusLeaderboard = () => {
  const [overallRankings, setOverallRankings] = useState([]);
  const [weeklyRankings, setWeeklyRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError('');

        // First, get the student's institute
        const instRes = await fetch(`${BACKEND_URL}/api/campus-ambassador/my-institute`, {
          credentials: 'include',
        });

        if (!instRes.ok) {
          const payload = await instRes.json().catch(() => null);
          throw new Error(payload?.message || 'Unable to load institute for leaderboard');
        }

        const instPayload = await instRes.json();
        const instituteId = instPayload?.institute?.instituteId;

        if (!instituteId) {
          throw new Error('No institute found for this student');
        }

        // Fetch overall rankings (top 3 or fewer if not enough students)
        const overallRes = await fetch(
          `${BACKEND_URL}/api/campus-ambassador/institutes/${encodeURIComponent(
            instituteId
          )}/rankings?limit=3`,
          { credentials: 'include' }
        );

        const weeklyRes = await fetch(
          `${BACKEND_URL}/api/campus-ambassador/institutes/${encodeURIComponent(
            instituteId
          )}/rankings/weekly?limit=3`,
          { credentials: 'include' }
        );

        if (!overallRes.ok || !weeklyRes.ok) {
          const overallPayload = await overallRes.json().catch(() => null);
          const weeklyPayload = await weeklyRes.json().catch(() => null);
          const message =
            overallPayload?.message ||
            weeklyPayload?.message ||
            `Failed to load rankings (${overallRes.status}/${weeklyRes.status})`;
          throw new Error(message);
        }

        const overallPayload = await overallRes.json();
        const weeklyPayload = await weeklyRes.json();

        if (!cancelled) {
          setOverallRankings(Array.isArray(overallPayload?.rankings) ? overallPayload.rankings : []);
          setWeeklyRankings(Array.isArray(weeklyPayload?.rankings) ? weeklyPayload.rankings : []);
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load leaderboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const renderStudentCard = (student, idx, accent = 'blue') => {
    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
    const medalColor =
      idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-500' : 'text-orange-500';

    const scoreColor = accent === 'green' ? 'text-green-600' : 'text-blue-600';

    return (
      <div
        key={student.studentId}
        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3"
      >
        <div className="flex items-center gap-3">
          <div className={`text-2xl ${medalColor}`}>{medal}</div>
          {student.profilePic ? (
            <img
              src={student.profilePic}
              alt={student.username}
              className="w-10 h-10 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-semibold">
              {(student.firstName?.[0] || student.username?.[0] || 'S').toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {student.firstName && student.lastName
                ? `${student.firstName} ${student.lastName}`
                : student.username}
            </p>
            <p className="text-xs text-slate-500 truncate">@{student.username}</p>
          </div>
        </div>

        <div className="flex justify-between text-[11px] text-slate-600">
          <span>Sessions: {student.totalSessions}</span>
          <span>Quiz points: {student.totalQuizMarks}</span>
        </div>
        <div className="flex justify-between items-center border-t border-slate-100 pt-2 mt-1">
          <span className="text-[11px] font-medium text-slate-600">Total score</span>
          <span className={`text-lg font-bold ${scoreColor}`}>{student.totalScore}</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <section className="w-full">
        <div className="rounded-3xl bg-white border border-slate-100 p-5 sm:p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Campus Leaderboard</p>
            <p className="mt-1 text-sm text-slate-600">
              Calculating top performers from your institute…
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full">
        <div className="rounded-3xl bg-white border border-rose-100 p-5 sm:p-6">
          <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide">Campus Leaderboard</p>
          <p className="mt-1 text-sm text-slate-700">{error}</p>
        </div>
      </section>
    );
  }

  const hasAnyRankings = (overallRankings?.length || 0) > 0 || (weeklyRankings?.length || 0) > 0;

  if (!hasAnyRankings) {
    return (
      <section className="w-full">
        <div className="rounded-3xl bg-white border border-slate-100 p-5 sm:p-6">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Campus Leaderboard</p>
          <p className="mt-1 text-sm text-slate-700">
            No leaderboard data yet. As students complete 1-on-1 sessions and quizzes, the top
            performers from your institute will appear here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full">
      <div className="rounded-3xl bg-white border border-slate-100 p-5 sm:p-6 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Campus Leaderboard</p>
            <h3 className="mt-1 text-lg sm:text-xl font-bold text-slate-900">
              Top performers from your institute
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-xl">
              Rankings are based on total 1-on-1 sessions taken (as tutor and learner) plus the total
              marks from all quizzes.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-4 sm:p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-600" />
                <p className="text-sm font-semibold text-slate-900">Top students overall</p>
              </div>
              <span className="text-[11px] px-2 py-1 rounded-full bg-white text-slate-600 border border-amber-100">
                All time
              </span>
            </div>

            {overallRankings && overallRankings.length > 0 ? (
              <div className="flex flex-col gap-3">
                {overallRankings.map((s, idx) => renderStudentCard(s, idx, 'blue'))}
              </div>
            ) : (
              <p className="text-xs text-slate-600">
                No overall rankings yet. Start completing sessions and quizzes to appear here.
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-4 sm:p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <p className="text-sm font-semibold text-slate-900">This week&apos;s leaders</p>
              </div>
              <span className="text-[11px] px-2 py-1 rounded-full bg-white text-slate-600 border border-emerald-100">
                This week
              </span>
            </div>

            {weeklyRankings && weeklyRankings.length > 0 ? (
              <div className="flex flex-col gap-3">
                {weeklyRankings.map((s, idx) => renderStudentCard(s, idx, 'green'))}
              </div>
            ) : (
              <p className="text-xs text-slate-600">
                No weekly activity yet. Complete sessions and quizzes this week to claim the top
                spots.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CampusLeaderboard;

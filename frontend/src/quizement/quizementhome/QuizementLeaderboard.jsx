import React, { useCallback, useEffect, useState } from 'react';
import { BACKEND_URL } from '../../config.js';
import TopRankers from './TopRankers.jsx';

const QuizementLeaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeaders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const resp = await fetch(`${BACKEND_URL}/api/quizement/leaderboard?type=score&limit=10`, {
        credentials: 'include',
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data?.message || 'Failed to load leaderboard');
      }

      setLeaders(Array.isArray(data?.leaders) ? data.leaders : []);
    } catch (e) {
      setLeaders([]);
      setError(e?.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaders();
  }, [fetchLeaders]);

  return (
    <div className="w-full">
      <TopRankers leaders={leaders} loading={loading} error={error} />
      
      {/* Refresh Button */}
      {!loading && !error && leaders.length > 0 && (
        <div className="mt-4 text-center">
          <button type="button" className="text-sm text-blue-900 font-semibold hover:underline" onClick={fetchLeaders}>
            Refresh
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizementLeaderboard;

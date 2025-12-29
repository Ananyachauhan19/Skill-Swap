import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../../config.js';
import HeroDashboard from './HeroDashboard.jsx';
import SkillThought from './CampusThought.jsx';
import ActivityDashboard from './ActivityDashboard.jsx';
import FeatureDashboard from './FeatureDashboard.jsx';

const HomeDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const view = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('view') || 'home';
  }, [location.search]);

  useEffect(() => {
    const campusValidated = localStorage.getItem('campusValidated');
    if (!campusValidated) {
      navigate('/campus-dashboard/login', { replace: true });
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await fetch(`${BACKEND_URL}/api/campus-ambassador/student-home`, {
          credentials: 'include',
        });

        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          throw new Error(payload?.message || `Failed to load dashboard (${res.status})`);
        }

        const payload = await res.json();
        if (!cancelled) setData(payload);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (loading && !data) {
    return (
      <div className="min-h-[60vh] bg-gradient-to-b from-blue-50/20 via-white to-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600">Loading campus home…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] bg-gradient-to-b from-blue-50/20 via-white to-white flex items-center justify-center px-4">
        <div className="max-w-xl w-full bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-900">Unable to load Campus Home</p>
          <p className="text-xs text-gray-600 mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const hero = data?.hero || {};
  const activity = data?.activity || {};
  const thoughts = data?.thoughts || {};

  return (
    <div className="bg-gradient-to-b from-blue-50/20 via-white to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[76px] sm:pt-[88px] pb-14">
        <HeroDashboard hero={hero} />

        <div className="mt-10 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] px-4 sm:px-6 lg:px-8">
          <SkillThought thoughts={Array.isArray(thoughts.items) ? thoughts.items : []} />
        </div>

        <div className="mt-10">
          <ActivityDashboard activity={activity} />
        </div>

        <div className="mt-10">
          <FeatureDashboard activeView={view} />
        </div>
      </div>
    </div>
  );
};

export default HomeDashboard;

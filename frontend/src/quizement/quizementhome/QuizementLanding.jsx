import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import QuizementHeroSection from './QuizementHeroSection.jsx';
import QuizementLeaderboard from './QuizementLeaderboard.jsx';
import { BACKEND_URL } from '../../config.js';

const FILTERS = ['all', 'unlocked', 'attempted'];

const QuizementLanding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [unlockingId, setUnlockingId] = useState(null);
  const [coinModalTest, setCoinModalTest] = useState(null);
  const [coinBalances, setCoinBalances] = useState({ bronze: 0, silver: 0 });
  const [unlocking, setUnlocking] = useState(false);

  // Check if user is employee
  const isEmployee = user && (user.role === 'employee' || user.isEmployee);

  // Redirect employees to upload page
  useEffect(() => {
    if (isEmployee) {
      navigate('/quizement/upload', { replace: true });
    }
  }, [isEmployee, navigate]);

  const loadTests = async () => {
    try {
      setLoading(true);
      const resp = await fetch(`${BACKEND_URL}/api/quizement/tests`, { credentials: 'include' });
      if (!resp.ok) throw new Error('Failed to load tests');
      const data = await resp.json();
      setTests(data.tests || []);
      setError('');
    } catch (e) {
      setError(e.message || 'Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const loadCoins = async () => {
    try {
      const resp = await fetch(`${BACKEND_URL}/api/auth/coins`, { credentials: 'include' });
      if (!resp.ok) return;
      const data = await resp.json();
      setCoinBalances({ bronze: data.bronze || 0, silver: data.silver || 0 });
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!isEmployee) {
      loadTests();
    }
  }, [isEmployee]);

  const filteredTests = tests.filter((t) => {
    if (filter === 'unlocked') return t.status === 'unlocked' || t.status === 'in-progress';
    if (filter === 'attempted') return t.status === 'attempted';
    return true;
  });

  const openUnlockModal = async (test) => {
    if (test.isFreeQuiz) {
      handleUnlock(test.id, null);
      return;
    }
    setCoinModalTest(test);
    await loadCoins();
  };

  const handleUnlock = async (testId, coinType) => {
    try {
      setUnlocking(true);
      setUnlockingId(testId);
      
      const body = coinType ? { coinType } : {};
      
      const resp = await fetch(`${BACKEND_URL}/api/quizement/tests/${testId}/unlock`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || 'Failed to unlock test');
      }
      
      if (coinType) {
        setCoinBalances({
          bronze: data.balance?.bronzeCoins ?? coinBalances.bronze,
          silver: data.balance?.silverCoins ?? coinBalances.silver,
        });
      }
      
      setTests((prev) => prev.map((t) => (t.id === testId ? { ...t, status: 'unlocked' } : t)));
      setCoinModalTest(null);
      navigate(`/quizement/attempt/${testId}`);
    } catch (e) {
      alert(e.message || 'Failed to unlock test');
    } finally {
      setUnlocking(false);
      setUnlockingId(null);
    }
  };

  const renderStatusButton = (test) => {
    if (test.status === 'attempted') {
      return (
        <button
          type="button"
          onClick={() => navigate(`/quizement/result/${test.id}`)}
          className="px-3 py-1 text-xs font-semibold rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
        >
          View Result
        </button>
      );
    }
    if (test.status === 'unlocked' || (test.isFreeQuiz && test.status !== 'in-progress')) {
      return (
        <button
          type="button"
          onClick={() => navigate(`/quizement/attempt/${test.id}`)}
          className="px-4 py-1.5 text-xs font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Start
        </button>
      );
    }
    if (test.status === 'in-progress') {
      return (
        <button
          type="button"
          onClick={() => navigate(`/quizement/attempt/${test.id}`)}
          className="px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-500 text-white hover:bg-amber-600 transition-colors"
        >
          Continue
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => openUnlockModal(test)}
        disabled={unlocking && unlockingId === test.id}
        className="px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-600 text-white hover:bg-slate-700 disabled:opacity-60 transition-colors"
      >
        Unlock
      </button>
    );
  };

  // Don't render anything if redirecting employee
  if (isEmployee) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <QuizementHeroSection />

      {/* Main Content - Two Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Left Column - Leaderboard */}
          <div className="lg:col-span-4">
            <QuizementLeaderboard />
          </div>

          {/* Right Column - Available Tests */}
          <div className="lg:col-span-8">
            {/* Header with Filter Tabs */}
            <div className="bg-white rounded-t-xl border border-slate-200 border-b-0">
              <div className="flex items-center gap-1 px-4 py-3">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === f 
                        ? 'text-blue-600' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {f === 'all' ? 'All Tests' : f === 'unlocked' ? 'My Tests' : 'Attempted'}
                  </button>
                ))}
              </div>
            </div>

            {/* Tests Container */}
            <div className="bg-white rounded-b-xl border border-slate-200">
              {/* Loading State */}
              {loading && (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-900 border-t-transparent"></div>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="p-6 text-center">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Empty State */}
              {!loading && !tests.length && !error && (
                <div className="p-12 text-center">
                  <div className="text-5xl mb-3">📚</div>
                  <p className="text-slate-600">No tests available yet.</p>
                  <p className="text-slate-500 text-sm mt-1">Check back soon!</p>
                </div>
              )}

              {/* Tests List - Compact Format */}
              {!loading && filteredTests.length > 0 && (
                <div className="divide-y divide-slate-100">
                  {filteredTests.map((test) => (
                    <div 
                      key={test.id} 
                      className="p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {/* Test Icon/Thumbnail */}
                        <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md">
                          <span className="text-2xl">📝</span>
                        </div>

                        {/* Test Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold text-slate-900 truncate">{test.name}</h3>
                            {test.isFreeQuiz && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-green-100 text-green-700 flex-shrink-0">
                                FREE
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mb-1.5 line-clamp-1">
                            {test.createdBy && `${test.createdBy} • `}
                            {test.duration} min • {test.questionCount} questions
                            {!test.isFreeQuiz && test.bronzeCost > 0 && ` • 🥉 ${test.bronzeCost}`}
                            {!test.isFreeQuiz && test.silverCost > 0 && ` • 🥈 ${test.silverCost}`}
                          </p>
                        </div>

                        {/* Score/Status */}
                        <div className="flex-shrink-0 text-right">
                          <div className="text-sm font-semibold text-slate-900 mb-1">
                            {test.status === 'attempted' ? (
                              <span className="text-purple-600">Attempted</span>
                            ) : test.status === 'unlocked' || test.status === 'in-progress' ? (
                              <span className="text-blue-600">Unlocked</span>
                            ) : test.isFreeQuiz ? (
                              <span className="text-green-600">Free</span>
                            ) : (
                              <span className="text-slate-500">Locked</span>
                            )}
                          </div>
                          {renderStatusButton(test)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Unlock Modal */}
      {coinModalTest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
              Unlock "{coinModalTest.name}"
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              Choose a coin type to unlock this test and start your assessment.
            </p>
            
            <div className="space-y-4 mb-6">
              {/* Bronze Option */}
              <div className="flex items-center justify-between p-4 rounded-xl border-2 border-orange-200 bg-orange-50">
                <div className="flex-1">
                  <div className="font-bold text-slate-900 mb-1">🥉 Bronze Coins</div>
                  <div className="text-sm text-slate-600">
                    Cost: <span className="font-semibold">{coinModalTest.bronzeCost}</span> • 
                    Balance: <span className="font-semibold">{coinBalances.bronze}</span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={coinModalTest.bronzeCost <= 0 || coinBalances.bronze < coinModalTest.bronzeCost || unlocking}
                  onClick={() => handleUnlock(coinModalTest.id, 'bronze')}
                  className="px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors text-sm"
                >
                  Use Bronze
                </button>
              </div>

              {/* Silver Option */}
              <div className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-300 bg-slate-50">
                <div className="flex-1">
                  <div className="font-bold text-slate-900 mb-1">🥈 Silver Coins</div>
                  <div className="text-sm text-slate-600">
                    Cost: <span className="font-semibold">{coinModalTest.silverCost}</span> • 
                    Balance: <span className="font-semibold">{coinBalances.silver}</span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={coinModalTest.silverCost <= 0 || coinBalances.silver < coinModalTest.silverCost || unlocking}
                  onClick={() => handleUnlock(coinModalTest.id, 'silver')}
                  className="px-4 py-2 rounded-lg bg-slate-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors text-sm"
                >
                  Use Silver
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setCoinModalTest(null)}
                className="px-6 py-2 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizementLanding;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import QuizementHeroSection from './QuizementHeroSection.jsx';
import QuizementLeaderboard from './QuizementLeaderboard.jsx';
import WeeklyQuizzes from './WeeklyQuizzes.jsx';
import { BACKEND_URL } from '../../config.js';

const FILTERS = ['all', 'attempted'];

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
      // Keep all tests including weekly ones
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
    // For attempted tab, show all attempted tests including weekly quizzes
    if (filter === 'attempted') return t.status === 'attempted';
    // For all tests tab, hide weekly quizzes (they're shown in Weekly Quiz section)
    if (filter === 'all') return !t.isWeeklyQuiz;
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

      {/* Weekly Quizzes Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <WeeklyQuizzes />
      </div>

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
                    {f === 'all' ? 'All Tests' : 'Attempted'}
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
                        <div className={`flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center shadow-md relative ${
                          test.isFreeQuiz 
                            ? 'bg-gradient-to-br from-green-400 to-emerald-600' 
                            : 'bg-gradient-to-br from-amber-400 to-orange-600'
                        }`}>
                          <span className="text-2xl">{test.isFreeQuiz ? '✨' : '💎'}</span>
                          {test.isPaid && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white">
                              <span className="text-[10px]">💰</span>
                            </div>
                          )}
                        </div>

                        {/* Test Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold text-slate-900 truncate">{test.name}</h3>
                            {test.isFreeQuiz ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-100 text-green-700 border border-green-300 flex-shrink-0">
                                ✨ FREE
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700 border border-amber-300 flex-shrink-0">
                                💰 PAID
                              </span>
                            )}
                            {test.course && (
                              <span className="px-2 py-0.5 text-[9px] font-medium rounded bg-purple-100 text-purple-700 flex-shrink-0">
                                {test.course}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mb-1.5">
                            {test.createdBy && (
                              <span className="text-slate-600 font-medium">{test.createdBy}</span>
                            )}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {test.duration} min
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {test.questionCount} Q
                            </span>
                            {!test.isFreeQuiz && test.bronzeCost > 0 && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-semibold">
                                🥉 {test.bronzeCost}
                              </span>
                            )}
                            {!test.isFreeQuiz && test.silverCost > 0 && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                                🥈 {test.silverCost}
                              </span>
                            )}
                          </div>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-5 text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <span className="text-2xl">💎</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">Unlock Quiz</h2>
                  <p className="text-sm text-amber-100">Choose your payment method</p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-lg px-3 py-2 mt-3">
                <p className="text-sm font-semibold truncate">{coinModalTest.name}</p>
                <div className="flex items-center gap-3 text-xs text-amber-100 mt-1">
                  <span>⏱ {coinModalTest.duration} min</span>
                  <span>❓ {coinModalTest.questionCount} questions</span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-5">
                Select a coin type to unlock this quiz. Once unlocked, you can start your assessment immediately.
              </p>
              
              <div className="space-y-3 mb-6">
                {/* Bronze Option */}
                <div className={`relative rounded-xl border-2 transition-all ${
                  coinModalTest.bronzeCost > 0 && coinBalances.bronze >= coinModalTest.bronzeCost
                    ? 'border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50 hover:shadow-md'
                    : 'border-gray-200 bg-gray-50 opacity-60'
                }`}>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">🥉</span>
                          <div>
                            <div className="font-bold text-slate-900">Bronze Coins</div>
                            {coinModalTest.bronzeCost <= 0 && (
                              <div className="text-xs text-red-600 font-medium">Not accepted for this quiz</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div>
                            <span className="text-slate-500">Cost:</span>
                            <span className="font-bold text-slate-900 ml-1">{coinModalTest.bronzeCost}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Your Balance:</span>
                            <span className={`font-bold ml-1 ${
                              coinBalances.bronze >= coinModalTest.bronzeCost ? 'text-green-600' : 'text-red-600'
                            }`}>{coinBalances.bronze}</span>
                          </div>
                        </div>
                        {coinModalTest.bronzeCost > 0 && coinBalances.bronze < coinModalTest.bronzeCost && (
                          <div className="mt-2 text-xs text-red-600 font-medium">
                            ⚠️ Insufficient balance (need {coinModalTest.bronzeCost - coinBalances.bronze} more)
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={coinModalTest.bronzeCost <= 0 || coinBalances.bronze < coinModalTest.bronzeCost || unlocking}
                        onClick={() => handleUnlock(coinModalTest.id, 'bronze')}
                        className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed hover:from-orange-600 hover:to-amber-700 transition-all shadow-md disabled:shadow-none text-sm"
                      >
                        {unlocking ? '...' : 'Use Bronze'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Silver Option */}
                <div className={`relative rounded-xl border-2 transition-all ${
                  coinModalTest.silverCost > 0 && coinBalances.silver >= coinModalTest.silverCost
                    ? 'border-slate-300 bg-gradient-to-br from-slate-50 to-gray-50 hover:shadow-md'
                    : 'border-gray-200 bg-gray-50 opacity-60'
                }`}>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">🥈</span>
                          <div>
                            <div className="font-bold text-slate-900">Silver Coins</div>
                            {coinModalTest.silverCost <= 0 && (
                              <div className="text-xs text-red-600 font-medium">Not accepted for this quiz</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div>
                            <span className="text-slate-500">Cost:</span>
                            <span className="font-bold text-slate-900 ml-1">{coinModalTest.silverCost}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Your Balance:</span>
                            <span className={`font-bold ml-1 ${
                              coinBalances.silver >= coinModalTest.silverCost ? 'text-green-600' : 'text-red-600'
                            }`}>{coinBalances.silver}</span>
                          </div>
                        </div>
                        {coinModalTest.silverCost > 0 && coinBalances.silver < coinModalTest.silverCost && (
                          <div className="mt-2 text-xs text-red-600 font-medium">
                            ⚠️ Insufficient balance (need {coinModalTest.silverCost - coinBalances.silver} more)
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={coinModalTest.silverCost <= 0 || coinBalances.silver < coinModalTest.silverCost || unlocking}
                        onClick={() => handleUnlock(coinModalTest.id, 'silver')}
                        className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-slate-700 to-slate-900 text-white font-bold disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed hover:from-slate-800 hover:to-black transition-all shadow-md disabled:shadow-none text-sm"
                      >
                        {unlocking ? '...' : 'Use Silver'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-800">
                  💡 <span className="font-semibold">Tip:</span> Once unlocked, you can start the quiz immediately and it will remain accessible until you complete it.
                </p>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCoinModalTest(null)}
                  disabled={unlocking}
                  className="px-6 py-2.5 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizementLanding;

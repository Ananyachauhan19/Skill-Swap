import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../config.js';

const FILTERS = ['all', 'unlocked', 'attempted'];

const QuizementAvailableTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [unlockingId, setUnlockingId] = useState(null);
  const [coinModalTest, setCoinModalTest] = useState(null);
  const [coinBalances, setCoinBalances] = useState({ bronze: 0, silver: 0 });
  const [unlocking, setUnlocking] = useState(false);
  const navigate = useNavigate();

  const loadTests = async () => {
    try {
      setLoading(true);
      const resp = await fetch(`${BACKEND_URL}/api/quizement/`, { credentials: 'include' });
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
    loadTests();
  }, []);

  const filteredTests = tests.filter((t) => {
    if (filter === 'unlocked') return t.status === 'unlocked' || t.status === 'in-progress';
    if (filter === 'attempted') return t.status === 'attempted';
    return true;
  });

  const openUnlockModal = async (test) => {
    // Free quizzes don't need unlock modal
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
      
      // Update test status and navigate directly to attempt page
      setTests((prev) => prev.map((t) => (t.id === testId ? { ...t, status: 'unlocked' } : t)));
      setCoinModalTest(null);
      
      // Navigate to attempt page after successful unlock
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
          className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 border border-green-300"
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
          className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-600 text-white"
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
          className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-500 text-white"
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
        className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-600 text-white disabled:opacity-60"
      >
        Unlock
      </button>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-blue-900">Quizement Tests</h1>
        <div className="flex gap-2 text-xs">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full border text-xs font-semibold ${
                filter === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-700 border-blue-200'
              }`}
            >
              {f === 'all' ? 'All' : f === 'unlocked' ? 'Unlocked' : 'Attempted'}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-gray-600">Loading tests...</p>}
      {error && !loading && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !tests.length && !error && (
        <p className="text-sm text-gray-600">No Quizement tests available yet.</p>
      )}

      <div className="grid gap-4 mt-4">
        {filteredTests.map((test) => (
          <div key={test.id} className="border-2 border-blue-100 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-lg font-bold text-blue-900">{test.name}</h2>
                  {test.isFreeQuiz ? (
                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-green-100 text-green-700 border border-green-300">
                      ✨ FREE
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700 border border-amber-300">
                      💰 PAID
                    </span>
                  )}
                  {test.course && (
                    <span className="px-2 py-0.5 text-[9px] font-medium rounded bg-purple-100 text-purple-700">
                      {test.course}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{test.description}</p>
                {test.createdBy && (
                  <p className="text-xs text-gray-500 mb-2">Created by: <span className="font-medium">{test.createdBy}</span></p>
                )}
                
                <div className="flex flex-wrap gap-3 text-xs text-gray-700">
                  <span className="flex items-center gap-1 px-2 py-1 rounded bg-blue-50">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {test.duration} min
                  </span>
                  <span className="flex items-center gap-1 px-2 py-1 rounded bg-blue-50">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {test.questionCount} questions
                  </span>
                  {!test.isFreeQuiz && test.bronzeCost > 0 && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded bg-orange-100 text-orange-700 font-semibold">
                      🥉 {test.bronzeCost}
                    </span>
                  )}
                  {!test.isFreeQuiz && test.silverCost > 0 && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded bg-slate-200 text-slate-700 font-semibold">
                      🥈 {test.silverCost}
                    </span>
                  )}
                  {test.isFreeQuiz && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-700 font-semibold">
                      ✨ No coins required
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                {renderStatusButton(test)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {coinModalTest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
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

export default QuizementAvailableTests;

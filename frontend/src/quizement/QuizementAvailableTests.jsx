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
          <div key={test.id} className="border border-blue-100 rounded-lg p-4 bg-white shadow-sm flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base font-semibold text-blue-900">{test.name}</h2>
                  {test.isFreeQuiz && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-100 text-green-700 border border-green-300">
                      FREE
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{test.description}</p>
                {test.createdBy && (
                  <p className="text-[10px] text-gray-500 mt-1">Created by: {test.createdBy}</p>
                )}
              </div>
              {renderStatusButton(test)}
            </div>
            <div className="flex flex-wrap gap-3 text-[11px] text-gray-700 mt-2">
              <span>⏱ {test.duration} minutes</span>
              <span>❓ {test.questionCount} questions</span>
              {!test.isFreeQuiz && test.bronzeCost > 0 && <span>🥉 {test.bronzeCost} Bronze</span>}
              {!test.isFreeQuiz && test.silverCost > 0 && <span>🥈 {test.silverCost} Silver</span>}
              {test.isFreeQuiz && <span className="text-green-600 font-semibold">✨ No coins required</span>}
            </div>
          </div>
        ))}
      </div>

      {coinModalTest && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 w-full max-w-sm">
            <h2 className="text-base font-semibold text-blue-900 mb-2">Unlock "{coinModalTest.name}"</h2>
            <p className="text-xs text-gray-600 mb-3">Choose a coin type to unlock this test.</p>
            <div className="space-y-2 mb-3 text-xs">
              <div className="flex items-center justify-between p-2 rounded border">
                <div>
                  <div className="font-semibold">Bronze</div>
                  <div className="text-[11px] text-gray-600">Cost: {coinModalTest.bronzeCost} • Balance: {coinBalances.bronze}</div>
                </div>
                <button
                  type="button"
                  disabled={coinModalTest.bronzeCost <= 0 || coinBalances.bronze < coinModalTest.bronzeCost || unlocking}
                  onClick={() => handleUnlock(coinModalTest.id, 'bronze')}
                  className="px-3 py-1 rounded-full bg-orange-500 text-white disabled:opacity-50 text-[11px]"
                >
                  Use Bronze
                </button>
              </div>
              <div className="flex items-center justify-between p-2 rounded border">
                <div>
                  <div className="font-semibold">Silver</div>
                  <div className="text-[11px] text-gray-600">Cost: {coinModalTest.silverCost} • Balance: {coinBalances.silver}</div>
                </div>
                <button
                  type="button"
                  disabled={coinModalTest.silverCost <= 0 || coinBalances.silver < coinModalTest.silverCost || unlocking}
                  onClick={() => handleUnlock(coinModalTest.id, 'silver')}
                  className="px-3 py-1 rounded-full bg-gray-700 text-white disabled:opacity-50 text-[11px]"
                >
                  Use Silver
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCoinModalTest(null)}
                className="px-3 py-1 rounded-full border border-gray-300 text-gray-700"
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

export default QuizementAvailableTests;

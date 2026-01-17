import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Clock, Award, Coins, Lock, ChevronRight, Calendar, TrendingUp } from 'lucide-react';
import { BACKEND_URL } from '../config.js';

const WeeklyQuizSection = () => {
  const [weeklyQuizzes, setWeeklyQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWeeklyQuizzes();
  }, []);

  const fetchWeeklyQuizzes = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/quizement/weekly-quizzes`, {
        withCredentials: true
      });
      setWeeklyQuizzes(response.data.weeklyQuizzes || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load weekly quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (coinType) => {
    if (!selectedQuiz) return;

    setUnlocking(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/quizement/tests/${selectedQuiz.id}/unlock`,
        { coinType },
        { withCredentials: true }
      );
      
      // Refresh quizzes and navigate
      await fetchWeeklyQuizzes();
      setShowUnlockModal(false);
      navigate(`/quizement/attempt/${selectedQuiz.id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to unlock quiz');
    } finally {
      setUnlocking(false);
    }
  };

  const handleQuizClick = (quiz) => {
    // Check if quiz is unlocked based on status or if it's a free quiz
    const isFreeQuiz = quiz.isFreeQuiz || (!quiz.isPaid && quiz.bronzeCost === 0 && quiz.silverCost === 0);
    const isUnlocked = quiz.status === 'unlocked' || quiz.status === 'in-progress' || quiz.status === 'attempted' || isFreeQuiz;
    
    if (isUnlocked) {
      navigate(`/quizement/attempt/${quiz.id}`);
    } else {
      setSelectedQuiz(quiz);
      setShowUnlockModal(true);
    }
  };

  const calculateDaysRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (loading) {
    return (
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-blue-900"></div>
            <p className="mt-4 text-blue-900 font-semibold">Loading weekly challenges...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || weeklyQuizzes.length === 0) {
    return null; // Don't show section if no weekly quizzes
  }

  return (
    <>
      <div id="weekly-contests" className="py-12 bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-900 to-blue-800 rounded-full mb-4 shadow-lg">
              <Clock className="w-4 h-4 text-white" />
              <span className="text-white font-bold text-xs uppercase tracking-wide">Limited Time</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-900 via-blue-800 to-slate-800 bg-clip-text text-transparent mb-3">
              Weekly Quiz Challenge
            </h2>
            <p className="text-gray-600 text-base max-w-2xl mx-auto">
              Test your skills with our time-limited weekly quizzes. Complete before they expire!
            </p>
          </div>

          {/* Quiz Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weeklyQuizzes.map((quiz) => {
              const daysRemaining = calculateDaysRemaining(quiz.expiresAt);
              const isLocked = quiz.isPaid && quiz.status === 'locked';

              return (
                <div
                  key={quiz.id}
                  className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border-2 border-blue-100 hover:border-blue-300"
                  onClick={() => handleQuizClick(quiz)}
                >
                  {/* Gradient Header */}
                  <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-3 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-bold">
                          {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
                        </span>
                      </div>
                      {quiz.isPaid ? (
                        <div className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full">
                          {isLocked ? <Lock className="w-3 h-3" /> : <Award className="w-3 h-3" />}
                          <span className="text-xs font-semibold">{isLocked ? 'Locked' : 'Unlocked'}</span>
                        </div>
                      ) : (
                        <div className="px-2 py-1 bg-green-500 rounded-full">
                          <span className="text-xs font-bold">Free</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4">
                    {/* Quiz Title */}
                    <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-900 transition-colors">
                      {quiz.name || quiz.title}
                    </h3>

                    {/* Description */}
                    {quiz.description && (
                      <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                        {quiz.description}
                      </p>
                    )}

                    {/* Course Tag */}
                    {quiz.course && (
                      <div className="inline-block mb-3">
                        <span className="px-2 py-1 bg-blue-50 text-blue-900 rounded-md text-xs font-semibold">
                          {quiz.course}
                        </span>
                      </div>
                    )}

                    {/* Quiz Info */}
                    <div className="flex items-center gap-3 mb-3 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{quiz.duration} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>{quiz.questionCount || 0} Q</span>
                      </div>
                    </div>

                    {/* Coin Cost (if paid) */}
                    {quiz.isPaid && (
                      <div className="flex items-center gap-3 mb-3 pt-3 border-t border-gray-100">
                        {quiz.bronzeCost > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg">🥉</span>
                            <span className="text-xs font-bold text-orange-600">
                              {quiz.bronzeCost}
                            </span>
                          </div>
                        )}
                        {quiz.silverCost > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg">🥈</span>
                            <span className="text-xs font-bold text-slate-600">
                              {quiz.silverCost}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 text-sm">
                      {isLocked ? (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Unlock</span>
                        </>
                      ) : (
                        <>
                          <span>{quiz.status === 'in-progress' ? 'Continue' : 'Start'}</span>
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Unlock Modal */}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${(daysRemaining / 7) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Unlock Modal */}
      {showUnlockModal && selectedQuiz && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-blue-100 max-w-md w-full animate-slideUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-slate-800 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                  <Coins className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Unlock Quiz Challenge</h3>
                  <p className="text-blue-100 text-sm mt-1">Choose your coin type to unlock</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="mb-5">
                <h4 className="font-bold text-gray-900 text-base mb-2">{selectedQuiz.name || selectedQuiz.title}</h4>
                <p className="text-sm text-gray-600">
                  {selectedQuiz.description || 'Unlock this quiz to start your challenge!'}
                </p>
              </div>

              {/* Coin Options */}
              <div className="space-y-3 mb-5">\n                {selectedQuiz.bronzeCost > 0 && (\n                  <button\n                    onClick={() => handleUnlock('bronze')}\n                    disabled={unlocking}\n                    className=\"w-full flex items-center justify-between p-4 border-2 border-orange-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all duration-200 group\"\n                  >\n                    <div className=\"flex items-center gap-3\">\n                      <span className=\"text-3xl\">🥉</span>\n                      <div className=\"text-left\">\n                        <p className=\"font-semibold text-gray-800\">Bronze Coins</p>\n                        <p className=\"text-sm text-gray-600\">Pay with Bronze</p>\n                      </div>\n                    </div>\n                    <div className=\"text-right\">\n                      <p className=\"text-2xl font-bold text-orange-600\">{selectedQuiz.bronzeCost}</p>\n                    </div>\n                  </button>\n                )}\n\n                {selectedQuiz.silverCost > 0 && (\n                  <button\n                    onClick={() => handleUnlock('silver')}\n                    disabled={unlocking}\n                    className=\"w-full flex items-center justify-between p-4 border-2 border-slate-200 rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-all duration-200 group\"\n                  >\n                    <div className=\"flex items-center gap-3\">\n                      <span className=\"text-3xl\">🥈</span>\n                      <div className=\"text-left\">\n                        <p className=\"font-semibold text-gray-800\">Silver Coins</p>\n                        <p className=\"text-sm text-gray-600\">Pay with Silver</p>\n                      </div>\n                    </div>\n                    <div className=\"text-right\">\n                      <p className=\"text-2xl font-bold text-slate-600\">{selectedQuiz.silverCost}</p>\n                    </div>\n                  </button>\n                )}\n              </div>

              {/* Cancel Button */}
              <button
                onClick={() => setShowUnlockModal(false)}
                disabled={unlocking}
                className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 hover:border-gray-400 transition-colors"
              >
                ✕ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WeeklyQuizSection;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Clock, Award, Coins, Lock, ChevronRight, Calendar, TrendingUp } from 'lucide-react';

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
      const response = await axios.get('http://localhost:5000/api/quizement/weekly-quizzes', {
        withCredentials: true
      });
      setWeeklyQuizzes(response.data.quizzes);
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
        `http://localhost:5000/api/quizement/tests/${selectedQuiz._id}/unlock`,
        { coinType },
        { withCredentials: true }
      );
      
      // Navigate to the quiz
      navigate(`/quizement/test/${selectedQuiz._id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to unlock quiz');
    } finally {
      setUnlocking(false);
      setShowUnlockModal(false);
    }
  };

  const handleQuizClick = (quiz) => {
    if (quiz.isUnlocked || !quiz.isPaid) {
      navigate(`/quizement/test/${quiz._id}`);
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
      <div className="py-16 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-purple-600">Loading weekly challenges...</p>
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
      <div className="py-16 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
              <Clock className="w-4 h-4 text-white" />
              <span className="text-white font-semibold text-sm">LIMITED TIME</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-4">
              Weekly Quiz Challenge
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Test your skills with our time-limited weekly quizzes. Complete before they expire!
            </p>
          </div>

          {/* Quiz Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {weeklyQuizzes.map((quiz) => {
              const daysRemaining = calculateDaysRemaining(quiz.expiresAt);
              const isLocked = quiz.isPaid && !quiz.isUnlocked;

              return (
                <div
                  key={quiz._id}
                  className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1"
                  onClick={() => handleQuizClick(quiz)}
                >
                  {/* Gradient Header */}
                  <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"></div>

                  {/* Card Content */}
                  <div className="p-6">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between mb-4">
                      {/* Timer Badge */}
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-semibold text-purple-700">
                          {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
                        </span>
                      </div>

                      {/* Free/Paid Badge */}
                      {quiz.isPaid ? (
                        <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full">
                          {isLocked ? (
                            <Lock className="w-4 h-4 text-amber-700" />
                          ) : (
                            <Award className="w-4 h-4 text-amber-700" />
                          )}
                          <span className="text-sm font-semibold text-amber-700">
                            {isLocked ? 'Locked' : 'Unlocked'}
                          </span>
                        </div>
                      ) : (
                        <div className="px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full">
                          <span className="text-sm font-semibold text-green-700">Free</span>
                        </div>
                      )}
                    </div>

                    {/* Quiz Title */}
                    <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                      {quiz.title}
                    </h3>

                    {/* Description */}
                    {quiz.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {quiz.description}
                      </p>
                    )}

                    {/* Course Tag */}
                    {quiz.course && (
                      <div className="inline-block mb-4">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                          {quiz.course}
                        </span>
                      </div>
                    )}

                    {/* Quiz Info */}
                    <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{quiz.duration} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>{quiz.questions?.length || 0} questions</span>
                      </div>
                    </div>

                    {/* Coin Cost (if paid) */}
                    {quiz.isPaid && (
                      <div className="flex items-center gap-4 mb-4 pt-4 border-t border-gray-100">
                        {quiz.bronzeCost > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">🥉</span>
                            <span className="text-sm font-semibold text-gray-700">
                              {quiz.bronzeCost} Bronze
                            </span>
                          </div>
                        )}
                        {quiz.silverCost > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">🥈</span>
                            <span className="text-sm font-semibold text-gray-700">
                              {quiz.silverCost} Silver
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200">
                      {isLocked ? (
                        <>
                          <Lock className="w-5 h-5" />
                          <span>Unlock Quiz</span>
                        </>
                      ) : (
                        <>
                          <span>{quiz.isPaid && quiz.isUnlocked ? 'Continue Quiz' : 'Start Quiz'}</span>
                          <ChevronRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Progress Bar for expiry */}
                  <div className="px-6 pb-4">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slideUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 p-6 rounded-t-2xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <Coins className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Unlock Weekly Quiz</h3>
              </div>
              <p className="text-purple-100 text-sm">
                Choose your payment method to unlock this quiz
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="mb-6">
                <h4 className="font-bold text-gray-800 mb-2">{selectedQuiz.title}</h4>
                <p className="text-sm text-gray-600">
                  {selectedQuiz.description || 'No description available'}
                </p>
              </div>

              {/* Coin Options */}
              <div className="space-y-3">
                {selectedQuiz.bronzeCost > 0 && (
                  <button
                    onClick={() => handleUnlock('bronze')}
                    disabled={unlocking}
                    className="w-full flex items-center justify-between p-4 border-2 border-orange-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🥉</span>
                      <div className="text-left">
                        <p className="font-semibold text-gray-800">Bronze Coins</p>
                        <p className="text-sm text-gray-600">Pay with Bronze</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-600">{selectedQuiz.bronzeCost}</p>
                    </div>
                  </button>
                )}

                {selectedQuiz.silverCost > 0 && (
                  <button
                    onClick={() => handleUnlock('silver')}
                    disabled={unlocking}
                    className="w-full flex items-center justify-between p-4 border-2 border-slate-200 rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🥈</span>
                      <div className="text-left">
                        <p className="font-semibold text-gray-800">Silver Coins</p>
                        <p className="text-sm text-gray-600">Pay with Silver</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-600">{selectedQuiz.silverCost}</p>
                    </div>
                  </button>
                )}
              </div>

              {/* Cancel Button */}
              <button
                onClick={() => setShowUnlockModal(false)}
                disabled={unlocking}
                className="w-full mt-4 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WeeklyQuizSection;

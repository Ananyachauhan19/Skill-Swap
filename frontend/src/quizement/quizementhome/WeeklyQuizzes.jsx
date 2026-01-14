import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Clock, Award, Coins, Lock, ChevronRight, Calendar, TrendingUp, Zap, Trophy, Target } from 'lucide-react';
import { BACKEND_URL } from '../../config.js';

const WeeklyQuizzes = () => {
  const [weeklyQuizzes, setWeeklyQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [coinBalances, setCoinBalances] = useState({ bronze: 0, silver: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    fetchWeeklyQuizzes();
    fetchCoinBalances();
  }, []);

  const fetchWeeklyQuizzes = async () => {
    try {
      setLoading(true);
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

  const fetchCoinBalances = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/auth/coins`, {
        withCredentials: true
      });
      if (response.data) {
        setCoinBalances({
          bronze: response.data.bronzeCoins || 0,
          silver: response.data.silverCoins || 0
        });
      }
    } catch (err) {
      console.error('Failed to fetch coin balances:', err);
    }
  };

  const handleUnlock = async (coinType) => {
    if (!selectedQuiz) return;

    setUnlocking(true);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/quizement/tests/${selectedQuiz.id}/unlock`,
        { coinType },
        { withCredentials: true }
      );
      
      // Refresh quizzes and coin balances
      await Promise.all([fetchWeeklyQuizzes(), fetchCoinBalances()]);
      setShowUnlockModal(false);
      
      // Navigate to the quiz
      navigate(`/quizement/test/${selectedQuiz.id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to unlock quiz');
      setUnlocking(false);
    }
  };

  const handleQuizClick = (quiz) => {
    // Check if quiz is unlocked based on status
    const isUnlocked = quiz.status === 'unlocked' || quiz.status === 'in-progress' || quiz.status === 'attempted' || !quiz.isPaid;
    
    if (isUnlocked) {
      navigate(`/quizement/test/${quiz.id}`);
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

  const calculateHoursRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry - now;
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    return diffHours > 0 ? diffHours : 0;
  };

  const getUrgencyColor = (daysRemaining) => {
    if (daysRemaining <= 1) return 'from-red-500 to-pink-500';
    if (daysRemaining <= 3) return 'from-orange-500 to-amber-500';
    return 'from-purple-500 to-pink-500';
  };

  if (loading) {
    return (
      <div className="py-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
          <p className="mt-6 text-purple-600 text-lg font-semibold">Loading weekly challenges...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-600 text-lg font-semibold">{error}</p>
          <button
            onClick={fetchWeeklyQuizzes}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (weeklyQuizzes.length === 0) {
    return (
      <div className="py-20">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-6">
            <Clock className="w-12 h-12 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">No Weekly Quizzes Available</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Check back soon! New weekly challenges are added regularly to test your skills.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="py-12">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 rounded-full mb-6 shadow-lg">
            <Zap className="w-5 h-5 text-white" />
            <span className="text-white font-bold text-sm uppercase tracking-wide">Limited Time</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-6">
            Weekly Quiz Challenge
          </h2>
          <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            Take on our time-limited quizzes and prove your skills before they expire! Complete challenges to earn rewards and climb the leaderboard.
          </p>

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Trophy className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-gray-800">{weeklyQuizzes.length}</p>
                <p className="text-sm text-gray-600">Active Challenges</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-xl">
                <span className="text-2xl">🥉</span>
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-gray-800">{coinBalances.bronze}</p>
                <p className="text-sm text-gray-600">Bronze Coins</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-100 rounded-xl">
                <span className="text-2xl">🥈</span>
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-gray-800">{coinBalances.silver}</p>
                <p className="text-sm text-gray-600">Silver Coins</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quiz Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {weeklyQuizzes.map((quiz) => {
            const daysRemaining = calculateDaysRemaining(quiz.expiresAt);
            const hoursRemaining = calculateHoursRemaining(quiz.expiresAt);
            const isLocked = quiz.isPaid && quiz.status === 'locked';
            const urgencyColor = getUrgencyColor(daysRemaining);
            const isUrgent = daysRemaining <= 1;

            return (
              <div
                key={quiz.id}
                className={`group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-2 ${
                  isUrgent ? 'ring-2 ring-red-400 ring-offset-2' : ''
                }`}
                onClick={() => handleQuizClick(quiz)}
              >
                {/* Animated Gradient Border */}
                <div className={`absolute inset-0 bg-gradient-to-r ${urgencyColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl`}></div>

                {/* Gradient Header with Timer */}
                <div className={`relative bg-gradient-to-r ${urgencyColor} p-6 text-white`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-white bg-opacity-20 rounded-lg backdrop-blur-sm">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium opacity-90">Time Remaining</p>
                        <p className="text-2xl font-bold">
                          {isUrgent ? `${hoursRemaining}h` : `${daysRemaining}d`}
                        </p>
                      </div>
                    </div>
                    {isUrgent && (
                      <div className="animate-pulse px-3 py-1 bg-red-500 bg-opacity-90 rounded-full">
                        <span className="text-xs font-bold uppercase">Urgent!</span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-white bg-opacity-20 rounded-full h-2 backdrop-blur-sm">
                    <div
                      className="bg-white h-2 rounded-full transition-all duration-500 shadow-lg"
                      style={{ width: `${(daysRemaining / 7) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  {/* Badges Row */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {quiz.isPaid ? (
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                        isLocked 
                          ? 'bg-gradient-to-r from-amber-100 to-orange-100' 
                          : 'bg-gradient-to-r from-green-100 to-emerald-100'
                      }`}>
                        {isLocked ? (
                          <Lock className="w-4 h-4 text-amber-700" />
                        ) : (
                          <Award className="w-4 h-4 text-green-700" />
                        )}
                        <span className={`text-xs font-bold ${isLocked ? 'text-amber-700' : 'text-green-700'}`}>
                          {isLocked ? 'Locked' : 'Unlocked'}
                        </span>
                      </div>
                    ) : (
                      <div className="px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full">
                        <span className="text-xs font-bold text-green-700">Free Access</span>
                      </div>
                    )}
                    {quiz.course && (
                      <div className="px-3 py-1.5 bg-gray-100 rounded-full">
                        <span className="text-xs font-semibold text-gray-700">{quiz.course}</span>
                      </div>
                    )}
                  </div>

                  {/* Quiz Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-purple-600 transition-colors leading-tight">
                    {quiz.name || quiz.title}
                  </h3>

                  {/* Description */}
                  {quiz.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                      {quiz.description}
                    </p>
                  )}

                  {/* Quiz Info Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-600">Duration</p>
                        <p className="text-sm font-bold text-gray-900">{quiz.duration} min</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg">
                      <Target className="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="text-xs text-gray-600">Questions</p>
                        <p className="text-sm font-bold text-gray-900">{quiz.questionCount || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Coin Cost (if paid) */}
                  {quiz.isPaid && (
                    <div className="flex items-center justify-center gap-6 mb-5 py-4 border-t border-b border-gray-100">
                      {quiz.bronzeCost > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-3xl">🥉</span>
                          <div>
                            <p className="text-xs text-gray-600">Bronze Cost</p>
                            <p className="text-lg font-bold text-orange-600">{quiz.bronzeCost}</p>
                          </div>
                        </div>
                      )}
                      {quiz.silverCost > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-3xl">🥈</span>
                          <div>
                            <p className="text-xs text-gray-600">Silver Cost</p>
                            <p className="text-lg font-bold text-slate-600">{quiz.silverCost}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  <button className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-white shadow-lg transform transition-all duration-200 hover:shadow-xl hover:scale-[1.02] bg-gradient-to-r ${urgencyColor}`}>
                    {isLocked ? (
                      <>
                        <Lock className="w-5 h-5" />
                        <span>Unlock Challenge</span>
                      </>
                    ) : (
                      <>
                        <span>{(quiz.status === 'unlocked' || quiz.status === 'in-progress') && quiz.isPaid ? 'Continue Challenge' : 'Start Challenge'}</span>
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>

                {/* Urgent Corner Badge */}
                {isUrgent && (
                  <div className="absolute top-4 right-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                      <div className="relative px-3 py-1.5 bg-red-500 rounded-full shadow-lg">
                        <span className="text-xs font-bold text-white">ENDING SOON!</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Unlock Modal */}
      {showUnlockModal && selectedQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full animate-slideUp overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 p-8">
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                  <Coins className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Unlock Quiz</h3>
                  <p className="text-purple-100 text-sm">Choose your payment method</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h4 className="font-bold text-gray-900 text-lg mb-2">{selectedQuiz.name || selectedQuiz.title}</h4>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {selectedQuiz.description || 'Unlock this quiz to start your challenge!'}
                </p>
                {selectedQuiz.expiresAt && (
                  <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-purple-50 rounded-lg">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-semibold text-purple-700">
                      Expires in {calculateDaysRemaining(selectedQuiz.expiresAt)} days
                    </span>
                  </div>
                )}
              </div>

              {/* Coin Options */}
              <div className="space-y-4 mb-6">
                {selectedQuiz.bronzeCost > 0 && (
                  <button
                    onClick={() => handleUnlock('bronze')}
                    disabled={unlocking || coinBalances.bronze < selectedQuiz.bronzeCost}
                    className={`w-full flex items-center justify-between p-5 border-2 rounded-2xl transition-all duration-200 ${
                      coinBalances.bronze >= selectedQuiz.bronzeCost
                        ? 'border-orange-300 hover:border-orange-500 hover:bg-orange-50 hover:shadow-lg'
                        : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">🥉</span>
                      <div className="text-left">
                        <p className="font-bold text-gray-900 text-lg">Bronze Coins</p>
                        <p className="text-sm text-gray-600">
                          Your balance: <span className="font-semibold">{coinBalances.bronze}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-orange-600">{selectedQuiz.bronzeCost}</p>
                      {coinBalances.bronze < selectedQuiz.bronzeCost && (
                        <p className="text-xs text-red-600 font-medium mt-1">Insufficient</p>
                      )}
                    </div>
                  </button>
                )}

                {selectedQuiz.silverCost > 0 && (
                  <button
                    onClick={() => handleUnlock('silver')}
                    disabled={unlocking || coinBalances.silver < selectedQuiz.silverCost}
                    className={`w-full flex items-center justify-between p-5 border-2 rounded-2xl transition-all duration-200 ${
                      coinBalances.silver >= selectedQuiz.silverCost
                        ? 'border-slate-300 hover:border-slate-500 hover:bg-slate-50 hover:shadow-lg'
                        : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">🥈</span>
                      <div className="text-left">
                        <p className="font-bold text-gray-900 text-lg">Silver Coins</p>
                        <p className="text-sm text-gray-600">
                          Your balance: <span className="font-semibold">{coinBalances.silver}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-slate-600">{selectedQuiz.silverCost}</p>
                      {coinBalances.silver < selectedQuiz.silverCost && (
                        <p className="text-xs text-red-600 font-medium mt-1">Insufficient</p>
                      )}
                    </div>
                  </button>
                )}
              </div>

              {/* Cancel Button */}
              <button
                onClick={() => setShowUnlockModal(false)}
                disabled={unlocking}
                className="w-full px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
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

export default WeeklyQuizzes;

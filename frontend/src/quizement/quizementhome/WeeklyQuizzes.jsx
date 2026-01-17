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
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWeeklyQuizzes();
    fetchCoinBalances();
  }, []);

  useEffect(() => {
    if (selectedQuiz) {
      console.log('Selected quiz for unlock:', {
        id: selectedQuiz.id,
        name: selectedQuiz.name,
        bronzeCost: selectedQuiz.bronzeCost,
        silverCost: selectedQuiz.silverCost,
        isPaid: selectedQuiz.isPaid,
        status: selectedQuiz.status
      });
    }
  }, [selectedQuiz]);

  useEffect(() => {
    console.log('Coin balances updated:', coinBalances);
  }, [coinBalances]);

  const fetchWeeklyQuizzes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/quizement/weekly-quizzes`, {
        withCredentials: true
      });
      console.log('Weekly quizzes response:', response.data);
      setWeeklyQuizzes(response.data.weeklyQuizzes || []);
      setError('');
    } catch (err) {
      console.error('Failed to fetch weekly quizzes:', err);
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
      console.log('Coin balance response:', response.data);
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

    // Check if user has sufficient balance before attempting unlock
    const cost = coinType === 'bronze' ? selectedQuiz.bronzeCost : selectedQuiz.silverCost;
    const balance = coinType === 'bronze' ? coinBalances.bronze : coinBalances.silver;
    
    console.log('Unlock attempt:', { coinType, cost, balance, selectedQuiz });
    
    if (balance < cost) {
      alert(`Insufficient ${coinType} coins. You have ${balance} but need ${cost}.`);
      return;
    }

    setUnlocking(true);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/quizement/tests/${selectedQuiz.id}/unlock`,
        { coinType },
        { withCredentials: true }
      );
      
      console.log('Unlock response:', response.data);
      
      // Refresh quizzes and coin balances
      await Promise.all([fetchWeeklyQuizzes(), fetchCoinBalances()]);
      setShowUnlockModal(false);
      
      // Navigate to the quiz
      navigate(`/quizement/attempt/${selectedQuiz.id}`);
    } catch (err) {
      console.error('Unlock error:', err.response?.data);
      alert(err.response?.data?.message || 'Failed to unlock quiz');
      setUnlocking(false);
    }
  };

  const handleQuizClick = (quiz) => {
    // Check if quiz is unlocked based on status or if it's a free quiz
    const isFreeQuiz = quiz.isFreeQuiz || (!quiz.isPaid && quiz.bronzeCost === 0 && quiz.silverCost === 0);
    const isUnlocked = quiz.status === 'unlocked' || quiz.status === 'in-progress' || quiz.status === 'attempted' || isFreeQuiz;
    
    console.log('Quiz clicked:', { quiz, isFreeQuiz, isUnlocked, status: quiz.status });
    
    if (isUnlocked) {
      navigate(`/quizement/attempt/${quiz.id}`);
    } else {
      setSelectedQuiz(quiz);
      // Refresh coin balances when opening modal to ensure latest data
      fetchCoinBalances();
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
    if (daysRemaining <= 1) return 'from-red-600 to-orange-600';
    if (daysRemaining <= 3) return 'from-blue-600 to-blue-800';
    return 'from-blue-900 to-slate-800';
  };

  if (loading) {
    return (
      <div className="py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-blue-900"></div>
          <p className="mt-4 text-blue-900 text-base font-semibold">Loading weekly challenges...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <div className="text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-red-600 text-base font-semibold">{error}</p>
          <button
            onClick={fetchWeeklyQuizzes}
            className="mt-3 px-5 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (weeklyQuizzes.length === 0) {
    return (
      <div className="py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-slate-100 rounded-full mb-4">
            <Clock className="w-8 h-8 text-blue-900" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Weekly Quizzes Available</h3>
          <p className="text-gray-600 text-sm max-w-md mx-auto">
            Check back soon! New weekly challenges are added regularly to test your skills.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div id="weekly-contests" className="py-4 sm:py-6">
        {/* Section Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg mb-3 shadow-md">
            <Zap className="w-3 h-3 text-white" />
            <span className="text-white font-bold text-[10px] uppercase tracking-wide">Limited Time</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-blue-900 via-blue-800 to-slate-800 bg-clip-text text-transparent mb-2">
            Weekly Quiz Challenge
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm max-w-2xl mx-auto px-4">
            Take on our time-limited quizzes before they expire!
          </p>
        </div>

        {/* Quiz Cards Grid - 2 cards on mobile, 3 on tablet */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {(showAll ? weeklyQuizzes : weeklyQuizzes.slice(0, 3)).map((quiz) => {
            const daysRemaining = calculateDaysRemaining(quiz.expiresAt);
            const hoursRemaining = calculateHoursRemaining(quiz.expiresAt);
            const isLocked = quiz.isPaid && quiz.status === 'locked';
            const isCompleted = quiz.status === 'attempted';
            const urgencyColor = getUrgencyColor(daysRemaining);
            const isUrgent = daysRemaining <= 1;

            // Professional RGB fading background colors
            const cardBgGradient = isCompleted 
              ? 'from-green-50 via-emerald-50 to-teal-50'
              : isLocked
              ? 'from-amber-50 via-orange-50 to-amber-50'
              : 'from-blue-50 via-indigo-50 to-purple-50';

            return (
              <div
                key={quiz.id}
                className={`group relative rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1 border ${
                  isCompleted ? 'border-green-200 hover:border-green-300' :
                  isUrgent ? 'border-red-200 hover:border-red-300' : 'border-blue-200 hover:border-blue-300'
                }`}
                onClick={() => handleQuizClick(quiz)}
              >
                {/* Professional RGB Fading Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${cardBgGradient} opacity-100`}></div>

                {/* Header with Timer */}
                <div className={`relative bg-gradient-to-r ${urgencyColor} p-3 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold opacity-90">Time Remaining</p>
                        <p className="text-lg font-black">
                          {isUrgent ? `${hoursRemaining}h` : `${daysRemaining}d`}
                        </p>
                      </div>
                    </div>
                    {isUrgent && (
                      <div className="px-2 py-0.5 bg-red-500 rounded-md">
                        <span className="text-[8px] font-black">⚡ URGENT</span>
                      </div>
                    )}
                  </div>

                  {/* Thin Progress Bar */}
                  <div className="w-full bg-white/20 rounded-full h-1 mt-2">
                    <div
                      className="bg-white h-1 rounded-full transition-all"
                      style={{ width: `${(daysRemaining / 7) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="relative p-3 bg-white/60 backdrop-blur-sm">
                  {/* Status Badge */}
                  <div className="flex items-center gap-1.5 mb-2">
                    {isCompleted ? (
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-green-500 rounded-lg">
                        <Award className="w-3 h-3 text-white" />
                        <span className="text-[10px] font-bold text-white">✓ COMPLETED</span>
                      </div>
                    ) : quiz.isPaid ? (
                      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${
                        isLocked ? 'bg-amber-500' : 'bg-green-500'
                      }`}>
                        {isLocked ? (
                          <Lock className="w-3 h-3 text-white" />
                        ) : (
                          <Award className="w-3 h-3 text-white" />
                        )}
                        <span className="text-[10px] font-bold text-white">
                          {isLocked ? '🔒 LOCKED' : '✓ UNLOCKED'}
                        </span>
                      </div>
                    ) : (
                      <div className="px-2.5 py-1 bg-green-500 rounded-lg">
                        <span className="text-[10px] font-bold text-white">⭐ FREE</span>
                      </div>
                    )}
                    {quiz.course && (
                      <div className="px-2.5 py-1 bg-blue-900 rounded-lg">
                        <span className="text-[10px] font-bold text-white truncate">📚 {quiz.course}</span>
                      </div>
                    )}
                  </div>

                  {/* Quiz Title */}
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1.5 line-clamp-1">
                    {quiz.name || quiz.title}
                  </h3>

                  {/* Quiz Description */}
                  {quiz.description && (
                    <p className="text-gray-600 text-[10px] sm:text-xs mb-2 line-clamp-1">
                      {quiz.description}
                    </p>
                  )}

                  {/* Quiz Info Grid - Compact */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="flex items-center gap-1.5 px-2 py-1.5 bg-blue-100 rounded-lg">
                      <Clock className="w-3 h-3 text-blue-700" />
                      <div>
                        <p className="text-[9px] text-blue-700 font-semibold">Duration</p>
                        <p className="text-xs font-bold text-gray-900">{quiz.duration} min</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-100 rounded-lg">
                      <Target className="w-3 h-3 text-slate-700" />
                      <div>
                        <p className="text-[9px] text-slate-700 font-semibold">Questions</p>
                        <p className="text-xs font-bold text-gray-900">{quiz.questionCount || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Coin Cost - Compact */}
                  {quiz.isPaid && !isCompleted && (
                    <div className="flex items-center justify-center gap-3 mb-2 py-2 bg-white/80 rounded-lg">
                      {quiz.bronzeCost > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg">🥉</span>
                          <div>
                            <p className="text-[9px] text-gray-600 font-semibold">Bronze</p>
                            <p className="text-sm font-bold text-orange-600">{quiz.bronzeCost}</p>
                          </div>
                        </div>
                      )}
                      {quiz.silverCost > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg">🥈</span>
                          <div>
                            <p className="text-[9px] text-gray-600 font-semibold">Silver</p>
                            <p className="text-sm font-bold text-slate-600">{quiz.silverCost}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Button - Compact & Rectangular */}
                  <button className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-bold text-white shadow-md transition-all hover:shadow-lg bg-gradient-to-r ${
                    isCompleted ? 'from-green-600 to-green-700' : urgencyColor
                  } text-xs sm:text-sm`}>
                    {isCompleted ? (
                      <>
                        <Award className="w-3.5 h-3.5" />
                        <span>View Results</span>
                      </>
                    ) : isLocked ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Unlock</span>
                      </>  
                    ) : (
                      <>
                        <span>{(quiz.status === 'unlocked' || quiz.status === 'in-progress') && quiz.isPaid ? 'Continue' : 'Start Now'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* View More Button */}
        {weeklyQuizzes.length > 3 && (
          <div className="text-center mt-8">
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-8 py-3 bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm sm:text-base"
            >
              {showAll ? '⬆️ Show Less' : '⬇️ View More Weekly Contests'}
            </button>
          </div>
        )}
      </div>

      {/* Unlock Modal */}
      {showUnlockModal && selectedQuiz && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-100 max-w-md w-full animate-slideUp overflow-hidden">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-slate-800 p-6 sm:p-7 overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIwLjUiIG9wYWNpdHk9IjAuMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
              <div className="relative flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md shadow-lg">
                  <Coins className="w-7 h-7 text-white drop-shadow-md" />
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-white mb-1 tracking-tight">Unlock Quiz Challenge</h3>
                  <p className="text-blue-100 text-sm font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                    Choose your coin type to unlock
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-7">
              <div className="mb-5 pb-5 border-b-2 border-gray-100">
                <div className="flex items-start gap-3 mb-3">
                  <div className="mt-0.5 p-2 bg-gradient-to-br from-blue-50 to-slate-50 rounded-lg">
                    <Target className="w-5 h-5 text-blue-900" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-extrabold text-gray-900 text-lg mb-2 leading-tight">{selectedQuiz.name || selectedQuiz.title}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {selectedQuiz.description || 'Unlock this quiz to start your challenge and test your skills!'}
                    </p>
                  </div>
                </div>
                {selectedQuiz.expiresAt && (
                  <div className="flex items-center gap-2.5 mt-3 px-3.5 py-2.5 bg-gradient-to-r from-blue-50 to-slate-50 rounded-xl border border-blue-100 shadow-sm">
                    <Clock className="w-4 h-4 text-blue-900" />
                    <span className="text-sm font-bold text-blue-900">
                      ⏰ Expires in {calculateDaysRemaining(selectedQuiz.expiresAt)} days
                    </span>
                  </div>
                )}
              </div>

              {/* Coin Options */}
              <div className="space-y-3 mb-5">
                {selectedQuiz.bronzeCost > 0 && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('Bronze button clicked', { 
                        coinBalance: coinBalances.bronze, 
                        cost: selectedQuiz.bronzeCost,
                        isDisabled: unlocking || coinBalances.bronze < selectedQuiz.bronzeCost
                      });
                      handleUnlock('bronze');
                    }}
                    disabled={unlocking || coinBalances.bronze < selectedQuiz.bronzeCost}
                    className={`group relative w-full flex items-center justify-between p-4 sm:p-5 rounded-2xl transition-all duration-300 transform ${
                      coinBalances.bronze >= selectedQuiz.bronzeCost
                        ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 hover:border-orange-400 hover:shadow-xl hover:scale-[1.02] cursor-pointer'
                        : 'bg-gray-50 border-2 border-gray-200 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400/0 to-amber-400/0 group-hover:from-orange-400/10 group-hover:to-amber-400/10 rounded-2xl transition-all duration-300"></div>
                    <div className="relative flex items-center gap-3">
                      <div className="p-2.5 bg-white rounded-xl shadow-md">
                        <span className="text-3xl">🥉</span>
                      </div>
                      <div className="text-left">
                        <p className="font-extrabold text-gray-900 text-base sm:text-lg mb-1">Bronze Coins</p>
                        <p className="text-xs text-gray-600 flex items-center gap-1.5">
                          <span className="font-medium">Balance:</span>
                          <span className="px-2 py-0.5 bg-white rounded-md font-bold text-orange-600">{coinBalances.bronze}</span>
                        </p>
                      </div>
                    </div>
                    <div className="relative text-right">
                      <p className="text-2xl sm:text-3xl font-black text-orange-600 mb-1">{selectedQuiz.bronzeCost}</p>
                      {coinBalances.bronze < selectedQuiz.bronzeCost ? (
                        <span className="text-xs text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-md">Insufficient</span>
                      ) : (
                        <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-md">Available</span>
                      )}
                    </div>
                  </button>
                )}

                {selectedQuiz.silverCost > 0 && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('Silver button clicked', { 
                        coinBalance: coinBalances.silver, 
                        cost: selectedQuiz.silverCost,
                        isDisabled: unlocking || coinBalances.silver < selectedQuiz.silverCost
                      });
                      handleUnlock('silver');
                    }}
                    disabled={unlocking || coinBalances.silver < selectedQuiz.silverCost}
                    className={`group relative w-full flex items-center justify-between p-4 sm:p-5 rounded-2xl transition-all duration-300 transform ${
                      coinBalances.silver >= selectedQuiz.silverCost
                        ? 'bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-200 hover:border-slate-400 hover:shadow-xl hover:scale-[1.02] cursor-pointer'
                        : 'bg-gray-50 border-2 border-gray-200 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-400/0 to-gray-400/0 group-hover:from-slate-400/10 group-hover:to-gray-400/10 rounded-2xl transition-all duration-300"></div>
                    <div className="relative flex items-center gap-3">
                      <div className="p-2.5 bg-white rounded-xl shadow-md">
                        <span className="text-3xl">🥈</span>
                      </div>
                      <div className="text-left">
                        <p className="font-extrabold text-gray-900 text-base sm:text-lg mb-1">Silver Coins</p>
                        <p className="text-xs text-gray-600 flex items-center gap-1.5">
                          <span className="font-medium">Balance:</span>
                          <span className="px-2 py-0.5 bg-white rounded-md font-bold text-slate-600">{coinBalances.silver}</span>
                        </p>
                      </div>
                    </div>
                    <div className="relative text-right">
                      <p className="text-2xl sm:text-3xl font-black text-slate-700 mb-1">{selectedQuiz.silverCost}</p>
                      {coinBalances.silver < selectedQuiz.silverCost ? (
                        <span className="text-xs text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-md">Insufficient</span>
                      ) : (
                        <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-md">Available</span>
                      )}
                    </div>
                  </button>
                )}
              </div>

              {/* Cancel Button */}
              <button
                onClick={() => setShowUnlockModal(false)}
                disabled={unlocking}
                className="w-full px-5 py-3.5 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-100 hover:border-gray-400 transition-all duration-300 text-base shadow-sm hover:shadow-md transform hover:scale-[1.01]"
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

export default WeeklyQuizzes;

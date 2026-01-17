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
      <div className="py-6 sm:py-8">
        {/* Section Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-900 to-blue-800 rounded-full mb-4 shadow-lg">
            <Zap className="w-4 h-4 text-white" />
            <span className="text-white font-bold text-xs uppercase tracking-wide">Limited Time</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-900 via-blue-800 to-slate-800 bg-clip-text text-transparent mb-3 sm:mb-4">
            Weekly Quiz Challenge
          </h2>
          <p className="text-gray-600 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed px-4">
            Take on our time-limited quizzes and prove your skills before they expire!
          </p>
        </div>

        {/* Quiz Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {(showAll ? weeklyQuizzes : weeklyQuizzes.slice(0, 3)).map((quiz) => {
            const daysRemaining = calculateDaysRemaining(quiz.expiresAt);
            const hoursRemaining = calculateHoursRemaining(quiz.expiresAt);
            const isLocked = quiz.isPaid && quiz.status === 'locked';
            const urgencyColor = getUrgencyColor(daysRemaining);
            const isUrgent = daysRemaining <= 1;

            return (
              <div
                key={quiz.id}
                className={`group relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-2 border-2 ${
                  isUrgent ? 'border-red-300 ring-2 ring-red-200 ring-offset-2' : 'border-blue-100 hover:border-blue-300'
                }`}
                onClick={() => handleQuizClick(quiz)}
              >
                {/* Animated Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${urgencyColor} opacity-0 group-hover:opacity-15 transition-opacity duration-300`}></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>

                {/* Gradient Header with Timer */}
                <div className={`relative bg-gradient-to-br ${urgencyColor} p-4 sm:p-5 text-white overflow-hidden`}>
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA0MCAwIEwgMCAwIDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC4zIiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
                  <div className="relative flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <div className="p-2 bg-white/25 rounded-xl backdrop-blur-md shadow-lg">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow-md" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold opacity-95 tracking-wide">Time Remaining</p>
                        <p className="text-xl sm:text-2xl font-black">
                          {isUrgent ? `${hoursRemaining}h` : `${daysRemaining}d`}
                        </p>
                      </div>
                    </div>
                    {isUrgent && (
                      <div className="animate-bounce px-2.5 py-1 bg-red-500 bg-opacity-95 rounded-full shadow-lg">
                        <span className="text-[10px] font-black uppercase tracking-wider">⚡ Urgent</span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="relative w-full bg-white/20 rounded-full h-2 backdrop-blur-md shadow-inner">
                    <div
                      className="bg-white h-2 rounded-full transition-all duration-500 shadow-md"
                      style={{ width: `${(daysRemaining / 7) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="relative p-4 sm:p-5">
                  {/* Badges Row */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {quiz.isPaid ? (
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg shadow-sm ${
                        isLocked 
                          ? 'bg-gradient-to-r from-amber-100 via-orange-100 to-amber-100 border border-orange-200' 
                          : 'bg-gradient-to-r from-green-100 via-emerald-100 to-green-100 border border-green-200'
                      }`}>
                        {isLocked ? (
                          <Lock className="w-3.5 h-3.5 text-amber-700" />
                        ) : (
                          <Award className="w-3.5 h-3.5 text-green-700" />
                        )}
                        <span className={`text-[11px] font-extrabold tracking-wide ${isLocked ? 'text-amber-700' : 'text-green-700'}`}>
                          {isLocked ? '🔒 LOCKED' : '✅ UNLOCKED'}
                        </span>
                      </div>
                    ) : (
                      <div className="px-3 py-1.5 bg-gradient-to-r from-green-100 via-emerald-100 to-green-100 rounded-lg shadow-sm border border-green-200">
                        <span className="text-[11px] font-extrabold text-green-700 tracking-wide">⭐ FREE</span>
                      </div>
                    )}
                    {quiz.course && (
                      <div className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-slate-50 rounded-lg shadow-sm border border-blue-100">
                        <span className="text-[11px] font-bold text-blue-900 truncate">📚 {quiz.course}</span>
                      </div>
                    )}
                  </div>

                  {/* Quiz Title */}
                  <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mb-2.5 line-clamp-2 group-hover:text-blue-900 transition-colors leading-tight tracking-tight">
                    {quiz.name || quiz.title}
                  </h3>

                  {/* Quiz Description */}
                  {quiz.description && (
                    <p className="text-gray-600 text-xs sm:text-sm mb-4 line-clamp-2 leading-relaxed">
                      {quiz.description}
                    </p>
                  )}

                  {/* Quiz Info Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm">
                      <div className="p-1.5 bg-white rounded-lg shadow-sm">
                        <Clock className="w-3.5 h-3.5 text-blue-900" />
                      </div>
                      <div>
                        <p className="text-[10px] text-blue-700 font-semibold">Duration</p>
                        <p className="text-sm font-black text-gray-900">{quiz.duration} min</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 shadow-sm">
                      <div className="p-1.5 bg-white rounded-lg shadow-sm">
                        <Target className="w-3.5 h-3.5 text-slate-700" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-700 font-semibold">Questions</p>
                        <p className="text-sm font-black text-gray-900">{quiz.questionCount || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Coin Cost (if paid) */}
                  {quiz.isPaid && (
                    <div className="flex items-center justify-center gap-4 sm:gap-5 mb-4 py-3 border-t-2 border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50">
                      {quiz.bronzeCost > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-white rounded-lg shadow-sm">
                            <span className="text-2xl">🥉</span>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-600 font-semibold">Bronze</p>
                            <p className="text-base sm:text-lg font-black text-orange-600">{quiz.bronzeCost}</p>
                          </div>
                        </div>
                      )}
                      {quiz.silverCost > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-white rounded-lg shadow-sm">
                            <span className="text-2xl">🥈</span>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-600 font-semibold">Silver</p>
                            <p className="text-base sm:text-lg font-black text-slate-600">{quiz.silverCost}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  <button className={`w-full flex items-center justify-center gap-2 px-4 py-3 sm:py-3.5 rounded-xl font-extrabold text-white shadow-lg transform transition-all duration-300 hover:shadow-2xl hover:scale-105 bg-gradient-to-r ${urgencyColor} text-sm sm:text-base tracking-wide`}>
                    {isLocked ? (
                      <>
                        <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>🔓 Unlock Now</span>
                      </>  
                    ) : (
                      <>
                        <span>{(quiz.status === 'unlocked' || quiz.status === 'in-progress') && quiz.isPaid ? '🚀 Continue' : '▶️ Start Now'}</span>
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </>
                    )}
                  </button>
                </div>

                {/* Urgent Corner Badge */}
                {isUrgent && (
                  <div className="absolute top-3 right-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-red-500 rounded-xl animate-ping opacity-75"></div>
                      <div className="relative px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-xl border-2 border-white">
                        <span className="text-[10px] font-black text-white tracking-wider">⚡ ENDING SOON!</span>
                      </div>
                    </div>
                  </div>
                )}
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

import React, { useState, useEffect } from 'react';
import { FaCoins, FaArrowUp, FaArrowDown, FaCalendar, FaClock, FaUser, FaBook, FaFilter, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const CoinHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    coinType: 'all',
    transactionType: 'all'
  });
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    count: 0,
    totalRecords: 0
  });

  useEffect(() => {
    fetchTransactions();
  }, [filters, pagination.current]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: pagination.current,
        limit: 20
      });

      if (filters.coinType !== 'all') {
        params.append('coinType', filters.coinType);
      }

      if (filters.transactionType !== 'all') {
        params.append('transactionType', filters.transactionType);
      }

      const response = await fetch(`/api/coin-transactions/history?${params}`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setTransactions(data.transactions);
        setSummary(data.summary);
        setPagination(data.pagination);
      } else {
        setError(data.message || 'Failed to fetch transactions');
      }
    } catch (err) {
      console.error('Error fetching coin history:', err);
      setError('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to page 1
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total) {
      setPagination(prev => ({ ...prev, current: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCoinIcon = (coinType) => {
    const colors = {
      silver: 'text-slate-400',
      bronze: 'text-amber-600',
      gold: 'text-yellow-500'
    };
    return <FaCoins className={colors[coinType] || 'text-slate-400'} />;
  };

  const getCoinColor = (coinType) => {
    const colors = {
      silver: 'bg-slate-50 border-slate-200 text-slate-700',
      bronze: 'bg-amber-50 border-amber-200 text-amber-700',
      gold: 'bg-yellow-50 border-yellow-200 text-yellow-700'
    };
    return colors[coinType] || 'bg-slate-50 border-slate-200 text-slate-700';
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Coin Transaction History</h1>
        <p className="text-slate-600 text-sm sm:text-base">Track your coins earned and spent during sessions</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Silver Summary */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center">
                  <FaCoins className="text-slate-600 text-lg" />
                </div>
                <span className="font-semibold text-slate-700">Silver</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 flex items-center gap-1">
                  <FaArrowUp className="text-emerald-600 text-xs" /> Earned
                </span>
                <span className="font-semibold text-emerald-600">+{summary.silver.earned}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 flex items-center gap-1">
                  <FaArrowDown className="text-rose-600 text-xs" /> Spent
                </span>
                <span className="font-semibold text-rose-600">-{summary.silver.spent}</span>
              </div>
            </div>
          </div>

          {/* Bronze Summary */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-amber-200 rounded-lg flex items-center justify-center">
                  <FaCoins className="text-amber-700 text-lg" />
                </div>
                <span className="font-semibold text-amber-700">Bronze</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-amber-700 flex items-center gap-1">
                  <FaArrowUp className="text-emerald-600 text-xs" /> Earned
                </span>
                <span className="font-semibold text-emerald-600">+{summary.bronze.earned}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-amber-700 flex items-center gap-1">
                  <FaArrowDown className="text-rose-600 text-xs" /> Spent
                </span>
                <span className="font-semibold text-rose-600">-{summary.bronze.spent}</span>
              </div>
            </div>
          </div>

          {/* Gold Summary */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-yellow-200 rounded-lg flex items-center justify-center">
                  <FaCoins className="text-yellow-700 text-lg" />
                </div>
                <span className="font-semibold text-yellow-700">Gold</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-yellow-700 flex items-center gap-1">
                  <FaArrowUp className="text-emerald-600 text-xs" /> Earned
                </span>
                <span className="font-semibold text-emerald-600">+{summary.gold.earned}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-yellow-700 flex items-center gap-1">
                  <FaArrowDown className="text-rose-600 text-xs" /> Spent
                </span>
                <span className="font-semibold text-rose-600">-{summary.gold.spent}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <FaFilter className="text-teal-600" />
          <span className="font-semibold text-slate-700">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Coin Type Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Coin Type</label>
            <select
              value={filters.coinType}
              onChange={(e) => handleFilterChange('coinType', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Coins</option>
              <option value="silver">Silver</option>
              <option value="bronze">Bronze</option>
              <option value="gold">Gold</option>
            </select>
          </div>

          {/* Transaction Type Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Transaction Type</label>
            <select
              value={filters.transactionType}
              onChange={(e) => handleFilterChange('transactionType', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Transactions</option>
              <option value="earned">Earned</option>
              <option value="spent">Spent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <FaCoins className="text-slate-300 text-5xl mx-auto mb-4" />
          <p className="text-slate-500 text-lg font-medium">No transactions found</p>
          <p className="text-slate-400 text-sm mt-2">Your coin transaction history will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction._id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left Section - Icon and Details */}
                <div className="flex items-start gap-3 flex-1">
                  {/* Coin Icon */}
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${getCoinColor(transaction.coinType)}`}>
                    {getCoinIcon(transaction.coinType)}
                  </div>

                  {/* Transaction Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-800 capitalize">
                        {transaction.coinType} Coins {transaction.transactionType}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        transaction.transactionType === 'earned'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {transaction.transactionType === 'earned' ? 'Earned' : 'Spent'}
                      </span>
                    </div>

                    {/* Session Info */}
                    <div className="space-y-1 text-sm text-slate-600">
                      {transaction.partnerName && (
                        <div className="flex items-center gap-2">
                          <FaUser className="text-slate-400 text-xs" />
                          <span>Session with {transaction.partnerName}</span>
                        </div>
                      )}
                      {transaction.subject && (
                        <div className="flex items-center gap-2">
                          <FaBook className="text-slate-400 text-xs" />
                          <span>{transaction.subject}{transaction.topic ? ` - ${transaction.topic}` : ''}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <FaClock className="text-slate-400 text-xs" />
                        <span>Duration: {transaction.sessionDurationMinutes} minute{transaction.sessionDurationMinutes > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaCalendar className="text-slate-400 text-xs" />
                        <span>{formatDate(transaction.createdAt)} at {formatTime(transaction.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Section - Amount */}
                <div className="text-right">
                  <div className={`text-2xl font-bold ${
                    transaction.transactionType === 'earned' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {transaction.transactionType === 'earned' ? '+' : '-'}{transaction.amount}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Balance: {transaction.balanceAfter}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.total > 1 && (
        <div className="flex items-center justify-between mt-6 px-4">
          <div className="text-sm text-slate-600">
            Showing {((pagination.current - 1) * 20) + 1} - {Math.min(pagination.current * 20, pagination.totalRecords)} of {pagination.totalRecords} transactions
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.current - 1)}
              disabled={pagination.current === 1}
              className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <FaChevronLeft className="text-slate-600" />
            </button>
            <span className="px-4 py-2 bg-teal-50 text-teal-700 font-medium rounded-lg border border-teal-200">
              {pagination.current} / {pagination.total}
            </span>
            <button
              onClick={() => handlePageChange(pagination.current + 1)}
              disabled={pagination.current === pagination.total}
              className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <FaChevronRight className="text-slate-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoinHistory;

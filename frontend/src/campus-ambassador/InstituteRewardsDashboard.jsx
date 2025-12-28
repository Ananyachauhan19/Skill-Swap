import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Calendar, User, Coins, Award, AlertCircle, ArrowUp } from 'lucide-react';

const InstituteRewardsDashboard = ({ institute, onClose }) => {
  const [rewardHistory, setRewardHistory] = useState([]);
  const [totals, setTotals] = useState({
    totalSilverDistributed: 0,
    totalGoldenDistributed: 0,
    totalTransactions: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRewardHistory();
  }, [institute._id]);

  const fetchRewardHistory = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/campus-ambassador/institutes/${institute._id}/reward-history`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch reward history');
      }

      setRewardHistory(data.transactions || []);
      setTotals(data.totals || {
        totalSilverDistributed: 0,
        totalGoldenDistributed: 0,
        totalTransactions: 0
      });
    } catch (err) {
      console.error('Fetch reward history error:', err);
      setError(err.message || 'Failed to load reward history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-gray-200 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Rewards Dashboard</h2>
            <p className="text-xs text-gray-600 mt-0.5">{institute.instituteName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-start gap-2">
            <ArrowUp className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
            <div className="text-xs text-blue-800">
              <p className="font-semibold mb-0.5">Wallet Balance Increments</p>
              <p>Each coin distribution <span className="font-bold">adds coins</span> to students' existing wallet balances.</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 bg-gray-200 rounded-lg">
                  <Coins className="text-gray-700" size={16} />
                </div>
                <p className="text-xs font-medium text-gray-600">Total Silver</p>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {totals.totalSilverDistributed.toLocaleString()}
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 bg-yellow-200 rounded-lg">
                  <Award className="text-yellow-700" size={16} />
                </div>
                <p className="text-xs font-medium text-yellow-700">Total Golden</p>
              </div>
              <p className="text-2xl font-bold text-yellow-800">
                {totals.totalGoldenDistributed.toLocaleString()}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 bg-blue-200 rounded-lg">
                  <TrendingUp className="text-blue-700" size={16} />
                </div>
                <p className="text-xs font-medium text-blue-600">Total Events</p>
              </div>
              <p className="text-2xl font-bold text-blue-800">{totals.totalTransactions}</p>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600 mt-3">Loading reward history...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
              <div>
                <p className="text-sm text-red-800 font-semibold">Error Loading Data</p>
                <p className="text-xs text-red-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Transaction History Table */}
          {!loading && !error && (
            <>
              {rewardHistory.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <Coins className="mx-auto text-gray-400 mb-2" size={40} />
                  <p className="text-sm text-gray-600 font-medium">No reward distributions yet</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Start distributing coins to your students!
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Source
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Distributed By
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                          Students
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                          Per Student
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                          Cumulative
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Remarks
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rewardHistory.map((transaction, index) => (
                        <tr key={transaction._id} className="hover:bg-gray-50 transition">
                          <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={12} className="text-gray-400" />
                              <span>{formatDate(transaction.distributionDate)}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs">
                            {transaction.source === 'EXCEL_UPLOAD' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                📊 Excel
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                🎁 Distribute
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-900">
                            <div className="flex items-center gap-1.5">
                              <User size={12} className="text-gray-400" />
                              <div>
                                <p className="font-medium">{transaction.ambassadorName}</p>
                                <p className="text-xs text-gray-500">{transaction.ambassadorEmail}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center text-xs font-semibold text-gray-900">
                            {transaction.totalStudentsCount}
                          </td>
                          <td className="px-3 py-3 text-center text-xs">
                            <div className="space-y-0.5">
                              {transaction.perStudentSilver > 0 && (
                                <div className="flex items-center justify-center gap-1">
                                  <Coins size={12} className="text-gray-600" />
                                  <span className="text-gray-700 font-medium">{transaction.perStudentSilver}</span>
                                </div>
                              )}
                              {transaction.perStudentGolden > 0 && (
                                <div className="flex items-center justify-center gap-1">
                                  <Award size={12} className="text-yellow-600" />
                                  <span className="text-yellow-700 font-medium">{transaction.perStudentGolden}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center text-xs">
                            <div className="space-y-0.5">
                              {transaction.totalSilverDistributed > 0 && (
                                <p className="text-gray-800 font-semibold">
                                  {transaction.totalSilverDistributed.toLocaleString()} 🪙
                                </p>
                              )}
                              {transaction.totalGoldenDistributed > 0 && (
                                <p className="text-yellow-700 font-semibold">
                                  {transaction.totalGoldenDistributed.toLocaleString()} 🏆
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center text-xs">
                            <div className="bg-blue-50 rounded px-2 py-1 space-y-0.5">
                              {transaction.cumulativeSilver > 0 && (
                                <p className="text-gray-800 font-bold">
                                  🪙 {transaction.cumulativeSilver.toLocaleString()}
                                </p>
                              )}
                              {transaction.cumulativeGolden > 0 && (
                                <p className="text-yellow-700 font-bold">
                                  🏆 {transaction.cumulativeGolden.toLocaleString()}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-600 max-w-xs">
                            {transaction.remarks || (
                              <span className="text-gray-400 italic">No remarks</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstituteRewardsDashboard;

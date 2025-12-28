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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Rewards Dashboard</h2>
            <p className="text-sm text-gray-600 mt-1">{institute.instituteName}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <ArrowUp className="text-blue-600 flex-shrink-0 mt-1" size={20} />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Wallet Balance Increments</p>
              <p>Each coin distribution <span className="font-bold">adds coins</span> to students' existing wallet balances. Coins are not replaced.</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <Coins className="text-gray-700" size={20} />
                </div>
                <p className="text-sm font-medium text-gray-600">Total Silver Distributed</p>
              </div>
              <p className="text-3xl font-bold text-gray-800">
                {totals.totalSilverDistributed.toLocaleString()}
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-5 border border-yellow-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-yellow-200 rounded-lg">
                  <Award className="text-yellow-700" size={20} />
                </div>
                <p className="text-sm font-medium text-yellow-700">Total Golden Distributed</p>
              </div>
              <p className="text-3xl font-bold text-yellow-800">
                {totals.totalGoldenDistributed.toLocaleString()}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-200 rounded-lg">
                  <TrendingUp className="text-blue-700" size={20} />
                </div>
                <p className="text-sm font-medium text-blue-600">Total Events</p>
              </div>
              <p className="text-3xl font-bold text-blue-800">{totals.totalTransactions}</p>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-4">Loading reward history...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-red-800 font-semibold">Error Loading Data</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Transaction History Table */}
          {!loading && !error && (
            <>
              {rewardHistory.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <Coins className="mx-auto text-gray-400 mb-3" size={48} />
                  <p className="text-gray-600 font-medium">No reward distributions yet</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Start distributing coins to your students!
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Source
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Distributed By
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Students
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Per Student
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Distributed
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cumulative Total
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Remarks
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rewardHistory.map((transaction, index) => (
                        <tr key={transaction._id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-gray-400" />
                              <span>{formatDate(transaction.distributionDate)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            {transaction.source === 'EXCEL_UPLOAD' ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                📊 Excel Upload
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                🎁 Distribute
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <User size={14} className="text-gray-400" />
                              <div>
                                <p className="font-medium">{transaction.ambassadorName}</p>
                                <p className="text-xs text-gray-500">{transaction.ambassadorEmail}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center text-sm font-semibold text-gray-900">
                            {transaction.totalStudentsCount}
                          </td>
                          <td className="px-4 py-4 text-center text-sm">
                            <div className="space-y-1">
                              {transaction.perStudentSilver > 0 && (
                                <div className="flex items-center justify-center gap-1">
                                  <Coins size={14} className="text-gray-600" />
                                  <span className="text-gray-700 font-medium">{transaction.perStudentSilver}</span>
                                </div>
                              )}
                              {transaction.perStudentGolden > 0 && (
                                <div className="flex items-center justify-center gap-1">
                                  <Award size={14} className="text-yellow-600" />
                                  <span className="text-yellow-700 font-medium">{transaction.perStudentGolden}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center text-sm">
                            <div className="space-y-1">
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
                          <td className="px-4 py-4 text-center text-sm">
                            <div className="bg-blue-50 rounded-lg p-2 space-y-1">
                              {transaction.cumulativeSilver > 0 && (
                                <p className="text-gray-800 font-bold text-xs">
                                  🪙 {transaction.cumulativeSilver.toLocaleString()}
                                </p>
                              )}
                              {transaction.cumulativeGolden > 0 && (
                                <p className="text-yellow-700 font-bold text-xs">
                                  🏆 {transaction.cumulativeGolden.toLocaleString()}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 max-w-xs">
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

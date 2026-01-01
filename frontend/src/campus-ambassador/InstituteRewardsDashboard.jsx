import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Calendar, User, Coins, Award, AlertCircle, ArrowUp } from 'lucide-react';

const InstituteRewardsDashboard = ({ institute, onClose, variant = 'modal' }) => {
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

  const isModal = variant !== 'page';

  return (
    <div className={isModal ? 'fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm p-4' : 'w-full'}>
      <div className={isModal ? 'bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-gray-200 flex flex-col' : 'bg-white rounded-2xl border border-slate-200 w-full overflow-hidden flex flex-col'}>
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Rewards Dashboard</h2>
            <p className="text-xs text-gray-600 mt-0.5">{institute.instituteName}</p>
          </div>
          {isModal && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* Top Summary Row */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-stretch mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-2">
              <ArrowUp className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
              <div className="text-xs text-blue-900/90">
                <p className="font-semibold">Wallet Balance Increments</p>
                <p className="mt-1 leading-snug">
                  Each coin distribution <span className="font-bold">adds coins</span> to students' existing wallet balances.
                </p>
              </div>
            </div>

            <div className="hidden lg:block w-px bg-slate-200 self-stretch" />

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gray-200 rounded-lg">
                    <Coins className="text-gray-700" size={16} />
                  </div>
                  <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Total Silver</p>
                </div>
                <p className="mt-2 text-xl font-bold text-gray-900 tabular-nums">
                  {totals.totalSilverDistributed.toLocaleString()}
                </p>
              </div>

              <div className="rounded-lg border border-yellow-200 bg-gradient-to-br from-yellow-50 to-white p-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-yellow-200 rounded-lg">
                    <Award className="text-yellow-700" size={16} />
                  </div>
                  <p className="text-[11px] font-semibold text-yellow-700 uppercase tracking-wide">Total Golden</p>
                </div>
                <p className="mt-2 text-xl font-bold text-yellow-900 tabular-nums">
                  {totals.totalGoldenDistributed.toLocaleString()}
                </p>
              </div>

              <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-200 rounded-lg">
                    <TrendingUp className="text-blue-700" size={16} />
                  </div>
                  <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide">Total Events</p>
                </div>
                <p className="mt-2 text-xl font-bold text-blue-900 tabular-nums">{totals.totalTransactions}</p>
              </div>
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
                        <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                          Date
                        </th>
                        <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                          Source
                        </th>
                        <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                          Distributed By
                        </th>
                        <th className="px-3 py-2 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                          Students
                        </th>
                        <th className="px-3 py-2 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                          Per Student
                        </th>
                        <th className="px-3 py-2 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                          Total
                        </th>
                        <th className="px-3 py-2 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                          Cumulative
                        </th>
                        <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
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
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-800">
                                <TrendingUp size={12} />
                                Excel Upload
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800">
                                <ArrowUp size={12} />
                                Distribute
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
                                <div className="inline-flex items-center justify-center gap-1 text-gray-800 font-semibold">
                                  <Coins size={12} className="text-gray-600" />
                                  <span>{transaction.totalSilverDistributed.toLocaleString()}</span>
                                </div>
                              )}
                              {transaction.totalGoldenDistributed > 0 && (
                                <div className="inline-flex items-center justify-center gap-1 text-yellow-700 font-semibold">
                                  <Award size={12} className="text-yellow-600" />
                                  <span>{transaction.totalGoldenDistributed.toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center text-xs">
                            <div className="bg-blue-50 rounded px-2 py-1 space-y-0.5">
                              {transaction.cumulativeSilver > 0 && (
                                <div className="flex items-center justify-center gap-1 text-gray-800 font-bold">
                                  <Coins size={12} className="text-gray-600" />
                                  <span>{transaction.cumulativeSilver.toLocaleString()}</span>
                                </div>
                              )}
                              {transaction.cumulativeGolden > 0 && (
                                <div className="flex items-center justify-center gap-1 text-yellow-700 font-bold">
                                  <Award size={12} className="text-yellow-600" />
                                  <span>{transaction.cumulativeGolden.toLocaleString()}</span>
                                </div>
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

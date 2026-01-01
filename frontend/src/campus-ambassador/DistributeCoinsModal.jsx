import React, { useState } from 'react';
import { X, Coins, AlertCircle } from 'lucide-react';

const DistributeCoinsModal = ({ institute, onClose, onSuccess, variant = 'modal' }) => {
  const [formData, setFormData] = useState({
    perStudentSilver: 0,
    perStudentGolden: 0,
    remarks: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'remarks' ? value : parseInt(value) || 0
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.perStudentSilver === 0 && formData.perStudentGolden === 0) {
      setError('Please assign at least Silver or Golden coins');
      return;
    }

    if (formData.perStudentSilver < 0 || formData.perStudentGolden < 0) {
      setError('Coin values cannot be negative');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/campus-ambassador/institutes/${institute._id}/distribute-coins`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            instituteId: institute._id,
            perStudentSilver: formData.perStudentSilver,
            perStudentGolden: formData.perStudentGolden,
            remarks: formData.remarks
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to distribute coins');
      }

      onSuccess(data);
      onClose();
    } catch (err) {
      console.error('Distribute coins error:', err);
      setError(err.message || 'Failed to distribute coins');
    } finally {
      setLoading(false);
    }
  };

  const totalSilver = formData.perStudentSilver * (institute.studentsCount || 0);
  const totalGolden = formData.perStudentGolden * (institute.studentsCount || 0);

  const isModal = variant !== 'page';

  return (
    <div className={isModal ? 'fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm p-4' : 'w-full'}>
      <div className={isModal ? 'bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200' : 'bg-white rounded-2xl border border-slate-200 w-full overflow-y-auto'}>
        <div className="flex justify-between items-center px-5 py-3 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-white">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Distribute Coins</h2>
            <p className="text-xs text-gray-600 mt-0.5">{institute.instituteName}</p>
          </div>
          {isModal && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
              <p className="text-red-700 text-xs">{error}</p>
            </div>
          )}

          {/* Institute Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Coins className="text-blue-600" size={18} />
                <p className="text-sm font-semibold text-blue-900">Institute Summary</p>
              </div>
              <span className="text-[11px] font-semibold text-blue-900/70">Students: {institute.studentsCount || 0}</span>
            </div>
            <p className="mt-2 text-xs text-blue-800 leading-snug">
              Coins will be <span className="font-bold">added</span> to each student's current wallet balance.
            </p>
          </div>

          {/* Coins Inputs (with vertical divider on desktop) */}
          <div className="border border-slate-200 rounded-lg bg-white">
            <div className="px-4 py-3 border-b border-slate-200">
              <p className="text-sm font-semibold text-gray-900">Per-student coins</p>
              <p className="mt-0.5 text-xs text-gray-600">Set Silver and/or Golden coins to distribute.</p>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Silver / student</label>
                <input
                  type="number"
                  name="perStudentSilver"
                  value={formData.perStudentSilver}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
                {formData.perStudentSilver > 0 && (
                  <p className="mt-1 text-[11px] text-gray-600">
                    Total: <span className="font-semibold text-gray-900">{totalSilver.toLocaleString()}</span> silver
                  </p>
                )}
              </div>

              <div className="hidden md:block w-px bg-slate-200 self-stretch" />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Golden / student</label>
                <input
                  type="number"
                  name="perStudentGolden"
                  value={formData.perStudentGolden}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
                {formData.perStudentGolden > 0 && (
                  <p className="mt-1 text-[11px] text-gray-600">
                    Total: <span className="font-semibold text-yellow-700">{totalGolden.toLocaleString()}</span> golden
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Remarks (Optional)
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows="2"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="E.g., Monthly rewards for December 2025"
            />
          </div>

          {/* Distribution Summary */}
          {(formData.perStudentSilver > 0 || formData.perStudentGolden > 0) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-green-900 mb-1.5">Distribution Summary</p>
              <div className="space-y-1 text-xs text-green-800">
                {formData.perStudentSilver > 0 && (
                  <p>Silver: {formData.perStudentSilver} × {institute.studentsCount || 0} = <span className="font-bold">{totalSilver.toLocaleString()}</span></p>
                )}
                {formData.perStudentGolden > 0 && (
                  <p>Golden: {formData.perStudentGolden} × {institute.studentsCount || 0} = <span className="font-bold text-yellow-600">{totalGolden.toLocaleString()}</span></p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
              disabled={loading || (formData.perStudentSilver === 0 && formData.perStudentGolden === 0)}
            >
              {loading ? 'Distributing...' : 'Distribute Coins'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DistributeCoinsModal;

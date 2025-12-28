import React, { useState } from 'react';
import { X, Coins, AlertCircle } from 'lucide-react';

const DistributeCoinsModal = ({ institute, onClose, onSuccess }) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Distribute Coins</h2>
            <p className="text-sm text-gray-600 mt-1">{institute.instituteName}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Institute Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="text-blue-600" size={20} />
              <p className="text-sm font-semibold text-blue-900">Institute Summary</p>
            </div>
            <div className="space-y-1 text-sm text-blue-800">
              <p>Active Students: <span className="font-semibold">{institute.studentsCount || 0}</span></p>
              <p className="text-xs text-blue-600 mt-2">
                💡 Coins will be <span className="font-bold">added</span> to each student's current wallet balance
              </p>
            </div>
          </div>

          {/* Silver Coins */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Silver Coins per Student
            </label>
            <input
              type="number"
              name="perStudentSilver"
              value={formData.perStudentSilver}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter silver coins"
            />
            {formData.perStudentSilver > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                Total: <span className="font-semibold text-gray-800">{totalSilver.toLocaleString()}</span> Silver coins
              </p>
            )}
          </div>

          {/* Golden Coins */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Golden Coins per Student
            </label>
            <input
              type="number"
              name="perStudentGolden"
              value={formData.perStudentGolden}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter golden coins"
            />
            {formData.perStudentGolden > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                Total: <span className="font-semibold text-yellow-600">{totalGolden.toLocaleString()}</span> Golden coins
              </p>
            )}
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remarks (Optional)
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="E.g., Monthly rewards for December 2025"
            />
          </div>

          {/* Distribution Summary */}
          {(formData.perStudentSilver > 0 || formData.perStudentGolden > 0) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-green-900 mb-2">Distribution Summary</p>
              <div className="space-y-1 text-sm text-green-800">
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
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
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

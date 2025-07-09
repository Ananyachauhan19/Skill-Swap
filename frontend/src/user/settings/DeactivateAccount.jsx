import React, { useState } from "react";

const REASONS = [
  "I need a break",
  "Privacy concerns",
  "Too many notifications",
  "I have another account",
  "Not finding value",
  "Technical issues",
  "Other (please specify)"
];

// Backend functions:
// async function deactivateAccount(reasons) {
//   return fetch('/api/user/deactivate', { method: 'POST', body: JSON.stringify({ reasons }) });
// }
// async function deleteAccount(reasons) {
//   return fetch('/api/user/delete', { method: 'POST', body: JSON.stringify({ reasons }) });
// }

const DeactivateAccount = () => {
  const [status, setStatus] = useState(null); // null | 'deactivated' | 'deleted'
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [otherReason, setOtherReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReasonChange = (reason) => {
    if (selectedReasons.includes(reason)) {
      setSelectedReasons(selectedReasons.filter(r => r !== reason));
    } else {
      setSelectedReasons([...selectedReasons, reason]);
    }
    setError("");
  };

  const handleOtherReasonChange = (e) => {
    setOtherReason(e.target.value);
    setError("");
  };

  const getFinalReasons = () => {
    let reasons = selectedReasons.filter(r => r !== REASONS[REASONS.length - 1]);
    if (selectedReasons.includes(REASONS[REASONS.length - 1]) && otherReason.trim()) {
      reasons.push(otherReason.trim());
    }
    return reasons;
  };

  const validateReasons = () => {
    if (selectedReasons.length === 0) {
      setError("Please select at least one reason.");
      return false;
    }
    if (selectedReasons.includes(REASONS[REASONS.length - 1]) && !otherReason.trim()) {
      setError("Please specify your reason in the 'Other' field.");
      return false;
    }
    return true;
  };

  const handleDeactivate = async () => {
    if (!validateReasons()) return;
    setLoading(true);
    try {
      // await deactivateAccount(getFinalReasons());
      setStatus('deactivated');
    } catch (err) {
      setError("Failed to deactivate account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!validateReasons()) return;
    if (window.confirm("Are you sure you want to permanently delete your account? This cannot be undone.")) {
      setLoading(true);
      try {
        // await deleteAccount(getFinalReasons());
        setStatus('deleted');
      } catch (err) {
        setError("Failed to delete account. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  if (status === 'deactivated') {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 border border-blue-100 text-center">
          <h2 className="text-2xl font-semibold text-yellow-600 mb-6">Account Deactivated</h2>
          <p className="text-blue-900">Your account is temporarily deactivated. You can reactivate it by logging in again.</p>
        </div>
      </div>
    );
  }
  if (status === 'deleted') {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 border border-blue-100 text-center">
          <h2 className="text-2xl font-semibold text-red-600 mb-6">Account Deleted</h2>
          <p className="text-blue-900">Your account has been permanently deleted. We're sorry to see you go!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
        <h2 className="text-2xl font-semibold text-blue-900 text-center mb-6">Deactivate or Delete Account</h2>
        <p className="text-blue-900 text-center mb-6">You can choose to temporarily deactivate your account or permanently delete it. Deactivation will hide your profile and data until you log in again. Deletion is irreversible.</p>
        <div className="mb-6">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Why are you leaving?</h3>
          <form className="flex flex-col gap-3" onSubmit={e => e.preventDefault()}>
            {REASONS.map((reason, idx) => (
              <label key={reason} className="flex items-center gap-2 text-blue-900">
                <input
                  type="checkbox"
                  checked={selectedReasons.includes(reason)}
                  onChange={() => handleReasonChange(reason)}
                  className="accent-blue-600 h-4 w-4"
                />
                <span className="text-sm">{reason}</span>
                {reason === REASONS[REASONS.length - 1] && selectedReasons.includes(reason) && (
                  <input
                    type="text"
                    className="ml-2 border border-blue-200 rounded-lg px-3 py-1.5 text-sm text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300 transition flex-1"
                    placeholder="Please specify your reason"
                    value={otherReason}
                    onChange={handleOtherReasonChange}
                    maxLength={200}
                  />
                )}
              </label>
            ))}
            {error && <div className="text-red-600 text-sm mt-3">{error}</div>}
          </form>
        </div>
        <div className="flex flex-col gap-3">
          <button
            className="w-full bg-yellow-500 text-white py-2.5 rounded-lg font-semibold shadow hover:bg-yellow-600 transition duration-200 disabled:bg-yellow-400"
            onClick={handleDeactivate}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deactivating...
              </div>
            ) : (
              'Deactivate Account Temporarily'
            )}
          </button>
          <button
            className="w-full bg-red-600 text-white py-2.5 rounded-lg font-semibold shadow hover:bg-red-700 positioning duration-200 disabled:bg-red-400"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </div>
            ) : (
              'Delete Account Permanently'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeactivateAccount;
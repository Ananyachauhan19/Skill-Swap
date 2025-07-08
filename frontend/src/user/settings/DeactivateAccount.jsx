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
      <div className="min-h-screen w-full bg-blue-50 flex flex-col items-center justify-center">
        <div className="max-w-lg w-full p-6 bg-white rounded-xl shadow border border-blue-100 mt-8 mx-auto text-center">
          <h2 className="text-xl font-bold mb-4 text-yellow-600">Account Deactivated</h2>
          <p className="mb-4 text-gray-700">Your account is temporarily deactivated. You can reactivate it by logging in again.</p>
        </div>
      </div>
    );
  }
  if (status === 'deleted') {
    return (
      <div className="min-h-screen w-full bg-blue-50 flex flex-col items-center justify-center">
        <div className="max-w-lg w-full p-6 bg-white rounded-xl shadow border border-blue-100 mt-8 mx-auto text-center">
          <h2 className="text-xl font-bold mb-4 text-red-600">Account Deleted</h2>
          <p className="mb-4 text-gray-700">Your account has been permanently deleted. We're sorry to see you go!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-blue-50 flex flex-col items-center justify-center">
      <div className="max-w-lg w-full p-6 bg-white rounded-xl shadow border border-blue-100 mt-8 mx-auto">
        <h2 className="text-xl font-bold mb-4 text-center">Deactivate or Delete Account</h2>
        <p className="mb-6 text-gray-700 text-center">You can choose to temporarily deactivate your account or permanently delete it. Deactivation will hide your profile and data until you log in again. Deletion is irreversible.</p>
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Why are you leaving?</h3>
          <form className="flex flex-col gap-2" onSubmit={e => e.preventDefault()}>
            {REASONS.map((reason, idx) => (
              <label key={reason} className="flex items-center gap-2 text-gray-700">
                <input
                  type="checkbox"
                  checked={selectedReasons.includes(reason)}
                  onChange={() => handleReasonChange(reason)}
                  className="accent-blue-600"
                />
                {reason}
                {reason === REASONS[REASONS.length - 1] && selectedReasons.includes(reason) && (
                  <input
                    type="text"
                    className="ml-2 border rounded px-2 py-1 text-sm flex-1"
                    placeholder="Please specify your reason"
                    value={otherReason}
                    onChange={handleOtherReasonChange}
                    maxLength={200}
                  />
                )}
              </label>
            ))}
            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          </form>
        </div>
        <div className="flex flex-col gap-4">
          <button className="bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600 transition w-full font-semibold" onClick={handleDeactivate} disabled={loading}>
            {loading ? 'Deactivating...' : 'Deactivate Account Temporarily'}
          </button>
          <button className="bg-red-600 text-white py-2 rounded hover:bg-red-700 transition w-full font-semibold" onClick={handleDelete} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete Account Permanently'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeactivateAccount;

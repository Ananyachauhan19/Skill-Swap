import React, { useState } from "react";

// Backend function: Change user password
// async function changePassword(currentPassword, newPassword) {
//   return fetch('/api/user/password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
// }

const ChangePassword = () => {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (newPass !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      // await changePassword(current, newPass);
      setMessage("Password updated successfully.");
      setCurrent(""); setNewPass(""); setConfirm("");
    } catch (err) {
      setError("Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
        <h2 className="text-2xl font-semibold text-blue-900 text-center mb-6">Change Password</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-blue-800 mb-1">Current Password</label>
            <input
              type="password"
              placeholder="Enter current password"
              className="w-full border border-blue-200 rounded-lg px-4 py-2.5 text-sm text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
              value={current}
              onChange={e => setCurrent(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-800 mb-1">New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              className="w-full border border-blue-200 rounded-lg px-4 py-2.5 text-sm text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-800 mb-1">Confirm New Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              className="w-full border border-blue-200 rounded-lg px-4 py-2.5 text-sm text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold shadow hover:bg-blue-700 transition duration-200 disabled:bg-blue-400"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </div>
            ) : (
              'Update Password'
            )}
          </button>
        </form>
        {message && <p className="text-green-600 text-sm mt-4 text-center">{message}</p>}
        {error && <p className="text-red-600 text-sm mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default ChangePassword;
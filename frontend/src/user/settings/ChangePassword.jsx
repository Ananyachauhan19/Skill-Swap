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
    <div className="min-h-screen w-full bg-blue-50 flex flex-col items-center justify-center">
      <div className="max-w-lg w-full p-6 bg-white rounded-xl shadow border border-blue-100 mt-8 mx-auto">
        <h2 className="text-xl font-bold mb-4 text-center">Change Password</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input type="password" placeholder="Current Password" className="border p-2 rounded" value={current} onChange={e => setCurrent(e.target.value)} required />
          <input type="password" placeholder="New Password" className="border p-2 rounded" value={newPass} onChange={e => setNewPass(e.target.value)} required />
          <input type="password" placeholder="Confirm New Password" className="border p-2 rounded" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          <button type="submit" className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition" disabled={loading}>{loading ? 'Updating...' : 'Update Password'}</button>
        </form>
        {message && <p className="text-green-600 text-sm mt-2 text-center">{message}</p>}
        {error && <p className="text-red-600 text-sm mt-2 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default ChangePassword;

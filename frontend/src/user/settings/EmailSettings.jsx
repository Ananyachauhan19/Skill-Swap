import React, { useState } from "react";

// Backend function: Update user's email and send verification link
// async function updateEmail(newEmail) {
//   return fetch('/api/user/email', { method: 'POST', body: JSON.stringify({ email: newEmail }) });
// }

const EmailSettings = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      // await updateEmail(email);
      setMessage("A verification link has been sent to your new email address.");
    } catch (err) {
      setError("Failed to update email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
        <h2 className="text-2xl font-semibold text-blue-900 text-center mb-6">Update Email Address</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-blue-800 mb-1">New Email Address</label>
            <input
              type="email"
              placeholder="Enter new email address"
              className="w-full border border-blue-200 rounded-lg px-4 py-2.5 text-sm text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold shadow hover:bg-blue-700 transition duration-200 disabled:bg-blue-400"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Verification'}
          </button>
        </form>
        {message && <p className="text-green-600 text-sm mt-4 text-center">{message}</p>}
        {error && <p className="text-red-600 text-sm mt-4 text-center">{error}</p>}
        <p className="text-sm text-blue-600 mt-4 text-center">A verification link will be sent to your new email address.</p>
      </div>
    </div>
  );
};

export default EmailSettings;
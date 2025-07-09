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
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError("Failed to update email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-blue-50 flex flex-col items-center justify-center">
      <div className="max-w-lg w-full p-6 bg-white rounded-xl shadow border border-blue-100 mt-8 mx-auto">
        <h2 className="text-xl font-bold mb-4 text-center">Update Email Address</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input type="email" placeholder="New Email Address" className="border p-2 rounded" value={email} onChange={e => setEmail(e.target.value)} required />
          <button type="submit" className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition" disabled={loading}>{loading ? 'Sending...' : 'Send Verification'}</button>
        </form>
        {message && <p className="text-green-600 text-sm mt-2 text-center">{message}</p>}
        {error && <p className="text-red-600 text-sm mt-2 text-center">{error}</p>}
        <p className="text-sm text-gray-500 mt-2 text-center">A verification link will be sent to your new email address.</p>
      </div>
    </div>
  );
};

export default EmailSettings;

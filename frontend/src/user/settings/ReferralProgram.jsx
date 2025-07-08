import React, { useState } from "react";

// Backend function: Fetch referral info
// async function fetchReferralInfo() {
//   const res = await fetch('/api/bonus/referral');
//   return res.json();
// }
// Backend function: Send referral invite
// async function sendReferralInvite(email) {
//   return fetch('/api/bonus/referral/invite', { method: 'POST', body: JSON.stringify({ email }) });
// }

const ReferralProgram = () => {
  // Static fallback data for development/demo
  const [referralLink] = useState("https://skillswaphub.com/invite/yourcode");
  const [inviteEmail, setInviteEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      // await sendReferralInvite(inviteEmail);
      setMessage("Referral invite sent!");
      setInviteEmail("");
    } catch (err) {
      setError("Failed to send invite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-8 bg-white rounded-xl shadow border border-blue-100 mt-8">
      <h1 className="text-2xl font-bold mb-6 text-blue-900 text-center">Referral Program</h1>
      <div className="mb-4">
        <div className="font-semibold text-blue-800 mb-1">Your Referral Link:</div>
        <div className="bg-blue-50 rounded p-2 text-blue-900 text-sm break-all select-all">{referralLink}</div>
      </div>
      <form onSubmit={handleInvite} className="space-y-4 mb-4">
        <input
          type="email"
          value={inviteEmail}
          onChange={e => setInviteEmail(e.target.value)}
          placeholder="Friend's email address"
          className="w-full border border-blue-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          required
        />
        <button type="submit" className="bg-blue-700 text-white px-6 py-2 rounded font-semibold shadow hover:bg-blue-800 transition-all duration-200" disabled={loading}>
          {loading ? 'Sending...' : 'Send Invite'}
        </button>
      </form>
      {message && <p className="text-green-600 text-sm mb-2 text-center">{message}</p>}
      {error && <p className="text-red-600 text-sm mb-2 text-center">{error}</p>}
    </div>
  );
};

export default ReferralProgram;

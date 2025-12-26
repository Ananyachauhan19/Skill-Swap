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
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError("Failed to send invite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center pt-16 md:pt-[72px] lg:pt-20 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 border border-blue-100 mt-8">
        <h1 className="text-2xl font-semibold text-blue-900 text-center mb-6">Referral Program</h1>
        <div className="mb-6">
          <label className="block text-sm font-medium text-blue-800 mb-1">Your Referral Link</label>
          <div className="bg-blue-50 rounded-lg p-3 text-blue-900 text-sm break-all select-all border border-blue-200">{referralLink}</div>
        </div>
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-blue-800 mb-1">Friend's Email</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="Enter friend's email"
              className="w-full border border-blue-200 rounded-lg px-4 py-2.5 text-sm text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold shadow hover:bg-blue-700 transition duration-200 disabled:bg-blue-400"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Invite'}
          </button>
        </form>
        {message && <p className="text-green-600 text-sm mt-4 text-center">{message}</p>}
        {error && <p className="text-red-600 text-sm mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default ReferralProgram;
import React, { useState } from "react";

// Backend functions:
// async function enable2FA() {
//   return fetch('/api/user/2fa/enable', { method: 'POST' });
// }
// async function verify2FACode(code) {
//   return fetch('/api/user/2fa/verify', { method: 'POST', body: JSON.stringify({ code }) });
// }
// async function disable2FA() {
//   return fetch('/api/user/2fa/disable', { method: 'POST' });
// }

const TwoFactorAuth = () => {
  const [enabled, setEnabled] = useState(false);
  const [code, setCode] = useState("");
  const [step, setStep] = useState("status");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleEnable = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      // await enable2FA();
      setStep("setup");
    } catch (err) {
      setError("Failed to start 2FA setup.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      // await verify2FACode(code);
      setEnabled(true);
      setStep("status");
      setMessage("2FA enabled successfully.");
    } catch (err) {
      setError("Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      // await disable2FA();
      setEnabled(false);
      setMessage("2FA disabled successfully.");
    } catch (err) {
      setError("Failed to disable 2FA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-blue-50 flex flex-col items-center justify-center">
      <div className="max-w-lg w-full p-6 bg-white rounded-xl shadow border border-blue-100 mt-8 mx-auto">
        <h2 className="text-xl font-bold mb-4 text-center">Two-Factor Authentication (2FA)</h2>
        {step === "status" && (
          <>
            <p className="mb-4 text-gray-700 text-center">
              2FA is <span className={enabled ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>{enabled ? "Enabled" : "Disabled"}</span> on your account.
            </p>
            {enabled ? (
              <button className="bg-red-600 text-white py-2 rounded hover:bg-red-700 transition w-full" onClick={handleDisable} disabled={loading}>
                {loading ? 'Disabling...' : 'Disable 2FA'}
              </button>
            ) : (
              <button className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition w-full" onClick={handleEnable} disabled={loading}>
                {loading ? 'Enabling...' : 'Enable 2FA'}
              </button>
            )}
            {message && <p className="text-green-600 text-sm mt-2 text-center">{message}</p>}
            {error && <p className="text-red-600 text-sm mt-2 text-center">{error}</p>}
          </>
        )}
        {step === "setup" && (
          <form className="flex flex-col gap-4" onSubmit={handleVerify}>
            <p className="text-gray-700 text-center">Enter the 6-digit code sent to your email or phone.</p>
            <input
              type="text"
              placeholder="Enter 2FA Code"
              className="border p-2 rounded"
              value={code}
              onChange={e => setCode(e.target.value)}
              maxLength={6}
              required
            />
            <button type="submit" className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Enable'}
            </button>
            {error && <p className="text-red-600 text-sm mt-2 text-center">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
};

export default TwoFactorAuth;

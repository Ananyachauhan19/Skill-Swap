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
    <div className="min-h-screen w-full bg-gradient-to-b from-blue-50 to-blue-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-lg border border-blue-200 mt-8 mx-auto transform transition-all duration-500 ease-out animate-fade-in">
        <h2 className="text-2xl font-bold mb-6 text-blue-900 text-center tracking-tight">
          Two-Factor Authentication (2FA)
        </h2>
        {step === "status" && (
          <div className="flex flex-col items-center gap-4">
            <p className="mb-4 text-gray-600 text-center text-sm font-medium animate-slide-up">
              2FA is <span className={enabled ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>{enabled ? "Enabled" : "Disabled"}</span> on your account.
            </p>
            {enabled ? (
              <button
                className="bg-red-600 text-white py-3 px-6 rounded-lg font-medium w-full transition-all duration-300 ease-in-out hover:bg-red-700 hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleDisable}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Disabling...
                  </span>
                ) : (
                  'Disable 2FA'
                )}
              </button>
            ) : (
              <button
                className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium w-full transition-all duration-300 ease-in-out hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleEnable}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enabling...
                  </span>
                ) : (
                  'Enable 2FA'
                )}
              </button>
            )}
            {message && (
              <p className="text-green-600 text-sm mt-3 text-center font-medium animate-slide-up">
                {message}
              </p>
            )}
            {error && (
              <p className="text-red-600 text-sm mt-3 text-center font-medium animate-slide-up">
                {error}
              </p>
            )}
          </div>
        )}
        {step === "setup" && (
          <form className="flex flex-col gap-5 animate-slide-up" onSubmit={handleVerify}>
            <p className="text-gray-600 text-center text-sm font-medium">
              Enter the 6-digit code sent to your email or phone.
            </p>
            <input
              type="text"
              placeholder="Enter 2FA Code"
              className="border border-gray-300 p-3 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-blue-50/50 hover:bg-blue-50 w-full"
              value={code}
              onChange={e => setCode(e.target.value)}
              maxLength={6}
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium w-full transition-all duration-300 ease-in-out hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Verify & Enable'
              )}
            </button>
            {error && (
              <p className="text-red-600 text-sm mt-3 text-center font-medium animate-slide-up">
                {error}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default TwoFactorAuth;
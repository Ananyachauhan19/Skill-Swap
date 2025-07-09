import React, { useState } from "react";

// Backend functions:
// async function sendOtp(phone) {
//   return fetch('/api/user/phone/send-otp', { method: 'POST', body: JSON.stringify({ phone }) });
// }
// async function verifyOtp(phone, otp) {
//   return fetch('/api/user/phone/verify-otp', { method: 'POST', body: JSON.stringify({ phone, otp }) });
// }

const PhoneVerification = () => {
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      // await sendOtp(phone);
      setOtpSent(true);
      setMessage("OTP sent to " + phone);
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      // await verifyOtp(phone, otp);
      setMessage("Phone verified successfully.");
    } catch (err) {
      setError("Failed to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
        <h2 className="text-2xl font-semibold text-blue-900 text-center mb-6">Phone Number Verification</h2>
        <form className="flex flex-col gap-4" onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}>
          <div>
            <label className="block text-sm font-medium text-blue-800 mb-1">Phone Number</label>
            <input
              type="tel"
              placeholder="Enter phone number"
              className="w-full border border-blue-200 rounded-lg px-4 py-2.5 text-sm text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              disabled={otpSent}
              required
            />
          </div>
          {otpSent && (
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-1">Enter OTP</label>
              <input
                type="text"
                placeholder="Enter OTP"
                className="w-full border border-blue-200 rounded-lg px-4 py-2.5 text-sm text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
              />
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold shadow hover:bg-blue-700 transition duration-200 disabled:bg-blue-400"
            disabled={loading}
          >
            {loading ? (otpSent ? "Verifying..." : "Sending...") : (otpSent ? "Verify OTP" : "Send OTP")}
          </button>
        </form>
        {message && <p className="text-green-600 text-sm mt-4 text-center">{message}</p>}
        {error && <p className="text-red-600 text-sm mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default PhoneVerification;
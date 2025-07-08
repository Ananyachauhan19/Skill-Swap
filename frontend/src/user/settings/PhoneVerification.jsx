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
    <div className="min-h-screen w-full bg-blue-50 flex flex-col items-center justify-center">
      <div className="max-w-lg w-full p-6 bg-white rounded-xl shadow border border-blue-100 mt-8 mx-auto">
        <h2 className="text-xl font-bold mb-4 text-center">Phone Number Verification</h2>
        <form className="flex flex-col gap-4" onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}>
          <input
            type="tel"
            placeholder="Enter New Phone Number"
            className="border p-2 rounded"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            disabled={otpSent}
            required
          />
          {otpSent && (
            <input
              type="text"
              placeholder="Enter OTP"
              className="border p-2 rounded"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              required
            />
          )}
          <button type="submit" className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition" disabled={loading}>
            {loading ? (otpSent ? "Verifying..." : "Sending...") : (otpSent ? "Verify OTP" : "Send OTP")}
          </button>
        </form>
        {message && <p className="text-green-600 text-sm mt-2 text-center">{message}</p>}
        {error && <p className="text-red-600 text-sm mt-2 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default PhoneVerification;

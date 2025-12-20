import React, { useState } from "react";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const PhoneVerification = () => {
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { setUser } = useAuth();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await api.post("/api/user/phone/send-otp", { phone });
      setOtpSent(true);
      setMessage("OTP sent to " + phone);
    } catch (err) {
      const msg = err?.response?.data?.message;
      if (err?.response?.status === 409) {
        setError(msg || "This phone number is already registered with another account.");
      } else {
        setError(msg || "Failed to send OTP. Please try again.");
      }
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
      const res = await api.post("/api/user/phone/verify-otp", { phone, otp });
      if (res?.data?.user) {
        setUser(res.data.user);
      }
      setMessage(res?.data?.message || "Phone verified successfully.");
      setOtpSent(false);
    } catch (err) {
      const msg = err?.response?.data?.message;
      setError(msg || "Failed to verify OTP. Please try again.");
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

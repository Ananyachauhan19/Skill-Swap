import React, { useState } from "react";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const EmailSettings = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { setUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await api.patch("/api/user/email", { email });
      if (res?.data?.user) {
        setUser(res.data.user);
      }
      setMessage(res?.data?.message || "Email updated successfully.");
    } catch (err) {
      const msg = err?.response?.data?.message;
      if (err?.response?.status === 409) {
        setError(msg || "This email is already registered with another account.");
      } else {
        setError(msg || "Failed to update email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-blue-50 flex flex-col items-center pt-16 md:pt-[72px] xl:pt-20 px-3 sm:px-4">
      <div className="max-w-lg w-full p-4 sm:p-6 bg-white rounded-lg sm:rounded-xl shadow border border-blue-100 mt-6 sm:mt-8 mx-auto">
        <h2 className="text-lg sm:text-xl font-bold mb-4 text-center">Update Email Address</h2>
        <form className="flex flex-col gap-3 sm:gap-4" onSubmit={handleSubmit}>
          <input type="email" placeholder="New Email Address" className="border p-2 sm:p-2.5 rounded text-sm sm:text-base" value={email} onChange={e => setEmail(e.target.value)} required />
          <button type="submit" className="bg-blue-600 text-white py-2 sm:py-2.5 rounded hover:bg-blue-700 transition text-sm sm:text-base font-medium" disabled={loading}>{loading ? 'Updating...' : 'Update Email'}</button>
        </form>
        {message && <p className="text-green-600 text-xs sm:text-sm mt-2 text-center">{message}</p>}
        {error && <p className="text-red-600 text-xs sm:text-sm mt-2 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default EmailSettings;

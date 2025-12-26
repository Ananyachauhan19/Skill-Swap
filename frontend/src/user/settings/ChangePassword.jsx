import React, { useState } from "react";
import api from "../../lib/api";
import { Eye, EyeOff } from "lucide-react";
const ChangePassword = () => {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const minLengthOk = newPass.length >= 6;
  const hasAtSymbol = newPass.includes("@");
  const passwordsMatch = newPass !== "" && confirm !== "" && newPass === confirm;

  const isFormValid =
    !!current &&
    !!newPass &&
    !!confirm &&
    minLengthOk &&
    hasAtSymbol &&
    passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!minLengthOk || !hasAtSymbol) {
      setError("New password must be at least 6 characters long and include '@'.");
      return;
    }
    if (newPass !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/api/user/password", {
        currentPassword: current,
        newPassword: newPass,
      });
      setMessage(res?.data?.message || "Password updated successfully.");
      setCurrent("");
      setNewPass("");
      setConfirm("");
    } catch (err) {
      const msg = err?.response?.data?.message;
      setError(msg || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-blue-50 flex flex-col items-center pt-16 md:pt-[72px] xl:pt-20 px-3 sm:px-4">
      <div className="max-w-lg w-full p-4 sm:p-6 bg-white rounded-lg sm:rounded-xl shadow border border-blue-100 mt-6 sm:mt-8 mx-auto">
        <h2 className="text-lg sm:text-xl font-bold mb-4 text-center">Change Password</h2>
        <form className="flex flex-col gap-3 sm:gap-4" onSubmit={handleSubmit}>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              placeholder="Current Password"
              className="border p-2 sm:p-2.5 rounded w-full pr-10 text-sm sm:text-base"
              value={current}
              onChange={e => setCurrent(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700 min-w-[36px] justify-center"
              aria-label={showCurrent ? "Hide current password" : "Show current password"}
            >
              {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                placeholder="New Password"
                className="border p-2 sm:p-2.5 rounded w-full pr-10 text-sm sm:text-base"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700 min-w-[36px] justify-center"
                aria-label={showNew ? "Hide new password" : "Show new password"}
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p
              className={`text-xs mt-1 ${newPass === "" ? "text-gray-500" : minLengthOk && hasAtSymbol ? "text-green-600" : "text-red-600"}`}
            >
              New password must be at least 6 characters long and include '@'.
            </p>
          </div>
          <div>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm New Password"
                className="border p-2 rounded w-full pr-10"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirm !== "" && (
              <p
                className={`text-xs mt-1 ${passwordsMatch ? "text-green-600" : "text-red-600"}`}
              >
                {passwordsMatch ? "Passwords match." : "Passwords do not match."}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading || !isFormValid}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
        {message && <p className="text-green-600 text-sm mt-2 text-center">{message}</p>}
        {error && <p className="text-red-600 text-sm mt-2 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default ChangePassword;

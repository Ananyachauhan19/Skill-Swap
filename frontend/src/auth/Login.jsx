import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaGoogle, FaPhone } from 'react-icons/fa';

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    // Simulate login
    localStorage.setItem('isRegistered', 'true');
    setError('');
    navigate('/home');
  };

  const handleGoogleLogin = () => {
    // Simulate Google login
    localStorage.setItem('isRegistered', 'true');
    navigate('/home');
  };

  const handleOtpLogin = () => {
    // Simulate OTP login
    localStorage.setItem('isRegistered', 'true');
    navigate('/home');
  };

  const handleForgotPassword = () => {
    setShowForgot(true);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-center mb-2">Login</h2>
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          autoComplete="email"
        />
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            autoComplete="current-password"
          />
          <span
            className="absolute right-3 top-3 cursor-pointer text-gray-500"
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            className="text-blue-600 text-sm hover:underline"
            onClick={handleForgotPassword}
          >
            Forgot password?
          </button>
        </div>
        {showForgot && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800 mb-2">
            Please contact support or use your registered email to reset your password.
          </div>
        )}
        <button
          type="submit"
          className="bg-blue-600 text-white rounded py-2 font-semibold hover:bg-blue-700 transition"
        >
          Login
        </button>
        <div className="flex flex-col gap-2 mt-2">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-2 border border-gray-300 rounded py-2 font-semibold hover:bg-blue-50 transition"
          >
            <FaGoogle className="text-red-500" /> Login with Google
          </button>
          <button
            type="button"
            onClick={handleOtpLogin}
            className="flex items-center justify-center gap-2 border border-gray-300 rounded py-2 font-semibold hover:bg-blue-50 transition"
          >
            <FaPhone className="text-green-500" /> Login via OTP
          </button>
        </div>
        <div className="text-center text-sm mt-4">
          Don't have an account?{' '}
          <button
            type="button"
            className="text-blue-600 hover:underline font-semibold"
            onClick={() => navigate('/register')}
          >
            Sign up
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;

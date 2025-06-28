import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaGoogle, FaPhone } from 'react-icons/fa';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.email || !form.username || !form.phone || !form.password || !form.confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    // Simulate registration
    localStorage.setItem('isRegistered', 'true');
    setError('');
    navigate('/home');
  };

  const handleGoogleSignup = () => {
    // Simulate Google signup
    localStorage.setItem('isRegistered', 'true');
    navigate('/home');
  };

  const handleOtpSignup = () => {
    // Simulate OTP signup
    localStorage.setItem('isRegistered', 'true');
    navigate('/home');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-center mb-2">Sign Up</h2>
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
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          autoComplete="username"
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          autoComplete="tel"
        />
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            autoComplete="new-password"
          />
          <span
            className="absolute right-3 top-3 cursor-pointer text-gray-500"
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            autoComplete="new-password"
          />
          <span
            className="absolute right-3 top-3 cursor-pointer text-gray-500"
            onClick={() => setShowConfirmPassword((v) => !v)}
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white rounded py-2 font-semibold hover:bg-blue-700 transition"
        >
          Sign Up
        </button>
        <div className="flex flex-col gap-2 mt-2">
          <button
            type="button"
            onClick={handleGoogleSignup}
            className="flex items-center justify-center gap-2 border border-gray-300 rounded py-2 font-semibold hover:bg-blue-50 transition"
          >
            <FaGoogle className="text-red-500" /> Sign up with Google
          </button>
          <button
            type="button"
            onClick={handleOtpSignup}
            className="flex items-center justify-center gap-2 border border-gray-300 rounded py-2 font-semibold hover:bg-blue-50 transition"
          >
            <FaPhone className="text-green-500" /> Sign up via OTP
          </button>
        </div>
        <div className="text-center text-sm mt-4">
          Already have an account?{' '}
          <button
            type="button"
            className="text-blue-600 hover:underline font-semibold"
            onClick={() => navigate('/login')}
          >
            Login
          </button>
        </div>
      </form>
    </div>
  );
};

export default Register;

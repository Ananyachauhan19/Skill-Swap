import React, { useState } from 'react';
import { BACKEND_URL } from '../config.js';
import { toast } from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your registered email.');
      return;
    }
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/password/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setSubmitted(true);
        toast.success('If the account exists, an email has been sent');
      } else {
        toast.error('Failed to send reset email');
      }
    } catch (e) {
      toast.error('Network error');
    }
  };

  return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300 px-4">
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md flex flex-col gap-4">
    <h2 className="text-2xl font-bold text-center mb-2">Forgot Password</h2>
    {submitted ? (
      <div className="text-green-600 text-center text-sm">
      If this email is registered, you will receive password reset instructions shortly.
      </div>
    ) : (
      <>
      {error && <div className="text-red-500 text-sm text-center">{error}</div>}
      <input
        type="email"
        name="email"
        placeholder="Enter your registered email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        autoComplete="email"
      />
      <button type="submit" className="bg-blue-600 text-white rounded py-2 font-semibold hover:bg-blue-700 transition">Send Reset Link</button>
      </>
    )}
    </form>
  </div>
  );
};

export default ForgotPassword;

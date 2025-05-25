import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, setupRecaptcha, signInWithPhone } from './firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import '../App.css';

function Login() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    remember: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [otpMode, setOtpMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);

  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (otpMode) {
      if (!phone) newErrors.phone = 'Phone number is required';
      else if (!/^[6-9]\d{9}$/.test(phone.trim()))
        newErrors.phone = 'Enter a valid 10-digit Indian phone number starting with 6-9';
      if (otpSent && !otp) newErrors.otp = 'OTP is required';
    } else {
      if (!form.email) newErrors.email = 'Email is required';
      else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.email))
        newErrors.email = 'Invalid email format';
      if (!form.password) newErrors.password = 'Password is required';
    }
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Email/Password Login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setToast({ type: '', message: '' });
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setLoading(true);
      try {
        // Check if email is registered in Firestore
        const q = query(collection(db, 'users'), where('email', '==', form.email));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          setToast({
            type: 'error',
            message: 'User not registered. Please register first.',
          });
          setLoading(false);
          return;
        }
        await signInWithEmailAndPassword(auth, form.email, form.password);
        setToast({ type: 'success', message: 'Login successful! Redirecting...' });
        setTimeout(() => {
          setToast({ type: 'info', message: 'Redirecting to your Home...' });
          setTimeout(() => navigate('/Home'), 1200);
        }, 1200);
      } catch (error) {
        setToast({
          type: 'error',
          message:
            error.code === 'auth/user-not-found'
              ? 'User not registered. Please register first.'
              : error.code === 'auth/wrong-password'
              ? 'Incorrect password'
              : error.message,
        });
      }
      setLoading(false);
    }
  };

  // Google Login
  const handleGoogleLogin = async () => {
    setToast({ type: '', message: '' });
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Check if user exists in Firestore (users collection, doc id = uid)
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!userDoc.exists()) {
        // User not registered, sign out and show error
        await signOut(auth);
        setToast({
          type: 'error',
          message: 'User not registered. Please register first.',
        });
        setLoading(false);
        return;
      }
      setToast({ type: 'success', message: 'Google login successful! Redirecting...' });
      setTimeout(() => {
        setToast({ type: 'info', message: 'Redirecting to your Home...' });
        setTimeout(() => navigate('/Home'), 1200);
      }, 1200);
    } catch (error) {
      setToast({ type: 'error', message: error.message });
      setLoading(false);
    }
    setLoading(false);
  };

  // OTP Login
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setToast({ type: '', message: '' });
    const validationErrors = validate();
    setErrors(validationErrors);

    if (!validationErrors.phone) {
      setLoading(true);
      try {
        // Setup reCAPTCHA only once
        let appVerifier = window.recaptchaVerifier;
        if (!appVerifier) {
          appVerifier = setupRecaptcha('recaptcha-container');
          window.recaptchaVerifier = appVerifier;
        }
        const confirmation = await signInWithPhone('+91' + phone, appVerifier);
        setConfirmationResult(confirmation);
        setOtpSent(true);
        setToast({ type: 'success', message: 'OTP sent to your phone!' });
      } catch (error) {
        setToast({ type: 'error', message: error.message });
        // Reset reCAPTCHA if error
        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        }
      }
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setToast({ type: '', message: '' });
    const validationErrors = validate();
    setErrors(validationErrors);

    if (!validationErrors.otp) {
      setLoading(true);
      try {
        await confirmationResult.confirm(otp);
        setToast({ type: 'success', message: 'OTP verified! Redirecting...' });
        setTimeout(() => {
          setToast({ type: 'info', message: 'Redirecting to your Home...' });
          setTimeout(() => navigate('/Home'), 1200);
        }, 1200);
      } catch (error) {
        setToast({ type: 'error', message: 'Invalid OTP' });
      }
      setLoading(false);
    }
  };

  const Toast = ({ type, message }) => {
    if (!message) return null;
    let bg = 'bg-blue-600';
    if (type === 'error') bg = 'bg-red-600';
    if (type === 'success') bg = 'bg-green-600';
    if (type === 'info') bg = 'bg-yellow-500';
    return (
      <div className={`${bg} text-white px-4 py-2 rounded shadow mb-4 text-center transition`}>
        {message}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-blue-200 flex items-center justify-center px-4">
      <div className="flex w-full max-w-4xl shadow-2xl rounded-2xl overflow-hidden bg-white">
        {/* Login Box (Left) */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
          <h2 className="text-3xl font-extrabold text-blue-700 mb-2 text-left">Login</h2>
          <p className="mb-6 text-gray-600 text-left">Welcome back! Please login to your account.</p>
          <Toast type={toast.type} message={toast.message} />
          {!otpMode ? (
            <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
              <div>
                <label className="block font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
              </div>
              <div>
                <label className="block font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 mt-1 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="remember"
                  checked={form.remember}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label className="text-gray-700">Remember Me</label>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-700 text-white py-2 rounded font-semibold hover:bg-blue-800 transition flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <span className="loader mr-2"></span>
                ) : null}
                {loading ? 'Logging in...' : 'Login'}
              </button>
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2 rounded font-semibold hover:bg-gray-100 transition"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg className="w-5 h-5" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.7 33.1 29.8 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.4l6.4-6.4C34.1 5.1 29.3 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.2-4z"/><path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 17.1 19.2 14 24 14c2.7 0 5.2.9 7.2 2.4l6.4-6.4C34.1 5.1 29.3 3 24 3 15.1 3 7.6 8.7 6.3 14.7z"/><path fill="#FBBC05" d="M24 44c5.8 0 10.7-1.9 14.3-5.2l-6.6-5.4C29.7 35.1 27 36 24 36c-5.8 0-10.7-3.9-12.3-9.3l-7 5.4C7.6 39.3 15.1 44 24 44z"/><path fill="#EA4335" d="M44.5 20H24v8.5h11.7C34.7 33.1 29.8 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.4l6.4-6.4C34.1 5.1 29.3 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.2-4z"/></g></svg>
                Login with Google
              </button>
              <button
                type="button"
                className="w-full bg-gray-100 text-gray-800 py-2 rounded font-semibold border hover:bg-gray-200 transition mt-2"
                onClick={() => setOtpMode(true)}
                disabled={loading}
              >
                Login with OTP
              </button>
              <div className="flex justify-between mt-4">
                <button
                  type="button"
                  className="text-blue-700 underline text-sm"
                  onClick={() => navigate('/forgot-password')}
                >
                  Forgot Password?
                </button>
                <button
                  type="button"
                  className="text-blue-700 underline text-sm"
                  onClick={() => navigate('/')}
                >
                  Register
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} autoComplete="off">
              <div>
                <label className="block font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                  disabled={otpSent}
                />
                {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
              </div>
              {otpSent && (
                <div>
                  <label className="block font-medium text-gray-700">Enter OTP</label>
                  <input
                    type="text"
                    name="otp"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                  {errors.otp && <p className="text-red-500 text-sm">{errors.otp}</p>}
                </div>
              )}
              <div id="recaptcha-container"></div>
              <button
                type="submit"
                className="w-full bg-blue-700 text-white py-2 rounded font-semibold hover:bg-blue-800 transition flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <span className="loader mr-2"></span>
                ) : null}
                {otpSent ? 'Verify OTP' : 'Send OTP'}
              </button>
              <button
                type="button"
                className="w-full bg-gray-100 text-gray-800 py-2 rounded font-semibold border hover:bg-gray-200 transition"
                onClick={() => {
                  setOtpMode(false);
                  setOtpSent(false);
                  setPhone('');
                  setOtp('');
                  setErrors({});
                }}
                disabled={loading}
              >
                Back to Email Login
              </button>
            </form>
          )}
        </div>
        {/* Right Side Illustration or Info */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-700 to-blue-400 items-center justify-center">
          <div className="text-white text-center px-8">
            <h3 className="text-2xl font-bold mb-4">Welcome Back to SkillSwap!</h3>
            <p className="mb-6">Connect, learn, and grow with a vibrant community of learners and mentors. Unlock new skills and opportunities today.</p>
            <img
              src="https://img.freepik.com/free-vector/online-world-concept-illustration_114360-1436.jpg?w=400"
              alt="SkillSwap Illustration"
              className="rounded-xl shadow-lg mx-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
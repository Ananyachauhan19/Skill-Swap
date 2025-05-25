import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { db } from './firebase'; // <-- Import Firestore instance
import { doc, setDoc } from 'firebase/firestore'; // <-- Import Firestore functions
import '../App.css';

function Register() {
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ type: '', message: '' });
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!form.phone.trim()) newErrors.phone = 'Phone Number is required';
    else if (!/^[6-9]\d{9}$/.test(form.phone.trim()))
      newErrors.phone = 'Enter a valid 10-digit Indian phone number starting with 6-9';
    if (!form.email) newErrors.email = 'Email is required';
    else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.email))
      newErrors.email = 'Invalid email format';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';
    if (form.confirmPassword !== form.password)
      newErrors.confirmPassword = 'Passwords do not match';
    if (!form.terms) newErrors.terms = 'You must accept the terms';
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToast({ type: '', message: '' });
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        // Save user to Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          fullName: form.fullName,
          phone: form.phone,
          email: form.email,
          createdAt: new Date(),
        });
        setToast({ type: 'success', message: 'Account created successfully' });
        setForm({
          fullName: '',
          phone: '',
          email: '',
          password: '',
          confirmPassword: '',
          terms: false,
        });
        setTimeout(() => {
          setToast({ type: 'info', message: 'Redirecting to your dashboard...' });
          setTimeout(() => setToast({ type: '', message: '' }), 2000);
        }, 1500);
      } catch (error) {
        const msg =
          error.code === 'auth/email-already-in-use'
            ? 'Email already in use'
            : error.message;
        setToast({ type: 'error', message: msg });
      }
    }
  };

  const handleGoogleRegister = async () => {
    setToast({ type: '', message: '' });
    try {
      await signInWithPopup(auth, googleProvider);
      setToast({ type: 'success', message: 'Google registration successful!' });
      setTimeout(() => {
        setToast({ type: 'info', message: 'Redirecting to your dashboard...' });
        setTimeout(() => setToast({ type: '', message: '' }), 2000);
      }, 1500);
    } catch (error) {
      setToast({ type: 'error', message: error.message });
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
      <div className="flex w-full max-w-5xl shadow-2xl rounded-2xl overflow-hidden bg-white">
        {/* Register Box (Left) */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
          <h2 className="text-3xl font-extrabold text-blue-700 mb-2 text-left">Create Account</h2>
          <p className="mb-6 text-gray-600 text-left">Join SkillSwap and start your learning journey!</p>
          <Toast type={toast.type} message={toast.message} />
          <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
            <div>
              <label className="block font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
              {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName}</p>}
            </div>
            <div>
              <label className="block font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
              {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
            </div>
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
            <div>
              <label className="block font-medium text-gray-700">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 mt-1 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600"
                  onClick={() => setShowConfirm((v) => !v)}
                  tabIndex={-1}
                >
                  {showConfirm ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="terms"
                checked={form.terms}
                onChange={handleChange}
                className="mr-2"
                required
              />
              <label className="text-gray-700">
                I accept the{' '}
                <a href="#" className="text-blue-600 underline">
                  Terms & Conditions
                </a>
              </label>
            </div>
            {errors.terms && <p className="text-red-500 text-sm">{errors.terms}</p>}
            <button
              type="submit"
              className="w-full bg-blue-700 text-white py-2 rounded font-semibold hover:bg-blue-800 transition"
            >
              Register
            </button>
            <button
              type="button"
              onClick={handleGoogleRegister}
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2 rounded font-semibold hover:bg-gray-100 transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.7 33.1 29.8 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.4l6.4-6.4C34.1 5.1 29.3 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.2-4z"/><path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 17.1 19.2 14 24 14c2.7 0 5.2.9 7.2 2.4l6.4-6.4C34.1 5.1 29.3 3 24 3 15.1 3 7.6 8.7 6.3 14.7z"/><path fill="#FBBC05" d="M24 44c5.8 0 10.7-1.9 14.3-5.2l-6.6-5.4C29.7 35.1 27 36 24 36c-5.8 0-10.7-3.9-12.3-9.3l-7 5.4C7.6 39.3 15.1 44 24 44z"/><path fill="#EA4335" d="M44.5 20H24v8.5h11.7C34.7 33.1 29.8 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.4l6.4-6.4C34.1 5.1 29.3 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.2-4z"/></g></svg>
              Register with Google
            </button>
          </form>
          <p className="text-center text-sm mt-4">
            Already have an account?{' '}
            <button
              className="text-blue-700 underline font-semibold"
              onClick={() => navigate('/login')}
              type="button"
            >
              Login here
            </button>
          </p>
        </div>
        {/* Right Side Illustration or Info */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-700 to-blue-400 items-center justify-center">
          <div className="text-white text-center px-8">
            <h3 className="text-2xl font-bold mb-4">Welcome to SkillSwap!</h3>
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

export default Register;
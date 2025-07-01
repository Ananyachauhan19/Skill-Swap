import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaGoogle, FaLinkedinIn, FaEye, FaEyeSlash, FaExclamationCircle } from 'react-icons/fa';
import axios from 'axios';

const LoginPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const leftPanelRef = useRef(null);

  const carouselImages = [
    '/assets/carousel/live-session.png',
    '/assets/carousel/group-discussion.png',
    '/assets/carousel/job-interview.png'
  ];

  const extendedImages = [...carouselImages, ...carouselImages];

  useEffect(() => {
    const totalOriginalSlides = carouselImages.length;

    const interval = setInterval(() => {
      setCurrentImageIndex(prev => {
        if (prev >= totalOriginalSlides - 1) {
          return 0;
        }
        return prev + 1;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [carouselImages.length]);

  useEffect(() => {
    if (currentImageIndex >= carouselImages.length) {
      const timeout = setTimeout(() => {
        setCurrentImageIndex(0);
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [currentImageIndex, carouselImages.length]);

  useEffect(() => {
    let lastMoveTime = 0;
    const moveThreshold = 500;

    const handleMouseMove = () => {
      const now = Date.now();
      if (now - lastMoveTime > moveThreshold) {
        setCurrentImageIndex(prev => {
          if (prev >= carouselImages.length - 1) {
            return 0;
          }
          return prev + 1;
        });
        lastMoveTime = now;
      }
    };

    const leftPanel = leftPanelRef.current;
    if (leftPanel) {
      leftPanel.addEventListener('mousemove', handleMouseMove);
      return () => leftPanel.removeEventListener('mousemove', handleMouseMove);
    }
  }, [carouselImages.length]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', form);

      if (res.data.otpSent) {
        setOtpStep(true);
        setError('');
      } else if (res.data.token && res.data.user) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/home');
      } else {
        setError('Unexpected response from server.');
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Login failed. Try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();

    if (!otp) {
      setError('Please enter the OTP');
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/verify-otp', {
        email: form.email,
        otp,
      });

      const { token, user } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      navigate('/home');
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('OTP verification failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  

  const handleLinkedInLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/home');
    }, 1500);
  };

  const loginButtonColor = form.email && (otpStep ? otp : form.password)
    ? 'bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950'
    : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700';

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'visible';
    };
  }, []);

  return (
    <div
      className="min-h-screen flex items-start justify-center pt-16 pb-10 px-4"
      style={{
        backgroundImage: "url('/assets/background-login.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <style>
        {`
          body {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          body::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>

      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        <div
          ref={leftPanelRef}
          className="w-full md:w-1/2 relative min-h-[350px] md:min-h-[550px] overflow-hidden"
          style={{
            backgroundImage: "url('/assets/leftpanel-background.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          }}
        >
          <div className="absolute top-6 left-6 z-30">
            <img
              src="/assets/skillswap-logo.jpg"
              alt="SkillSwap Logo"
              className="h-10 w-auto"
            />
          </div>

          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="relative w-[80%] h-[60%] overflow-hidden">
              <div
                className="flex transition-transform ease-in-out"
                style={{
                  transform: `translateX(-${100 * currentImageIndex}%)`,
                  transitionDuration: currentImageIndex >= carouselImages.length ? '0ms' : '1500ms',
                }}
              >
                {extendedImages.map((src, idx) => (
                  <div key={idx} className="min-w-full h-full">
                    <img
                      src={src}
                      alt={`Feature ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-2 z-30">
            {carouselImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 z-10" />
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-10">
          <h1 className="text-3xl font-bold text-[#154360] mb-8">Login</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center">
              <FaExclamationCircle className="mr-2" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4 mb-6">
            <button
  onClick={() => window.location.href = 'http://localhost:5000/api/auth/google'}
  className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
>
  <FaGoogle className="text-[#DB4437] mr-3" />
  <span className="font-medium">Login with Google</span>
</button>

            <button
              onClick={handleLinkedInLogin}
              className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FaLinkedinIn className="text-[#0077B5] mr-3" />
              <span className="font-medium">Login with LinkedIn</span>
            </button>
          </div>

          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="mx-4 text-gray-500">or</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <form onSubmit={otpStep ? handleOtpSubmit : handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent outline-none transition-all"
                autoComplete="email"
              />
            </div>

            {!otpStep && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent outline-none transition-all"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
            )}

            {otpStep && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">OTP</label>
                <input
                  type="text"
                  name="otp"
                  placeholder="Enter the OTP sent to your email"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent outline-none transition-all"
                />
              </div>
            )}

            {!otpStep && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm flex items-center text-[#154360] hover:underline"
                >
                  <FaExclamationCircle className="mr-1" />
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !form.email || (otpStep ? !otp : !form.password)}
              className={`w-full py-3.5 ${loginButtonColor} rounded-lg font-semibold text-white shadow-md transition-all flex items-center justify-center ${
                isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:opacity-90'
              }`}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                otpStep ? 'Verify OTP' : 'Login'
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-gray-600">I don't have an account? </span>
            <button
              type="button"
              className="font-medium text-[#154360] hover:underline"
              onClick={() => navigate('/register')}
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

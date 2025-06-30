import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaGoogle, FaLinkedinIn, FaEye, FaEyeSlash, FaExclamationCircle } from 'react-icons/fa';

const LoginPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const leftPanelRef = useRef(null);

  // Carousel images
  const carouselImages = [
    '/assets/carousel/live-session.png',
    '/assets/carousel/group-discussion.png',
    '/assets/carousel/job-interview.png'
  ];

  // Duplicate images to create seamless loop (original + original)
  const extendedImages = [...carouselImages, ...carouselImages];

  // Auto-rotate carousel every 5 seconds (right to left)
  useEffect(() => {
    const totalOriginalSlides = carouselImages.length;
    const totalSlides = extendedImages.length;

    const interval = setInterval(() => {
      setCurrentImageIndex(prev => {
        if (prev >= totalOriginalSlides - 1) {
          return 0; // Reset to start of first set
        }
        return prev + 1;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [carouselImages.length]);

  // Reset transform instantly when reaching the duplicate set
  useEffect(() => {
    if (currentImageIndex >= carouselImages.length) {
      const timeout = setTimeout(() => {
        setCurrentImageIndex(0);
      }, 1500); // Match transition duration
      return () => clearTimeout(timeout);
    }
  }, [currentImageIndex, carouselImages.length]);

  // Handle cursor movement for carousel navigation
  useEffect(() => {
    let lastMoveTime = 0;
    const moveThreshold = 500; // 0.5 seconds

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

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/home');
    }, 1500);
  };

  // Social login handlers
  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/home');
    }, 1500);
  };

  const handleLinkedInLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/home');
    }, 1500);
  };

  // Determine login button color based on form input
  const loginButtonColor = form.email && form.password 
    ? 'bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950'
    : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700';

  // Hide scrollbar for entire page
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
      {/* Hide scrollbar globally */}
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

      {/* Main Container */}
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Panel - Fixed Background with Floating Carousel */}
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
          {/* Logo */}
          <div className="absolute top-6 left-6 z-30">
            <img 
              src="/assets/skillswap-logo.jpg" 
              alt="SkillSwap Logo" 
              className="h-10 w-auto"
            />
          </div>

          {/* Floating Carousel Container */}
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
                  <div
                    key={idx}
                    className="min-w-full h-full"
                  >
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

          {/* Carousel Indicators */}
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

          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 z-10" />
        </div>

        {/* Right Panel - Login Form */}
        <div className="w-full md:w-1/2 p-8 md:p-10">
          {/* Login Heading */}
          <h1 className="text-3xl font-bold text-[#154360] mb-8">Login</h1>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center">
              <FaExclamationCircle className="mr-2" />
              <span>{error}</span>
            </div>
          )}

          {/* Social Login Buttons */}
          <div className="space-y-4 mb-6">
            <button
              onClick={handleGoogleLogin}
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

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="mx-4 text-gray-500">or</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
<<<<<<< HEAD
            
=======
>>>>>>> 5ed46ca1b81bde4f03354056828a512d639fc5b5
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
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

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
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
                {/* Password Toggle */}
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm flex items-center text-[#154360] hover:underline"
              >
                <FaExclamationCircle className="mr-1" />
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading || !(form.email && form.password)}
              className={`w-full py-3.5 ${loginButtonColor} rounded-lg font-semibold text-white shadow-md transition-all flex items-center justify-center ${
                isLoading || !(form.email && form.password) ? 'opacity-75 cursor-not-allowed' : 'hover:opacity-90'
              }`}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Sign Up Link */}
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
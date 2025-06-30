import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaGoogle, FaLinkedinIn, FaExclamationCircle, FaMale, FaFemale } from 'react-icons/fa';
import { MdOutlineMoreHoriz } from 'react-icons/md';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { firstName, email, phone, gender, password, confirmPassword } = form;
    if (!firstName || !email || !phone || !gender || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      localStorage.setItem('isRegistered', 'true');
      setError('');
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

        {/* Right Panel - Registration Form */}
        <div className="w-full md:w-1/2 p-8 md:p-10">
          <h1 className="text-3xl font-bold text-[#154360] mb-8">Create an Account</h1>
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
              <span className="font-medium">Sign up with Google</span>
            </button>
            <button
              onClick={handleLinkedInLogin}
              className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FaLinkedinIn className="text-[#0077B5] mr-3" />
              <span className="font-medium">Sign up with LinkedIn</span>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="mx-4 text-gray-500">or</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <input type="text" name="firstName" placeholder="First Name*" value={form.firstName} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none" />
              <input type="text" name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none" />
            </div>
            <input type="email" name="email" placeholder="Email*" value={form.email} onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none" />
            <input type="tel" name="phone" placeholder="Phone*" value={form.phone} onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none" />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender*</label>
              <div className="flex gap-4">
                <button type="button" className={`border px-4 py-2 rounded-full flex items-center gap-2 ${form.gender === 'male' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`} onClick={() => setForm({ ...form, gender: 'male' })}>
                  <FaMale /> Male
                </button>
                <button type="button" className={`border px-4 py-2 rounded-full flex items-center gap-2 ${form.gender === 'female' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`} onClick={() => setForm({ ...form, gender: 'female' })}>
                  <FaFemale /> Female
                </button>
                <button type="button" className={`border px-4 py-2 rounded-full flex items-center gap-2 ${form.gender === 'other' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`} onClick={() => setForm({ ...form, gender: 'other' })}>
                  <MdOutlineMoreHoriz /> More Options
                </button>
              </div>
            </div>

            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Password*" value={form.password} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none" />
              <span onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500">{showPassword ? <FaEyeSlash /> : <FaEye />}</span>
            </div>

            <div className="relative">
              <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" placeholder="Confirm Password*" value={form.confirmPassword} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none" />
              <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500">{showConfirmPassword ? <FaEyeSlash /> : <FaEye />}</span>
            </div>

            <div className="text-xs text-gray-500">
              <input type="checkbox" className="mr-2" />
              All your information is collected, stored and processed as per our data processing guidelines. By signing up, you agree to our <a href="#" className="text-blue-600">Privacy Policy</a> and <a href="#" className="text-blue-600">Terms of Use</a>.
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full py-3.5 bg-gradient-to-r from-blue-800 to-blue-900 rounded-lg font-semibold text-white shadow-md transition-all flex items-center justify-center ${
                isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:opacity-90'
              }`}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Next'
              )}
            </button>

            <div className="text-center text-sm mt-4">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="text-blue-600 hover:underline font-semibold">
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
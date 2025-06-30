import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaGoogle, FaLinkedinIn, FaEye, FaEyeSlash, FaExclamationCircle } from 'react-icons/fa';

const LoginPage = () => {
  const navigate = useNavigate();
  // State management
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const leftPanelRef = useRef(null);
  
  // Carousel images with descriptions - using local assets
  const carouselImages = [
    { 
      src: '/assets/carousel/live-session.png',
      title: 'Live session'
    },
    { 
      src: '/assets/carousel/group-discussion.png',
      title: 'Group discussion'
    },
    { 
      src: '/assets/carousel/job-interview.png',
      title: 'Interview session'
    }
  ];
  
  // Auto-rotate carousel every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % carouselImages.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  // Handle wheel scroll for carousel navigation
  useEffect(() => {
    const handleWheel = (e) => {
      if (!leftPanelRef.current?.contains(e.target)) return;
      
      e.preventDefault();
      setCurrentImageIndex(prev => {
        if (e.deltaY > 0) return (prev + 1) % carouselImages.length;
        return (prev - 1 + carouselImages.length) % carouselImages.length;
      });
    };

    const leftPanel = leftPanelRef.current;
    if (leftPanel) {
      leftPanel.addEventListener('wheel', handleWheel);
      return () => leftPanel.removeEventListener('wheel', handleWheel);
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
    
    // Simulate API call
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

  return (
    <div 
      className="min-h-screen flex items-start justify-center pt-16 pb-10 px-4"
      style={{
        backgroundImage: "url('/assets/background-login.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Main Container */}
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Panel - Image Carousel */}
        <div 
          ref={leftPanelRef}
          className="w-full md:w-1/2 relative min-h-[350px] md:min-h-[550px] bg-gray-900"
        >
          {/* Logo */}
          <div className="absolute top-6 left-6 z-20">
            <img 
              src="/assets/skillswap-logo.jpg" 
              alt="SkillSwap Logo" 
              className="h-10 w-auto"
            />
          </div>
          
          {/* Carousel Images */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            {carouselImages.map((image, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  currentImageIndex === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                <img 
                  src={image.src} 
                  alt={image.title}
                  className="w-full h-full object-cover"
                />
                {/* Image Title Overlay */}
                <div className="absolute bottom-6 left-0 right-0 text-center z-20">
                  <h3 className="text-white text-xl font-bold bg-black bg-opacity-50 px-4 py-2 rounded-lg inline-block">
                    {image.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
          
          {/* Dark overlay for better text contrast */}
          <div className="absolute inset-0 bg-black bg-opacity-30 z-10" />
          
          {/* Carousel Indicators */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20">
            {carouselImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full mx-1 ${
                  currentImageIndex === idx ? 'bg-white' : 'bg-gray-400'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
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
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 rounded-lg font-semibold text-gray-800 shadow-md transition-all flex items-center justify-center"
            >
              {isLoading ? (
                // Loading spinner
                <svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
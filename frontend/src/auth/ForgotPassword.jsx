import React, { useEffect, useRef, useState } from 'react';
import { BACKEND_URL } from '../config.js';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Match Login page left-panel carousel
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const leftPanelRef = useRef(null);
  const lastMouseMoveRef = useRef(0);
  const isTransitioningRef = useRef(false);

  const carouselImages = [
    'https://res.cloudinary.com/dbltazdsa/image/upload/v1766589371/webimages/interview-illustration.png',
    'https://res.cloudinary.com/dbltazdsa/image/upload/v1766589368/webimages/expert-connect-illustration.png',
    'https://res.cloudinary.com/dbltazdsa/image/upload/v1766589376/webimages/skillswap-hero.png',
  ];
  const extendedImages = [...carouselImages, carouselImages[0]];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => {
        const nextIndex = prev + 1;
        if (nextIndex >= carouselImages.length + 1) {
          const el = leftPanelRef.current?.querySelector('.carousel-container');
          if (el) {
            el.style.transition = 'none';
            setTimeout(() => {
              el.style.transition = 'transform 1500ms ease-in-out';
            }, 0);
          }
          return 0;
        }
        return nextIndex;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  useEffect(() => {
    const handleMouseMove = () => {
      const now = Date.now();
      if (now - lastMouseMoveRef.current > 1000 && !isTransitioningRef.current) {
        isTransitioningRef.current = true;
        setCurrentImageIndex((prev) => {
          const nextIndex = prev + 1;
          if (nextIndex >= carouselImages.length + 1) {
            const el = leftPanelRef.current?.querySelector('.carousel-container');
            if (el) {
              el.style.transition = 'none';
              setTimeout(() => {
                el.style.transition = 'transform 1500ms ease-in-out';
              }, 0);
            }
            return 0;
          }
          return nextIndex;
        });
        lastMouseMoveRef.current = now;
        setTimeout(() => {
          isTransitioningRef.current = false;
        }, 1500);
      }
    };

    const panel = leftPanelRef.current;
    if (panel) {
      panel.addEventListener('mousemove', handleMouseMove);
      return () => panel.removeEventListener('mousemove', handleMouseMove);
    }
  }, [carouselImages.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your registered email.');
      return;
    }
    setError('');
    try {
      setIsLoading(true);
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
    } catch {
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center pt-8 pb-10 px-2 sm:px-4">
      <div className="bg-white rounded-xl p-2 sm:p-4 shadow-2xl w-[90vw] sm:w-[80vw] md:w-[70vw] h-[85vh] sm:h-[75vh] max-w-[1200px]">
        <div className="flex flex-col md:flex-row w-full h-full">
          {/* Left Panel (same as Login) */}
          <div
            ref={leftPanelRef}
            className="w-full md:w-1/2 relative overflow-hidden min-h-[240px] sm:min-h-[300px] md:min-h-0"
            style={{
              backgroundColor: '#e6f2fb',
              borderTopLeftRadius: '40px',
              borderBottomRightRadius: '40px',
            }}
          >
            <div className="absolute top-4 left-4 z-30">
              <img
                src="https://res.cloudinary.com/dbltazdsa/image/upload/v1766589377/webimages/skillswap-logo.png"
                alt="SkillSwap Logo"
                className="h-6 sm:h-7 md:h-8 w-auto"
              />
            </div>

            <div className="absolute inset-0 flex items-center justify-center z-20 p-8">
              <div className="relative w-full h-full max-w-[400px] max-h-[400px] overflow-hidden rounded-2xl">
                <div
                  className="flex carousel-container h-full"
                  style={{
                    transform: `translateX(-${100 * currentImageIndex}%)`,
                    transition: 'transform 1500ms ease-in-out',
                  }}
                >
                  {extendedImages.map((src, idx) => (
                    <div
                      key={idx}
                      className="min-w-full w-full h-full flex-shrink-0 flex items-center justify-center p-4"
                    >
                      <img src={src} alt={`Feature ${idx + 1}`} className="w-full h-full object-contain" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 z-10" />
          </div>

          {/* Right Panel */}
          <div className="w-full md:w-1/2 p-4 sm:p-6 md:p-8 bg-gray-50 relative overflow-y-auto">
            <h1 className="text-xl sm:text-2xl font-bold text-[#154360] mb-4 sm:mb-6 text-center">
              Forgot Password
            </h1>

            <p className="text-xs sm:text-sm text-gray-600 text-center mb-4 sm:mb-6">
              Enter your registered email and we’ll send you a password reset link.
            </p>

            {submitted ? (
              <div className="space-y-4">
                <div className="p-3 bg-green-50 text-green-700 rounded-lg text-xs sm:text-sm">
                  If this email is registered, you will receive password reset instructions shortly.
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg font-semibold text-white text-sm sm:text-base hover:opacity-90 transition-all"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="mb-1 p-2 bg-red-50 text-red-700 rounded-lg text-xs sm:text-sm text-center">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 text-sm sm:text-base"
                    autoComplete="email"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className={`w-full py-2 sm:py-3 rounded-lg font-semibold text-white flex justify-center items-center text-sm sm:text-base ${
                    email
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700'
                      : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
                  } ${isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:opacity-90'}`}
                >
                  {isLoading ? (
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>

                <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm">
                  <span className="text-gray-600">Remembered your password? </span>
                  <button onClick={() => navigate('/login')} type="button" className="font-medium text-[#154360] hover:underline">
                    Back to Login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

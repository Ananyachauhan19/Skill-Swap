import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../config.js';
import { toast } from 'react-hot-toast';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState('checking'); // checking | valid | invalid
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    let isActive = true;

    const verifyToken = async () => {
      if (!token) {
        if (!isActive) return;
        setStatus('invalid');
        setStatusMessage('Missing reset token. Please request a new password reset link.');
        return;
      }

      try {
        const res = await fetch(
          `${BACKEND_URL}/api/auth/password/verify?token=${encodeURIComponent(token || '')}`
        );
        const data = await res.json().catch(() => ({}));
        if (!isActive) return;
        if (data?.valid) {
          setStatus('valid');
          setStatusMessage('');
        } else {
          setStatus('invalid');
          setStatusMessage(data?.message || 'Invalid or expired link.');
          toast.error(data?.message || 'Invalid or expired link');
        }
      } catch (e) {
        if (!isActive) return;
        setStatus('invalid');
        setStatusMessage('Unable to verify the reset link. Please try again later.');
        toast.error('Unable to verify the reset link');
      }
    };

    setStatus('checking');
    setStatusMessage('');
    verifyToken();

    return () => {
      isActive = false;
    };
  }, [token]);

  const isFormValid = password.length >= 6 && password === confirmPassword;
  const resetButtonColor = isFormValid
    ? 'bg-gradient-to-r from-blue-600 to-blue-700'
    : 'bg-gradient-to-r from-gray-500 to-gray-600';

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!token) {
      toast.error('Missing reset token');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => ({}));
      
      if (res.ok) {
        toast.success(data?.message || 'Password reset successful');
        navigate('/login');
        return;
      }

      const errorMessage = data?.message || 'Failed to reset password';
      toast.error(errorMessage);
    } catch (e) {
      const errorMessage = 'Network error. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
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
              Set New Password
            </h1>

            {status === 'checking' && (
              <div className="space-y-4">
                <p className="text-xs sm:text-sm text-gray-600 text-center">
                  Checking your reset link…
                </p>
                <div className="flex justify-center">
                  <svg className="animate-spin h-5 w-5 text-blue-700" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              </div>
            )}

            {status === 'invalid' && (
              <div className="space-y-4">
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs sm:text-sm">
                  {statusMessage || 'Invalid or expired link.'}
                </div>

                <button
                  onClick={() => navigate('/forgot-password')}
                  className="w-full py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:opacity-90 transition-all text-sm sm:text-base"
                >
                  Request a New Link
                </button>

                <div className="text-center text-xs sm:text-sm">
                  <span className="text-gray-600">Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="font-medium text-[#154360] hover:underline"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            )}

            {status === 'valid' && (
              <>
                <p className="text-xs sm:text-sm text-gray-600 text-center mb-4 sm:mb-6">
                  Create a new password for your account.
                </p>

                <form onSubmit={onSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter a new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 text-sm sm:text-base"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    <p className="mt-1 text-[11px] sm:text-xs text-gray-500">Minimum 6 characters.</p>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 text-sm sm:text-base"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !isFormValid}
                    className={`w-full py-2 sm:py-3 ${resetButtonColor} rounded-lg font-semibold text-white flex justify-center items-center text-sm sm:text-base ${
                      isSubmitting ? 'opacity-75 cursor-not-allowed' : 'hover:opacity-90'
                    }`}
                  >
                    {isSubmitting ? (
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </form>

                <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm">
                  <span className="text-gray-600">Changed your mind? </span>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="font-medium text-[#154360] hover:underline"
                  >
                    Back to Login
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

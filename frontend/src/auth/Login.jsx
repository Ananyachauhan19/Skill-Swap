import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaExclamationCircle, FaTimes } from "react-icons/fa";
import axios from "axios";
import { useModal } from '../context/ModalContext';
import Cookies from 'js-cookie';
import { BACKEND_URL } from '../config.js';

const LoginPage = ({ onClose, onLoginSuccess, isModal = false }) => {
  const navigate = useNavigate();
  const { openRegister } = useModal();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const leftPanelRef = useRef(null);

  // ✅ New OTP States
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [emailForOtp, setEmailForOtp] = useState("");

  const carouselImages = [
    "/assets/interview-illustration.webp",
    "/assets/expert-connect-illustration.webp",
    "/assets/group-discussion-illustration.webp",
    "/assets/skillchoose.webp",
  ];
  const extendedImages = [...carouselImages, ...carouselImages];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev >= carouselImages.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentImageIndex >= carouselImages.length) {
      const timeout = setTimeout(() => setCurrentImageIndex(0), 1500);
      return () => clearTimeout(timeout);
    }
  }, [currentImageIndex]);

  useEffect(() => {
    let lastMoveTime = 0;
    const handleMouseMove = () => {
      const now = Date.now();
      if (now - lastMoveTime > 500) {
        setCurrentImageIndex((prev) => (prev >= carouselImages.length - 1 ? 0 : prev + 1));
        lastMoveTime = now;
      }
    };
    const panel = leftPanelRef.current;
    if (panel) {
      panel.addEventListener("mousemove", handleMouseMove);
      return () => panel.removeEventListener("mousemove", handleMouseMove);
    }
  }, []);

  useEffect(() => {
    if (isModal) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModal]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = form;
    if (!email || !password) return setError("Please fill in all fields.");

    try {
      setIsLoading(true);
      setError("");

      const res = await axios.post(`${BACKEND_URL}/api/auth/login`, { email, password }, { withCredentials: true });
      // No token in response, OTP sent
      setEmailForOtp(email);
      setShowOtp(true);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
  if (!otp) return setError("Enter the OTP sent to your email.");

  try {
    const res = await axios.post(`${BACKEND_URL}/api/auth/verify-otp`, {
      email: emailForOtp,
      otp,
    }, { withCredentials: true });

    const { user } = res.data;
    Cookies.set('user', JSON.stringify(user), { expires: 1 });
    localStorage.setItem('user', JSON.stringify(user));
    Cookies.set('registeredEmail', emailForOtp, { expires: 1 }); 
    Cookies.set('isRegistered', 'true', { expires: 1 }); 
    window.dispatchEvent(new Event("authChanged"));
    if (onLoginSuccess) onLoginSuccess(user);
    if (isModal && onClose) onClose();
    else navigate("/home");
  } catch (err) {
    setError(err.response?.data?.message || "OTP verification failed.");
  }
};

  const handleOAuth = (provider) => {
    window.location.href = `${BACKEND_URL}/api/auth/${provider}`;
  };

  const isFormValid = form.email && form.password;
  const loginButtonColor = isFormValid
    ? "bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950"
    : "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700";

  return (
    <div className={`${isModal ? "fixed inset-0 flex items-center justify-center bg-black/40 z-50" : "min-h-screen flex items-start justify-center pt-16 pb-10 px-4"}`}>
      <div className="bg-white rounded-xl p-4 shadow-2xl">
        <div className="flex flex-col md:flex-row w-[70vw] h-[75vh]">
          {/* Left Panel */}
          <div ref={leftPanelRef} className="w-full md:w-1/2 relative overflow-hidden" style={{
            backgroundColor: "#e6f2fb",
            borderTopLeftRadius: "40px",
            borderBottomRightRadius: "40px",
          }}>
            <div className="absolute top-4 left-4 z-30">
              <img src="/assets/skillswap-logo.webp" alt="SkillSwap Logo" className="h-8 w-auto" />
            </div>

            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="relative w-[70%] h-[50%] overflow-hidden">
                <div className="flex transition-transform ease-in-out"
                  style={{
                    transform: `translateX(-${100 * currentImageIndex}%)`,
                    transitionDuration: currentImageIndex >= carouselImages.length ? "0ms" : "1500ms",
                  }}>
                  {extendedImages.map((src, idx) => (
                    <div key={idx} className="min-w-full h-full">
                      <img src={src} alt={`Feature ${idx + 1}`} className="w-full h-full object-contain" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 z-30">
              {carouselImages.map((_, idx) => (
                <button key={idx} onClick={() => setCurrentImageIndex(idx)}
                  className={`w-2 h-2 rounded-full ${idx === currentImageIndex ? "bg-blue-600 scale-125" : "bg-blue-300"}`} />
              ))}
            </div>

            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 z-10" />
          </div>

          {/* Right Panel */}
          <div className="w-full md:w-1/2 p-6 md:p-8 bg-gray-50 relative">
            {isModal && (
              <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                <FaTimes className="w-5 h-5" />
              </button>
            )}

            {/* OAuth */}
            <div className="space-y-3 mb-6">
              <button onClick={() => handleOAuth("google")} className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100">
                <svg className="w-5 h-5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="..." />
                  <path fill="#34A853" d="..." />
                  <path fill="#4A90E2" d="..." />
                  <path fill="#FBBC05" d="..." />
                </svg>
                <span>Login with Google</span>
              </button>

              <button onClick={() => handleOAuth("linkedin")} className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100">
                <svg className="w-5 h-5" viewBox="0 0 448 512" fill="#0077B5">
                  <path d="..." />
                </svg>
                <span>Login with LinkedIn</span>
              </button>
            </div>

            <h1 className="text-2xl font-bold text-[#154360] mb-6 text-center">Login to Your Account</h1>

            {error && (
              <div className="mb-4 p-2 bg-red-50 text-red-700 rounded-lg text-sm flex items-center">
                <FaExclamationCircle className="mr-2" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} name="password" value={form.password}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300" />
                  <button type="button" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading || !isFormValid}
                className={`w-full py-3 ${loginButtonColor} rounded-lg font-semibold text-white flex justify-center items-center ${isLoading ? "opacity-75 cursor-not-allowed" : "hover:opacity-90"}`}>
                {isLoading ? (
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : "Login"}
              </button>
            </form>

            {/* ✅ OTP Input and Submit */}
            {showOtp && (
              <div className="mt-6 space-y-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-300"
                />
                <button
                  onClick={handleVerifyOtp}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:opacity-90 transition-all"
                >
                  Verify OTP
                </button>
              </div>
            )}

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <button onClick={() => {
                if (isModal && onClose) onClose();
                openRegister();
              }} className="font-medium text-[#154360] hover:underline">Sign Up</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

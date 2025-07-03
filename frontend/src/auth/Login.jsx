import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaExclamationCircle, FaTimes } from "react-icons/fa";
import axios from "axios";
import { useModal } from '../context/ModalContext';

const LoginPage = ({ onClose, onLoginSuccess, isModal = false }) => {
  const navigate = useNavigate();
  const { openRegister } = useModal();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const leftPanelRef = useRef(null);

  const carouselImages = [
    "/assets/carousel/live-session.png",
    "/assets/carousel/group-discussion.png",
    "/assets/carousel/job-interview.png",
  ];
  const extendedImages = [...carouselImages, ...carouselImages];

  useEffect(() => {
    const totalSlides = carouselImages.length;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev >= totalSlides - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentImageIndex >= carouselImages.length) {
      const timeout = setTimeout(() => {
        setCurrentImageIndex(0);
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [currentImageIndex]);

  useEffect(() => {
    let lastMoveTime = 0;
    const moveThreshold = 500;
    const handleMouseMove = () => {
      const now = Date.now();
      if (now - lastMoveTime > moveThreshold) {
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
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isModal]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = form;
    if (!email || !password) {
      return setError("Please fill in all fields.");
    }
    try {
      setIsLoading(true);
      setError("");
      const res = await axios.post("http://localhost:5000/api/auth/login", { email, password });
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      window.dispatchEvent(new Event("authChanged"));
      if (onLoginSuccess) onLoginSuccess(user);
      if (isModal && onClose) {
        onClose();
      } else {
        navigate("/home");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = (provider) => {
    window.location.href = `http://localhost:5000/api/auth/${provider}`;
  };

  const isFormValid = form.email && form.password;
  const loginButtonColor = isFormValid
    ? "bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950"
    : "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700";

  return (
    <div
      className={`${
        isModal ? "fixed inset-0 flex items-center justify-center bg-black/40 z-50" : "min-h-screen flex items-start justify-center pt-16 pb-10 px-4"
      }`}
    >
      <div className="bg-white rounded-xl p-4 shadow-2xl">
        <div className="flex flex-col md:flex-row w-[70vw] h-[75vh]">
          {/* Left Panel */}
          <div
            ref={leftPanelRef}
            className="w-full md:w-1/2 relative min-h-[300px] md:min-h-[50vh] overflow-hidden"
            style={{
              backgroundImage: "url('/assets/leftpanel-background.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundAttachment: "fixed",
            }}
          >
            <div className="absolute top-4 left-4 z-30">
              <img src="/assets/skillswap-logo.jpg" alt="SkillSwap Logo" className="h-8 w-auto" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="relative w-[70%] h-[50%] overflow-hidden">
                <div
                  className="flex transition-transform ease-in-out"
                  style={{
                    transform: `translateX(-${100 * currentImageIndex}%)`,
                    transitionDuration: currentImageIndex >= carouselImages.length ? "0ms" : "1500ms",
                  }}
                >
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
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentImageIndex ? "bg-white scale-125" : "bg-white/50"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 z-10" />
          </div>

     {/* Right Panel */}
<div className="w-full md:w-1/2 p-6 md:p-8 bg-gray-50 relative">
  {isModal && (
    <button
      onClick={onClose}
      className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
      aria-label="Close"
    >
      <FaTimes className="w-5 h-5" />
    </button>
  )}

  {/* OAuth Buttons */}
  <div className="space-y-3 mb-6">
    <button
      onClick={() => handleOAuth("google")}
      className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-all"
    >
      <svg className="w-5 h-5" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.5 0 6.4 1.4 8.3 3.5l6.2-6.2C34.3 3 29.6 0.5 24 0.5 14.8 0.5 6.8 6.6 3.2 14.6l7.3 5.7C12.8 13.2 17.9 9.5 24 9.5z" />
        <path fill="#34A853" d="M46.1 24.5c0-1.6-.1-2.8-.4-4H24v7.5h12.5c-.5 2.6-2 4.7-4.2 6.1l6.6 5.1c3.9-3.6 6.2-8.9 6.2-14.7z" />
        <path fill="#4A90E2" d="M10.5 28.3c-1.3-2-2.1-4.3-2.1-6.8s.8-4.8 2.1-6.8l-7.3-5.7C1.2 13.1 0 18.4 0 23.5s1.2 10.4 3.2 14.5l7.3-5.7z" />
        <path fill="#FBBC05" d="M24 47.5c6.4 0 11.8-2.1 15.7-5.7l-7.3-5.7c-2.1 1.4-4.8 2.2-8.4 2.2-6.1 0-11.2-3.7-13.3-8.8l-7.3 5.7C6.8 41.4 14.8 47.5 24 47.5z" />
      </svg>
      <span>Login with Google</span>
    </button>

    <button
      onClick={() => handleOAuth("linkedin")}
      className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-all"
    >
      <svg className="w-5 h-5" viewBox="0 0 448 512" fill="#0077B5">
        <path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.34 0 53.77 0 24.09 24.09 0 53.79 0c29.48 0 53.58 24.09 53.58 53.77 0 29.57-24.1 54.33-53.58 54.33zM447.9 448h-92.4V302.4c0-34.7-12.5-58.4-43.6-58.4-23.8 0-38 16-44.3 31.4-2.3 5.5-2.8 13.2-2.8 20.9V448h-92.5s1.2-270.5 0-298.1h92.5v42.2c12.3-19 34.2-46 83.2-46 60.7 0 106.1 39.6 106.1 124.7V448z" />
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
      <input
        type="email"
        name="email"
        value={form.email}
        onChange={handleChange}
        autoComplete="email"
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none transition-all"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          value={form.password}
          onChange={handleChange}
          autoComplete="current-password"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none transition-all"
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
        </button>
      </div>
    </div>

    <button
      type="submit"
      disabled={isLoading || !isFormValid}
      className={`w-full py-3 ${loginButtonColor} rounded-lg font-semibold text-white shadow-md transition-all flex items-center justify-center ${
        isLoading ? "opacity-75 cursor-not-allowed" : "hover:opacity-90"
      }`}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        "Login"
      )}
    </button>
  </form>

  <div className="mt-6 text-center text-sm">
    <span className="text-gray-600">Don't have an account? </span>
    <button
      onClick={() => {
        if (isModal && onClose) onClose();
        openRegister();
      }}
      className="font-medium text-[#154360] hover:underline"
    >
      Sign Up
    </button>
  </div>
</div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;

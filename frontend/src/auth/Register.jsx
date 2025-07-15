import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaEye,
  FaEyeSlash,
  FaExclamationCircle,
  FaMale,
  FaFemale,
  FaTimes,
} from "react-icons/fa";
import { MdOutlineMoreHoriz } from "react-icons/md";
import axios from "axios";
import { useModal } from "../context/ModalContext";
import { motion } from "framer-motion";
import Cookies from 'js-cookie';
import { BACKEND_URL } from '../config.js';

const RegisterPage = ({ onClose, onRegisterSuccess, isModal = false }) => {
  const navigate = useNavigate();
  const { openLogin } = useModal();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    gender: "",
    password: "",
    confirmPassword: "",
    skillsToTeach: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const leftPanelRef = useRef(null);

  const carouselImages = [
    "/assets/interview-illustration.webp",
    "/assets/expert-connect-illustration.webp",
    "/assets/group-discussion-illustration.webp",
    "/assets/skillchoose.webp",
  ];
  const extendedImages = [...carouselImages, ...carouselImages];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) =>
        prev >= carouselImages.length - 1 ? 0 : prev + 1
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let lastMoveTime = 0;
    const moveThreshold = 500;
    const handleMouseMove = () => {
      const now = Date.now();
      if (now - lastMoveTime > moveThreshold) {
        setCurrentImageIndex((prev) =>
          prev >= carouselImages.length - 1 ? 0 : prev + 1
        );
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

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const {
      firstName,
      lastName,
      username,
      email,
      phone,
      gender,
      password,
      confirmPassword,
      skillsToTeach,
    } = form;
    if (!firstName || !username || !email || !phone || !gender || !password || !confirmPassword || !skillsToTeach) {
      return setError("Please fill in all required fields.");
    }
    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }
    try {
      setIsLoading(true);
      setError("");
      const res = await axios.post(`${BACKEND_URL}/api/auth/register`, {
        firstName,
        lastName,
        username,
        email,
        phone,
        gender,
        password,
        skillsToTeach: skillsToTeach.split(',').map(s => s.trim()),
      });
      const { token, user } = res.data;
      Cookies.set('user', JSON.stringify(user), { expires: 1 });
      Cookies.set('registeredName', `${firstName}${lastName ? " " + lastName : ""}`, { expires: 1 });
      Cookies.set('registeredEmail', email, { expires: 1 });
      Cookies.set('isRegistered', 'true', { expires: 1 });
      window.dispatchEvent(new Event("authChanged"));
      if (onRegisterSuccess) onRegisterSuccess(user);
      if (isModal && onClose) {
        onClose();
      } else {
        navigate("/home");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    form.firstName &&
    form.email &&
    form.phone &&
    form.gender &&
    form.password &&
    form.confirmPassword;

  const registerButtonColor = isFormValid
    ? "bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950"
    : "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700";

  return (
    <div
      className={`${
        isModal
          ? "fixed inset-0 z-50 flex items-center justify-center"
          : "min-h-screen flex items-center justify-center pt-16 pb-10 px-4"
      }`}
      style={{
        backgroundColor: isModal ? "rgba(0,0,0,0.2)" : "transparent",
        backdropFilter: "none",
        WebkitBackdropFilter: "none",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl p-4 shadow-2xl w-[95vw] max-w-[1100px] h-[90vh] md:h-[650px] overflow-hidden flex flex-col"
      >
        <div className="flex flex-col md:flex-row w-full h-full">
          {/* Left Panel */}
          <div
            ref={leftPanelRef}
            className="w-full md:w-1/2 relative"
            style={{
              backgroundColor: "#e6f2fb",
              borderTopLeftRadius: "40px",
              borderBottomRightRadius: "40px",
            }}
          >
            <div className="absolute top-4 left-4 z-30">
              <img
                src="/assets/skillswap-logo.webp"
                alt="SkillSwap Logo"
                className="h-8 w-auto"
              />
            </div>

            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="relative w-[70%] h-[50%] overflow-hidden">
                <div
                  className="flex transition-transform ease-in-out"
                  style={{
                    transform: `translateX(-${100 * currentImageIndex}%)`,
                    transitionDuration:
                      currentImageIndex >= carouselImages.length ? "0ms" : "1500ms",
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

            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 z-30">
              {carouselImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentImageIndex
                      ? "bg-blue-600 scale-125"
                      : "bg-blue-300"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-full md:w-1/2 p-4 md:p-6 bg-gray-50 relative">
            <div className="bg-white rounded-lg p-4 shadow-md h-full flex flex-col">
              {isModal && (
                <button
                  onClick={onClose}
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              )}

              <h1 className="text-xl font-bold text-[#154360] mb-4 text-center">
                Create an Account
              </h1>

              {error && (
                <div className="mb-3 p-1.5 bg-red-50 text-red-700 rounded-lg text-xs flex items-center">
                  <FaExclamationCircle className="mr-1.5 w-3 h-3" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3 flex-1">
                <div className="flex gap-2">
                  <div className="w-full">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      First Name*
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none transition-all text-sm"
                    />
                  </div>
                  <div className="w-full">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Username*
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-2 py-1"
                    placeholder="Choose a unique username"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email*
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Phone*
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Gender*
                  </label>
                  <div className="flex gap-2">
                    {["male", "female", "other"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setForm({ ...form, gender: g })}
                        className={`border px-2 py-1 rounded-full flex items-center gap-1 text-xs ${
                          form.gender === g
                            ? "border-blue-600 bg-blue-50 text-blue-800"
                            : "border-gray-300 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {g === "male" ? (
                          <FaMale className="w-3 h-3" />
                        ) : g === "female" ? (
                          <FaFemale className="w-3 h-3" />
                        ) : (
                          <MdOutlineMoreHoriz className="w-3 h-3" />
                        )}
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Password*
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Create password"
                      value={form.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none transition-all text-sm"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <FaEyeSlash className="w-3 h-3" />
                      ) : (
                        <FaEye className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Confirm Password*
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Re-enter password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none transition-all text-sm"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <FaEyeSlash className="w-3 h-3" />
                      ) : (
                        <FaEye className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    What do you want to teach?
                  </label>
                  <input
                    type="text"
                    name="skillsToTeach"
                    value={form.skillsToTeach}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-2 py-1"
                    placeholder="e.g. Mathematics, Physics"
                    required
                  />
                </div>

                <div className="text-[10px] text-gray-600 flex items-start">
                  <input type="checkbox" required className="mt-0.5 mr-1.5 w-3 h-3" />
                  <span>
                    I agree to the{" "}
                    <a href="#" className="text-blue-600 underline">
                      Privacy Policy
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-blue-600 underline">
                      Terms
                    </a>
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !isFormValid}
                  className={`w-full py-2.5 ${registerButtonColor} rounded-lg font-medium text-sm text-white shadow-md transition-all flex items-center justify-center ${
                    isLoading ? "opacity-75 cursor-not-allowed" : "hover:opacity-90"
                  }`}
                >
                  {isLoading ? (
                    <svg className="animate-spin h-3 w-3 text-white" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    "Create Account"
                  )}
                </button>

                <div className="mt-4 text-center text-xs">
                  <span className="text-gray-600">Already have an account? </span>
                  <button
                    onClick={() => {
                      if (isModal && onClose) {
                        onClose();
                        openLogin();
                      } else {
                        navigate("/login");
                      }
                    }}
                    className="font-medium text-[#154360] hover:underline"
                  >
                    Login
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
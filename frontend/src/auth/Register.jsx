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
import { STATIC_COURSES, STATIC_UNITS, STATIC_TOPICS } from '../constants/teachingData';

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
  });
  const [skillsToTeach, setSkillsToTeach] = useState([
    { subject: '', topic: '', subtopic: '' }
  ]);
  const [role, setRole] = useState('learner');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const leftPanelRef = useRef(null);

  // ✅ New OTP States
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [emailForOtp, setEmailForOtp] = useState("");
  const [registrationData, setRegistrationData] = useState(null);

  const carouselImages = [
    "/assets/interview-illustration.webp",
    "/assets/expert-connect-illustration.webp",
    "/assets/group-discussion-illustration.webp",
    "/assets/skillchoose.webp",
  ];
  const extendedImages = [...carouselImages, ...carouselImages];

  const MAX_SKILLS = 3; // Limit to 3 skills to prevent overflow

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

  const handleAddSkill = () => {
    if (skillsToTeach.length < MAX_SKILLS) {
      setSkillsToTeach([...skillsToTeach, { subject: '', topic: '', subtopic: '' }]);
    } else {
      setError("Maximum of 3 skills can be added.");
    }
  };

  const handleRemoveSkill = (idx) => {
    setSkillsToTeach(skillsToTeach.filter((_, i) => i !== idx));
  };

  const handleSkillChange = (idx, field, value) => {
    setSkillsToTeach(skillsToTeach.map((s, i) =>
      i === idx ? { ...s, [field]: value, ...(field === 'subject' ? { topic: '', subtopic: '' } : field === 'topic' ? { subtopic: '' } : {}) } : s
    ));
  };

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
    } = form;
    if (!firstName || !username || !email || !phone || !gender || !password || !confirmPassword) {
      return setError("Please fill in all required fields.");
    }
    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }
    if ((role === 'teacher' || role === 'both') && (!skillsToTeach.length || skillsToTeach.some(s => !s.subject || !s.topic || !s.subtopic))) {
      return setError('Please select subject, topic, and subtopic for each teaching skill.');
    }
    try {
      setIsLoading(true);
      setError("");
      
      // Store registration data for OTP verification
      setRegistrationData({
        firstName,
        lastName,
        username,
        email,
        phone,
        gender,
        password,
        role,
        skillsToTeach,
      });
      
      // Send registration request
      const res = await axios.post(`${BACKEND_URL}/api/auth/register`, {
        firstName,
        lastName,
        username,
        email,
        phone,
        gender,
        password,
        role,
        skillsToTeach,
      });
      
      // Show OTP verification
      setEmailForOtp(email);
      setShowOtp(true);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
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
      Cookies.set('registeredName', `${registrationData.firstName}${registrationData.lastName ? " " + registrationData.lastName : ""}`, { expires: 1 });
      Cookies.set('registeredEmail', emailForOtp, { expires: 1 });
      Cookies.set('isRegistered', 'true', { expires: 1 });
      window.dispatchEvent(new Event("authChanged"));
      if (onRegisterSuccess) onRegisterSuccess(user);
      if (isModal && onClose) {
        onClose();
      } else {
        navigate("/home");
      }
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed.");
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
    : "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 to-gray-700";

  return (
    <div
      className={`${
        isModal
          ? "fixed inset-0 z-50 flex items-center justify-center"
          : "min-h-screen flex items-center justify-center pt-12 pb-8 px-4"
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
        className="bg-white rounded-xl p-4 w-[90vw] max-w-[1000px] h-[85vh] md:h-[650px] flex flex-col"
      >
        <div className="flex flex-col md:flex-row w-full h-full">
          {/* Left Panel */}
          <div
            ref={leftPanelRef}
            className="w-full md:w-1/2 relative"
            style={{
              backgroundColor: "#e6f2fb",
              borderTopLeftRadius: "32px",
              borderBottomRightRadius: "32px",
            }}
          >
            <div className="absolute top-3 left-3 z-30">
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

            <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-2 z-30">
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
          <div className="w-full md:w-1/2 p-6 bg-white flex items-center justify-center">
            <div className={`w-full ${skillsToTeach.length > 1 ? 'max-w-[450px]' : 'max-w-[380px]'} bg-white rounded-lg p-3 flex flex-col gap-1.5 overflow-hidden`}>
              {isModal && (
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="Close"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              )}

              <h1 className="text-lg font-bold text-[#154360] text-center">
                Create an Account
              </h1>

              {error && (
                <div className="p-1 bg-red-50 text-red-700 rounded-lg text-[11px] flex items-center gap-1">
                  <FaExclamationCircle className="w-3 h-3" />
                  <span>{error}</span>
                </div>
              )}

              {!showOtp ? (
                <form onSubmit={handleSubmit} className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                        First Name*
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={form.firstName}
                        onChange={handleChange}
                        className="w-full px-1.5 py-0.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-[11px]"
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={form.lastName}
                        onChange={handleChange}
                        className="w-full px-1.5 py-0.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-[11px]"
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                      Username*
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      className="w-full px-1.5 py-0.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-[11px]"
                      placeholder="Choose a unique username"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                      Email*
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      autoComplete="email"
                      className="w-full px-1.5 py-0.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-[11px]"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                      Phone*
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full px-1.5 py-0.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-[11px]"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                      Gender*
                    </label>
                    <div className="flex gap-1">
                      {["male", "female", "other"].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setForm({ ...form, gender: g })}
                          className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                            form.gender === g
                              ? "border-blue-600 bg-blue-50 text-blue-800"
                              : "border-gray-300 text-gray-700 hover:bg-gray-100 border"
                          }`}
                        >
                          {g === "male" ? (
                            <FaMale className="w-2.5 h-2.5" />
                          ) : g === "female" ? (
                            <FaFemale className="w-2.5 h-2.5" />
                          ) : (
                            <MdOutlineMoreHoriz className="w-2.5 h-2.5" />
                          )}
                          {g.charAt(0).toUpperCase() + g.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
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
                        className="w-full px-1.5 py-0.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-[11px]"
                      />
                      <button
                        type="button"
                        className="absolute right-1.5 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <FaEyeSlash className="w-2.5 h-2.5" />
                        ) : (
                          <FaEye className="w-2.5 h-2.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
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
                        className="w-full px-1.5 py-0.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-[11px]"
                      />
                      <button
                        type="button"
                        className="absolute right-1.5 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <FaEyeSlash className="w-2.5 h-2.5" />
                        ) : (
                          <FaEye className="w-2.5 h-2.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                      Register as:
                    </label>
                    <div className="flex gap-1.5">
                      {["teacher", "learner", "both"].map((r) => (
                        <label key={r} className="flex items-center gap-0.5">
                          <input
                            type="radio"
                            name="role"
                            value={r}
                            checked={role === r}
                            onChange={() => setRole(r)}
                            className="w-2.5 h-2.5 text-blue-600"
                          />
                          <span className="text-[11px]">{r.charAt(0).toUpperCase() + r.slice(1)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {(role === 'teacher' || role === 'both') && (
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                        What do you want to teach? (Max {MAX_SKILLS} skills)
                      </label>
                      {skillsToTeach.map((skill, idx) => (
                        <div key={idx} className="flex gap-1 mb-0.5 items-center">
                          <select
                            className="flex-1 px-1.5 py-0.5 border border-gray-300 rounded-lg text-[11px] focus:ring-2 focus:ring-blue-500 outline-none"
                            value={skill.subject}
                            onChange={(e) => handleSkillChange(idx, 'subject', e.target.value)}
                            required={role === 'teacher' || role === 'both'}
                          >
                            <option value="">Select Subject</option>
                            {STATIC_COURSES.map((subj) => (
                              <option key={subj} value={subj}>
                                {subj}
                              </option>
                            ))}
                          </select>
                          <select
                            className="flex-1 px-1.5 py-0.5 border border-gray-300 rounded-lg text-[11px] focus:ring-2 focus:ring-blue-500 outline-none"
                            value={skill.topic}
                            onChange={(e) => handleSkillChange(idx, 'topic', e.target.value)}
                            required={role === 'teacher' || role === 'both'}
                            disabled={!skill.subject}
                          >
                            <option value="">Select Topic</option>
                            {(STATIC_UNITS[skill.subject] || []).map((topic) => (
                              <option key={topic} value={topic}>
                                {topic}
                              </option>
                            ))}
                          </select>
                          <select
                            className="flex-1 px-1.5 py-0.5 border border-gray-300 rounded-lg text-[11px] focus:ring-2 focus:ring-blue-500 outline-none"
                            value={skill.subtopic}
                            onChange={(e) => handleSkillChange(idx, 'subtopic', e.target.value)}
                            required={role === 'teacher' || role === 'both'}
                            disabled={!skill.topic}
                          >
                            <option value="">Select Subtopic</option>
                            {(STATIC_TOPICS[skill.topic] || []).map((subtopic) => (
                              <option key={subtopic} value={subtopic}>
                                {subtopic}
                              </option>
                            ))}
                          </select>
                          {skillsToTeach.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(idx)}
                              className="text-red-500 hover:text-red-700 font-medium text-[11px]"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      {skillsToTeach.length < MAX_SKILLS && (
                        <button
                          type="button"
                          onClick={handleAddSkill}
                          className="text-blue-600 hover:text-blue-800 underline text-[11px]"
                        >
                          Add Another Skill
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex items-start text-[11px] text-gray-600">
                    <input
                      type="checkbox"
                      required
                      className="mt-0.5 mr-1 w-2.5 h-2.5 text-blue-600"
                    />
                    <span>
                      I agree to the{" "}
                      <a href="#" className="text-blue-600 hover:underline">
                        Privacy Policy
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-blue-600 hover:underline">
                        Terms
                      </a>
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !isFormValid}
                    className={`w-full py-1.5 ${registerButtonColor} rounded-lg font-semibold text-[11px] text-white transition-all flex items-center justify-center ${
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

                  <div className="text-center text-[11px]">
                    <span className="text-gray-600">Already have an account? </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (isModal && onClose) {
                          onClose();
                          openLogin();
                        } else {
                          navigate("/login");
                        }
                      }}
                      className="font-semibold text-[#154360] hover:underline"
                    >
                      Login
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-1.5">
                  <div className="text-center">
                    <h2 className="text-lg font-bold text-[#154360] mb-2">Verify Your Email</h2>
                    <p className="text-[11px] text-gray-600 mb-4">
                      We've sent a verification code to <strong>{emailForOtp}</strong>
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                      Enter OTP*
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full px-1.5 py-0.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-[11px]"
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                    />
                  </div>

                  <button
                    onClick={handleVerifyOtp}
                    disabled={!otp || otp.length !== 6}
                    className={`w-full py-1.5 bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 rounded-lg font-semibold text-[11px] text-white transition-all flex items-center justify-center ${
                      !otp || otp.length !== 6 ? "opacity-75 cursor-not-allowed" : "hover:opacity-90"
                    }`}
                  >
                    Verify & Complete Registration
                  </button>

                  <div className="text-center text-[11px]">
                    <span className="text-gray-600">Didn't receive the code? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOtp(false);
                        setOtp("");
                        setError("");
                      }}
                      className="font-semibold text-[#154360] hover:underline"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaExclamationCircle, FaTimes } from "react-icons/fa";
import axios from "axios";
import { useModal } from '../context/ModalContext';
import Cookies from 'js-cookie';
import { BACKEND_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useEmployeeAuth } from '../context/EmployeeAuthContext.jsx';
import { useQuizementEmployeeAuth } from '../context/QuizementEmployeeAuthContext.jsx';
import { useInternCoordinatorAuth } from '../context/InternCoordinatorAuthContext.jsx';

const LoginPage = ({ onClose, onLoginSuccess, isModal = false }) => {
  const navigate = useNavigate();
  const { openRegister } = useModal();
  const { setUser } = useAuth();
  const { setEmployee } = useEmployeeAuth();
  const { setEmployee: setQuizementEmployee } = useQuizementEmployeeAuth() || {};
  const { setCoordinator } = useInternCoordinatorAuth() || {};

  const [form, setForm] = useState({ identifier: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const leftPanelRef = useRef(null);
  const lastMouseMoveRef = useRef(0);
  const isTransitioningRef = useRef(false);

  // OTP States
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [emailForOtp, setEmailForOtp] = useState("");
  const [isEmployeeOtp, setIsEmployeeOtp] = useState(false);

  const carouselImages = [
    "https://res.cloudinary.com/dbltazdsa/image/upload/v1766589371/webimages/interview-illustration.png",
    "https://res.cloudinary.com/dbltazdsa/image/upload/v1766589368/webimages/expert-connect-illustration.png",
    "https://res.cloudinary.com/dbltazdsa/image/upload/v1766589376/webimages/skillswap-hero.png",
  ];
  // Duplicate images for seamless infinite loop
  const extendedImages = [...carouselImages, carouselImages[0]];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => {
        const nextIndex = prev + 1;
        // When reaching the duplicated image, instantly jump back to the first image without transition
        if (nextIndex >= carouselImages.length + 1) {
          leftPanelRef.current.querySelector('.carousel-container').style.transition = 'none';
          setTimeout(() => {
            leftPanelRef.current.querySelector('.carousel-container').style.transition = 'transform 1500ms ease-in-out';
          }, 0);
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
            leftPanelRef.current.querySelector('.carousel-container').style.transition = 'none';
            setTimeout(() => {
              leftPanelRef.current.querySelector('.carousel-container').style.transition = 'transform 1500ms ease-in-out';
            }, 0);
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
      panel.addEventListener("mousemove", handleMouseMove);
      return () => panel.removeEventListener("mousemove", handleMouseMove);
    }
  }, [carouselImages.length]);

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
    const { identifier, password } = form;
    if (!identifier || !password) return setError("Please fill in all fields.");

    try {
      setIsLoading(true);
      setError("");
      // First, try Quizzment employee login (email or employeeId)
      try {
        const resQuiz = await axios.post(
          `${BACKEND_URL}/api/quizement-employee/login`,
          { identifier, password },
          { withCredentials: true }
        );
        const emp = resQuiz.data?.employee;
        if (emp && setQuizementEmployee) {
          setQuizementEmployee(emp);
        }
        if (isModal && onClose) onClose();
        navigate('/quizement-employee/dashboard');
        return;
      } catch (_) {
        // fall through to user/employee login
        console.log('[Login] Quizement employee login failed (expected), trying regular login...');
      }

      // Next, try unified login (handles both regular users and intern employees)
      console.log('[Login] Attempting unified login for:', identifier);
      const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, { email: identifier, password }, { withCredentials: true });
      console.log('[Login] Login response:', loginResponse.data);
      console.log('[Login] Account type:', loginResponse.data.accountType);
      console.log('[Login] Is intern employee?', loginResponse.data.accountType === 'internEmployee');
      
      // Check if it's an intern employee (no OTP required)
      if (loginResponse.data.accountType === 'internEmployee') {
        console.log('[Login] ✅ Intern Employee DETECTED!');
        const employee = loginResponse.data.employee;
        console.log('[Login] Employee data:', employee);
        
        if (employee) {
          localStorage.setItem('internEmployee', JSON.stringify(employee));
          console.log('[Login] Saved to localStorage');
          if (setCoordinator) {
            try {
              setCoordinator(employee);
              console.log('[Login] Intern coordinator context updated');
            } catch (ctxErr) {
              console.warn('[Login] Failed to update intern coordinator context:', ctxErr);
            }
          }
        }
        
        if (isModal && onClose) {
          console.log('[Login] Closing modal');
          onClose();
        }
        
        // Check if must change password
        const mustChange = loginResponse.data.mustChangePassword || employee.mustChangePassword;
        console.log('[Login] mustChangePassword flag:', mustChange);
        
        if (mustChange) {
          console.log('[Login] 🔄 Redirecting to CHANGE PASSWORD page...');
          setTimeout(() => {
            window.location.href = '/intern-coordinator/change-password';
          }, 100);
        } else {
          console.log('[Login] 🔄 Redirecting to DASHBOARD...');
          setTimeout(() => {
            window.location.href = '/intern-coordinator/dashboard';
          }, 100);
        }
        
        setIsLoading(false);
        return;
      }
      
      console.log('[Login] Not an intern employee, proceeding with OTP flow...');
      
      // Regular user - requires OTP
      setEmailForOtp(identifier);
      setIsEmployeeOtp(false);
      setShowOtp(true);
      setError("");
    } catch (err) {
      // If regular user login fails with client/auth error, try employee login (OTP) on same form
      const status = err.response?.status;
      if (status >= 400 && status < 500) {
        try {
          await axios.post(`${BACKEND_URL}/api/employee/login`, {
            identifier,
            password,
          }, { withCredentials: true });

          setEmailForOtp(identifier);
          setIsEmployeeOtp(true);
          setShowOtp(true);
          setError("");
          return; // We'll proceed with OTP verification as employee
        } catch (empErr) {
          // Display the specific backend error message
          const errorMessage = err.response?.data?.message || empErr.response?.data?.message || "Login failed";
          setError(errorMessage);
        }
      } else {
        // Display the specific backend error message
        const errorMessage = err.response?.data?.message || "Login failed. Please try again.";
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return setError("Enter the OTP sent to your email.");

    try {
      if (isEmployeeOtp) {
        // Verify OTP for employee accounts
        const res = await axios.post(`${BACKEND_URL}/api/employee/verify-otp`, {
          email: emailForOtp,
          otp,
        }, { withCredentials: true });

        const { employee } = res.data;
        if (employee && setEmployee) {
          setEmployee(employee);
        }
        // If admin-assigned password is temporary, force employee to reset it first
        if (employee && employee.mustChangePassword) {
          navigate('/employee/reset-password');
        } else {
          navigate('/employee/dashboard');
        }
        if (isModal && onClose) onClose();
      } else {
        // Verify OTP for regular users/admin
        const res = await axios.post(`${BACKEND_URL}/api/auth/verify-otp`, {
          email: emailForOtp,
          otp,
        }, { withCredentials: true });

        const { user, token } = res.data;
        console.log('[LOGIN] User data after OTP verification:', {
          role: user.role,
          isCampusAmbassador: user.isCampusAmbassador,
          isFirstLogin: user.isFirstLogin,
          email: user.email
        });
        console.log('[LOGIN] Is campus ambassador?', user.role === 'campus_ambassador' || user.isCampusAmbassador);
        console.log('[LOGIN] isModal?', isModal);
        
        Cookies.set('user', JSON.stringify(user), { expires: 1 });
        localStorage.setItem('user', JSON.stringify(user));
        if (token) {
          localStorage.setItem('token', token);
        }
        Cookies.set('registeredEmail', emailForOtp, { expires: 1 });
        Cookies.set('isRegistered', 'true', { expires: 1 });
        setUser(user);
        window.dispatchEvent(new Event("authChanged"));
        if (onLoginSuccess) onLoginSuccess(user);
        
        // Close modal first if in modal mode
        const wasModal = isModal;
        if (isModal && onClose) {
          console.log('[LOGIN] Closing modal');
          onClose();
        }
        
        // Redirect based on user role (only if not in modal)
        if (!wasModal) {
          console.log('[LOGIN] Not in modal, proceeding with redirect logic');
          if (user.role === 'campus_ambassador' || user.isCampusAmbassador) {
            console.log('[LOGIN] Detected campus ambassador, isFirstLogin:', user.isFirstLogin);
            if (user.isFirstLogin) {
              console.log('[LOGIN] Redirecting to change-password');
              navigate("/change-password");
            } else {
              console.log('[LOGIN] Redirecting to campus-ambassador dashboard');
              navigate("/campus-ambassador");
            }
          } else {
            console.log('[LOGIN] Regular user, redirecting to home');
            navigate("/home");
          }
        } else {
          console.log('[LOGIN] Modal mode, skipping navigation');
        }
      }
    } catch (err) {
      // Display specific backend error message
      const errorMessage = err.response?.data?.message || "OTP verification failed. Please try again.";
      setError(errorMessage);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${BACKEND_URL}/api/auth/google`;
  };

  const handleOAuth = (provider) => {
    window.location.href = `${BACKEND_URL}/api/auth/${provider}`;
  };

  const isFormValid = form.identifier && form.password;
  const loginButtonColor = isFormValid
    ? "bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950"
    : "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700";

  return (
    <div className={`${isModal ? "fixed inset-0 flex items-center justify-center bg-black/40 z-50" : "min-h-screen flex items-start justify-center pt-8 pb-10 px-2 sm:px-4"}`}>
      <div className="bg-white rounded-xl p-2 sm:p-4 shadow-2xl w-[90vw] sm:w-[80vw] md:w-[70vw] h-[85vh] sm:h-[75vh] max-w-[1200px]">
        <div className="flex flex-col md:flex-row w-full h-full">
          {/* Left Panel */}
          <div ref={leftPanelRef} className="w-full md:w-1/2 relative overflow-hidden min-h-[240px] sm:min-h-[300px] md:min-h-0" style={{
            backgroundColor: "#e6f2fb",
            borderTopLeftRadius: "40px",
            borderBottomRightRadius: "40px",
          }}>
            <div className="absolute top-4 left-4 z-30">
              <img src="https://res.cloudinary.com/dbltazdsa/image/upload/v1766589377/webimages/skillswap-logo.png" alt="SkillSwap Logo" className="h-6 sm:h-7 md:h-8 w-auto" />
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
                    <div key={idx} className="min-w-full w-full h-full flex-shrink-0 flex items-center justify-center p-4">
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

            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 z-10" />
          </div>

          {/* Right Panel */}
          <div className="w-full md:w-1/2 p-4 sm:p-6 md:p-8 bg-gray-50 relative overflow-y-auto">
            {isModal && (
              <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                <FaTimes className="w-5 h-5" />
              </button>
            )}

            {/* OAuth */}
            <div className="space-y-3 mb-4 sm:mb-6">
              <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 py-2 sm:py-2.5 px-4 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100">
                <svg className="w-5 h-5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#4A90E2" d="M10.54 28.28l-7.98-6.19C.99 25.76 0 29.78 0 34c0 4.22.99 8.24 2.56 11.91l7.98-6.19c-1.09-3.42-1.09-7.27 0-10.64z" />
                  <path fill="#FBBC05" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>Login with Google</span>
              </button>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-[#154360] mb-4 sm:mb-6 text-center">Login to Your Account</h1>

            {error && (
              <div className="mb-4 p-2 bg-red-50 text-red-700 rounded-lg text-xs sm:text-sm flex items-center">
                <FaExclamationCircle className="mr-2" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email or Employee ID</label>
                <input
                  type="text"
                  name="identifier"
                  value={form.identifier}
                  onChange={handleChange}
                  placeholder="Enter your email or Employee ID"
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} name="password" value={form.password}
                    onChange={handleChange}
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 text-sm sm:text-base" />
                  <button type="button" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading || !isFormValid}
                className={`w-full py-2 sm:py-3 ${loginButtonColor} rounded-lg font-semibold text-white flex justify-center items-center text-sm sm:text-base ${isLoading ? "opacity-75 cursor-not-allowed" : "hover:opacity-90"}`}>
                {isLoading ? (
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : "Login"}
              </button>
            </form>

            {/* OTP Input and Submit */}
            {showOtp && (
              <div className="mt-4 sm:mt-6 space-y-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 text-sm sm:text-base"
                />
                <button
                  onClick={handleVerifyOtp}
                  className="w-full py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:opacity-90 transition-all text-sm sm:text-base"
                >
                  Verify OTP
                </button>
              </div>
            )}

            <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <button onClick={() => {
                if (isModal && onClose) onClose();
                openRegister();
              }} className="font-medium text-[#154360] hover:underline">Sign Up</button>
              <div className="mt-2">
                <button
                  onClick={() => {
                    if (isModal && onClose) onClose();
                    navigate('/forgot-password');
                  }}
                  className="text-blue-700 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
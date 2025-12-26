import React, { useEffect, useState } from 'react';
import { useLocation, useRoutes, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/footer/Footer';
import { ModalProvider } from './context/ModalContext';
import { SkillMatesProvider } from './context/SkillMatesContext.jsx';
import ModalBodyScrollLock from './ModalBodyScrollLock';
import GlobalModals from './GlobalModals';
import SkillMatesModal from './components/SkillMatesModal.jsx';
import { ToastProvider } from './components/ToastProvider.jsx';
import ToastSocketBridge from './components/ToastSocketBridge.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext.jsx';
import { useEmployeeAuth } from './context/EmployeeAuthContext.jsx';
import RegisterInterviewer from './user/RegisterInterviewer.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import socket from './socket';
import visitorTracker from './utils/visitorTracker';

// Pages
import Home from './user/Home';
import Login from './auth/Login';
import Register from './auth/Register';
import OneOnOne from './user/OneOnOne';
import Discuss from './user/Discuss';
import Interview from './user/Interview';
import Sessions from './user/Sessions';
import Testimonial from './user/Testimonial';
import Profile from './user/Profile';
import CreateSession from './user/createSession';
import LearningHistory from './user/LearningHistory';
import HelpSupportPage from './components/footer/HelpSupportPage';
import GoPro from './user/HomeSection/GoPro';
import AccountSettings from './user/AccountSettings';
import privateProfileRoutes from './user/privateProfile/privateProfileRoutes';
import PrivateProfile from './user/PrivateProfile';
import PublicProfile from './user/PublicProfile';
import SessionRequests from './user/SessionRequests';
import JoinSession from './user/JoinSession.jsx';
import InterviewCallPage from './components/InterviewCallPage';
import accountSettingsRoutes from './user/settings/AccountSettingsRoutes';
import ReportPage from './user/privateProfile/Report';
import TeachingHistory from './user/TeachingHistory';
import CoinsHistory from './user/CoinsHistory';
import Blog from './components/footer/Blog';
import AdminPanel from './admin/adminpanel';
import AdminRoute from './routes/AdminRoute';
import Applications from './admin/Applications.jsx';
import NewDashboard from './admin/NewDashboard.jsx';
import InterviewRequests from './admin/InterviewRequests.jsx';
import AdminSessionRequests from './admin/SessionRequests.jsx';
import SkillMateRequests from './admin/SkillMateRequests.jsx';
import Users from './admin/Users.jsx';
import Settings from './admin/Settings.jsx';
import Analytics from './admin/Analytics.jsx';
import AdminHelpSupport from './admin/AdminHelpSupport.jsx';
import AdminPackages from './admin/AdminPackages.jsx';
import AdminLayout from './admin/AdminLayout.jsx';
import PrivacyPolicy from './components/footer/PrivacyPolicy.jsx';
import Community from './components/footer/Community.jsx';
import FAQ from './components/footer/FAQ.jsx';
import ContactUs from './components/footer/ContactUs.jsx';
import TermsConditions from './components/footer/TermsConditions.jsx';
import CookiesPolicy from './components/footer/CookiesPolicy.jsx';
import About from './components/footer/About.jsx';
import Career from './components/footer/Career.jsx';
import YourInterviews from './user/YourInterviews';
import RatingPage from './user/RatingPage.jsx';
import TutorApplication from './tutor/TutorApplication.jsx';
import TutorVerificationStatus from './tutor/TutorVerificationStatus.jsx';
import TutorVerification from './admin/TutorVerification.jsx';
import ForgotPassword from './auth/ForgotPassword.jsx';
import ResetPassword from './auth/ResetPassword.jsx';
import Reports from './admin/Reports.jsx';
import Employees from './admin/Employees.jsx';
import EmployeeDetail from './admin/EmployeeDetail.jsx';
import AdminUserProfile from './admin/AdminUserProfile.jsx';
import EmployeeRoute from './routes/EmployeeRoute.jsx';
import EmployeeLayout from './employee/EmployeeLayout.jsx';
import EmployeeDashboard from './employee/EmployeeDashboard.jsx';
import EmployeeApplicationsPage from './employee/EmployeeApplicationsPage.jsx';
import EmployeeResetPassword from './employee/EmployeeResetPassword.jsx';
import RecruitmentApplication from './user/RecruitmentApplication.jsx';
import RecruitmentApplications from './admin/RecruitmentApplications.jsx';

// Define full (regular user) routes
const appRoutes = [
  // Public routes (accessible without authentication)
  { path: '/', element: <Navigate to="/home" replace /> },
  { path: '/home', element: <Home /> },
  { path: '/login', element: <Login /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },
  { path: '/register', element: <Register /> },
  { path: '/tutor/apply', element: <ProtectedRoute><TutorApplication /></ProtectedRoute> },
  { path: '/tutor/status', element: <ProtectedRoute><TutorVerificationStatus /></ProtectedRoute> },
  { path: '/privacy-policy', element: <PrivacyPolicy /> },
  { path: '/community', element: <Community /> },
  { path: '/about', element: <About /> },
  { path: '/faq', element: <FAQ /> },
  { path: '/contact-us', element: <ContactUs /> },
  { path: '/terms-conditions', element: <TermsConditions /> },
  { path: '/cookies', element: <CookiesPolicy /> },
  { path: '/career', element: <Career /> },
  { path: '/profile/:username', element: <PublicProfile /> },
  // Protected routes (require authentication)
  { path: '/one-on-one', element: <ProtectedRoute><OneOnOne /></ProtectedRoute> },
  { path: '/discuss', element: <ProtectedRoute><Discuss /></ProtectedRoute> },
  { path: '/interview', element: <ProtectedRoute><Interview /></ProtectedRoute> },
  { path: '/your-interviews', element: <ProtectedRoute><YourInterviews /></ProtectedRoute> },
  { path: '/session', element: <ProtectedRoute><Sessions /></ProtectedRoute> },
  { path: '/session-requests', element: <ProtectedRoute><SessionRequests /></ProtectedRoute> },
  { path: '/join-session/:id', element: <ProtectedRoute><JoinSession /></ProtectedRoute> },
  { path: '/rate/:sessionId', element: <ProtectedRoute><RatingPage /></ProtectedRoute> },
  { path: '/register-interviewer', element: <RegisterInterviewer />} ,
  { path: '/interview-call/:sessionId', element: <ProtectedRoute><InterviewCallPage /></ProtectedRoute> },
  { path: '/testimonials', element: <ProtectedRoute><Testimonial showAll={true} /></ProtectedRoute> },
  { path: '/your-profile', element: <ProtectedRoute><Profile /></ProtectedRoute> },
  { path: '/createSession', element: <ProtectedRoute><CreateSession /></ProtectedRoute> },
  { path: '/learning-history', element: <ProtectedRoute><LearningHistory /></ProtectedRoute> },
  { path: '/coins-history', element: <ProtectedRoute><CoinsHistory /></ProtectedRoute> },
  { path: '/help', element: <ProtectedRoute><HelpSupportPage /></ProtectedRoute> },
  { path: '/pro', element: <ProtectedRoute><GoPro /></ProtectedRoute> },
  { path: '/recruitment-application', element: <ProtectedRoute><RecruitmentApplication /></ProtectedRoute> },
  { path: '/accountSettings', element: <ProtectedRoute><AccountSettings /></ProtectedRoute> },
  { path: '/report', element: <ProtectedRoute><ReportPage /></ProtectedRoute> },
  { path: '/teaching-history', element: <ProtectedRoute><TeachingHistory /></ProtectedRoute> },
  { path: '/blog', element: <ProtectedRoute><Blog /></ProtectedRoute> },
  {
    path: '/employee',
    element: <EmployeeRoute />,
    children: [
      {
        element: <EmployeeLayout />,
        children: [
          { index: true, element: <EmployeeDashboard /> },
          { path: 'dashboard', element: <EmployeeDashboard /> },
          { path: 'applications/:category', element: <EmployeeApplicationsPage /> },
          { path: 'reset-password', element: <EmployeeResetPassword /> },
        ],
      },
    ],
  },
  {
    path: '/admin',
    element: <AdminRoute />,
    children: [
      {
        index: true,
        element: <ProtectedRoute><AdminPanel /></ProtectedRoute>,
      },
      {
        path: 'applications',
        element: <ProtectedRoute><Applications /></ProtectedRoute>,
      },
    ],
  },
  ...(Array.isArray(accountSettingsRoutes) ? accountSettingsRoutes.map(route => ({
    ...route,
    element: <ProtectedRoute>{route.element}</ProtectedRoute>,
  })) : []),
  {
    path: '/profile',
    element: <ProtectedRoute><PrivateProfile /></ProtectedRoute>,
    children: Array.isArray(privateProfileRoutes) ? privateProfileRoutes.map(route => ({
      ...route,
      element: <ProtectedRoute>{route.element}</ProtectedRoute>,
    })) : [],
  },
];

// Define admin-only routes (restrict everything else when admin email logged in)
const adminOnlyRoutes = [
  { path: '/', element: <Navigate to="/admin/dashboard" replace /> },
  {
    path: '/admin',
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />, // layout wraps all admin pages
        children: [
          { index: true, element: <NewDashboard /> },
          { path: 'dashboard', element: <NewDashboard /> },
          { path: 'applications', element: <Applications /> },
          { path: 'recruitment', element: <RecruitmentApplications /> },
          { path: 'analytics', element: <Analytics /> },
          { path: 'interview-requests', element: <InterviewRequests /> },
          { path: 'session-requests', element: <AdminSessionRequests /> },
          { path: 'skillmate-requests', element: <SkillMateRequests /> },
          { path: 'users', element: <Users /> },
          { path: 'users/profile/:userId', element: <AdminUserProfile /> },
          { path: 'employees', element: <Employees /> },
          { path: 'employees/:employeeId', element: <EmployeeDetail /> },
          { path: 'packages', element: <AdminPackages /> },
          { path: 'reports', element: <Reports /> },
          { path: 'help-support', element: <AdminHelpSupport /> },
          { path: 'settings', element: <Settings /> },
          { path: 'tutor-verification', element: <TutorVerification /> },
        ],
      },
    ],
  },
  { path: '/profile/:username', element: <PublicProfile /> },
  { path: '*', element: <Navigate to="/admin/dashboard" replace /> },
];

// Updated ProtectedRouteWithModal to redirect to login page
function ProtectedRouteWithModal({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <img
            src="https://res.cloudinary.com/dbltazdsa/image/upload/v1766589377/webimages/skillswap-logo.png"
            alt="SkillSwap Logo"
            className="w-24 h-24 object-contain drop-shadow-md"
          />
          {/* Spinner ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-[6px] border-blue-900/20 border-t-blue-900 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page, preserving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function App() {
  const { user, loading, setUser } = useAuth();
  const { employee } = useEmployeeAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isRatingPage = location.pathname.startsWith('/rate/');
  const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'skillswaphubb@gmail.com').toLowerCase();
  const isAdminUser = !!(user && user.email && user.email.toLowerCase() === adminEmail);
  
  // App initialization state with fade transition
  const [isAppReady, setIsAppReady] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // Choose route set based on admin status
  const element = useRoutes(isAdminUser ? adminOnlyRoutes : appRoutes);

  // Initial app loading - wait for auth to complete, then show content with fade
  useEffect(() => {
    if (!loading) {
      // Auth is complete, mark app as ready
      setIsAppReady(true);
      // Small delay for smooth fade-in transition
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Enforce redirect for admin to /admin regardless of prior location
  // But allow access to public profiles
  useEffect(() => {
    if (isAdminUser && !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/profile/')) {
      navigate('/admin', { replace: true });
    }
  }, [isAdminUser, location.pathname, navigate]);

  // Always scroll to top on route changes (top-to-bottom view)
  useEffect(() => {
    // If navigating to a hash (e.g., /home#explore), let browser handle anchor
    if (location.hash) {
      // slight delay to ensure element exists
      setTimeout(() => {
        const el = document.getElementById(location.hash.substring(1));
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    
    // Track page view for anonymous visitors
    if (!user) {
      visitorTracker.trackPageView(location.pathname);
    }
  }, [location.pathname, location.search, location.hash, user]);

  // Initialize visitor tracking for anonymous users
  useEffect(() => {
    if (!user && isAppReady) {
      visitorTracker.init();
    }
    
    return () => {
      if (!user) {
        visitorTracker.destroy();
      }
    };
  }, [user, isAppReady]);

  // Socket connection for authenticated users
  useEffect(() => {
    if (!user || !user._id) {
      console.info('[DEBUG] App: No valid user for socket registration');
      return;
    }

    socket.emit('register', user._id);
    console.info('[DEBUG] Socket register emitted for user:', user._id);

    return () => {
      socket.off('register');
    };
  }, [user]);

  // Handle logout only
  useEffect(() => {
    const handleLogout = () => {
      if (socket.connected) {
        socket.disconnect();
        console.info('[DEBUG] Socket disconnected on logout');
      }
      setUser(null);
      navigate('/login', { replace: true });
    };

    window.addEventListener('logout', handleLogout);
    return () => window.removeEventListener('logout', handleLogout);
  }, [navigate, setUser]);

  // Enforce mandatory rating page: if a pending rating exists, always redirect to it
  useEffect(() => {
    try {
      const pendingId = localStorage.getItem('pendingRatingSessionId');
      if (pendingId && !location.pathname.startsWith(`/rate/`)) {
        navigate(`/rate/${pendingId}`, { replace: true });
      }
    } catch {
      /* ignore */
    }
  }, [location.pathname, navigate]);

  // Show loading screen until app is ready
  if (loading || !isAppReady) {
    return <LoadingScreen />;
  }

  // Hide Navbar and Footer for employee dashboard routes
  const isEmployeeRoute = location.pathname.startsWith('/employee');
  return (
    <ToastProvider>
      <ToastSocketBridge />
      <ModalProvider>
        <SkillMatesProvider>
          <ModalBodyScrollLock />
          <GlobalModals />
          <SkillMatesModal />
          {/* Main content with fade-in transition */}
          <div
            className={`transition-opacity duration-500 ${
              showContent ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {!isAdminUser && !isEmployeeRoute && !isAuthPage && !isRatingPage && <Navbar />}
            {element}
            {!isAdminUser && !isEmployeeRoute && !isAuthPage && !isRatingPage && <Footer />}
          </div>
        </SkillMatesProvider>
      </ModalProvider>
    </ToastProvider>
  );
}

export default App;
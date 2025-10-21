import React, { useEffect } from 'react';
import { useLocation, useRoutes, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { ModalProvider } from './context/ModalContext';
import ModalBodyScrollLock from './ModalBodyScrollLock';
import GlobalModals from './GlobalModals';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext.jsx';
import RegisterInterviewer from './user/RegisterInterviewer.jsx';
import socket from './socket';

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
import HistoryPage from './user/HistoryPage';
import HelpSupportPage from './user/HelpSupportPage';
import GoPro from './user/HomeSection/GoPro';
import AccountSettings from './user/AccountSettings';
import Package from './user/Package';
import privateProfileRoutes from './user/privateProfile/privateProfileRoutes';
import PrivateProfile from './user/PrivateProfile';
import PublicProfile from './user/PublicProfile';
import publicProfileRoutes from './user/publicProfile/publicProfileRoutes';
import StartSkillSwap from './user/StartSkillSwap';
import SessionRequests from './user/SessionRequests';
import InterviewCallPage from './components/InterviewCallPage';
import accountSettingsRoutes from './user/settings/AccountSettingsRoutes';
import ReportPage from './user/privateProfile/Report';
import TeachingHistory from './user/TeachingHistory';
import CompleteProfile from './user/myprofile/CompleteProfile';
import Blog from './user/company/Blog';
import SearchPage from './user/SearchPage';
import AdminPanel from './admin/adminpanel';
import AdminRoute from './routes/AdminRoute';
import InterviewerApplications from './admin/InterviewerApplications';
import PrivacyPolicy from './PrivacyPolicy.jsx';
import Community from './Community.jsx';
import FAQ from './FAQ.jsx';
import TermsConditions from './TermsConditions.jsx';
import CookiesPolicy from './CookiesPolicy.jsx';
import About from './About.jsx';
import Career from './Career.jsx';
import YourInterviews from './user/YourInterviews';

// Define routes
const appRoutes = [
  // Public routes (accessible without authentication)
  { path: '/', element: <Navigate to="/home" replace /> },
  { path: '/home', element: <Home /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/privacy-policy', element: <PrivacyPolicy /> },
  { path: '/community', element: <Community /> },
  { path: '/about', element: <About /> },
  { path: '/faq', element: <FAQ /> },
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
  { path: '/register-interviewer', element: <RegisterInterviewer />} ,
  { path: '/interview-call/:sessionId', element: <ProtectedRoute><InterviewCallPage /></ProtectedRoute> },
  { path: '/testimonials', element: <ProtectedRoute><Testimonial showAll={true} /></ProtectedRoute> },
  { path: '/your-profile', element: <ProtectedRoute><Profile /></ProtectedRoute> },
  { path: '/createSession', element: <ProtectedRoute><CreateSession /></ProtectedRoute> },
  { path: '/package', element: <ProtectedRoute><Package /></ProtectedRoute> },
  { path: '/learning-history', element: <ProtectedRoute><HistoryPage /></ProtectedRoute> },
  { path: '/help', element: <ProtectedRoute><HelpSupportPage /></ProtectedRoute> },
  { path: '/pro', element: <ProtectedRoute><GoPro /></ProtectedRoute> },
  { path: '/accountSettings', element: <ProtectedRoute><AccountSettings /></ProtectedRoute> },
  { path: '/StartSkillSwap', element: <ProtectedRoute><StartSkillSwap /></ProtectedRoute> },
  { path: '/report', element: <ProtectedRoute><ReportPage /></ProtectedRoute> },
  { path: '/teaching-history', element: <ProtectedRoute><TeachingHistory /></ProtectedRoute> },
  { path: '/blog', element: <ProtectedRoute><Blog /></ProtectedRoute> },
  { path: '/search', element: <ProtectedRoute><SearchPage /></ProtectedRoute> },
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
        element: <ProtectedRoute><InterviewerApplications /></ProtectedRoute>,
      },
    ],
  },
  ...accountSettingsRoutes.map(route => ({
    ...route,
    element: <ProtectedRoute>{route.element}</ProtectedRoute>,
  })),
  {
    path: '/profile',
    element: <ProtectedRoute><PrivateProfile /></ProtectedRoute>,
    children: privateProfileRoutes.map(route => ({
      ...route,
      element: <ProtectedRoute>{route.element}</ProtectedRoute>,
    })),
  },
  {
    path: '/public-profile',
    element: <ProtectedRoute><PublicProfile /></ProtectedRoute>,
    children: publicProfileRoutes.map(route => ({
      ...route,
      element: <ProtectedRoute>{route.element}</ProtectedRoute>,
    })),
  },
];

// Updated ProtectedRouteWithModal to redirect to login page
function ProtectedRouteWithModal({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    // Redirect to login page, preserving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function App() {
  const { user, loading, setUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const element = useRoutes(appRoutes);

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
  }, [user?._id]);

  // Handle logout
  useEffect(() => {
    const handleAuthChange = () => {
      if (socket.connected) {
        socket.disconnect();
        console.info('[DEBUG] Socket disconnected on auth change');
      }
      setUser(null);
      navigate('/login', { replace: true }); // Redirect to login on logout
    };

    window.addEventListener('authChanged', handleAuthChange);
    return () => window.removeEventListener('authChanged', handleAuthChange);
  }, [navigate, setUser]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ModalProvider>
      <ModalBodyScrollLock />
      <GlobalModals />
      {!isAuthPage && <Navbar />}
      <div className={location.pathname === '/home' ? '' : 'pt-8'}>
        {element}
        {user && <CompleteProfile />}
      </div>
      {!isAuthPage && <Footer />}
    </ModalProvider>
  );
}

export default App;
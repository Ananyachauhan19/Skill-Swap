import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RootRedirect = () => {
  const { user, loading } = useAuth();

  console.log('[ROOT REDIRECT] User:', user);
  console.log('[ROOT REDIRECT] Loading:', loading);

  if (loading) {
    return null; // or a loading spinner
  }

  // If user is a campus ambassador
  if (user && (user.role === 'campus_ambassador' || user.isCampusAmbassador)) {
    console.log('[ROOT REDIRECT] Campus ambassador detected');
    if (user.isFirstLogin) {
      console.log('[ROOT REDIRECT] Redirecting to change-password');
      return <Navigate to="/change-password" replace />;
    }
    console.log('[ROOT REDIRECT] Redirecting to campus-ambassador');
    return <Navigate to="/campus-ambassador" replace />;
  }

  // Default redirect
  console.log('[ROOT REDIRECT] Redirecting to home');
  return <Navigate to="/home" replace />;
};

export default RootRedirect;

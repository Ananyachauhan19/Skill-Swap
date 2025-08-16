import React, { useEffect } from 'react';
import Cookies from 'js-cookie';
import { BACKEND_URL } from '../config.js';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProfileDropdown = ({ show, onClose, menuRef }) => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!show) return;
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [show, onClose, menuRef]);

  if (!show) return null;

  const handleLogout = async () => {
    try {
      // Clear all cookies
      Object.keys(Cookies.get()).forEach(cookieName => Cookies.remove(cookieName, { path: '/', domain: window.location.hostname }));
      
      // Clear localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();

      // Make logout API call for regular and Google login
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Clear user context
      setUser(null);

      // Dispatch auth change event
      window.dispatchEvent(new Event('authChanged'));

      // Close dropdown and redirect to /home
      onClose();
      navigate('/home', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      // Clear client-side data and redirect even on error
      Object.keys(Cookies.get()).forEach(cookieName => Cookies.remove(cookieName, { path: '/', domain: window.location.hostname }));
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
      window.dispatchEvent(new Event('authChanged'));
      onClose();
      navigate('/home', { replace: true });
    }
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg z-50 flex flex-col p-4"
    >
      {user ? (
        <>
          <button
            className="text-left px-4 py-2 hover:bg-blue-50 rounded"
            onClick={() => { onClose(); navigate('/profile'); }}
          >
            Profile
          </button>
          <button
            className="text-left px-4 py-2 hover:bg-blue-50 rounded"
            onClick={() => { onClose(); navigate('/createSession'); }}
          >
            Schedule Sessions
          </button>
          <button
            className="text-left px-4 py-2 hover:bg-blue-50 rounded"
            onClick={() => { onClose(); navigate('/learning-history'); }}
          >
            Learning History
          </button>
          <button
            className="text-left px-4 py-2 hover:bg-blue-50 rounded"
            onClick={() => { onClose(); navigate('/teaching-history'); }}
          >
            Teaching History
          </button>
          <button
            className="text-left px-4 py-2 hover:bg-blue-50 rounded"
            onClick={() => { onClose(); navigate('/package'); }}
          >
            Purchase
          </button>
          {user.isAdmin && (
            <button
              className="text-left px-4 py-2 hover:bg-blue-50 rounded"
              onClick={() => { onClose(); navigate('/admin'); }}
            >
              Admin Panel
            </button>
          )}
          <button
            className="text-left px-4 py-2 hover:bg-blue-50 rounded"
            onClick={() => { onClose(); navigate('/help'); }}
          >
            Help & Support
          </button>
          <button
            className="text-left px-4 py-2 hover:bg-red-50 text-red-600 rounded"
            onClick={handleLogout}
          >
            Logout
          </button>
        </>
      ) : (
        <button
          className="text-left px-4 py-2 hover:bg-blue-50 rounded"
          onClick={() => { onClose(); navigate('/login'); }}
        >
          Login
        </button>
      )}
    </div>
  );
};

export default ProfileDropdown;
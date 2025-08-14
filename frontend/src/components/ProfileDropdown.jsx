import React, { useEffect } from 'react';
import Cookies from 'js-cookie';
import { BACKEND_URL } from '../config.js';
import { useAuth } from '../context/AuthContext';

const ProfileDropdown = ({ show, onClose, navigate, menuRef }) => {
  const { user, setUser } = useAuth();
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
  return (
    <div
      ref={menuRef}
      className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg z-50 flex flex-col p-4"
    >
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
      {user && user.isAdmin && (
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
        onClick={async () => {
          // Clear all cookies
          Object.keys(Cookies.get()).forEach(cookieName => Cookies.remove(cookieName));
          localStorage.removeItem('token');
          await fetch(`${BACKEND_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
          setUser(null); // Clear user from auth context
          window.dispatchEvent(new Event('authChanged'));
          onClose();
          navigate('/login'); // Redirect to login page
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default ProfileDropdown;
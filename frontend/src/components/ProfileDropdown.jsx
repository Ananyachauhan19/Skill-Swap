import React, { useEffect } from 'react';
import Cookies from 'js-cookie';

const ProfileDropdown = ({ show, onClose, navigate, menuRef }) => {
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
        onClick={() => { onClose(); navigate('/history'); }}
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
        Package
      </button>
      <button
        className="text-left px-4 py-2 hover:bg-blue-50 rounded"
        onClick={() => { onClose(); navigate('/help'); }}
      >
        Help & Support
      </button>
      
      <button
        className="text-left px-4 py-2 hover:bg-red-50 text-red-600 rounded"
        onClick={async () => {
          Cookies.remove('user');
          localStorage.removeItem('token'); // Remove token from localStorage
          await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
          window.dispatchEvent(new Event('authChanged'));
          onClose();
          navigate('/home');
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default ProfileDropdown;

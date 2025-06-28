import React, { useEffect } from 'react';

const ProfileDropdown = ({ show, onClose, navigate, menuRef }) => {
  // Close menu if clicked outside
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
      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg z-50 flex flex-col p-4"
    >
      <button
        className="text-left px-4 py-2 hover:bg-blue-50 rounded"
        onClick={() => { onClose(); navigate('/profile'); }}
      >
        Your Profile
      </button>
      <button
        className="text-left px-4 py-2 hover:bg-blue-50 rounded"
        onClick={() => { onClose(); navigate('/progress'); }}
      >
        Your Progress
      </button>
      <button
        className="text-left px-4 py-2 hover:bg-blue-50 rounded"
        onClick={() => { onClose(); navigate('/help'); }}
      >
        Help & Support
      </button>
      <button
        className="text-left px-4 py-2 hover:bg-red-50 text-red-600 rounded"
        onClick={() => {
          localStorage.removeItem('isRegistered');
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

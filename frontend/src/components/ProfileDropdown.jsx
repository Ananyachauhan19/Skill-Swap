import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProfileDropdown = ({ show, onClose, menuRef }) => {
  const { user, logout } = useAuth();
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

  const go = (path) => {
    onClose();
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await logout();             // centralized logout (Google + backend + clear)
    } finally {
      onClose();
      navigate('/home', { replace: true }); // always land on /home after logout
    }
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg z-50 flex flex-col p-4"
    >
      {user ? (
        <>
          <button className="text-left px-4 py-2 hover:bg-blue-50 rounded" onClick={() => go('/profile')}>
            Profile
          </button>
          <button className="text-left px-4 py-2 hover:bg-blue-50 rounded" onClick={() => go('/createSession')}>
            Schedule Sessions
          </button>
          <button className="text-left px-4 py-2 hover:bg-blue-50 rounded" onClick={() => go('/learning-history')}>
            Learning History
          </button>
          <button className="text-left px-4 py-2 hover:bg-blue-50 rounded" onClick={() => go('/teaching-history')}>
            Teaching History
          </button>
          <button className="text-left px-4 py-2 hover:bg-blue-50 rounded" onClick={() => go('/package')}>
            Purchase
          </button>
          {user.isAdmin && (
            <button className="text-left px-4 py-2 hover:bg-blue-50 rounded" onClick={() => go('/admin')}>
              Admin Panel
            </button>
          )}
          <button className="text-left px-4 py-2 hover:bg-blue-50 rounded" onClick={() => go('/help')}>
            Help & Support
          </button>
          <button className="text-left px-4 py-2 hover:bg-red-50 text-red-600 rounded" onClick={handleLogout}>
            Logout
          </button>
        </>
      ) : (
        <button
          className="text-left px-4 py-2 hover:bg-blue-50 rounded"
          onClick={() => {
            onClose();
            navigate('/login');
          }}
        >
          Login
        </button>
      )}
    </div>
  );
};

export default ProfileDropdown;
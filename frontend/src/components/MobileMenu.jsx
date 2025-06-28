import React from 'react';

const MobileMenu = ({ isLoggedIn, navigate, setShowProfileMenu, showProfileMenu, menuRef, setMenuOpen, ProfileDropdown }) => (
  <div className="flex flex-col gap-4 mt-4">
    <button
      className="text-base font-medium px-3 py-1 rounded transition hover:bg-blue-50"
      onClick={() => { navigate('/'); setMenuOpen(false); }}
    >
      Home
    </button>
    <button
      className="text-base font-medium px-3 py-1 rounded transition hover:bg-blue-50"
      onClick={() => { navigate('/one-on-one'); setMenuOpen(false); }}
    >
      1-on-1
    </button>
    <button
      className="text-base font-medium px-3 py-1 rounded transition hover:bg-blue-50"
      onClick={() => { navigate('/discuss'); setMenuOpen(false); }}
    >
      Discuss
    </button>
    <button
      className="text-base font-medium px-3 py-1 rounded transition hover:bg-blue-50"
      onClick={() => { navigate('/interview'); setMenuOpen(false); }}
    >
      Interview
    </button>
    <div className="flex items-center gap-4 mt-2">
      {!isLoggedIn ? (
        <button
          className="bg-blue-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-600 transition w-full"
          onClick={() => { navigate('/login'); setMenuOpen(false); }}
        >
          Login
        </button>
      ) : (
        <div className="relative w-full flex justify-center">
          <button
            className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg border-2 border-blue-300 hover:bg-blue-200 transition"
            onClick={() => setShowProfileMenu((v) => !v)}
            title="Profile"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
          {ProfileDropdown && <ProfileDropdown show={showProfileMenu} onClose={() => setShowProfileMenu(false)} navigate={navigate} menuRef={menuRef} />}
        </div>
      )}
    </div>
  </div>
);

export default MobileMenu;

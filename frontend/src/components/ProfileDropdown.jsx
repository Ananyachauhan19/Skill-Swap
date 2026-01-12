import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSkillMates } from '../context/SkillMatesContext.jsx';

// Icons (you can replace these with your actual icon components or use an icon library)
const ProfileIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const SkillMatesIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const InterviewIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const ScheduleIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const LearningIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const TeachingIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v6l9-5M12 20l-9-5" /></svg>;
const CoinIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>;
const PurchaseIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
const PackageIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const TutorIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>;
const InterviewerIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const VerificationIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const AdminIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const HelpIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const LogoutIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const LoginIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>;
const CampusDashboardIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const HistoryIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ChevronDownIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
const ChevronUpIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>;

const ProfileDropdown = ({ show, onClose, menuRef }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { count: skillMateCount, refresh: refreshSkillMates } = useSkillMates();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);

  useEffect(() => {
    if (!show) return;

    // Refresh SkillMates so the badge stays accurate
    try {
      refreshSkillMates?.();
    } catch {
      /* ignore */
    }

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

  const userSkillMatesCount = Array.isArray(user?.skillMates) ? user.skillMates.length : undefined;
  const displaySkillMateCount =
    typeof skillMateCount === 'number' && typeof userSkillMatesCount === 'number'
      ? Math.max(skillMateCount, userSkillMatesCount)
      : typeof skillMateCount === 'number'
        ? skillMateCount
        : userSkillMatesCount;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      onClose();
      setTimeout(() => {
        navigate('/home', { replace: true });
      }, 100);
    }
  };

  const MenuItem = ({ icon: Icon, label, onClick, count, isDanger = false }) => (
    <button
      className={`flex items-center w-full px-4 py-3 text-sm transition-all duration-200 rounded-lg ${
        isDanger 
          ? 'text-red-600 hover:bg-red-50 hover:text-red-700' 
          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
      }`}
      onClick={onClick}
    >
      <Icon />
      <span className="ml-3 flex-1 text-left">{label}</span>
      {typeof count === 'number' && (
        <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-600 rounded-full">
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div
      ref={menuRef}
      className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-blue-100 z-[5100] overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e6f3ff 100%)'
      }}
    >
      {/* Header */}
      {user && (
        <div className="px-6 py-4 border-b border-blue-200 bg-white">
          <div className="flex items-center">
            {user.profilePic ? (
              <img
                src={user.profilePic}
                alt={(user.firstName || user.username || 'User') + ' avatar'}
                className="w-10 h-10 rounded-full object-cover border border-blue-200"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {((user.firstName && user.firstName[0]) || (user.username && user.username[0]) || 'U').toUpperCase()}
              </div>
            )}
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-semibold text-gray-900">
                {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.name || 'User'}
              </h3>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="p-3 space-y-1">
        {user ? (
          <>
            <MenuItem icon={ProfileIcon} label="Profile" onClick={() => go('/profile')} />
            <MenuItem 
              icon={SkillMatesIcon} 
              label="SkillMates" 
              onClick={() => go('/chat')} 
              count={typeof displaySkillMateCount === 'number' ? displaySkillMateCount : undefined}
            />
            <MenuItem icon={CampusDashboardIcon} label="Campus Dashboard" onClick={() => go('/campus-dashboard')} />
            <MenuItem icon={InterviewIcon} label="Your Interviews" onClick={() => go('/your-interviews')} />
            
            {/* Your History Dropdown */}
            <div>
              <button
                className="flex items-center w-full px-4 py-3 text-sm transition-all duration-200 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              >
                <HistoryIcon />
                <span className="ml-3 flex-1 text-left">Your History</span>
                {isHistoryOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
              </button>
              
              {isHistoryOpen && (
                <div className="ml-8 mt-1 space-y-1 border-l-2 border-blue-100 pl-2">
                  <button
                    className="flex items-center w-full px-3 py-2 text-xs transition-all duration-200 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                    onClick={() => go('/coins-history')}
                  >
                    <CoinIcon />
                    <span className="ml-2">Coin History</span>
                  </button>
                  <button
                    className="flex items-center w-full px-3 py-2 text-xs transition-all duration-200 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                    onClick={() => go('/learning-history')}
                  >
                    <LearningIcon />
                    <span className="ml-2">Learning History</span>
                  </button>
                  <button
                    className="flex items-center w-full px-3 py-2 text-xs transition-all duration-200 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                    onClick={() => go('/teaching-history')}
                  >
                    <TeachingIcon />
                    <span className="ml-2">Teaching History</span>
                  </button>
                </div>
              )}
            </div>
            
            <MenuItem icon={PackageIcon} label="Purchase" onClick={() => go('/pro')} />
            
            {/* Verification Dropdown */}
            <div>
              <button
                className="flex items-center w-full px-4 py-3 text-sm transition-all duration-200 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                onClick={() => setIsVerificationOpen(!isVerificationOpen)}
              >
                <VerificationIcon />
                <span className="ml-3 flex-1 text-left">Verification</span>
                {isVerificationOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
              </button>
              
              {isVerificationOpen && (
                <div className="ml-8 mt-1 space-y-1 border-l-2 border-blue-100 pl-2">
                  <button
                    className="flex items-center w-full px-3 py-2 text-xs transition-all duration-200 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                    onClick={() => go('/tutor/status')}
                  >
                    <TutorIcon />
                    <span className="ml-2">Tutor Verification</span>
                  </button>
                  <button
                    className="flex items-center w-full px-3 py-2 text-xs transition-all duration-200 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                    onClick={() => go('/interviewer/status')}
                  >
                    <InterviewerIcon />
                    <span className="ml-2">Interviewer Verification</span>
                  </button>
                </div>
              )}
            </div>
            
            {user.isAdmin && (
              <MenuItem icon={AdminIcon} label="Admin Panel" onClick={() => go('/admin')} />
            )}
            
            <div className="border-t border-blue-200 my-2"></div>
            
            <MenuItem icon={HelpIcon} label="Help & Support" onClick={() => go('/help')} />
            <MenuItem icon={LogoutIcon} label="Logout" onClick={handleLogout} isDanger />
          </>
        ) : (
          <MenuItem icon={LoginIcon} label="Login" onClick={() => { onClose(); navigate('/login'); }} />
        )}
      </div>
    </div>
  );
};

export default ProfileDropdown;
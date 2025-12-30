import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, FileSpreadsheet, LogOut, School, Upload, UserCircle2, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCampusAmbassador } from '../context/CampusAmbassadorContext';

const CampusAmbassadorNavbar = ({ onOpenCollegeAssignment, onOpenUploadCollege, onOpenUploadTest, onOpenActivityProfile }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { selectedInstitute, setSelectedInstitute } = useCampusAmbassador();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (event) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <nav className="fixed top-0 left-0 w-full h-[72px] bg-white/80 backdrop-blur-md border-b border-blue-100 z-50">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 px-2 py-1">
          <img
            src="https://res.cloudinary.com/dbltazdsa/image/upload/v1766589377/webimages/skillswap-logo.png"
            alt="SkillSwapHub"
            className="h-9 w-9 rounded-full object-contain border border-blue-900/20 bg-white"
          />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-blue-950">SkillSwapHub</div>
            <div className="text-[11px] text-slate-500">Campus Ambassador</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {typeof onOpenUploadCollege === 'function' && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenUploadCollege();
              }}
              className="h-9 px-3 rounded-full border border-blue-100 bg-blue-900 hover:bg-blue-950 transition inline-flex items-center gap-2"
              aria-label="Upload college"
              title="Upload college"
            >
              <Upload size={16} className="text-white" />
              <span className="text-xs font-semibold text-white">Upload College</span>
            </button>
          )}

          {typeof onOpenUploadTest === 'function' && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenUploadTest();
              }}
              className="h-9 px-3 rounded-full border border-blue-100 bg-white hover:bg-blue-50/50 transition inline-flex items-center gap-2"
              aria-label="Upload test"
              title="Upload test"
            >
              <FileSpreadsheet size={16} className="text-blue-900" />
              <span className="text-xs font-semibold text-blue-950">Upload Test</span>
            </button>
          )}

          {typeof onOpenCollegeAssignment === 'function' && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenCollegeAssignment();
              }}
              className="h-9 px-3 rounded-full border border-blue-100 bg-white hover:bg-blue-50/50 transition inline-flex items-center gap-2"
              aria-label="College assignment"
              title="College assignment"
            >
              <School size={16} className="text-blue-900" />
              <span className="text-xs font-semibold text-blue-950">College Assignment</span>
            </button>
          )}

          {selectedInstitute?._id && (
            <button
              type="button"
              onClick={() => {
                setSelectedInstitute(null);
                setOpen(false);
              }}
              className="h-9 px-3 rounded-full border border-blue-100 bg-white hover:bg-blue-50/50 transition inline-flex items-center gap-2"
              aria-label="Back to colleges"
              title="Back to colleges"
            >
              <ArrowLeft size={16} className="text-blue-900" />
              <span className="text-xs font-semibold text-blue-950">Back</span>
            </button>
          )}

          {typeof onOpenActivityProfile === 'function' && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenActivityProfile();
              }}
              className="h-9 px-3 rounded-full border border-blue-100 bg-white hover:bg-blue-50/50 transition inline-flex items-center gap-2"
              aria-label="Activity Profile"
              title="Activity Profile"
            >
              <Activity size={16} className="text-blue-900" />
              <span className="text-xs font-semibold text-blue-950">Activity Profile</span>
            </button>
          )}

          <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="h-9 w-9 rounded-full border border-blue-100 bg-white hover:bg-blue-50/50 transition flex items-center justify-center"
            aria-label="Profile"
            aria-expanded={open}
          >
            <UserCircle2 size={18} className="text-blue-900" />
          </button>

          <div
            className={`absolute right-0 mt-2 w-64 origin-top-right rounded-xl border border-blue-100 bg-white shadow-lg transition-all duration-200 ${
              open ? 'opacity-100 scale-100 translate-y-0' : 'pointer-events-none opacity-0 scale-[0.98] -translate-y-1'
            }`}
            role="menu"
          >
            <div className="px-4 py-3 border-b border-blue-100">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Profile</p>
              <p className="mt-2 text-sm font-semibold text-slate-900 truncate">
                {user?.name || user?.fullName || 'User'}
              </p>
              <p className="mt-1 text-xs text-slate-600 truncate">{user?.email || '—'}</p>
            </div>
            <div className="px-2 py-2">
              <button
                type="button"
                onClick={async () => {
                  setOpen(false);
                  await logout();
                  navigate('/login');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition"
              >
                <LogOut size={16} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default CampusAmbassadorNavbar;

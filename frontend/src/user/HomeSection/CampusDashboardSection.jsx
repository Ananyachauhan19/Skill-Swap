import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const CampusDashboardSection = ({
  totalCampusCollaborations = 0,
  totalStudentsOnDashboard = 0,
  imageSrc = 'https://res.cloudinary.com/dbltazdsa/image/upload/v1766937373/campusdashboard_n0ammq.png',
  imageAlt = 'Campus Dashboard illustration',
  onJoin,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const hasJoinedCampusDashboard = Boolean(user?.instituteId);

  const handleCtaClick = () => {
    if (hasJoinedCampusDashboard) {
      navigate('/campus-dashboard');
      return;
    }
    if (typeof onJoin === 'function') {
      onJoin();
      return;
    }
    navigate('/campus-dashboard');
  };

  return (
    <section className="relative py-16 sm:py-20 lg:py-28 overflow-hidden bg-home-bg">
      {/* Background Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.06),transparent)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/80 backdrop-blur-sm px-4 py-1.5 shadow-sm">
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
              </span>
              <span className="text-xs font-semibold text-blue-900 tracking-wide uppercase">
                Campus Dashboard
              </span>
            </div>

            {/* Title */}
            <div className="space-y-5">
              <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-slate-900 leading-[1.15] tracking-tight">
                Structured Academic{' '}
                <span className="relative">
                  <span className="text-blue-700">Collaboration</span>
                  <svg
                    className="absolute -bottom-1 left-0 w-full h-2 text-blue-200"
                    viewBox="0 0 200 8"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0 7c50-6 100-6 200 0"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>{' '}
                for Institutions
              </h2>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg">
                The Campus Dashboard enables schools and universities to centralize
                student learning through coordinated one-on-one sessions, structured
                assignments, and institution-aligned academic progress tracking.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="flex flex-wrap gap-4">
              {/* Stat 1 */}
              <div className="group flex-1 min-w-[180px] rounded-2xl border border-blue-100/80 bg-white/90 backdrop-blur-sm p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm">
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                      <path
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-16 0H3m5-12h6m-6 4h6m-6 4h4"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Institutions
                  </span>
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-slate-900 tabular-nums">
                  {Number.isFinite(totalCampusCollaborations)
                    ? totalCampusCollaborations.toLocaleString()
                    : totalCampusCollaborations}
                </div>
                <div className="mt-1 text-sm text-slate-600 font-medium">
                  Total Campus Collaborations
                </div>
              </div>

              {/* Stat 2 */}
              <div className="group flex-1 min-w-[180px] rounded-2xl border border-blue-100/80 bg-white/90 backdrop-blur-sm p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-sm">
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                      <path
                        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm14 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Students
                  </span>
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-slate-900 tabular-nums">
                  {Number.isFinite(totalStudentsOnDashboard)
                    ? totalStudentsOnDashboard.toLocaleString()
                    : totalStudentsOnDashboard}
                </div>
                <div className="mt-1 text-sm text-slate-600 font-medium">
                  Total Students on Dashboard
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleCtaClick}
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 hover:from-blue-700 hover:to-blue-800"
              >
                {hasJoinedCampusDashboard ? 'Visit Campus Dashboard' : 'Join Campus Dashboard'}
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Right Visual Area */}
          <div className="relative">
            <div className="relative z-10 rounded-3xl overflow-hidden">
              <img
                src={imageSrc}
                alt={imageAlt}
                className="w-full h-[360px] sm:h-[420px] lg:h-[560px] object-contain"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CampusDashboardSection;

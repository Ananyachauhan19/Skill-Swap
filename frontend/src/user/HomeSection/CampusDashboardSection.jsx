import React from 'react';

const CampusDashboardSection = ({
  totalCampusCollaborations = 0,
  totalStudentsOnDashboard = 0,
  imageSrc,
  imageAlt = 'Campus Dashboard illustration',
  onJoin,
}) => {
  return (
    <section className="relative py-16 sm:py-20 lg:py-28 overflow-hidden bg-home-bg">
      {/* Background Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.06),transparent)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-campus-badge-border bg-campus-badge-bg backdrop-blur-sm px-4 py-1.5 shadow-sm">
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-campus-badge-dot opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-campus-badge-dot" />
              </span>
              <span className="text-xs font-semibold text-campus-badge-text tracking-wide uppercase">
                Campus Dashboard
              </span>
            </div>

            {/* Title */}
            <div className="space-y-5">
              <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-campus-title leading-[1.15] tracking-tight">
                Structured Academic{' '}
                <span className="relative">
                  <span className="text-campus-title-accent">Collaboration</span>
                  <svg
                    className="absolute -bottom-1 left-0 w-full h-2 text-campus-badge-border"
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

              <p className="text-base sm:text-lg text-campus-body-text leading-relaxed max-w-lg">
                The Campus Dashboard enables schools and universities to centralize
                student learning through coordinated one-on-one sessions, structured
                assignments, and institution-aligned academic progress tracking.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="flex flex-wrap gap-4">
              {/* Stat 1 */}
              <div className="group flex-1 min-w-[180px] rounded-2xl border border-campus-stat-border bg-campus-stat-bg backdrop-blur-sm p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-campus-stat-border-hover">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-campus-stat-icon-1-start to-campus-stat-icon-1-end text-text-inverted shadow-sm">
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
                  <span className="text-xs font-medium text-campus-stat-label uppercase tracking-wider">
                    Institutions
                  </span>
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-campus-stat-value tabular-nums">
                  {Number.isFinite(totalCampusCollaborations)
                    ? totalCampusCollaborations.toLocaleString()
                    : totalCampusCollaborations}
                </div>
                <div className="mt-1 text-sm text-slate-600 font-medium">
                  Total Campus Collaborations
                </div>
              </div>

              {/* Stat 2 */}
              <div className="group flex-1 min-w-[180px] rounded-2xl border border-campus-stat-border bg-campus-stat-bg backdrop-blur-sm p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-campus-stat-border-hover">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-campus-stat-icon-2-start to-campus-stat-icon-2-end text-text-inverted shadow-sm">
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
                onClick={() => (typeof onJoin === 'function' ? onJoin() : undefined)}
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-campus-cta-bg-start to-campus-cta-bg-end px-6 py-3.5 text-base font-semibold text-text-inverted shadow-lg shadow-campus-cta-shadow transition-all duration-300 hover:shadow-xl hover:shadow-campus-cta-shadow hover:from-campus-cta-bg-hover-start hover:to-campus-cta-bg-hover-end"
              >
                Join Campus Dashboard
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
            {/* Main Image Container */}
            <div className="relative z-10">
              {imageSrc ? (
                <div className="rounded-3xl overflow-hidden border border-slate-200/60 bg-white shadow-2xl shadow-slate-900/10">
                  <img
                    src={imageSrc}
                    alt={imageAlt}
                    className="w-full h-[360px] sm:h-[420px] lg:h-[500px] object-cover"
                  />
                </div>
              ) : (
                <div className="rounded-3xl overflow-hidden border border-campus-image-border bg-bg-card shadow-2xl shadow-shadow-strong">
                  <div className="w-full h-[360px] sm:h-[420px] lg:h-[500px] bg-gradient-to-br from-campus-placeholder-bg-start via-bg-card to-campus-placeholder-bg-end flex items-center justify-center p-8">
                    {/* Placeholder Visual Grid */}
                    <div className="w-full max-w-sm space-y-4">
                      {/* Header bar */}
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                        <div className="h-8 w-8 rounded-lg bg-blue-100" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-2.5 w-24 rounded bg-slate-200" />
                          <div className="h-2 w-16 rounded bg-slate-100" />
                        </div>
                        <div className="h-6 w-6 rounded-full bg-green-100" />
                      </div>

                      {/* Content rows */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                          <div className="h-6 w-6 rounded bg-blue-100 mb-2" />
                          <div className="h-2 w-full rounded bg-slate-200 mb-1" />
                          <div className="h-2 w-3/4 rounded bg-slate-100" />
                        </div>
                        <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                          <div className="h-6 w-6 rounded bg-indigo-100 mb-2" />
                          <div className="h-2 w-full rounded bg-slate-200 mb-1" />
                          <div className="h-2 w-2/3 rounded bg-slate-100" />
                        </div>
                      </div>

                      {/* Progress section */}
                      <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="h-2.5 w-20 rounded bg-slate-200" />
                          <div className="h-2 w-8 rounded bg-blue-100" />
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full w-3/5 rounded-full bg-gradient-to-r from-blue-400 to-blue-500" />
                        </div>
                      </div>

                      {/* Bottom cards */}
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded-lg bg-white border border-slate-100 shadow-sm text-center"
                          >
                            <div className="h-5 w-5 mx-auto rounded bg-blue-50 mb-1.5" />
                            <div className="h-1.5 w-full rounded bg-slate-100" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Floating Visual Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-100/50 rounded-full blur-2xl" />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-indigo-100/50 rounded-full blur-2xl" />

            {/* Floating Cards (Visual Promotion) */}
            <div className="hidden lg:block absolute -left-8 top-1/4 z-20">
                <div className="p-3 rounded-xl bg-campus-float-card-bg backdrop-blur border border-campus-float-card-border shadow-lg animate-float-slow">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-campus-float-icon-1 to-status-success-icon flex items-center justify-center text-text-inverted">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">Syllabus</div>
                    <div className="text-[10px] text-slate-500">Aligned</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden lg:block absolute -right-6 top-12 z-20">
              <div className="p-3 rounded-xl bg-white/95 backdrop-blur border border-slate-100 shadow-lg animate-float-delayed">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path d="M5.127 3.502L5.25 3.5h9.5c.041 0 .082 0 .123.002A2.251 2.251 0 0012.75 2h-5.5a2.25 2.25 0 00-2.123 1.502zM1 10.25A2.25 2.25 0 013.25 8h13.5A2.25 2.25 0 0119 10.25v5.5A2.25 2.25 0 0116.75 18H3.25A2.25 2.25 0 011 15.75v-5.5zM3.25 6.5c-.04 0-.082 0-.123.002A2.25 2.25 0 015.25 5h9.5c.98 0 1.814.627 2.123 1.502a3.819 3.819 0 00-.123-.002H3.25z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">Weekly</div>
                    <div className="text-[10px] text-slate-500">Structured</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden lg:block absolute -left-4 bottom-16 z-20">
              <div className="p-3 rounded-xl bg-white/95 backdrop-blur border border-slate-100 shadow-lg animate-float">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-400 to-violet-500 flex items-center justify-center text-white">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.919z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">Progress</div>
                    <div className="text-[10px] text-slate-500">Tracking</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden lg:block absolute right-8 bottom-8 z-20">
              <div className="p-3 rounded-xl bg-white/95 backdrop-blur border border-slate-100 shadow-lg animate-float-slow">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path
                        fillRule="evenodd"
                        d="M9.664 1.319a.75.75 0 01.672 0 41.059 41.059 0 018.198 5.424.75.75 0 01-.254 1.285 31.372 31.372 0 00-7.86 3.83.75.75 0 01-.84 0 31.508 31.508 0 00-7.86-3.83.75.75 0 01-.254-1.285 41.059 41.059 0 018.198-5.424zM6.303 10.104a31.994 31.994 0 015.697 3.28.75.75 0 001 0 32.058 32.058 0 015.697-3.28.75.75 0 01.553 1.392 30.565 30.565 0 00-5.697 3.281.75.75 0 01-1.106 0 30.565 30.565 0 00-5.697-3.281.75.75 0 01.553-1.392z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">Institution</div>
                    <div className="text-[10px] text-slate-500">Insights</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Animation Styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite;
          animation-delay: 0.5s;
        }
        .animate-float-delayed {
          animation: float-delayed 3.5s ease-in-out infinite;
          animation-delay: 1s;
        }
      `}</style>
    </section>
  );
};

export default CampusDashboardSection;

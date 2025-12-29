import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Video, ClipboardList, TrendingUp } from 'lucide-react';

const FeatureDashboard = ({ activeView }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const view = params.get('view') || activeView || 'home';
    return {
      oneOnOne: location.pathname === '/campus/one-on-one',
      assessments: location.pathname === '/campus-dashboard' && view === 'assessments',
      progress: location.pathname === '/learning-history',
    };
  }, [location.pathname, location.search, activeView]);

  const tabs = useMemo(
    () => [
      {
        key: 'oneOnOne',
        label: '1-on-1 Sessions',
        description: 'Connect with peers and exchange skills in focused sessions.',
        Icon: Video,
        accent: 'from-purple-100 via-white to-purple-50',
        iconBg: 'bg-blue-50',
        iconFg: 'text-blue-700',
        onClick: () => navigate('/campus/one-on-one'),
        active: isActive.oneOnOne,
      },
      {
        key: 'assessments',
        label: 'Assessments',
        description: 'Practice with structured tests and track your improvement.',
        Icon: ClipboardList,
        accent: 'from-sky-100 via-white to-sky-50',
        iconBg: 'bg-blue-50',
        iconFg: 'text-blue-700',
        onClick: () => navigate('/campus-dashboard?view=assessments'),
        active: isActive.assessments,
      },
      {
        key: 'progress',
        label: 'Progress',
        description: 'See learning history and understand your growth over time.',
        Icon: TrendingUp,
        accent: 'from-rose-100 via-white to-rose-50',
        iconBg: 'bg-blue-50',
        iconFg: 'text-blue-700',
        onClick: () => navigate('/learning-history'),
        active: isActive.progress,
      },
    ],
    [navigate, isActive]
  );

  return (
    <section className="w-full">
      <div className="text-center">
        <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-blue-950">
          Explore Opportunities
        </h3>
        <p className="mt-3 text-base text-slate-600">
          Discover the ways you can grow and learn on your campus dashboard.
        </p>
      </div>

      <div className="mt-7 grid grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={t.onClick}
            className={`group relative overflow-hidden rounded-3xl border bg-white text-left shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6 min-h-[150px] sm:min-h-[160px] lg:min-h-[212px] ${
              t.active ? 'border-blue-200 ring-1 ring-blue-200/70' : 'border-slate-100'
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${t.accent}`} />
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-100/50 blur-2xl" />
            <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-blue-200/30 blur-2xl" />

            <div className="relative">
              <div className={`h-9 w-9 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-2xl ${t.iconBg} flex items-center justify-center`}>
                <t.Icon className={`h-4 w-4 sm:h-4 sm:w-4 lg:h-5 lg:w-5 ${t.iconFg}`} />
              </div>

              <p className="mt-3 lg:mt-4 text-sm sm:text-base lg:text-lg font-bold text-blue-950">
                {t.label}
              </p>
              <p className="mt-2 lg:mt-3 text-[11px] sm:text-xs lg:text-sm leading-snug lg:leading-relaxed text-slate-600">
                {t.description}
              </p>

              <div className="mt-3 sm:mt-4 lg:mt-5 inline-flex items-center gap-2 text-blue-700 font-semibold text-xs sm:text-sm">
                <span>Learn more</span>
                <span aria-hidden className="text-xl leading-none group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default FeatureDashboard;

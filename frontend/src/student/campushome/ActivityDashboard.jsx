import React, { useMemo } from 'react';
import { Video, CheckCircle2, Clock3, Users } from 'lucide-react';

const formatStat = (value) => {
  const n = Number.isFinite(value) ? value : 0;
  return n > 0 ? `${n}+` : `${n}`;
};

const StatCard = ({ title, subtitle, value, Icon: IconComponent }) => {
  return (
    <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      <div className="p-3 sm:p-4 lg:p-5 min-h-[112px] sm:min-h-[124px] lg:min-h-[148px] flex items-start gap-3 sm:gap-4">
        <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-white/15 border border-white/25 flex flex-col items-center justify-center text-white">
          {React.createElement(IconComponent, { className: 'h-4 w-4 text-white mb-1' })}
          <p className="text-lg sm:text-xl lg:text-xl font-semibold tabular-nums leading-none">{formatStat(value)}</p>
        </div>

        <div className="pt-1">
          <p className="text-base sm:text-lg lg:text-xl font-semibold text-white leading-tight">{title}</p>
          <p className="mt-1.5 lg:mt-2 text-[11px] sm:text-xs lg:text-[13px] text-white/90 max-w-[24ch]">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
};

const ActivityDashboard = ({ activity }) => {
  const stats = useMemo(
    () => [
      {
        key: 'mySessions',
        title: 'Active Sessions',
        subtitle: 'Sessions you can join or manage',
        Icon: Video,
        value: Number(activity?.mySessions || 0),
      },
      {
        key: 'campusStudents',
        title: 'Campus Learners',
        subtitle: 'Students learning on your campus',
        Icon: Users,
        value: Number(activity?.campusStudents || 0),
      },
      {
        key: 'completed',
        title: 'Completed',
        subtitle: 'Sessions completed successfully',
        Icon: CheckCircle2,
        value: Number(activity?.completed || 0),
      },
      {
        key: 'pending',
        title: 'Pending',
        subtitle: 'Upcoming sessions in your queue',
        Icon: Clock3,
        value: Number(activity?.pending || 0),
      },
    ],
    [activity]
  );

  return (
    <section className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">
        <div>
          <span className="inline-flex items-center rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            Campus Dashboard
          </span>

          <h2 className="mt-5 text-3xl sm:text-4xl font-extrabold leading-[1.08] text-slate-900">
            Empowering Campus Learning
            <span className="block text-blue-600">Through Connection</span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl">
            A quick snapshot of your campus activity—sessions, learners, and progress—updated live from the system.
          </p>

          <div className="mt-6 inline-flex items-center gap-3 text-slate-900 font-semibold">
            <span>View detailed reports</span>
            <span aria-hidden className="text-2xl leading-none">→</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {stats.map((s) => (
            <StatCard
              key={s.key}
              title={s.title}
              subtitle={s.subtitle}
              value={s.value}
              Icon={s.Icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ActivityDashboard;

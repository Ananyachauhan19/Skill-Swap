import React, { useEffect, useRef, useState } from 'react';
import { BACKEND_URL } from '../../config.js';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const handleChange = (event) => setIsMobile(event.matches);

    setIsMobile(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return isMobile;
};

const GlobalTopPerformersSection = () => {
  const [topStudents, setTopStudents] = useState([]);
  const [topInstitutes, setTopInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const [activeInstitute, setActiveInstitute] = useState(0);
  const [activeStudent, setActiveStudent] = useState(0);
  const [pauseInstituteAuto, setPauseInstituteAuto] = useState(false);
  const [pauseStudentAuto, setPauseStudentAuto] = useState(false);

  const instituteScrollRef = useRef(null);
  const studentScrollRef = useRef(null);
  const institutePauseTimeoutRef = useRef(null);
  const studentPauseTimeoutRef = useRef(null);
  const instituteScrollRafRef = useRef(null);
  const studentScrollRafRef = useRef(null);

  useEffect(() => {
    return () => {
      if (institutePauseTimeoutRef.current) clearTimeout(institutePauseTimeoutRef.current);
      if (studentPauseTimeoutRef.current) clearTimeout(studentPauseTimeoutRef.current);
      if (instituteScrollRafRef.current) cancelAnimationFrame(instituteScrollRafRef.current);
      if (studentScrollRafRef.current) cancelAnimationFrame(studentScrollRafRef.current);
    };
  }, []);

  useEffect(() => {
    const fetchTopPerformers = async () => {
      try {
        setLoading(true);

        // Fetch top students
        const studentResponse = await fetch(`${BACKEND_URL}/api/campus-ambassador/global/top-student`);
        if (studentResponse.ok) {
          const studentData = await studentResponse.json();
          setTopStudents(studentData.topStudents || []);
        }

        // Fetch top institutes
        const instituteResponse = await fetch(`${BACKEND_URL}/api/campus-ambassador/global/top-institute`);
        if (instituteResponse.ok) {
          const instituteData = await instituteResponse.json();
          setTopInstitutes(instituteData.topInstitutes || []);
        }
      } catch (error) {
        console.error('Failed to fetch top performers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopPerformers();
  }, []);

  useEffect(() => {
    if (!isMobile || topInstitutes.length <= 1) return;
    if (pauseInstituteAuto) return;
    const intervalId = setInterval(() => {
      const el = instituteScrollRef.current;
      if (!el) return;
      const width = el.clientWidth || 1;
      const currentIdx = Math.round(el.scrollLeft / width);
      const nextIdx = (currentIdx + 1) % topInstitutes.length;
      el.scrollTo({ left: nextIdx * width, behavior: 'smooth' });
      setActiveInstitute(nextIdx);
    }, 5000);
    return () => clearInterval(intervalId);
  }, [isMobile, topInstitutes.length, pauseInstituteAuto]);

  useEffect(() => {
    if (!isMobile || topStudents.length <= 1) return;
    if (pauseStudentAuto) return;
    const intervalId = setInterval(() => {
      const el = studentScrollRef.current;
      if (!el) return;
      const width = el.clientWidth || 1;
      const currentIdx = Math.round(el.scrollLeft / width);
      const nextIdx = (currentIdx + 1) % topStudents.length;
      el.scrollTo({ left: nextIdx * width, behavior: 'smooth' });
      setActiveStudent(nextIdx);
    }, 5000);
    return () => clearInterval(intervalId);
  }, [isMobile, topStudents.length, pauseStudentAuto]);

  useEffect(() => {
    if (!isMobile) return;
    const el = instituteScrollRef.current;
    if (!el) return;
    el.scrollTo({ left: 0, behavior: 'auto' });
    setActiveInstitute(0);
  }, [isMobile, topInstitutes.length]);

  useEffect(() => {
    if (!isMobile) return;
    const el = studentScrollRef.current;
    if (!el) return;
    el.scrollTo({ left: 0, behavior: 'auto' });
    setActiveStudent(0);
  }, [isMobile, topStudents.length]);

  if (loading) {
    return (
      <section className="relative py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
            <p className="mt-4 text-slate-600 font-medium">Loading top performers...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!topStudents.length && !topInstitutes.length) {
    return null;
  }

  const getRankStyle = (idx) => {
    if (idx === 0) return { header: 'bg-gradient-to-r from-slate-900 to-blue-900', border: 'border-blue-200' };
    if (idx === 1) return { header: 'bg-gradient-to-r from-slate-800 to-slate-900', border: 'border-slate-200' };
    return { header: 'bg-gradient-to-r from-blue-900 to-slate-900', border: 'border-blue-200' };
  };

  const pauseInstitute = () => {
    setPauseInstituteAuto(true);
    if (institutePauseTimeoutRef.current) {
      clearTimeout(institutePauseTimeoutRef.current);
    }
    institutePauseTimeoutRef.current = setTimeout(() => setPauseInstituteAuto(false), 7000);
  };

  const pauseStudent = () => {
    setPauseStudentAuto(true);
    if (studentPauseTimeoutRef.current) {
      clearTimeout(studentPauseTimeoutRef.current);
    }
    studentPauseTimeoutRef.current = setTimeout(() => setPauseStudentAuto(false), 7000);
  };

  const handleInstituteScroll = () => {
    if (!isMobile) return;
    pauseInstitute();
    const el = instituteScrollRef.current;
    if (!el) return;
    if (instituteScrollRafRef.current) cancelAnimationFrame(instituteScrollRafRef.current);
    instituteScrollRafRef.current = requestAnimationFrame(() => {
      const width = el.clientWidth || 1;
      const idx = Math.round(el.scrollLeft / width);
      setActiveInstitute(idx);
    });
  };

  const handleStudentScroll = () => {
    if (!isMobile) return;
    pauseStudent();
    const el = studentScrollRef.current;
    if (!el) return;
    if (studentScrollRafRef.current) cancelAnimationFrame(studentScrollRafRef.current);
    studentScrollRafRef.current = requestAnimationFrame(() => {
      const width = el.clientWidth || 1;
      const idx = Math.round(el.scrollLeft / width);
      setActiveStudent(idx);
    });
  };

  const InstituteCard = ({ institute, idx }) => {
    const style = getRankStyle(idx);
    const instituteLabel = (institute?.instituteName || 'Institute').trim();
    const initials = instituteLabel
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase();

    return (
      <div
        className={`bg-white rounded-xl border ${style.border} shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden`}
      >
        <div className={`${style.header} px-3 py-2 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center">
              <span className="text-sm font-bold text-white">#{idx + 1}</span>
            </div>
            <span className="text-xs font-semibold text-white/90">Rank {idx + 1}</span>
          </div>
          <span className="text-[11px] font-semibold text-white/85 tracking-wide">INSTITUTE</span>
        </div>

        <div className="relative h-20 bg-gradient-to-br from-slate-50 to-blue-50">
          {institute.campusBackgroundImage ? (
            <img
              src={institute.campusBackgroundImage}
              alt={institute.instituteName}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : null}

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-white/70 backdrop-blur border border-slate-200 flex items-center justify-center">
              <span className="text-sm font-bold text-slate-900">{initials || 'I'}</span>
            </div>
          </div>
        </div>

        <div className="p-3">
          <h4
            className="text-sm font-semibold text-slate-900 leading-snug truncate"
            title={institute.instituteName}
          >
            {institute.instituteName}
          </h4>
          <p className="text-[11px] text-slate-600 truncate">{institute.instituteId}</p>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-center">
              <p className="text-sm font-bold text-slate-900 leading-none">{institute.totalStudents}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">Students</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-center">
              <p className="text-sm font-bold text-slate-900 leading-none">{institute.totalSessions}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">Sessions</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-2 text-center">
              <p className="text-sm font-bold text-blue-900 leading-none">{institute.totalQuizMarks}</p>
              <p className="text-[10px] text-slate-700 mt-0.5">Quiz Pts</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-2 text-center">
              <p className="text-sm font-bold text-blue-900 leading-none">{Number(institute.averageScore || 0).toFixed(1)}</p>
              <p className="text-[10px] text-slate-700 mt-0.5">Avg Score</p>
            </div>
          </div>

          <div className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-700">Total Score</span>
            <span className="text-base font-bold text-slate-900">{institute.totalScore}</span>
          </div>
        </div>
      </div>
    );
  };

  const StudentCard = ({ student, idx }) => {
    const style = getRankStyle(idx);
    const displayName =
      student.firstName && student.lastName
        ? `${student.firstName} ${student.lastName}`
        : student.username;
    const initial = (student.firstName?.[0] || student.username?.[0] || 'S').toUpperCase();

    return (
      <div
        className={`bg-white rounded-xl border ${style.border} shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden`}
      >
        <div className={`${style.header} px-3 py-2 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center">
              <span className="text-sm font-bold text-white">#{idx + 1}</span>
            </div>
            <span className="text-xs font-semibold text-white/90">Rank {idx + 1}</span>
          </div>
          <span className="text-[11px] font-semibold text-white/85 tracking-wide">STUDENT</span>
        </div>

        <div className="p-3">
          <div className="flex items-center gap-2">
            {student.profilePic ? (
              <img
                src={student.profilePic}
                alt={student.username}
                className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                loading="lazy"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center text-white text-sm font-bold">
                {initial}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-slate-900 truncate">{displayName}</h4>
              <p className="text-[11px] text-slate-600 truncate">@{student.username}</p>
            </div>
          </div>

          {student.instituteName && (
            <p className="mt-2 text-[11px] text-slate-700 truncate" title={student.instituteName}>
              {student.instituteName}
            </p>
          )}

          <div className="mt-2 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-center">
              <p className="text-sm font-bold text-slate-900 leading-none">{student.totalSessions}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">Sessions</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-2 text-center">
              <p className="text-sm font-bold text-blue-900 leading-none">{student.totalQuizMarks}</p>
              <p className="text-[10px] text-slate-700 mt-0.5">Quiz Pts</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-center">
              <p className="text-sm font-bold text-slate-900 leading-none">{student.totalScore}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">Total</p>
            </div>
          </div>

          <div className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-700">Achievement</span>
            <span className="text-[11px] font-semibold text-slate-900">
              {idx === 0 ? 'Champion' : idx === 1 ? 'Outstanding' : 'Contributor'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="relative py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Top Performers</h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600">Across the campus network</p>
        </div>

        {/* Top 3 Institutes Section */}
        {topInstitutes.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-blue-200" />
              <div className="px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm">
                <h3 className="text-sm sm:text-base font-semibold text-slate-900">Top Institutes</h3>
              </div>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-blue-200" />
            </div>

            {isMobile ? (
              <div
                ref={instituteScrollRef}
                className="relative flex overflow-x-auto snap-x snap-mandatory scroll-smooth [-webkit-overflow-scrolling:touch]"
                onScroll={handleInstituteScroll}
                onTouchStart={pauseInstitute}
                onMouseDown={pauseInstitute}
                onPointerDown={pauseInstitute}
                role="region"
                aria-label="Top institutes carousel"
              >
                  {topInstitutes.map((institute, idx) => (
                    <div
                      key={institute.instituteId}
                      className="w-full shrink-0 snap-start px-1"
                      aria-roledescription="slide"
                    >
                      <div className="max-w-sm mx-auto">
                        <InstituteCard institute={institute} idx={idx} />
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {topInstitutes.map((institute, idx) => (
                  <div key={institute.instituteId}>
                    <InstituteCard institute={institute} idx={idx} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Top 3 Students Section */}
        {topStudents.length > 0 && (
          <div>
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-blue-200" />
              <div className="px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm">
                <h3 className="text-sm sm:text-base font-semibold text-slate-900">Top Students</h3>
              </div>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-blue-200" />
            </div>

            {isMobile ? (
              <div
                ref={studentScrollRef}
                className="relative flex overflow-x-auto snap-x snap-mandatory scroll-smooth [-webkit-overflow-scrolling:touch]"
                onScroll={handleStudentScroll}
                onTouchStart={pauseStudent}
                onMouseDown={pauseStudent}
                onPointerDown={pauseStudent}
                role="region"
                aria-label="Top students carousel"
              >
                  {topStudents.map((student, idx) => (
                    <div
                      key={student.studentId}
                      className="w-full shrink-0 snap-start px-1"
                      aria-roledescription="slide"
                    >
                      <div className="max-w-sm mx-auto">
                        <StudentCard student={student} idx={idx} />
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topStudents.map((student, idx) => (
                  <div key={student.studentId}>
                    <StudentCard student={student} idx={idx} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default GlobalTopPerformersSection;

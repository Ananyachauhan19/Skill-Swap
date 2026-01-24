import React, { useState, useEffect } from 'react';
import { Building2, User, TrendingUp } from 'lucide-react';
import { BACKEND_URL } from '../../config.js';

const GlobalTopPerformersSection = () => {
  const [topStudents, setTopStudents] = useState([]);
  const [topInstitutes, setTopInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);

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
    if (idx === 0) return { bg: 'bg-gradient-to-br from-blue-600 to-blue-700', text: 'text-white', border: 'border-blue-600' };
    if (idx === 1) return { bg: 'bg-gradient-to-br from-slate-700 to-slate-800', text: 'text-white', border: 'border-slate-700' };
    return { bg: 'bg-gradient-to-br from-blue-800 to-blue-900', text: 'text-white', border: 'border-blue-800' };
  };

  return (
    <section className="relative py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            🏆 Top Performers Across Campus Network
          </h2>
          <p className="text-lg text-slate-600">
            Celebrating excellence in our campus community
          </p>
        </div>

        {/* Top 3 Institutes Section */}
        {topInstitutes.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-blue-200"></div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 rounded-full shadow-sm">
                <Building2 className="w-5 h-5 text-blue-700" />
                <h3 className="text-lg font-bold text-slate-900">Top 3 Institutes</h3>
              </div>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-blue-200"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {topInstitutes.map((institute, idx) => {
                const style = getRankStyle(idx);
                return (
                  <div 
                    key={institute.instituteId}
                    className={`bg-white rounded-xl border ${style.border} shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden`}
                  >
                    {/* Header with Rank Badge */}
                    <div className={`${style.bg} px-4 py-3 flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                          <span className="text-xl font-bold text-white">#{idx + 1}</span>
                        </div>
                        <span className="text-sm font-semibold text-white/90">Rank {idx + 1}</span>
                      </div>
                      <span className="text-2xl">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                      </span>
                    </div>

                    {/* Institute Image */}
                    <div className="relative h-32 bg-gradient-to-br from-blue-50 to-slate-100">
                      {institute.campusBackgroundImage ? (
                        <img 
                          src={institute.campusBackgroundImage} 
                          alt={institute.instituteName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`${institute.campusBackgroundImage ? 'hidden' : 'flex'} absolute inset-0 items-center justify-center`}>
                        <Building2 className="w-16 h-16 text-blue-300" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h4 className="text-base font-bold text-slate-900 mb-1 truncate" title={institute.instituteName}>
                        {institute.instituteName}
                      </h4>
                      <p className="text-xs text-slate-600 mb-3 uppercase tracking-wide">{institute.instituteId}</p>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-lg font-bold text-blue-700">{institute.totalStudents}</p>
                          <p className="text-xs text-slate-600">Students</p>
                        </div>
                        <div className="text-center p-2 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="text-lg font-bold text-slate-700">{institute.totalSessions}</p>
                          <p className="text-xs text-slate-600">Sessions</p>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-lg font-bold text-blue-700">{institute.totalQuizMarks}</p>
                          <p className="text-xs text-slate-600">Quiz Pts</p>
                        </div>
                        <div className="text-center p-2 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="text-lg font-bold text-slate-700">{institute.averageScore.toFixed(1)}</p>
                          <p className="text-xs text-slate-600">Avg Score</p>
                        </div>
                      </div>

                      {/* Total Score */}
                      <div className="bg-gradient-to-r from-blue-50 to-slate-50 rounded-lg p-3 text-center border border-blue-100">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-blue-700" />
                          <p className="text-xs font-semibold text-slate-700">Total Score</p>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{institute.totalScore}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top 3 Students Section */}
        {topStudents.length > 0 && (
          <div>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-blue-200"></div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 rounded-full shadow-sm">
                <User className="w-5 h-5 text-blue-700" />
                <h3 className="text-lg font-bold text-slate-900">Top 3 Students</h3>
              </div>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-blue-200"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topStudents.map((student, idx) => {
                const style = getRankStyle(idx);
                return (
                  <div 
                    key={student.studentId}
                    className={`bg-white rounded-xl border ${style.border} shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden`}
                  >
                    {/* Header with Rank Badge */}
                    <div className={`${style.bg} px-4 py-3 flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                          <span className="text-xl font-bold text-white">#{idx + 1}</span>
                        </div>
                        <span className="text-sm font-semibold text-white/90">Rank {idx + 1}</span>
                      </div>
                      <span className="text-2xl">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                      </span>
                    </div>

                    {/* Profile Section */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        {student.profilePic ? (
                          <img 
                            src={student.profilePic} 
                            alt={student.username}
                            className="w-14 h-14 rounded-full object-cover border-2 border-blue-200 shadow-md"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-xl font-bold border-2 border-blue-200 shadow-md">
                            {(student.firstName?.[0] || student.username?.[0] || 'S').toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-bold text-slate-900 truncate">
                            {student.firstName && student.lastName 
                              ? `${student.firstName} ${student.lastName}`
                              : student.username}
                          </h4>
                          <p className="text-xs text-slate-600 truncate">@{student.username}</p>
                        </div>
                      </div>

                      {/* Institute Badge */}
                      {student.instituteName && (
                        <div className="mb-3">
                          <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full">
                            <Building2 className="w-3 h-3 text-blue-700" />
                            <span className="text-xs font-medium text-blue-700 truncate max-w-[200px]">
                              {student.instituteName}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-base font-bold text-blue-700">{student.totalSessions}</p>
                          <p className="text-xs text-slate-600">Sessions</p>
                        </div>
                        <div className="text-center p-2 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="text-base font-bold text-slate-700">{student.totalQuizMarks}</p>
                          <p className="text-xs text-slate-600">Quiz Pts</p>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-base font-bold text-blue-700">{student.totalScore}</p>
                          <p className="text-xs text-slate-600">Total</p>
                        </div>
                      </div>

                      {/* Achievement Badge */}
                      <div className="bg-gradient-to-r from-blue-50 to-slate-50 rounded-lg p-3 text-center border border-blue-100">
                        <p className="text-sm font-semibold text-slate-800">
                          {idx === 0 ? '🎉 Campus Champion' :
                           idx === 1 ? '⭐ Outstanding Learner' :
                           '🔥 Top Contributor'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default GlobalTopPerformersSection;

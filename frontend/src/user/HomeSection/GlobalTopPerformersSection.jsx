import React, { useState, useEffect } from 'react';
import { Trophy, Award, Users, TrendingUp } from 'lucide-react';
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
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading top performers...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!topStudents.length && !topInstitutes.length) {
    return null;
  }

  return (
    <section className="relative py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Trophy className="w-4 h-4" />
            <span>Global Rankings</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            🏆 Top Performers Across Campus Network
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Celebrating excellence in our campus community
          </p>
        </div>

        {/* Top 3 Institutes Section */}
        {topInstitutes.length > 0 && (
          <div className="mb-12">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                🏛️ Top 3 Institutes
              </h3>
              <p className="text-gray-600">Leading campuses with the most engaged communities</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topInstitutes.map((institute, idx) => (
                <div 
                  key={institute.instituteId}
                  className={`bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 transition-all duration-300 ${
                    idx === 0 ? 'border-2 border-yellow-400' :
                    idx === 1 ? 'border-2 border-gray-400' :
                    'border-2 border-orange-400'
                  }`}
                >
                  {/* Card Header */}
                  <div className={`p-4 ${
                    idx === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                    idx === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                    'bg-gradient-to-r from-orange-400 to-orange-500'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-3xl">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                        </span>
                      </div>
                      <div className="text-white text-right">
                        <p className="text-sm font-medium opacity-90">Rank</p>
                        <p className="text-2xl font-bold">#{institute.rank}</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5">
                    <h4 className="text-lg font-bold text-gray-900 mb-2 truncate" title={institute.instituteName}>
                      {institute.instituteName}
                    </h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {institute.instituteId}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full capitalize">
                        {institute.instituteType}
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="text-center p-2 bg-blue-50 rounded-lg">
                        <p className="text-lg font-bold text-blue-600">{institute.totalStudents}</p>
                        <p className="text-xs text-gray-600">Students</p>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded-lg">
                        <p className="text-lg font-bold text-green-600">{institute.totalSessions}</p>
                        <p className="text-xs text-gray-600">Sessions</p>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded-lg">
                        <p className="text-lg font-bold text-purple-600">{institute.totalQuizMarks}</p>
                        <p className="text-xs text-gray-600">Quiz Points</p>
                      </div>
                      <div className={`text-center p-2 rounded-lg ${
                        idx === 0 ? 'bg-yellow-50 border border-yellow-300' :
                        idx === 1 ? 'bg-gray-50 border border-gray-300' :
                        'bg-orange-50 border border-orange-300'
                      }`}>
                        <p className={`text-lg font-bold ${
                          idx === 0 ? 'text-yellow-600' :
                          idx === 1 ? 'text-gray-600' :
                          'text-orange-600'
                        }`}>
                          {institute.averageScore.toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-600">Avg Score</p>
                      </div>
                    </div>

                    {/* Total Score Badge */}
                    <div className={`rounded-lg p-3 text-center ${
                      idx === 0 ? 'bg-gradient-to-r from-yellow-100 to-orange-100' :
                      idx === 1 ? 'bg-gradient-to-r from-gray-100 to-gray-200' :
                      'bg-gradient-to-r from-orange-100 to-orange-200'
                    }`}>
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-gray-700" />
                        <p className="text-xs font-medium text-gray-700">Total Campus Score</p>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{institute.totalScore}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top 3 Students Section */}
        {topStudents.length > 0 && (
          <div>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                ⭐ Top 3 Students
              </h3>
              <p className="text-gray-600">Most active learners and tutors across all campuses</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topStudents.map((student, idx) => (
                <div 
                  key={student.studentId}
                  className={`bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 transition-all duration-300 ${
                    idx === 0 ? 'border-2 border-yellow-400' :
                    idx === 1 ? 'border-2 border-gray-400' :
                    'border-2 border-orange-400'
                  }`}
                >
                  {/* Card Header */}
                  <div className={`p-4 ${
                    idx === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                    idx === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                    'bg-gradient-to-r from-orange-400 to-orange-500'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                          <Award className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-3xl">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                        </span>
                      </div>
                      <div className="text-white text-right">
                        <p className="text-sm font-medium opacity-90">Rank</p>
                        <p className="text-2xl font-bold">#{student.rank}</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      {student.profilePic ? (
                        <img 
                          src={student.profilePic} 
                          alt={student.username}
                          className={`w-16 h-16 rounded-full object-cover shadow-lg ${
                            idx === 0 ? 'border-4 border-yellow-400' :
                            idx === 1 ? 'border-4 border-gray-400' :
                            'border-4 border-orange-400'
                          }`}
                        />
                      ) : (
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg ${
                          idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 border-4 border-yellow-400' :
                          idx === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600 border-4 border-gray-400' :
                          'bg-gradient-to-br from-orange-400 to-orange-600 border-4 border-orange-400'
                        }`}>
                          {(student.firstName?.[0] || student.username?.[0] || 'S').toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-bold text-gray-900 truncate">
                          {student.firstName && student.lastName 
                            ? `${student.firstName} ${student.lastName}`
                            : student.username}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">@{student.username}</p>
                        {student.instituteName && (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full truncate max-w-full">
                              🏛️ {student.instituteName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center p-2 bg-blue-50 rounded-lg">
                        <p className="text-lg font-bold text-blue-600">{student.totalSessions}</p>
                        <p className="text-xs text-gray-600">Sessions</p>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded-lg">
                        <p className="text-lg font-bold text-green-600">{student.totalQuizMarks}</p>
                        <p className="text-xs text-gray-600">Quiz Pts</p>
                      </div>
                      <div className={`text-center p-2 rounded-lg ${
                        idx === 0 ? 'bg-yellow-50 border border-yellow-300' :
                        idx === 1 ? 'bg-gray-50 border border-gray-300' :
                        'bg-orange-50 border border-orange-300'
                      }`}>
                        <p className={`text-lg font-bold ${
                          idx === 0 ? 'text-yellow-600' :
                          idx === 1 ? 'text-gray-600' :
                          'text-orange-600'
                        }`}>
                          {student.totalScore}
                        </p>
                        <p className="text-xs text-gray-600">Total</p>
                      </div>
                    </div>

                    {/* Achievement Badge */}
                    <div className={`rounded-lg p-3 text-center ${
                      idx === 0 ? 'bg-gradient-to-r from-yellow-100 to-orange-100' :
                      idx === 1 ? 'bg-gradient-to-r from-gray-100 to-gray-200' :
                      'bg-gradient-to-r from-orange-100 to-orange-200'
                    }`}>
                      <p className="text-sm font-semibold text-gray-800">
                        {idx === 0 ? '🎉 Campus Champion' :
                         idx === 1 ? '⭐ Outstanding Learner' :
                         '🔥 Top Contributor'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Want to see your name here?
            </h3>
            <p className="text-gray-600 mb-6">
              Stay active on campus, complete sessions, ace quizzes, and climb the leaderboard!
            </p>
            <button 
              onClick={() => window.location.href = '/campus-dashboard'}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Join Campus Dashboard
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GlobalTopPerformersSection;

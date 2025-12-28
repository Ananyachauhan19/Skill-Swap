import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { School, Users, BookOpen, Award, ArrowRight } from 'lucide-react';
import { useCampusAmbassador } from '../context/CampusAmbassadorContext';
import { useAuth } from '../context/AuthContext';

const StudentCampusDashboard = () => {
  const navigate = useNavigate();
  const { validateCampusId, getInstituteStudents } = useCampusAmbassador();
  const { user } = useAuth();

  const [step, setStep] = useState('input'); // 'input' | 'dashboard'
  const [campusId, setCampusId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [instituteData, setInstituteData] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [students, setStudents] = useState([]);

  // Check if user already has institute data
  useEffect(() => {
    if (user?.instituteId && user?.studentId) {
      loadInstituteDashboard(user.studentId);
    }
  }, [user]);

  const loadInstituteDashboard = async (studentId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await validateCampusId(studentId);
      setInstituteData(data.institute);
      setStudentData(data.user);
      
      // Load institute students for filtering
      const studentsData = await getInstituteStudents(data.institute.instituteId);
      setStudents(studentsData.students);
      
      setStep('dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateCampusId = async (e) => {
    e.preventDefault();
    if (!campusId.trim()) {
      setError('Please enter your Campus ID');
      return;
    }

    await loadInstituteDashboard(campusId.trim());
  };

  // Campus ID Input Screen
  if (step === 'input') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8">
          <div className="text-center mb-6">
            <School size={64} className="mx-auto text-blue-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Campus Dashboard</h1>
            <p className="text-gray-600">Enter your Campus ID to access your institute dashboard</p>
          </div>

          <form onSubmit={handleValidateCampusId} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campus ID
              </label>
              <input
                type="text"
                value={campusId}
                onChange={(e) => {
                  setCampusId(e.target.value);
                  setError(null);
                }}
                placeholder="SSH-XXX-12345678"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Validating...</span>
                </>
              ) : (
                <>
                  <span>Access Dashboard</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Campus Dashboard Screen
  return (
    <div 
      className="min-h-screen bg-cover bg-center relative"
      style={{
        backgroundImage: instituteData?.campusBackgroundImage 
          ? `url(${instituteData.campusBackgroundImage})` 
          : 'linear-gradient(to bottom right, #3b82f6, #8b5cf6)'
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>

      {/* Content */}
      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white bg-opacity-95 rounded-lg shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <School size={48} className="text-blue-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">{instituteData?.instituteName}</h1>
                  <p className="text-gray-600">Campus ID: {studentData?.studentId}</p>
                </div>
              </div>
              <button
                onClick={() => setStep('input')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Switch Campus
              </button>
            </div>
          </div>

          {/* Student Info */}
          <div className="bg-white bg-opacity-95 rounded-lg shadow-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Your Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-bold text-gray-800">
                  {studentData?.firstName} {studentData?.lastName}
                </p>
              </div>
              {studentData?.class && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Class</p>
                  <p className="font-bold text-gray-800">{studentData.class}</p>
                </div>
              )}
              {studentData?.course && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Course</p>
                  <p className="font-bold text-gray-800">{studentData.course}</p>
                </div>
              )}
              {studentData?.semester && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Semester</p>
                  <p className="font-bold text-gray-800">{studentData.semester}</p>
                </div>
              )}
            </div>
          </div>

          {/* Rewards */}
          <div className="bg-white bg-opacity-95 rounded-lg shadow-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <Award size={24} className="text-yellow-500" />
              <span>Campus Rewards</span>
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 p-6 rounded-lg text-center">
                <p className="text-sm text-yellow-800 mb-2">Gold Coins</p>
                <p className="text-4xl font-bold text-yellow-700">{instituteData?.goldCoins || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-6 rounded-lg text-center">
                <p className="text-sm text-gray-800 mb-2">Silver Coins</p>
                <p className="text-4xl font-bold text-gray-700">{instituteData?.silverCoins || 0}</p>
              </div>
            </div>
          </div>

          {/* Campus Students (One-on-One Filtering) */}
          <div className="bg-white bg-opacity-95 rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <Users size={24} className="text-blue-600" />
              <span>Campus Students</span>
            </h2>
            <p className="text-gray-600 mb-4">
              Connect with students from {instituteData?.instituteName} for one-on-one learning sessions
            </p>
            
            {students.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users size={48} className="mx-auto mb-2 opacity-50" />
                <p>No students found yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.slice(0, 9).map((student) => (
                  <div key={student._id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {student.firstName?.[0]}{student.lastName?.[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{student.studentId}</p>
                        {student.course && (
                          <p className="text-xs text-gray-500">{student.course}</p>
                        )}
                        {student.class && (
                          <p className="text-xs text-gray-500">Class {student.class}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {students.length > 9 && (
              <div className="mt-4 text-center">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  View All Students ({students.length})
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <button className="bg-white bg-opacity-95 p-6 rounded-lg shadow-lg hover:shadow-xl transition text-center">
              <BookOpen size={32} className="mx-auto mb-2 text-blue-600" />
              <p className="font-semibold text-gray-800">Find Study Partners</p>
            </button>
            <button className="bg-white bg-opacity-95 p-6 rounded-lg shadow-lg hover:shadow-xl transition text-center">
              <Users size={32} className="mx-auto mb-2 text-green-600" />
              <p className="font-semibold text-gray-800">Join Study Groups</p>
            </button>
            <button className="bg-white bg-opacity-95 p-6 rounded-lg shadow-lg hover:shadow-xl transition text-center">
              <Award size={32} className="mx-auto mb-2 text-purple-600" />
              <p className="font-semibold text-gray-800">Campus Leaderboard</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentCampusDashboard;

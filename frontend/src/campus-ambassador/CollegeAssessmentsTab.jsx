import React, { useState, useEffect } from 'react';
import { FileText, Clock, Users, TrendingUp, AlertTriangle, ChevronDown, ChevronUp, Calendar, CheckCircle, XCircle, User, Award, Timer, Shield, Download, Eye, X } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config.js';

const CollegeAssessmentsTab = ({ institute }) => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [activeTab, setActiveTab] = useState('compulsory'); // compulsory | optional
  const [expandedSemesters, setExpandedSemesters] = useState({});
  const [answerSheetModal, setAnswerSheetModal] = useState(null);
  const [answerSheetData, setAnswerSheetData] = useState(null);
  const [loadingAnswerSheet, setLoadingAnswerSheet] = useState(false);

  useEffect(() => {
    if (institute?._id) {
      fetchAssessments();
    }
  }, [institute]);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${BACKEND_URL}/api/campus-ambassador/institutes/${institute._id}/assessments`,
        { withCredentials: true }
      );
      setAssessments(response.data.assessments || []);
    } catch (err) {
      console.error('Failed to fetch assessments:', err);
      setError(err.response?.data?.message || 'Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const toggleSemester = (semester) => {
    setExpandedSemesters(prev => ({
      ...prev,
      [semester]: !prev[semester]
    }));
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const viewAnswerSheet = async (attemptData, assessmentId) => {
    try {
      setLoadingAnswerSheet(true);
      setAnswerSheetModal(attemptData);
      
      const response = await axios.get(
        `${BACKEND_URL}/api/campus-ambassador/assessment-attempt/${attemptData.studentId}/${assessmentId}`,
        { withCredentials: true }
      );
      
      setAnswerSheetData(response.data);
    } catch (err) {
      console.error('Failed to fetch answer sheet:', err);
      alert('Failed to load answer sheet');
      setAnswerSheetModal(null);
    } finally {
      setLoadingAnswerSheet(false);
    }
  };

  const closeAnswerSheet = () => {
    setAnswerSheetModal(null);
    setAnswerSheetData(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading assessments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (!selectedAssessment) {
    // Assessment List View
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Assessments</h2>
            <p className="text-sm text-gray-600 mt-1">
              {institute.instituteName} • {assessments.length} assessment{assessments.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {assessments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">No assessments yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Assessments created for this college will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {assessments.map((assessment) => (
              <div
                key={assessment.assessmentId}
                className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedAssessment(assessment)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {assessment.title}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          assessment.status === 'Active'
                            ? 'bg-green-100 text-green-700'
                            : assessment.status === 'Expired'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {assessment.status}
                      </span>
                    </div>
                    
                    {assessment.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {assessment.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{formatDate(assessment.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{formatDuration(assessment.duration)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{assessment.totalStudents} students</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {assessment.totalAttempted}/{assessment.totalStudents} attempted
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        {assessment.courseId}
                      </span>
                      {assessment.compulsorySemesters.length > 0 && (
                        <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded font-medium">
                          Compulsory: Sem {assessment.compulsorySemesters.join(', ')}
                        </span>
                      )}
                      {assessment.optionalSemesters.length > 0 && (
                        <span className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded">
                          Optional: Sem {assessment.optionalSemesters.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Assessment Detail View
  const currentData = activeTab === 'compulsory' 
    ? selectedAssessment.compulsoryData 
    : selectedAssessment.optionalData;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedAssessment(null);
              setExpandedSemesters({});
              setActiveTab('compulsory');
            }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Assessments
          </button>
        </div>
      </div>

      {/* Assessment Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{selectedAssessment.title}</h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  selectedAssessment.status === 'Active'
                    ? 'bg-green-100 text-green-700'
                    : selectedAssessment.status === 'Expired'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {selectedAssessment.status}
              </span>
            </div>
            
            {selectedAssessment.description && (
              <p className="text-gray-600 mb-4">{selectedAssessment.description}</p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Created On</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(selectedAssessment.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Duration</p>
                <p className="text-sm font-medium text-gray-900">{formatDuration(selectedAssessment.duration)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Students</p>
                <p className="text-sm font-medium text-gray-900">{selectedAssessment.totalStudents}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Attempts</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedAssessment.totalAttempted} / {selectedAssessment.totalStudents}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('compulsory')}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'compulsory'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Compulsory ({selectedAssessment.compulsoryData.length} semesters)
          </button>
          <button
            onClick={() => setActiveTab('optional')}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'optional'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Optional ({selectedAssessment.optionalData.length} semesters)
          </button>
        </div>
      </div>

      {/* Semester List */}
      {currentData.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">
            No {activeTab} semesters for this assessment
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentData.map((semData) => {
            const isExpanded = expandedSemesters[semData.semester];
            const attemptRate = semData.totalStudents > 0 
              ? Math.round((semData.attemptedCount / semData.totalStudents) * 100) 
              : 0;

            return (
              <div key={semData.semester} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* Semester Header */}
                <button
                  onClick={() => toggleSemester(semData.semester)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Semester {semData.semester}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {semData.totalStudents} students • {semData.attemptedCount} attempted • {semData.notAttemptedCount} pending
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{attemptRate}%</p>
                      <p className="text-xs text-gray-500">completion</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Attempts List */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    {semData.attempts.length === 0 ? (
                      <div className="px-5 py-6 text-center">
                        <p className="text-sm text-gray-600">No attempts yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {semData.attempts.map((attempt, idx) => {
                          const percentage = Math.round((attempt.marksObtained / attempt.totalMarks) * 100);
                          const passed = percentage >= 40; // Assuming 40% is passing threshold
                          const hasViolations = attempt.violationDetected && attempt.violationTypes && attempt.violationTypes.length > 0;
                          
                          // Determine card status
                          let statusBadge = {
                            text: passed ? '✅ Completed' : '❌ Failed',
                            color: passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          };
                          if (hasViolations && passed) {
                            statusBadge = {
                              text: '⚠️ Completed with Violations',
                              color: 'bg-orange-100 text-orange-700'
                            };
                          }
                          
                          return (
                            <div key={idx} className="px-5 py-5 bg-white hover:bg-gray-50 transition-colors">
                              {/* Assessment Result Card */}
                              <div className="space-y-5">
                                
                                {/* 1️⃣ HEADER SECTION */}
                                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                                  <h3 className="text-base font-bold text-gray-900">Assessment Result</h3>
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.color}`}>
                                    {statusBadge.text}
                                  </span>
                                </div>

                                {/* 2️⃣ STUDENT DETAILS SECTION */}
                                <div>
                                  <div className="flex items-center gap-2 mb-3">
                                    <User className="h-4 w-4 text-gray-500" />
                                    <h4 className="text-sm font-semibold text-gray-700">Student Information</h4>
                                  </div>
                                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                      <div>
                                        <p className="text-xs text-gray-500">Name</p>
                                        <p className="text-sm font-medium text-gray-900">{attempt.studentName}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500">Email</p>
                                        <p className="text-sm font-medium text-gray-900">{attempt.studentEmail}</p>
                                      </div>
                                      <div className="col-span-2">
                                        <p className="text-xs text-gray-500">Attempted On</p>
                                        <p className="text-sm font-medium text-gray-900">{formatDate(attempt.completedAt)}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* 3️⃣ PERFORMANCE SUMMARY (HIGHLIGHTED) */}
                                <div>
                                  <div className="flex items-center gap-2 mb-3">
                                    <Award className="h-4 w-4 text-blue-600" />
                                    <h4 className="text-sm font-semibold text-gray-700">Performance Summary</h4>
                                  </div>
                                  <div className={`rounded-lg p-4 border-2 ${
                                    percentage >= 70 ? 'bg-green-50 border-green-200' : 
                                    percentage >= 40 ? 'bg-yellow-50 border-yellow-200' : 
                                    'bg-red-50 border-red-200'
                                  }`}>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-xs text-gray-600 mb-1">Score</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                          {attempt.marksObtained} <span className="text-lg text-gray-500">/ {attempt.totalMarks}</span>
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-600 mb-1">Percentage</p>
                                        <div className="flex items-center gap-2">
                                          <p className="text-2xl font-bold text-gray-900">{percentage}%</p>
                                          {percentage >= 70 ? (
                                            <CheckCircle className="h-6 w-6 text-green-600" />
                                          ) : percentage >= 40 ? (
                                            <AlertTriangle className="h-6 w-6 text-yellow-600" />
                                          ) : (
                                            <XCircle className="h-6 w-6 text-red-600" />
                                          )}
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-600 mb-1">Time Taken</p>
                                        <div className="flex items-center gap-1">
                                          <Timer className="h-4 w-4 text-gray-500" />
                                          <p className="text-sm font-semibold text-gray-900">
                                            {Math.floor(attempt.timeTaken / 60)} minutes
                                          </p>
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-600 mb-1">Result</p>
                                        <p className={`text-sm font-bold ${passed ? 'text-green-700' : 'text-red-700'}`}>
                                          {passed ? '✅ Passed' : '❌ Failed'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* 4️⃣ DETAILED BREAKDOWN (if data available) */}
                                {attempt.totalMarks && (
                                  <div>
                                    <div className="flex items-center gap-2 mb-3">
                                      <TrendingUp className="h-4 w-4 text-purple-600" />
                                      <h4 className="text-sm font-semibold text-gray-700">Attempt Details</h4>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                      <div className="grid grid-cols-4 gap-3 text-center">
                                        <div>
                                          <p className="text-xs text-gray-500 mb-1">Total Questions</p>
                                          <p className="text-lg font-bold text-gray-900">{attempt.totalMarks}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500 mb-1">Correct</p>
                                          <p className="text-lg font-bold text-green-600">{attempt.marksObtained}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500 mb-1">Incorrect</p>
                                          <p className="text-lg font-bold text-red-600">{attempt.totalMarks - attempt.marksObtained}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500 mb-1">Unattempted</p>
                                          <p className="text-lg font-bold text-gray-400">0</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* 5️⃣ VIOLATION / MONITORING SECTION (CONDITIONAL) */}
                                {hasViolations && (
                                  <div>
                                    <div className="flex items-center gap-2 mb-3">
                                      <Shield className="h-4 w-4 text-red-600" />
                                      <h4 className="text-sm font-semibold text-gray-700">Proctoring / Violations</h4>
                                    </div>
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <p className="text-xs text-gray-600 mb-1">Violation Detected</p>
                                          <p className="text-sm font-bold text-red-700">⚠️ Yes</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-600 mb-1">Total Violations</p>
                                          <p className="text-sm font-bold text-red-700">{attempt.violations || attempt.violationTypes.length}</p>
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-600 mb-2">Type of Violations</p>
                                        <div className="flex flex-wrap gap-2">
                                          {attempt.violationTypes.map((vType, vIdx) => (
                                            <span
                                              key={vIdx}
                                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 border border-red-300 text-red-800 text-xs font-semibold"
                                            >
                                              <AlertTriangle className="h-3 w-3" />
                                              {vType.replace(/-/g, ' ').toUpperCase()}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* 6️⃣ ACTION BUTTONS (BOTTOM) */}
                                <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                                  <button
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                    onClick={() => viewAnswerSheet(attempt, selectedAssessment.assessmentId)}
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    View Answer Sheet
                                  </button>
                                </div>

                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Answer Sheet Modal */}
      {answerSheetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
              <div>
                <h2 className="text-xl font-bold text-white">Answer Sheet</h2>
                <p className="text-sm text-blue-100 mt-1">{answerSheetModal.studentName}</p>
              </div>
              <button
                onClick={closeAnswerSheet}
                className="p-2 hover:bg-blue-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingAnswerSheet ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : answerSheetData ? (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-center">
                      <p className="text-xs text-gray-600 mb-1">Score</p>
                      <p className="text-lg font-bold text-gray-900">
                        {answerSheetData.attempt.score}/{answerSheetData.assessment.totalMarks}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600 mb-1">Correct</p>
                      <p className="text-lg font-bold text-green-600">{answerSheetData.attempt.score}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600 mb-1">Incorrect</p>
                      <p className="text-lg font-bold text-red-600">
                        {answerSheetData.assessment.questions.length - answerSheetData.attempt.score}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600 mb-1">Percentage</p>
                      <p className="text-lg font-bold text-blue-600">
                        {Math.round((answerSheetData.attempt.score / answerSheetData.assessment.totalMarks) * 100)}%
                      </p>
                    </div>
                  </div>

                  {/* Questions and Answers */}
                  <div className="space-y-4">
                    {answerSheetData.assessment.questions.map((question, index) => {
                      const studentAnswer = answerSheetData.attempt.answers.find(a => a.questionIndex === index);
                      const selectedOption = studentAnswer?.selectedAnswer || '';
                      const isCorrect = selectedOption === question.correctAnswer;
                      
                      return (
                        <div
                          key={index}
                          className={`p-5 rounded-lg border-2 ${
                            isCorrect
                              ? 'bg-green-50 border-green-300'
                              : 'bg-red-50 border-red-300'
                          }`}
                        >
                          {/* Question Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center text-sm font-semibold">
                                {index + 1}
                              </span>
                              <h4 className="text-base font-semibold text-gray-900">
                                {question.questionText}
                              </h4>
                            </div>
                            {isCorrect ? (
                              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                            )}
                          </div>

                          {/* Options */}
                          <div className="space-y-2 ml-10">
                            {['A', 'B', 'C', 'D'].map((option) => {
                              const optionText = question[`option${option}`];
                              if (!optionText) return null;

                              const isSelected = selectedOption === option;
                              const isCorrectOption = question.correctAnswer === option;
                              
                              let optionClass = 'bg-white border-gray-300';
                              if (isCorrectOption) {
                                optionClass = 'bg-green-100 border-green-500 font-semibold';
                              } else if (isSelected && !isCorrect) {
                                optionClass = 'bg-red-100 border-red-500 font-semibold';
                              }

                              return (
                                <div
                                  key={option}
                                  className={`p-3 rounded-lg border-2 ${optionClass} flex items-center gap-3`}
                                >
                                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-sm font-bold">
                                    {option}
                                  </span>
                                  <span className="text-sm text-gray-900">{optionText}</span>
                                  {isCorrectOption && (
                                    <span className="ml-auto flex-shrink-0 text-xs font-bold text-green-700 bg-green-200 px-2 py-1 rounded">
                                      Correct Answer
                                    </span>
                                  )}
                                  {isSelected && !isCorrectOption && (
                                    <span className="ml-auto flex-shrink-0 text-xs font-bold text-red-700 bg-red-200 px-2 py-1 rounded">
                                      Student's Answer
                                    </span>
                                  )}
                                  {isSelected && isCorrectOption && (
                                    <span className="ml-auto flex-shrink-0 text-xs font-bold text-green-700 bg-green-200 px-2 py-1 rounded">
                                      Student's Answer ✓
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">Failed to load answer sheet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeAssessmentsTab;

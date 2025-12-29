import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, School, Users, Trash2, Edit, Coins, TrendingUp, Upload, Building2, FileText, Eye, BarChart3 } from 'lucide-react';
import { useCampusAmbassador } from '../context/CampusAmbassadorContext';
import { useAuth } from '../context/AuthContext';
import CampusAmbassadorNavbar from './CampusAmbassadorNavbar';
import InstituteForm from './InstituteForm';
import ExcelUpload from './ExcelUpload';
import DistributeCoinsModal from './DistributeCoinsModal';
import InstituteRewardsDashboard from './InstituteRewardsDashboard';
import AssessmentUpload from './AssessmentUpload';
import AssessmentList from './AssessmentList';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const CampusAmbassadorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    institutes,
    loading,
    error,
    fetchInstitutes,
    createInstitute,
    updateInstitute,
    deleteInstitute
  } = useCampusAmbassador();

  const [showInstituteForm, setShowInstituteForm] = useState(false);
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [editingInstitute, setEditingInstitute] = useState(null);
  const [selectedInstituteForUpload, setSelectedInstituteForUpload] = useState(null);
  const [showDistributeCoins, setShowDistributeCoins] = useState(false);
  const [selectedInstituteForRewards, setSelectedInstituteForRewards] = useState(null);
  const [showRewardsDashboard, setShowRewardsDashboard] = useState(false);
  const [selectedInstitute, setSelectedInstitute] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAssessmentUpload, setShowAssessmentUpload] = useState(false);
  const [showAssessmentList, setShowAssessmentList] = useState(false);
  const [assessments, setAssessments] = useState([]);
  const [loadingAssessments, setLoadingAssessments] = useState(false);

  // Check if campus ambassador needs to change password
  useEffect(() => {
    if (user && user.isFirstLogin) {
      navigate('/change-password', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchInstitutes();
  }, []);

  // Fetch assessments when component mounts or when institutes change
  useEffect(() => {
    fetchAssessments();
  }, [institutes]);

  // Fetch assessments from backend
  const fetchAssessments = async () => {
    setLoadingAssessments(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/campus-ambassador/assessments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAssessments(data.assessments || []);
      }
    } catch (error) {
      console.error('Error fetching assessments:', error);
    } finally {
      setLoadingAssessments(false);
    }
  };

  // Auto-select first institute if available
  useEffect(() => {
    if (institutes.length > 0 && !selectedInstitute) {
      setSelectedInstitute(institutes[0]);
    }
  }, [institutes]);

  // Filter institutes based on search
  const filteredInstitutes = institutes.filter(institute =>
    institute.instituteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    institute.instituteId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateInstitute = async (formData) => {
    try {
      await createInstitute(formData);
      setShowInstituteForm(false);
    } catch (error) {
      console.error('Error creating institute:', error);
    }
  };

  const handleUpdateInstitute = async (formData) => {
    try {
      await updateInstitute(editingInstitute._id, formData);
      setEditingInstitute(null);
      setShowInstituteForm(false);
    } catch (error) {
      console.error('Error updating institute:', error);
    }
  };

  const handleDeleteInstitute = async (id) => {
    if (!window.confirm('Are you sure you want to delete this institute?')) return;
    try {
      await deleteInstitute(id);
    } catch (error) {
      console.error('Error deleting institute:', error);
    }
  };

  const handleEditClick = (institute) => {
    setEditingInstitute(institute);
    setShowInstituteForm(true);
  };

  const handleUploadClick = (institute) => {
    setSelectedInstituteForUpload(institute);
    setShowExcelUpload(true);
  };

  const handleUploadSuccess = () => {
    setShowExcelUpload(false);
    setSelectedInstituteForUpload(null);
    fetchInstitutes();
  };

  const handleDistributeCoinsClick = (institute) => {
    setSelectedInstituteForRewards(institute);
    setShowDistributeCoins(true);
  };

  const handleDistributeSuccess = (data) => {
    alert(`Successfully distributed coins to ${data.transaction.totalStudents} students!`);
    fetchInstitutes();
  };

  const handleViewRewardsClick = (institute) => {
    setSelectedInstituteForRewards(institute);
    setShowRewardsDashboard(true);
  };

  const handleInstituteClick = (institute) => {
    setSelectedInstitute(institute);
  };

  const handleAssessmentUploadSuccess = () => {
    setShowAssessmentUpload(false);
    fetchAssessments(); // Refresh assessment list
    setShowAssessmentList(true);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <CampusAmbassadorNavbar
        onAddInstitute={() => setShowInstituteForm(true)}
        onUploadTest={() => setShowAssessmentUpload(true)}
      />

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 pt-16 overflow-hidden">
        
        {/* Left Sidebar */}
        <aside className="w-72 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search colleges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Colleges List */}
          <div className="flex-1 overflow-y-auto">
            {loading && institutes.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredInstitutes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 px-4">
                <School size={32} className="text-gray-300 mb-2" />
                <p className="text-sm text-gray-500 text-center">
                  {searchQuery ? 'No colleges found' : 'No colleges added yet'}
                </p>
              </div>
            ) : (
              <div className="py-2">
                {filteredInstitutes.map((institute) => (
                  <button
                    key={institute._id}
                    onClick={() => handleInstituteClick(institute)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-l-4 ${
                      selectedInstitute?._id === institute._id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        selectedInstitute?._id === institute._id
                          ? 'bg-blue-100'
                          : 'bg-gray-100'
                      }`}>
                        {institute.campusBackgroundImage ? (
                          <img
                            src={institute.campusBackgroundImage}
                            alt={institute.instituteName}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Building2 size={20} className={
                            selectedInstitute?._id === institute._id
                              ? 'text-blue-600'
                              : 'text-gray-500'
                          } />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-semibold truncate ${
                          selectedInstitute?._id === institute._id
                            ? 'text-blue-900'
                            : 'text-gray-900'
                        }`}>
                          {institute.instituteName}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          {institute.instituteId}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            <Users size={12} className="inline mr-1" />
                            {institute.studentsCount || 0}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            institute.instituteType === 'college'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {institute.instituteType}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {error && (
              <div className="m-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {!selectedInstitute && institutes.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md px-4">
                  <School size={64} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Institutes Yet</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Get started by adding your first college or school using the button in the navbar
                  </p>
                </div>
              </div>
            ) : !selectedInstitute ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md px-4">
                  <Building2 size={64} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a College</h3>
                  <p className="text-sm text-gray-600">
                    Choose a college from the sidebar to view details
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4">
                {/* Institute Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4">
                  {/* Campus Image */}
                  <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 relative">
                    {selectedInstitute.campusBackgroundImage ? (
                      <img
                        src={selectedInstitute.campusBackgroundImage}
                        alt={selectedInstitute.instituteName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <School size={40} className="text-white opacity-50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    
                    {/* Type Badge */}
                    <span className="absolute top-3 right-3 px-2 py-1 text-xs font-semibold bg-white/90 backdrop-blur-sm text-gray-800 rounded-full uppercase">
                      {selectedInstitute.instituteType}
                    </span>
                  </div>

                  {/* Institute Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-0.5">
                          {selectedInstitute.instituteName}
                        </h2>
                        <p className="text-xs text-gray-600">ID: {selectedInstitute.instituteId}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(selectedInstitute)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Institute"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteInstitute(selectedInstitute._id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Institute"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <Users size={16} className="mx-auto text-gray-600 mb-1" />
                        <p className="text-xs text-gray-600 mb-0.5">Students</p>
                        <p className="text-xl font-bold text-gray-900">
                          {selectedInstitute.studentsCount || 0}
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-3 text-center">
                        <div className="text-lg mb-1">🏆</div>
                        <p className="text-xs text-yellow-700 mb-0.5">Gold</p>
                        <p className="text-xl font-bold text-yellow-700">
                          {selectedInstitute.totalGoldenAssigned || 0}
                        </p>
                      </div>
                      <div className="bg-gray-100 rounded-lg p-3 text-center">
                        <div className="text-lg mb-1">🥈</div>
                        <p className="text-xs text-gray-700 mb-0.5">Silver</p>
                        <p className="text-xl font-bold text-gray-700">
                          {selectedInstitute.totalSilverAssigned || 0}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleUploadClick(selectedInstitute)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
                      >
                        <Upload size={14} />
                        <span>Upload Students</span>
                      </button>
                      <button
                        onClick={() => handleDistributeCoinsClick(selectedInstitute)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-xs font-medium"
                      >
                        <Coins size={14} />
                        <span>Distribute Coins</span>
                      </button>
                      <button
                        onClick={() => handleViewRewardsClick(selectedInstitute)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs font-medium"
                      >
                        <TrendingUp size={14} />
                        <span>Rewards History</span>
                      </button>
                      <button
                        onClick={() => handleEditClick(selectedInstitute)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                      >
                        <Edit size={14} />
                        <span>Edit Details</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Stats</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                        <span className="text-xs text-gray-600">Total Students</span>
                        <span className="text-xs font-semibold text-gray-900">
                          {selectedInstitute.studentsCount || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                        <span className="text-xs text-gray-600">Institute Type</span>
                        <span className="text-xs font-semibold text-gray-900 capitalize">
                          {selectedInstitute.instituteType}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                        <span className="text-xs text-gray-600">Coin Distributions</span>
                        <span className="text-xs font-semibold text-gray-900">
                          {selectedInstitute.assignmentEventsCount || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                        <span className="text-xs text-gray-600">Assessments</span>
                        <span className="text-xs font-semibold text-gray-900">
                          {assessments.filter(a => a.institutes.some(inst => inst._id === selectedInstitute._id)).length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-xs text-gray-600">Status</span>
                        <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded">
                          Active
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h3>
                    <div className="space-y-2">
                      {selectedInstitute.assignmentEventsCount > 0 ? (
                        <div className="text-xs text-gray-600 text-center py-6">
                          <TrendingUp size={28} className="mx-auto text-gray-300 mb-2" />
                          <p>View detailed history in Rewards History</p>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 text-center py-6">
                          No activity yet
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assessments Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileText size={20} className="text-blue-600" />
                      <h3 className="text-sm font-semibold text-gray-900">Assessments for this Institute</h3>
                    </div>
                    <button
                      onClick={() => setShowAssessmentUpload(true)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Create New
                    </button>
                  </div>

                  {loadingAssessments ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <>
                      {assessments.filter(assessment => 
                        assessment.institutes.some(inst => inst._id === selectedInstitute._id)
                      ).length === 0 ? (
                        <div className="text-center py-8">
                          <FileText size={32} className="mx-auto text-gray-300 mb-2" />
                          <p className="text-sm text-gray-500 mb-3">No assessments created for this institute yet</p>
                          <button
                            onClick={() => setShowAssessmentUpload(true)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Create your first assessment
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {assessments
                            .filter(assessment => 
                              assessment.institutes.some(inst => inst._id === selectedInstitute._id)
                            )
                            .map((assessment) => (
                              <div
                                key={assessment._id}
                                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="text-sm font-semibold text-gray-900">
                                        {assessment.title}
                                      </h4>
                                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                        assessment.isActive
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-gray-100 text-gray-600'
                                      }`}>
                                        {assessment.isActive ? 'Active' : 'Inactive'}
                                      </span>
                                    </div>
                                    {assessment.description && (
                                      <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                                        {assessment.description}
                                      </p>
                                    )}
                                    
                                    {/* Assigned Institutes */}
                                    <div className="mb-2">
                                      <div className="flex flex-wrap gap-1 items-center">
                                        <span className="text-xs text-gray-500 mr-1">Assigned to:</span>
                                        {assessment.institutes && assessment.institutes.length > 0 ? (
                                          assessment.institutes.map((inst) => (
                                            <span
                                              key={inst._id}
                                              className={`px-2 py-0.5 text-xs rounded-full ${
                                                inst._id === selectedInstitute._id
                                                  ? 'bg-blue-100 text-blue-700 font-medium'
                                                  : 'bg-gray-100 text-gray-600'
                                              }`}
                                            >
                                              {inst.instituteName || inst.name || inst.instituteId}
                                            </span>
                                          ))
                                        ) : (
                                          <span className="text-xs text-gray-400">No institutes</span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                      <span className="flex items-center gap-1">
                                        <FileText size={12} />
                                        {assessment.questionCount} Questions
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <BarChart3 size={12} />
                                        {assessment.totalMarks} Marks
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Users size={12} />
                                        {assessment.attemptsCount || 0} Attempts
                                      </span>
                                      {assessment.averageScore > 0 && (
                                        <span className="flex items-center gap-1">
                                          <TrendingUp size={12} />
                                          Avg: {assessment.averageScore.toFixed(1)}%
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setShowAssessmentList(true);
                                    }}
                                    className="ml-2 p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="View Details"
                                  >
                                    <Eye size={16} />
                                  </button>
                                </div>
                                <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                                  Created: {new Date(assessment.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      {/* Modals */}
      {showInstituteForm && (
        <InstituteForm
          onSubmit={editingInstitute ? handleUpdateInstitute : handleCreateInstitute}
          onClose={() => {
            setShowInstituteForm(false);
            setEditingInstitute(null);
          }}
          initialData={editingInstitute}
        />
      )}

      {showExcelUpload && selectedInstituteForUpload && (
        <ExcelUpload
          instituteId={selectedInstituteForUpload._id}
          instituteName={selectedInstituteForUpload.instituteName}
          instituteType={selectedInstituteForUpload.instituteType}
          onClose={() => {
            setShowExcelUpload(false);
            setSelectedInstituteForUpload(null);
          }}
          onSuccess={handleUploadSuccess}
        />
      )}

      {showDistributeCoins && selectedInstituteForRewards && (
        <DistributeCoinsModal
          institute={selectedInstituteForRewards}
          onClose={() => {
            setShowDistributeCoins(false);
            setSelectedInstituteForRewards(null);
          }}
          onSuccess={handleDistributeSuccess}
        />
      )}

      {showRewardsDashboard && selectedInstituteForRewards && (
        <InstituteRewardsDashboard
          institute={selectedInstituteForRewards}
          onClose={() => {
            setShowRewardsDashboard(false);
            setSelectedInstituteForRewards(null);
          }}
        />
      )}

      {/* Assessment Upload Modal */}
      {showAssessmentUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowAssessmentUpload(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="p-6">
              <AssessmentUpload
                institutes={institutes}
                onUploadSuccess={handleAssessmentUploadSuccess}
              />
            </div>
          </div>
        </div>
      )}

      {/* Assessment List Modal */}
      {showAssessmentList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto relative">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-800">My Assessments</h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    setShowAssessmentList(false);
                    setShowAssessmentUpload(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Upload New Test
                </button>
                <button
                  onClick={() => setShowAssessmentList(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <AssessmentList onUpdate={fetchAssessments} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampusAmbassadorDashboard;

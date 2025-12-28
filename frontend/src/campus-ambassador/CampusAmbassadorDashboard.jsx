import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload, School, Users, Trash2, Edit } from 'lucide-react';
import { useCampusAmbassador } from '../context/CampusAmbassadorContext';
import { useAuth } from '../context/AuthContext';
import InstituteForm from './InstituteForm';
import ExcelUpload from './ExcelUpload';

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

  // Check if campus ambassador needs to change password
  useEffect(() => {
    if (user && user.isFirstLogin) {
      navigate('/change-password', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchInstitutes();
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Campus Ambassador Dashboard</h1>
          <p className="text-gray-600">Manage your institutes and onboard students</p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setShowInstituteForm(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            <span>Add College / School</span>
          </button>
          
          <button
            className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            onClick={() => alert('Upload Test feature coming soon!')}
          >
            <Upload size={20} />
            <span>Upload Test (UI Only)</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && institutes.length === 0 && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading institutes...</p>
          </div>
        )}

        {/* Institutes Grid */}
        {!loading && institutes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <School size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Institutes Yet</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first college or school</p>
            <button
              onClick={() => setShowInstituteForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Add Institute
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {institutes.map((institute) => (
              <div key={institute._id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
                {/* Institute Image */}
                <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative">
                  {institute.campusBackgroundImage ? (
                    <img
                      src={institute.campusBackgroundImage}
                      alt={institute.instituteName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <School size={64} className="text-white opacity-50" />
                    </div>
                  )}
                </div>

                {/* Institute Details */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-800">{institute.instituteName}</h3>
                    <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded uppercase">
                      {institute.instituteType}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4">ID: {institute.instituteId}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <Users size={16} className="mx-auto text-gray-600 mb-1" />
                      <p className="text-xs text-gray-600">Students</p>
                      <p className="font-bold text-gray-800">{institute.studentsCount || 0}</p>
                    </div>
                    <div className="bg-yellow-50 p-2 rounded text-center">
                      <p className="text-xs text-yellow-700">🏆 Gold</p>
                      <p className="text-[10px] text-yellow-600">Per student: {institute.perStudentGoldCoins || 0}</p>
                      <p className="font-bold text-yellow-700">Total: {institute.goldCoins > 0 ? institute.goldCoins : '-'}</p>
                    </div>
                    <div className="bg-gray-100 p-2 rounded text-center">
                      <p className="text-xs text-gray-700">🥈 Silver</p>
                      <p className="text-[10px] text-gray-600">Per student: {institute.perStudentSilverCoins || 0}</p>
                      <p className="font-bold text-gray-700">Total: {institute.silverCoins > 0 ? institute.silverCoins : '-'}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUploadClick(institute)}
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
                    >
                      <Upload size={16} />
                      <span>Upload</span>
                    </button>
                    <button
                      onClick={() => handleEditClick(institute)}
                      className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteInstitute(institute._id)}
                      className="flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

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
            onClose={() => {
              setShowExcelUpload(false);
              setSelectedInstituteForUpload(null);
            }}
            onSuccess={handleUploadSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default CampusAmbassadorDashboard;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { useAuth } from '../context/AuthContext.jsx';

const InterviewerVerificationStatus = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApplicationStatus();
  }, []);

  const fetchApplicationStatus = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/api/interview/verification-status`, {
        withCredentials: true
      });
      setApplication(res.data.application);
    } catch (err) {
      if (err.response?.status === 404) {
        setApplication(null);
      } else {
        setError(err.response?.data?.message || 'Failed to fetch status');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = () => {
    if (!application) {
      return {
        title: 'Not Applied',
        description: 'You have not submitted an interviewer verification application yet.',
        icon: '📋',
        color: 'gray',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-700',
        showApplyButton: true
      };
    }

    switch (application.status) {
      case 'pending':
        return {
          title: 'Application Pending',
          description: 'Your application is under review by our admin team. You will be notified once a decision is made.',
          icon: '⏳',
          color: 'yellow',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-300',
          textColor: 'text-yellow-800',
          showApplyButton: false
        };
      case 'approved':
        return {
          title: 'Application Approved',
          description: 'Congratulations! Your application has been approved. You can now conduct interviews on our platform.',
          icon: '✅',
          color: 'green',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-300',
          textColor: 'text-green-800',
          showApplyButton: false
        };
      case 'rejected':
        return {
          title: 'Application Rejected',
          description: application.rejectionReason || 'Unfortunately, your application was not approved. Please review the requirements and reapply.',
          icon: '❌',
          color: 'red',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-300',
          textColor: 'text-red-800',
          showApplyButton: true
        };
      default:
        return {
          title: 'Unknown Status',
          description: 'Unable to determine application status.',
          icon: '❓',
          color: 'gray',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-700',
          showApplyButton: false
        };
    }
  };

  const status = getStatusConfig();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pt-16 md:pt-[72px] xl:pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-900 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pt-16 md:pt-[72px] xl:pt-20">
      <div className="max-w-4xl mx-auto px-6 pb-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-900 mb-3">Interviewer Verification Status</h1>
          <p className="text-sm text-gray-600">
            Track your interviewer application progress
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          {/* Status Banner */}
          <div className={`${status.bgColor} border-b-4 ${status.borderColor} px-8 py-12 text-center`}>
            <div className="text-6xl mb-4">{status.icon}</div>
            <h2 className={`text-3xl font-bold ${status.textColor} mb-3`}>
              {status.title}
            </h2>
            <p className={`text-sm ${status.textColor} max-w-2xl mx-auto`}>
              {status.description}
            </p>
          </div>

          {/* Application Details */}
          {application && (
            <div className="px-8 py-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Application Details</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Name</span>
                    <span className="font-medium text-gray-900">{application.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Company</span>
                    <span className="font-medium text-gray-900">{application.company}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Position</span>
                    <span className="font-medium text-gray-900">{application.position}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Experience</span>
                    <span className="font-medium text-gray-900">{application.experience} years</span>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  {application.age && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Age</span>
                      <span className="font-medium text-gray-900">{application.age}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Qualification</span>
                    <span className="font-medium text-gray-900">{application.qualification}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Past Interviews</span>
                    <span className="font-medium text-gray-900">{application.totalPastInterviews || 0}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Submitted On</span>
                    <span className="font-medium text-gray-900">
                      {new Date(application.submittedAt || application.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {application.approvedAt && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Approved On</span>
                      <span className="font-medium text-gray-900">
                        {new Date(application.approvedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Resume */}
              {application.resumeUrl && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Submitted Documents</h4>
                  <div className="flex gap-4">
                    <a
                      href={application.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition"
                    >
                      📄 View Resume
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Call to Action */}
          {status.showApplyButton && (
            <div className="px-8 pb-8">
              <button
                onClick={() => navigate('/interview/apply')}
                className="group w-full py-5 bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-xl hover:from-blue-800 hover:to-blue-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
              >
                <svg 
                  className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                  />
                </svg>
                <span className="text-base font-bold tracking-wide">Apply as Interviewer</span>
                <svg 
                  className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2.5} 
                    d="M13 7l5 5m0 0l-5 5m5-5H6" 
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Info Box */}
        {user?.isApprovedInterviewer && (
          <div className="bg-blue-900 text-white rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-lg font-bold mb-2">You are Verified!</h3>
            <p className="text-sm opacity-90">
              You are now verified to conduct interviews on our platform.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewerVerificationStatus;

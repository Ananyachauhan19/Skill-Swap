import React, { useState } from 'react';

const initialGroupFormData = {
  organizerName: '',
  domain: '',
  dateTime: '',
  duration: 30,
  participants: '',
  meetingLink: ''
};

const initialInterviewFormData = {
  organizerName: '',
  domain: '',
  dateTime: '',
  candidateName: '',
  candidateEmail: '',
  meetingLink: ''
};

const AdminPanel = () => {
  const [activeForm, setActiveForm] = useState(null);
  const [groupFormData, setGroupFormData] = useState(initialGroupFormData);
  const [interviewFormData, setInterviewFormData] = useState(initialInterviewFormData);

  const handleGroupInputChange = (e) => {
    const { name, value } = e.target;
    setGroupFormData(prev => ({
      ...prev,
      [name]: name === 'duration' ? Number(value) : value
    }));
  };

  const handleInterviewInputChange = (e) => {
    const { name, value } = e.target;
    setInterviewFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGroupSubmit = (e) => {
    e.preventDefault();
    alert('Group Discussion scheduled successfully!');
    setActiveForm(null);
    setGroupFormData(initialGroupFormData);
  };

  const handleInterviewSubmit = (e) => {
    e.preventDefault();
    alert('Job Interview scheduled successfully!');
    setActiveForm(null);
    setInterviewFormData(initialInterviewFormData);
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Main Dashboard */}
      {!activeForm && (
        <div className="w-full max-w-4xl space-y-12">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">
              Admin Dashboard
            </h1>
            <p className="text-lg font-medium text-gray-600 max-w-md mx-auto">
              Seamlessly schedule and manage group discussions and job interviews
            </p>
          </div>
          <div className="flex flex-col space-y-12 items-center">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 transition-all duration-500 ease-in-out hover:shadow-2xl hover:-translate-y-2 hover:scale-105 w-full max-w-md">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
              <div className="p-6 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center mb-4">
                    <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Group Discussions</h2>
                  </div>
                  <p className="text-gray-600 text-base font-medium">
                    Organize collaborative sessions with multiple participants effortlessly
                  </p>
                </div>
                <button
                  onClick={() => setActiveForm('group')}
                  className="w-full py-3 px-4 mt-6 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg font-semibold transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg"
                  aria-label="Schedule a group discussion"
                >
                  <span>Schedule Discussion</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 ml-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 transition-all duration-500 ease-in-out hover:shadow-2xl hover:-translate-y-2 hover:scale-105 w-full max-w-md">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
              <div className="p-6 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center mb-4">
                    <div className="p-2 rounded-full bg-indigo-100 text-indigo-600 mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Job Interviews</h2>
                  </div>
                  <p className="text-gray-600 text-base font-medium">
                    Coordinate professional interviews with candidates seamlessly
                  </p>
                </div>
                <button
                  onClick={() => setActiveForm('interview')}
                  className="w-full py-3 px-4 mt-6 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-semibold transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg"
                  aria-label="Schedule a job interview"
                >
                  <span>Schedule Interview</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 ml-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group Discussion Modal */}
      {activeForm === 'group' && (
        <div className="fixed inset-0 bg-blue-50 flex items-center justify-center p-4 z-50 transition-all duration-500 ease-in-out">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl transform transition-all duration-500 ease-in-out scale-100">
            <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Schedule Group Discussion</h2>
              <button
                onClick={() => setActiveForm(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close group discussion form"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Organizer Name
                </label>
                <input
                  type="text"
                  name="organizerName"
                  value={groupFormData.organizerName}
                  onChange={handleGroupInputChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter organizer's full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Discussion Topic
                </label>
                <input
                  type="text"
                  name="domain"
                  value={groupFormData.domain}
                  onChange={handleGroupInputChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter discussion topic or domain"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    name="dateTime"
                    value={groupFormData.dateTime}
                    onChange={handleGroupInputChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={groupFormData.duration}
                    onChange={handleGroupInputChange}
                    min="1"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter duration in minutes"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Participants (emails)
                </label>
                <textarea
                  name="participants"
                  value={groupFormData.participants}
                  onChange={handleGroupInputChange}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter participant emails (comma-separated)"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Meeting Link
                </label>
                <input
                  type="url"
                  name="meetingLink"
                  value={groupFormData.meetingLink}
                  onChange={handleGroupInputChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="https://meet.example.com/your-session"
                  required
                />
              </div>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleGroupSubmit}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                  aria-label="Submit group discussion schedule"
                >
                  Schedule Discussion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Interview Modal */}
      {activeForm === 'interview' && (
        <div className="fixed inset-0 bg-blue-50 flex items-center justify-center p-4 z-50 transition-all duration-500 ease-in-out">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl transform transition-all duration-500 ease-in-out scale-100">
            <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Schedule Job Interview</h2>
              <button
                onClick={() => setActiveForm(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close job interview form"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Organizer Name
                </label>
                <input
                  type="text"
                  name="organizerName"
                  value={interviewFormData.organizerName}
                  onChange={handleInterviewInputChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter organizer's full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Job Position
                </label>
                <input
                  type="text"
                  name="domain"
                  value={interviewFormData.domain}
                  onChange={handleInterviewInputChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter job position or department"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="dateTime"
                  value={interviewFormData.dateTime}
                  onChange={handleInterviewInputChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Candidate Name
                </label>
                <input
                  type="text"
                  name="candidateName"
                  value={interviewFormData.candidateName}
                  onChange={handleInterviewInputChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter candidate's full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Candidate Email
                </label>
                <input
                  type="email"
                  name="candidateEmail"
                  value={interviewFormData.candidateEmail}
                  onChange={handleInterviewInputChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter candidate's email address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Meeting Link
                </label>
                <input
                  type="url"
                  name="meetingLink"
                  value={interviewFormData.meetingLink}
                  onChange={handleInterviewInputChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="https://meet.example.com/your-interview"
                  required
                />
              </div>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleInterviewSubmit}
                  className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                  aria-label="Submit job interview schedule"
                >
                  Schedule Interview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
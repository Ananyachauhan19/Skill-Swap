import React, { useState, useEffect } from 'react';
import { Search, Trash2, AlertCircle, Users, Filter, X, Edit } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config';

const StudentDatabaseTab = ({ institute }) => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', course: '', semester: '', class: '' });
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState(null);

  const isSchool = institute?.instituteType === 'school';

  useEffect(() => {
    fetchStudents();
  }, [institute._id]);

  useEffect(() => {
    applyFilters();
  }, [students, searchQuery, selectedCourse, selectedSemester, selectedClass]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${BACKEND_URL}/api/campus-ambassador/institutes/${institute._id}/students`,
        { withCredentials: true }
      );
      setStudents(response.data.students || []);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...students];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(student => 
        student.name?.toLowerCase().includes(query) ||
        student.email?.toLowerCase().includes(query)
      );
    }

    // Course/Class filter
    if (isSchool) {
      if (selectedClass !== 'all') {
        filtered = filtered.filter(student => student.class === selectedClass);
      }
    } else {
      if (selectedCourse !== 'all') {
        filtered = filtered.filter(student => student.course === selectedCourse);
      }
      if (selectedSemester !== 'all') {
        filtered = filtered.filter(student => student.semester?.toString() === selectedSemester);
      }
    }

    setFilteredStudents(filtered);
  };

  const handleDeleteStudent = async (studentId) => {
    try {
      setDeleting(true);
      await axios.delete(
        `${BACKEND_URL}/api/campus-ambassador/institutes/${institute._id}/students/${studentId}`,
        { withCredentials: true }
      );
      setStudents(prev => prev.filter(s => s._id !== studentId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting student:', err);
      alert(err.response?.data?.message || 'Failed to delete student');
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (student) => {
    setEditStudent(student);
    setEditForm({
      name: student.name || '',
      email: student.email || '',
      course: student.course || '',
      semester: student.semester?.toString() || '',
      class: student.class || ''
    });
    setEditError(null);
  };

  const handleUpdateStudent = async () => {
    try {
      setUpdating(true);
      setEditError(null);

      const updateData = {
        name: editForm.name.trim(),
        email: editForm.email.trim().toLowerCase(),
        ...(isSchool ? { class: editForm.class } : {}),
        ...(!isSchool ? { course: editForm.course, semester: parseInt(editForm.semester) } : {})
      };

      await axios.put(
        `${BACKEND_URL}/api/campus-ambassador/institutes/${institute._id}/students/${editStudent._id}`,
        updateData,
        { withCredentials: true }
      );

      // Update local state
      setStudents(prev => prev.map(s => 
        s._id === editStudent._id 
          ? { ...s, ...updateData }
          : s
      ));

      setEditStudent(null);
    } catch (err) {
      console.error('Error updating student:', err);
      setEditError(err.response?.data?.message || 'Failed to update student');
    } finally {
      setUpdating(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCourse('all');
    setSelectedSemester('all');
    setSelectedClass('all');
  };

  // Get unique courses/classes for filters
  const uniqueCourses = isSchool 
    ? []
    : [...new Set(students.map(s => s.course).filter(Boolean))];
  const uniqueClasses = isSchool 
    ? [...new Set(students.map(s => s.class).filter(Boolean))]
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
        <AlertCircle size={20} />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Student Database</h2>
          <p className="text-sm text-gray-600 mt-1">
            {institute.instituteName} • {filteredStudents.length} of {students.length} students
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Filters */}
          {isSchool ? (
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Classes</option>
              {uniqueClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          ) : (
            <>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Courses</option>
                {uniqueCourses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(sem => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
            </>
          )}

          {(searchQuery || selectedCourse !== 'all' || selectedSemester !== 'all' || selectedClass !== 'all') && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Students Table */}
      {filteredStudents.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600">
            {students.length === 0 
              ? 'No students found in this institute'
              : 'No students match your search criteria'}
          </p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                  {isSchool ? (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Class</th>
                  ) : (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Course</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Semester</th>
                    </>
                  )}
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{student.name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{student.email || '-'}</td>
                    {isSchool ? (
                      <td className="px-4 py-3 text-sm text-gray-900">{student.class || '-'}</td>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-sm text-gray-900">{student.course || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{student.semester || '-'}</td>
                      </>
                    )}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(student)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                          title="Edit student"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(student)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                          title="Delete student"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Student</h3>
              <button
                onClick={() => setEditStudent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {editError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded text-sm">
                {editError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {isSchool ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editForm.class}
                    onChange={(e) => setEditForm(prev => ({ ...prev, class: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Select Class --</option>
                    {uniqueClasses.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Course <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editForm.course}
                      onChange={(e) => setEditForm(prev => ({ ...prev, course: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">-- Select Course --</option>
                      {uniqueCourses.map(course => (
                        <option key={course} value={course}>{course}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Semester <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editForm.semester}
                      onChange={(e) => setEditForm(prev => ({ ...prev, semester: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">-- Select Semester --</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(sem => (
                        <option key={sem} value={sem}>{sem}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditStudent(null)}
                disabled={updating}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStudent}
                disabled={updating || !editForm.name.trim() || !editForm.email.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Student</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded p-3 mb-4">
              <p className="text-sm text-gray-700">
                <strong>Name:</strong> {deleteConfirm.name}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Email:</strong> {deleteConfirm.email}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteStudent(deleteConfirm._id)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDatabaseTab;

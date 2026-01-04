import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Download, Calendar, ChevronDown, Filter, Users, Search, RefreshCw, Eye } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import StudentReportModal from './StudentReportModal';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const ReportsTab = ({ institute }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    courses: [],
    semesters: [],
    classes: [],
    availableMonths: []
  });
  
  // Filter state
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [reportType, setReportType] = useState('overall');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data state
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  
  // Modal state
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Bulk download state
  const [bulkDownloading, setBulkDownloading] = useState(false);

  const isSchool = institute?.instituteType === 'school';

  // Fetch filters on mount
  useEffect(() => {
    if (institute?._id) {
      fetchFilters();
    }
  }, [institute?._id]);

  // Fetch reports when filters change
  useEffect(() => {
    if (institute?._id) {
      fetchReports();
    }
  }, [institute?._id, selectedMonth, selectedYear, selectedCourse, selectedSemester, reportType, pagination.page]);

  const fetchFilters = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/assessment-reports/campus-ambassador/institute/${institute._id}/filters`,
        { withCredentials: true }
      );
      setFilters(response.data);
    } catch (err) {
      console.error('Error fetching filters:', err);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        `${BACKEND_URL}/api/assessment-reports/campus-ambassador/institute/${institute._id}/students`,
        {
          params: {
            month: selectedMonth,
            year: selectedYear,
            type: reportType,
            course: selectedCourse,
            semester: selectedSemester,
            page: pagination.page,
            limit: pagination.limit
          },
          withCredentials: true
        }
      );
      
      setStudents(response.data.students || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0,
        pages: response.data.pagination?.pages || 0
      }));
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  // Filter students by search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const query = searchQuery.toLowerCase();
    return students.filter(s => 
      s.name?.toLowerCase().includes(query) ||
      s.email?.toLowerCase().includes(query) ||
      s.studentId?.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  // Generate month options
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      options.push({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        label: `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`
      });
    }
    return options;
  }, []);

  const handleMonthChange = (e) => {
    const [year, month] = e.target.value.split('-').map(Number);
    setSelectedYear(year);
    setSelectedMonth(month);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Bulk PDF Download
  const handleBulkDownload = async () => {
    try {
      setBulkDownloading(true);
      
      const response = await axios.post(
        `${BACKEND_URL}/api/assessment-reports/campus-ambassador/bulk`,
        {
          instituteId: institute._id,
          month: selectedMonth,
          year: selectedYear,
          type: reportType,
          course: selectedCourse !== 'all' ? selectedCourse : undefined,
          semester: selectedSemester !== 'all' ? selectedSemester : undefined
        },
        { withCredentials: true }
      );
      
      const data = response.data;
      if (!data.students || data.students.length === 0) {
        alert('No reports found for the selected criteria');
        return;
      }
      
      // Generate bulk PDF
      const monthName = MONTH_NAMES[data.month - 1];
      const reportTitle = reportType === 'compulsory' ? 'Compulsory Assessment Report' : 'Overall Assessment Report';
      const filterInfo = [];
      if (selectedCourse !== 'all') filterInfo.push(`Course: ${selectedCourse}`);
      if (selectedSemester !== 'all') filterInfo.push(`Semester: ${selectedSemester}`);
      
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Bulk ${reportTitle} - ${monthName} ${data.year}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Times New Roman', serif; padding: 20px; background: white; }
            .page-break { page-break-after: always; }
            .report { margin-bottom: 40px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 3px double #1e3a5f; padding-bottom: 15px; }
            .header h1 { color: #1e3a5f; font-size: 22px; margin-bottom: 5px; }
            .header h2 { color: #2563eb; font-size: 16px; font-weight: normal; margin-bottom: 8px; }
            .header p { color: #666; font-size: 13px; }
            .student-info { display: flex; justify-content: space-between; margin-bottom: 20px; padding: 12px; background: #f8fafc; border-radius: 6px; font-size: 13px; }
            .student-info div { flex: 1; }
            .student-info p { margin: 4px 0; }
            .student-info strong { color: #1e3a5f; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
            th { background: #1e3a5f; color: white; padding: 10px 6px; text-align: left; }
            td { padding: 8px 6px; border-bottom: 1px solid #e2e8f0; }
            tr:nth-child(even) { background: #f8fafc; }
            .summary { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); color: white; padding: 15px; border-radius: 6px; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; text-align: center; }
            .summary-item h3 { font-size: 18px; margin-bottom: 3px; }
            .summary-item p { font-size: 11px; opacity: 0.9; }
            .no-tests { text-align: center; padding: 30px; color: #666; font-style: italic; }
            .grade-badge { display: inline-block; padding: 6px 15px; background: #fbbf24; color: #1e3a5f; font-weight: bold; font-size: 16px; border-radius: 50px; }
            @media print { 
              body { padding: 10px; } 
              .page-break { page-break-after: always; }
            }
          </style>
        </head>
        <body>
          ${data.students.map((student, idx) => `
            <div class="report ${idx < data.students.length - 1 ? 'page-break' : ''}">
              <div class="header">
                <h1>${data.institute?.name || 'Campus Institute'}</h1>
                <h2>${reportTitle}</h2>
                <p>${monthName} ${data.year}${filterInfo.length ? ' • ' + filterInfo.join(' • ') : ''}</p>
              </div>
              
              <div class="student-info">
                <div>
                  <p><strong>Student Name:</strong> ${student.name}</p>
                  <p><strong>Student ID:</strong> ${student.studentId || 'N/A'}</p>
                  <p><strong>Email:</strong> ${student.email}</p>
                </div>
                <div>
                  <p><strong>Course:</strong> ${student.course || student.class || 'N/A'}</p>
                  <p><strong>Semester:</strong> ${student.semester || 'N/A'}</p>
                </div>
              </div>
              
              ${student.report.tests.length > 0 ? `
                <table>
                  <thead>
                    <tr>
                      <th>Sr.</th>
                      <th>Test Name</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Obtained</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${student.report.tests.map(test => `
                      <tr>
                        <td>${test.srNo}</td>
                        <td>${test.testName}</td>
                        <td>${new Date(test.date).toLocaleDateString('en-IN')}</td>
                        <td>${test.totalMarks}</td>
                        <td>${test.marksObtained}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                
                <div class="summary">
                  <div class="summary-grid">
                    <div class="summary-item">
                      <h3>${student.report.summary.totalTests}</h3>
                      <p>Tests</p>
                    </div>
                    <div class="summary-item">
                      <h3>${student.report.summary.sumMarksObtained}/${student.report.summary.sumTotalMarks}</h3>
                      <p>Score</p>
                    </div>
                    <div class="summary-item">
                      <h3>${student.report.summary.average.toFixed(1)}</h3>
                      <p>Average</p>
                    </div>
                    <div class="summary-item">
                      <h3>${student.report.summary.percentage.toFixed(1)}%</h3>
                      <p>Percentage</p>
                    </div>
                  </div>
                  <div style="text-align: center; margin-top: 12px;">
                    <span class="grade-badge">Grade: ${student.report.summary.grade}</span>
                  </div>
                </div>
              ` : '<p class="no-tests">No tests found for this period.</p>'}
            </div>
          `).join('')}
        </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
      
    } catch (err) {
      console.error('Error downloading bulk reports:', err);
      alert('Failed to download reports. Please try again.');
    } finally {
      setBulkDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Assessment Reports
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {institute.instituteName} • View and download student assessment reports
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={`${selectedYear}-${selectedMonth}`}
              onChange={handleMonthChange}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 appearance-none bg-white cursor-pointer min-w-[180px]"
            >
              {monthOptions.map(opt => (
                <option key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Course/Class Filter */}
          {isSchool ? (
            <select
              value={selectedCourse}
              onChange={(e) => { setSelectedCourse(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Classes</option>
              {filters.classes?.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          ) : (
            <>
              <select
                value={selectedCourse}
                onChange={(e) => { setSelectedCourse(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Courses</option>
                {filters.courses?.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
              <select
                value={selectedSemester}
                onChange={(e) => { setSelectedSemester(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Semesters</option>
                {filters.semesters?.map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </>
          )}

          {/* Report Type Toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => { setReportType('overall'); setPagination(p => ({ ...p, page: 1 })); }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                reportType === 'overall' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Overall
            </button>
            <button
              onClick={() => { setReportType('compulsory'); setPagination(p => ({ ...p, page: 1 })); }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                reportType === 'compulsory' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Compulsory
            </button>
          </div>

          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Bulk Download Button */}
          <button
            onClick={handleBulkDownload}
            disabled={bulkDownloading || loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {bulkDownloading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Bulk Download
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Students Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Reports Found</h3>
          <p className="text-gray-500 text-sm">
            No students have completed assessments for the selected criteria.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredStudents.length} of {pagination.total} students
            </p>
            <p className="text-sm text-gray-600">
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear} • {reportType === 'compulsory' ? 'Compulsory' : 'Overall'} Reports
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    {isSchool ? 'Class' : 'Course/Sem'}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Tests</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Average</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Percentage</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Grade</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{student.name}</p>
                        <p className="text-xs text-gray-500">{student.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {isSchool 
                        ? student.class || '-'
                        : `${student.course || '-'} / Sem ${student.semester || '-'}`
                      }
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium text-gray-900">
                        {student.report?.summary?.totalTests || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium text-gray-900">
                        {student.report?.summary?.average?.toFixed(1) || '0'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded ${
                        (student.report?.summary?.percentage || 0) >= 70 
                          ? 'bg-green-100 text-green-700' 
                          : (student.report?.summary?.percentage || 0) >= 40 
                            ? 'bg-yellow-100 text-yellow-700' 
                            : 'bg-red-100 text-red-700'
                      }`}>
                        {student.report?.summary?.percentage?.toFixed(1) || '0'}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-3 py-1 text-sm font-bold rounded-full ${
                        student.report?.summary?.grade === 'A+' || student.report?.summary?.grade === 'A' 
                          ? 'bg-green-100 text-green-700' 
                          : student.report?.summary?.grade === 'B+' || student.report?.summary?.grade === 'B' 
                            ? 'bg-blue-100 text-blue-700' 
                            : student.report?.summary?.grade === 'C' 
                              ? 'bg-yellow-100 text-yellow-700' 
                              : 'bg-red-100 text-red-700'
                      }`}>
                        {student.report?.summary?.grade || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Student Report Modal */}
      {selectedStudent && (
        <StudentReportModal
          student={selectedStudent}
          institute={institute}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
};

export default ReportsTab;

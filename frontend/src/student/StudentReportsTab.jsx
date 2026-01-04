import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Download, Calendar, ChevronDown, BookOpen, Award, TrendingUp, Filter } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const StudentReportsTab = () => {
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [reportType, setReportType] = useState('overall'); // 'overall' or 'compulsory'
  const [report, setReport] = useState(null);

  // Fetch available months on mount
  useEffect(() => {
    fetchAvailableMonths();
  }, []);

  const fetchAvailableMonths = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${BACKEND_URL}/api/assessment-reports/student/summary`,
        { withCredentials: true }
      );
      const months = response.data.availableMonths || [];
      setAvailableMonths(months);
      
      // Set default to most recent month
      if (months.length > 0) {
        setSelectedMonth(months[0].month);
        setSelectedYear(months[0].year);
      }
    } catch (err) {
      console.error('Error fetching available months:', err);
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch report when month/year/type changes
  useEffect(() => {
    if (selectedMonth && selectedYear) {
      fetchReport();
    }
  }, [selectedMonth, selectedYear, reportType]);

  const fetchReport = async () => {
    try {
      setReportLoading(true);
      setError(null);
      const endpoint = reportType === 'compulsory' 
        ? '/api/assessment-reports/student/monthly/compulsory'
        : '/api/assessment-reports/student/monthly/overall';
      
      const response = await axios.get(
        `${BACKEND_URL}${endpoint}`,
        { 
          params: { month: selectedMonth, year: selectedYear },
          withCredentials: true 
        }
      );
      setReport(response.data);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Failed to load report');
      setReport(null);
    } finally {
      setReportLoading(false);
    }
  };

  // Generate unique year-month options
  const monthOptions = useMemo(() => {
    return availableMonths.map(m => ({
      value: `${m.year}-${m.month}`,
      label: `${MONTH_NAMES[m.month - 1]} ${m.year}`,
      month: m.month,
      year: m.year,
      totalAttempts: m.totalAttempts,
      compulsoryAttempts: m.compulsoryAttempts
    }));
  }, [availableMonths]);

  const handleMonthChange = (e) => {
    const [year, month] = e.target.value.split('-').map(Number);
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  // PDF Download Handler
  const handleDownloadPDF = () => {
    if (!report) return;
    
    const { student, institute, tests, summary, month, year } = report;
    const monthName = MONTH_NAMES[month - 1];
    const reportTitle = reportType === 'compulsory' ? 'Compulsory Assessment Report' : 'Overall Assessment Report';
    
    // Create printable HTML
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportTitle} - ${monthName} ${year}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Times New Roman', serif; padding: 20px; background: white; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px double #1e3a5f; padding-bottom: 20px; }
          .header h1 { color: #1e3a5f; font-size: 24px; margin-bottom: 5px; }
          .header h2 { color: #2563eb; font-size: 18px; font-weight: normal; margin-bottom: 10px; }
          .header p { color: #666; font-size: 14px; }
          .student-info { display: flex; justify-content: space-between; margin-bottom: 25px; padding: 15px; background: #f8fafc; border-radius: 8px; }
          .student-info div { flex: 1; }
          .student-info p { margin: 5px 0; font-size: 14px; }
          .student-info strong { color: #1e3a5f; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          th { background: #1e3a5f; color: white; padding: 12px 8px; text-align: left; font-size: 13px; }
          td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          tr:nth-child(even) { background: #f8fafc; }
          .summary { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); color: white; padding: 20px; border-radius: 8px; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; text-align: center; }
          .summary-item h3 { font-size: 24px; margin-bottom: 5px; }
          .summary-item p { font-size: 12px; opacity: 0.9; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          .grade-badge { display: inline-block; padding: 8px 20px; background: #fbbf24; color: #1e3a5f; font-weight: bold; font-size: 20px; border-radius: 50px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${institute?.name || 'Campus Institute'}</h1>
          <h2>${reportTitle}</h2>
          <p>${monthName} ${year}</p>
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
            <p><strong>Report Type:</strong> ${reportType === 'compulsory' ? 'Compulsory Tests' : 'All Tests'}</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Sr. No</th>
              <th>Test Name</th>
              <th>Date</th>
              <th>Total Marks</th>
              <th>Marks Obtained</th>
            </tr>
          </thead>
          <tbody>
            ${tests.map(test => `
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
              <h3>${summary.totalTests}</h3>
              <p>Total Tests</p>
            </div>
            <div class="summary-item">
              <h3>${summary.sumMarksObtained}/${summary.sumTotalMarks}</h3>
              <p>Total Score</p>
            </div>
            <div class="summary-item">
              <h3>${summary.average.toFixed(2)}</h3>
              <p>Average Marks</p>
            </div>
            <div class="summary-item">
              <h3>${summary.percentage.toFixed(2)}%</h3>
              <p>Percentage</p>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px;">
            <span class="grade-badge">Grade: ${summary.grade}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>This is a computer-generated report from Skill-Swap Campus Assessment System</p>
          <p>Generated on: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}</p>
        </div>
      </body>
      </html>
    `;
    
    // Open print dialog
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (availableMonths.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Reports Available</h3>
        <p className="text-gray-500 text-sm">
          You haven't completed any assessments yet. Complete assessments to view your monthly reports.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Monthly Assessment Reports
            </h2>
            <p className="text-sm text-gray-600 mt-1">View and download your monthly assessment performance</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Month Selector */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedMonth && selectedYear ? `${selectedYear}-${selectedMonth}` : ''}
                onChange={handleMonthChange}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer"
              >
                {monthOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.totalAttempts} tests)
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            
            {/* Report Type Toggle */}
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setReportType('overall')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  reportType === 'overall' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Overall
              </button>
              <button
                onClick={() => setReportType('compulsory')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  reportType === 'compulsory' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Compulsory
              </button>
            </div>
            
            {/* Download Button */}
            {report && report.tests.length > 0 && (
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Report Content */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {reportLoading ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report...</p>
        </div>
      ) : report ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{report.summary.totalTests}</p>
                  <p className="text-xs text-gray-500">Total Tests</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{report.summary.average.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">Average Score</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{report.summary.percentage.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">Percentage</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  report.summary.grade === 'A+' || report.summary.grade === 'A' ? 'bg-green-100' :
                  report.summary.grade === 'B+' || report.summary.grade === 'B' ? 'bg-blue-100' :
                  report.summary.grade === 'C' ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <span className={`text-lg font-bold ${
                    report.summary.grade === 'A+' || report.summary.grade === 'A' ? 'text-green-600' :
                    report.summary.grade === 'B+' || report.summary.grade === 'B' ? 'text-blue-600' :
                    report.summary.grade === 'C' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {report.summary.grade}
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{report.summary.grade}</p>
                  <p className="text-xs text-gray-500">Grade</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tests Table */}
          {report.tests.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">
                No {reportType === 'compulsory' ? 'compulsory ' : ''}tests found for this month.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-900">
                  {reportType === 'compulsory' ? 'Compulsory Tests' : 'All Tests'} - {MONTH_NAMES[report.month - 1]} {report.year}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sr. No</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Test Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Total Marks</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Marks Obtained</th>
                      {reportType === 'overall' && (
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Type</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {report.tests.map((test) => (
                      <tr key={test.srNo} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{test.srNo}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{test.testName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(test.date).toLocaleDateString('en-IN', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-center">{test.totalMarks}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded ${
                            (test.marksObtained / test.totalMarks) >= 0.7 
                              ? 'bg-green-100 text-green-700' 
                              : (test.marksObtained / test.totalMarks) >= 0.4 
                                ? 'bg-yellow-100 text-yellow-700' 
                                : 'bg-red-100 text-red-700'
                          }`}>
                            {test.marksObtained}
                          </span>
                        </td>
                        {reportType === 'overall' && (
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              test.isCompulsory 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {test.isCompulsory ? 'Compulsory' : 'Optional'}
                            </span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-gray-900">Total</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-center">{report.summary.sumTotalMarks}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-center">
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded">
                          {report.summary.sumMarksObtained}
                        </span>
                      </td>
                      {reportType === 'overall' && <td></td>}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default StudentReportsTab;

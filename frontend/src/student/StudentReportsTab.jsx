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
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (availableMonths.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 text-center border border-blue-100 shadow-sm">
        <FileText className="w-12 h-12 text-blue-200 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-gray-800 mb-1">No Reports Available</h3>
        <p className="text-gray-500 text-xs">
          Complete assessments to view your monthly reports
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Monthly Assessment Reports</h2>
              <p className="text-xs text-blue-100 mt-0.5">View and download your performance reports</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Month Selector */}
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <select
                value={selectedMonth && selectedYear ? `${selectedYear}-${selectedMonth}` : ''}
                onChange={handleMonthChange}
                className="pl-8 pr-7 py-1.5 border border-blue-200 rounded-md text-xs focus:ring-2 focus:ring-blue-400 focus:border-transparent appearance-none bg-white cursor-pointer font-medium text-gray-700 shadow-sm"
              >
                {monthOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.totalAttempts})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
            
            {/* Report Type Toggle */}
            <div className="flex rounded-md border border-blue-200 overflow-hidden shadow-sm bg-white">
              <button
                onClick={() => setReportType('overall')}
                className={`px-3 py-1.5 text-xs font-semibold transition-all ${
                  reportType === 'overall' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-blue-50'
                }`}
              >
                Overall
              </button>
              <button
                onClick={() => setReportType('compulsory')}
                className={`px-3 py-1.5 text-xs font-semibold transition-all ${
                  reportType === 'compulsory' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-blue-50'
                }`}
              >
                Compulsory
              </button>
            </div>
            
            {/* Download Button */}
            {report && report.tests.length > 0 && (
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition-all text-xs font-semibold shadow-sm border border-blue-200"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Report Content */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-xs">
          {error}
        </div>
      )}

      {reportLoading ? (
        <div className="bg-white rounded-lg p-8 text-center border border-blue-100 shadow-sm">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600 text-xs">Loading report...</p>
        </div>
      ) : report ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-gray-900 leading-none">{report.summary.totalTests}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">Total Tests</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-gray-900 leading-none">{report.summary.average.toFixed(1)}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">Avg Score</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-gray-900 leading-none">{report.summary.percentage.toFixed(1)}%</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">Percentage</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  report.summary.grade === 'A+' || report.summary.grade === 'A' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                  report.summary.grade === 'B+' || report.summary.grade === 'B' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                  report.summary.grade === 'C' ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gradient-to-br from-red-500 to-red-600'
                }`}>
                  <span className="text-base font-bold text-white">
                    {report.summary.grade}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-gray-900 leading-none">{report.summary.grade}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">Grade</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tests Table */}
          {report.tests.length === 0 ? (
            <div className="bg-white rounded-lg p-6 text-center border border-blue-100 shadow-sm">
              <FileText className="w-10 h-10 text-blue-200 mx-auto mb-2" />
              <p className="text-gray-600 text-xs">
                No {reportType === 'compulsory' ? 'compulsory ' : ''}tests found for this month
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-blue-100 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-blue-100">
                <h3 className="text-xs font-bold text-blue-900">
                  {reportType === 'compulsory' ? 'Compulsory Tests' : 'All Tests'} - {MONTH_NAMES[report.month - 1]} {report.year}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-blue-50/50 border-b border-blue-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-[10px] font-bold text-blue-900 uppercase tracking-wide">No</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold text-blue-900 uppercase tracking-wide">Test Name</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold text-blue-900 uppercase tracking-wide">Date</th>
                      <th className="px-3 py-2 text-center text-[10px] font-bold text-blue-900 uppercase tracking-wide">Total</th>
                      <th className="px-3 py-2 text-center text-[10px] font-bold text-blue-900 uppercase tracking-wide">Obtained</th>
                      {reportType === 'overall' && (
                        <th className="px-3 py-2 text-center text-[10px] font-bold text-blue-900 uppercase tracking-wide">Type</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50">
                    {report.tests.map((test) => (
                      <tr key={test.srNo} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-3 py-2 text-xs text-gray-700 font-medium">{test.srNo}</td>
                        <td className="px-3 py-2 text-xs font-semibold text-gray-900">{test.testName}</td>
                        <td className="px-3 py-2 text-xs text-gray-600">
                          {new Date(test.date).toLocaleDateString('en-IN', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-900 text-center font-semibold">{test.totalMarks}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded ${
                            (test.marksObtained / test.totalMarks) >= 0.7 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : (test.marksObtained / test.totalMarks) >= 0.4 
                                ? 'bg-amber-100 text-amber-700' 
                                : 'bg-red-100 text-red-700'
                          }`}>
                            {test.marksObtained}
                          </span>
                        </td>
                        {reportType === 'overall' && (
                          <td className="px-3 py-2 text-center">
                            <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              test.isCompulsory 
                                ? 'bg-violet-100 text-violet-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {test.isCompulsory ? 'Comp' : 'Opt'}
                            </span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gradient-to-r from-blue-50 to-blue-100 border-t-2 border-blue-300">
                    <tr>
                      <td colSpan={3} className="px-3 py-2.5 text-xs font-bold text-blue-900 uppercase">Total</td>
                      <td className="px-3 py-2.5 text-xs font-bold text-blue-900 text-center">{report.summary.sumTotalMarks}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="bg-blue-600 text-white px-2.5 py-1 rounded font-bold text-xs">
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

import React, { useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Coins, Info, UserPlus } from 'lucide-react';
import * as XLSX from 'xlsx';

const ExcelUpload = ({ instituteId, instituteName, instituteType, onClose, onSuccess, variant = 'modal' }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [validationPreview, setValidationPreview] = useState(null);
  const [existingStudents, setExistingStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [instituteCourses, setInstituteCourses] = useState([]);
  const [coinInputs, setCoinInputs] = useState({
    perStudentSilver: 0,
    perStudentGolden: 0
  });
  const [uploadMode, setUploadMode] = useState('csv'); // 'csv' or 'manual'
  const [manualStudent, setManualStudent] = useState({
    name: '',
    email: '',
    class: '',
    course: '',
    semester: ''
  });
  const [manualSubmitting, setManualSubmitting] = useState(false);

  const isModal = variant !== 'page';

  // Fetch existing students function
  const fetchExistingStudents = React.useCallback(async () => {
    try {
      setLoadingStudents(true);
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/campus-ambassador/institutes/${instituteId}/students`,
        {
          method: 'GET',
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        setExistingStudents(data.students || []);
      } else {
        setExistingStudents([]);
      }
    } catch (err) {
      console.error('Failed to fetch existing students:', err);
      setExistingStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }, [instituteId]);

  // Fetch existing students when component mounts
  React.useEffect(() => {
    fetchExistingStudents();
  }, [fetchExistingStudents]);

  // Fetch institute courses
  React.useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/campus-ambassador/institutes/${instituteId}/courses`,
          {
            method: 'GET',
            credentials: 'include'
          }
        );

        if (response.ok) {
          const data = await response.json();
          setInstituteCourses(data.courses || []);
        } else {
          setInstituteCourses([]);
        }
      } catch (err) {
        console.error('Failed to fetch institute courses:', err);
        setInstituteCourses([]);
      }
    };

    fetchCourses();
  }, [instituteId]);

  const validateExcelFile = async (selectedFile) => {
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        return {
          valid: false,
          error: 'Excel file is empty',
          data: []
        };
      }

      // Validate required columns
      const firstRow = data[0];
      const hasEmail = 'email' in firstRow;
      const hasName = 'name' in firstRow;
      
      if (!hasEmail || !hasName) {
        return {
          valid: false,
          error: 'Missing required columns: email and name are mandatory',
          data: []
        };
      }

      // Check for institute type-specific columns
      if (instituteType === 'school' && !('class' in firstRow)) {
        return {
          valid: false,
          error: 'Missing required column: class (required for schools)',
          data: []
        };
      }

      if (instituteType === 'college') {
        if (!('course' in firstRow) || !('semester' in firstRow)) {
          return {
            valid: false,
            error: 'Missing required columns: course and semester (required for colleges)',
            data: []
          };
        }
      }

      // Validate data quality
      const issues = {
        missingEmail: [],
        missingName: [],
        duplicateEmails: [],
        duplicateEmailRows: new Set(),
        existingUnchanged: [],
        existingWillUpdate: []
      };

      const emailMap = new Map(); // Track all occurrences of each email
      
      // First pass: collect all emails and their row numbers
      data.forEach((row, idx) => {
        const email = row.email?.toLowerCase().trim();
        if (email) {
          if (!emailMap.has(email)) {
            emailMap.set(email, []);
          }
          emailMap.get(email).push(idx + 2); // +2 for Excel row number
        }
      });

      // Create a map of existing students by email for quick lookup
      const existingStudentsMap = new Map();
      existingStudents.forEach(student => {
        if (student.email) {
          existingStudentsMap.set(student.email.toLowerCase(), student);
        }
      });

      // Second pass: identify duplicates, existing unchanged, and other issues
      data.forEach((row, idx) => {
        const email = row.email?.toLowerCase().trim();
        const name = row.name?.trim();
        const rowNum = idx + 2;
        const course = row.course?.trim() || '';
        const semester = row.semester ? String(row.semester).trim() : '';
        const classValue = row.class ? String(row.class).trim() : '';

        if (!email) {
          issues.missingEmail.push(rowNum);
          return;
        }
        if (!name) {
          issues.missingName.push(rowNum);
          return;
        }
        
        // If this email appears more than once in Excel, mark as duplicate
        if (emailMap.get(email).length > 1) {
          issues.duplicateEmailRows.add(rowNum);
          const isDuplicate = issues.duplicateEmails.some(d => d.email === email);
          if (!isDuplicate) {
            issues.duplicateEmails.push({ 
              email, 
              rows: emailMap.get(email),
              count: emailMap.get(email).length
            });
          }
          return;
        }

        // Check if email exists in database
        const existingStudent = existingStudentsMap.get(email);
        if (existingStudent) {
          // Build comparison values
          const existingValues = {
            course: existingStudent.course || '',
            semester: existingStudent.semester ? String(existingStudent.semester) : '',
            class: existingStudent.class ? String(existingStudent.class) : ''
          };

          const newValues = {
            course: instituteType === 'college' ? course : '',
            semester: instituteType === 'college' ? semester : '',
            class: instituteType === 'school' ? classValue : ''
          };

          // Check if all values are unchanged
          const isUnchanged = existingValues.course === newValues.course &&
                             existingValues.semester === newValues.semester &&
                             existingValues.class === newValues.class;

          if (isUnchanged) {
            // No changes - will be skipped, no wallet increment
            issues.existingUnchanged.push({
              rowNum,
              email,
              name,
              reason: 'No changes detected - will be skipped'
            });
          } else {
            // Has changes - will be updated with wallet increment
            issues.existingWillUpdate.push({
              rowNum,
              email,
              name,
              changes: {
                course: newValues.course !== existingValues.course ? { old: existingValues.course, new: newValues.course } : null,
                semester: newValues.semester !== existingValues.semester ? { old: existingValues.semester, new: newValues.semester } : null,
                class: newValues.class !== existingValues.class ? { old: existingValues.class, new: newValues.class } : null
              }
            });
          }
        }
      });

      const hasIssues = issues.missingEmail.length > 0 || 
                        issues.missingName.length > 0 || 
                        issues.duplicateEmails.length > 0;

      const hasWarnings = issues.existingUnchanged.length > 0;

      // Calculate valid rows (exclude rows with errors, but count updates as valid)
      const invalidRowsSet = new Set([
        ...issues.missingEmail,
        ...issues.missingName,
        ...Array.from(issues.duplicateEmailRows)
      ]);

      // Valid rows = total - invalid - unchanged existing
      const validRows = data.length - invalidRowsSet.size - issues.existingUnchanged.length;
      const willBeProcessed = validRows; // New + Updated students

      return {
        valid: !hasIssues && !hasWarnings,
        warning: hasIssues || hasWarnings,
        issues,
        totalRows: data.length,
        validRows: willBeProcessed,
        newStudents: validRows - issues.existingWillUpdate.length,
        existingUpdates: issues.existingWillUpdate.length,
        existingSkipped: issues.existingUnchanged.length,
        data
      };
    } catch (err) {
      return {
        valid: false,
        error: `Failed to read Excel file: ${err.message}`,
        data: []
      };
    }
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) {
      setFile(null);
      setError(null);
      setValidationPreview(null);
      return;
    }

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      setError('Please upload an Excel file (.xlsx or .xls)');
      setFile(null);
      setValidationPreview(null);
      return;
    }

    // Check if existing students are still loading
    if (loadingStudents) {
      setError('Please wait while we load existing student data...');
      setFile(null);
      setValidationPreview(null);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setValidationPreview({ loading: true });

    // Validate file immediately
    const validation = await validateExcelFile(selectedFile);
    
    if (validation.error) {
      setError(validation.error);
      setValidationPreview(null);
      setFile(null);
    } else if (validation.warning) {
      setValidationPreview({
        type: 'warning',
        ...validation
      });
    } else {
      setValidationPreview({
        type: 'success',
        ...validation
      });
    }
  };

  const handleCoinChange = (e) => {
    const { name, value } = e.target;
    setCoinInputs(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!manualStudent.name || !manualStudent.email) {
      setError('Name and Email are required');
      return;
    }

    if (instituteType === 'school' && !manualStudent.class) {
      setError('Class is required for school students');
      return;
    }

    if (instituteType === 'college' && (!manualStudent.course || !manualStudent.semester)) {
      setError('Course and Semester are required for college students');
      return;
    }

    try {
      setManualSubmitting(true);
      setError(null);

      const payload = {
        students: [{
          name: manualStudent.name.trim(),
          email: manualStudent.email.trim().toLowerCase(),
          ...(instituteType === 'school' ? { class: manualStudent.class } : {}),
          ...(instituteType === 'college' ? { 
            course: manualStudent.course.trim(),
            semester: manualStudent.semester 
          } : {})
        }],
        perStudentSilver: coinInputs.perStudentSilver,
        perStudentGolden: coinInputs.perStudentGolden
      };

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/campus-ambassador/institutes/${instituteId}/add-student`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add student');
      }

      setResults({
        success: true,
        message: data.message,
        summary: {
          added: 1,
          updated: 0,
          skippedDuplicate: 0,
          skippedDifferentInstitute: 0
        },
        rewardDistribution: coinInputs.perStudentSilver > 0 || coinInputs.perStudentGolden > 0 ? {
          totalSilverDistributed: coinInputs.perStudentSilver,
          totalGoldenDistributed: coinInputs.perStudentGolden,
          recipientCount: 1
        } : null,
        details: {
          added: [{ email: manualStudent.email, name: manualStudent.name }],
          updated: [],
          skippedDuplicate: [],
          skippedDifferentInstitute: [],
          errors: []
        }
      });

      // Reset form
      setManualStudent({
        name: '',
        email: '',
        class: '',
        course: '',
        semester: ''
      });

      // Refresh student list to update count
      await fetchExistingStudents();

      console.log('[ExcelUpload] Manual student added, calling onSuccess:', !!onSuccess);
      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.message || 'Error adding student');
    } finally {
      setManualSubmitting(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('excelFile', file);
    formData.append('perStudentSilver', coinInputs.perStudentSilver);
    formData.append('perStudentGolden', coinInputs.perStudentGolden);

    try {
      setUploading(true);
      setError(null);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/campus-ambassador/institutes/${instituteId}/upload-students`,
        {
          method: 'POST',
          credentials: 'include',
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      setResults(data);
      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.message || 'Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={
        isModal
          ? 'fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm p-4'
          : 'w-full'
      }
    >
      <div
        className={
          isModal
            ? 'bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200'
            : 'bg-white rounded-2xl border border-slate-200 w-full overflow-y-auto'
        }
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-white">
          <h2 className="text-xl font-bold text-gray-900">Upload Students</h2>
          {isModal && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Mode Toggle */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setUploadMode('csv')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                uploadMode === 'csv'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Upload size={16} />
              CSV Upload
            </button>
            <button
              onClick={() => setUploadMode('manual')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                uploadMode === 'manual'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserPlus size={16} />
              Add Single Student
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <h3 className="font-semibold text-base text-gray-700 mb-1">
              {instituteName}
            </h3>
            <p className="text-gray-600 text-xs">
              {uploadMode === 'csv' 
                ? 'Upload an Excel file with student information to onboard them to the platform.'
                : 'Manually add a single student to the platform.'}
            </p>
          </div>

          {uploadMode === 'csv' ? (
            <>
              {/* Excel Format Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <h4 className="font-semibold text-sm text-blue-900 mb-2">Excel Format:</h4>
                <div className="space-y-1.5 text-xs text-blue-700">
                  <p className="font-medium">For Schools:</p>
                  <ul className="list-disc list-inside ml-2">
                    <li>name (required)</li>
                    <li>email (required)</li>
                    <li>class (required)</li>
                  </ul>
                  <p className="font-medium mt-1.5">For Colleges:</p>
                  <ul className="list-disc list-inside ml-2">
                    <li>name (required)</li>
                    <li>email (required)</li>
                    <li>course (required)</li>
                    <li>semester (required)</li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Manual Student Form */}
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={manualStudent.name}
                    onChange={(e) => setManualStudent(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter student name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={manualStudent.email}
                    onChange={(e) => setManualStudent(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="student@example.com"
                    required
                  />
                </div>

                {instituteType === 'school' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Class <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={manualStudent.class}
                      onChange={(e) => setManualStudent(prev => ({ ...prev, class: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">-- Select Class --</option>
                      {instituteCourses.map(course => (
                        <option key={course} value={course}>{course}</option>
                      ))}
                    </select>
                  </div>
                )}

                {instituteType === 'college' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Course <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={manualStudent.course}
                        onChange={(e) => setManualStudent(prev => ({ ...prev, course: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">-- Select Course --</option>
                        {instituteCourses.map(course => (
                          <option key={course} value={course}>{course}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Semester <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={manualStudent.semester}
                        onChange={(e) => setManualStudent(prev => ({ ...prev, semester: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              </form>
            </>
          )}

          {uploadMode === 'csv' && (
            <>
              {/* Excel Format Instructions - keeping original content */}
            </>
          )}

          {/* Continue with original Excel Format Instructions block if in CSV mode */}
          {uploadMode === 'csv' ? null : null}

          {/* Coin Distribution Inputs */}
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="text-yellow-700" size={18} />
              <h4 className="font-semibold text-sm text-yellow-900">Reward Coins (Optional)</h4>
            </div>
            <p className="text-xs text-yellow-800 mb-3">
              Coins will be <span className="font-bold">added</span> to each student's wallet incrementally
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Silver Coins per Student
                </label>
                <input
                  type="number"
                  name="perStudentSilver"
                  value={coinInputs.perStudentSilver}
                  onChange={handleCoinChange}
                  min="0"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Golden Coins per Student
                </label>
                <input
                  type="number"
                  name="perStudentGolden"
                  value={coinInputs.perStudentGolden}
                  onChange={handleCoinChange}
                  min="0"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* File Upload - CSV Mode Only */}
          {uploadMode === 'csv' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Select Excel File
                </label>
                {loadingStudents && (
                  <div className="mb-2 bg-blue-50 border border-blue-200 rounded-lg p-2 flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                    <p className="text-xs text-blue-700">Loading existing student data...</p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    disabled={loadingStudents}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-1.5 font-medium"
                  >
                    <Upload size={16} />
                    <span>{uploading ? 'Uploading...' : 'Upload'}</span>
                  </button>
                </div>
                {file && (
                  <p className="text-xs text-gray-600 mt-1.5">
                    Selected: {file.name}
                  </p>
                )}
                {!loadingStudents && existingStudents.length > 0 && !file && (
                  <p className="text-xs text-green-600 mt-1.5">
                    ✓ Ready to validate ({existingStudents.length} existing students loaded)
                  </p>
                )}
              </div>
            </>
          )}

          {/* Manual Student Submit Button */}
          {uploadMode === 'manual' && (
            <div className="mb-4">
              <button
                onClick={handleManualSubmit}
                disabled={manualSubmitting}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              >
                <UserPlus size={18} />
                <span>{manualSubmitting ? 'Adding Student...' : 'Add Student'}</span>
              </button>
            </div>
          )}

          {/* Validation Preview */}
          {validationPreview && validationPreview.loading && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="text-blue-800 text-sm">Validating Excel file...</p>
              </div>
            </div>
          )}

          {validationPreview && validationPreview.type === 'success' && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <p className="font-semibold text-green-800 mb-1">✓ File Validated Successfully</p>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>• Total rows: <span className="font-bold">{validationPreview.totalRows}</span></p>
                    <p>• New students: <span className="font-bold text-blue-600">{validationPreview.newStudents || 0}</span></p>
                    {validationPreview.existingUpdates > 0 && (
                      <p>• Will be updated: <span className="font-bold text-orange-600">{validationPreview.existingUpdates}</span> (data changed)</p>
                    )}
                    {validationPreview.existingSkipped > 0 && (
                      <p>• Will be skipped: <span className="font-bold text-gray-600">{validationPreview.existingSkipped}</span> (no changes)</p>
                    )}
                    <p className="text-xs text-green-600 mt-2 pt-2 border-t border-green-300">
                      {coinInputs.perStudentSilver > 0 || coinInputs.perStudentGolden > 0 ? (
                        <>✓ Coins will be distributed to {validationPreview.validRows} students (new + updated only)</>
                      ) : (
                        <>✓ Ready to upload (no coins will be distributed)</>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {validationPreview && validationPreview.type === 'warning' && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <p className="font-semibold text-yellow-800 mb-2">⚠️ File Has Issues</p>
                  <div className="text-sm text-yellow-700 space-y-2">
                    <p>• Total rows: {validationPreview.totalRows}</p>
                    <p>• Will be processed: <span className="font-bold text-green-700">{validationPreview.validRows}</span></p>
                    {validationPreview.newStudents > 0 && (
                      <p className="ml-4 text-xs">→ New students: {validationPreview.newStudents}</p>
                    )}
                    {validationPreview.existingUpdates > 0 && (
                      <p className="ml-4 text-xs">→ Existing (will update): {validationPreview.existingUpdates}</p>
                    )}
                    
                    {validationPreview.issues.missingEmail.length > 0 && (
                      <div className="bg-white rounded p-2 mt-2">
                        <p className="font-semibold text-red-600">Missing Email ({validationPreview.issues.missingEmail.length} rows):</p>
                        <p className="text-xs text-red-600">Rows: {validationPreview.issues.missingEmail.slice(0, 10).join(', ')}
                          {validationPreview.issues.missingEmail.length > 10 && '...'}
                        </p>
                      </div>
                    )}

                    {validationPreview.issues.missingName.length > 0 && (
                      <div className="bg-white rounded p-2 mt-2">
                        <p className="font-semibold text-red-600">Missing Name ({validationPreview.issues.missingName.length} rows):</p>
                        <p className="text-xs text-red-600">Rows: {validationPreview.issues.missingName.slice(0, 10).join(', ')}
                          {validationPreview.issues.missingName.length > 10 && '...'}
                        </p>
                      </div>
                    )}

                    {validationPreview.issues.duplicateEmails.length > 0 && (
                      <div className="bg-white rounded p-2 mt-2">
                        <p className="font-semibold text-orange-600">Duplicate Emails Found ({validationPreview.issues.duplicateEmails.length} unique emails):</p>
                        <div className="text-xs text-orange-600 max-h-24 overflow-y-auto space-y-1 mt-1">
                          {validationPreview.issues.duplicateEmails.slice(0, 5).map((dup, idx) => (
                            <div key={idx} className="bg-orange-50 p-1 rounded">
                              <p className="font-semibold">• {dup.email}</p>
                              <p className="text-[10px] ml-2">Found {dup.count} times in rows: {dup.rows.join(', ')}</p>
                            </div>
                          ))}
                          {validationPreview.issues.duplicateEmails.length > 5 && (
                            <p className="font-semibold">... and {validationPreview.issues.duplicateEmails.length - 5} more duplicate emails</p>
                          )}
                        </div>
                      </div>
                    )}

                    {validationPreview.issues.existingUnchanged && validationPreview.issues.existingUnchanged.length > 0 && (
                      <div className="bg-white rounded p-2 mt-2">
                        <p className="font-semibold text-gray-600">⚠️ Existing Students - No Changes ({validationPreview.issues.existingUnchanged.length}):</p>
                        <p className="text-xs text-gray-600 mb-1">These rows will be skipped (no wallet increment)</p>
                        <div className="text-xs text-gray-700 max-h-24 overflow-y-auto space-y-1 mt-1">
                          {validationPreview.issues.existingUnchanged.slice(0, 5).map((item, idx) => (
                            <div key={idx} className="bg-gray-50 p-1 rounded">
                              <p>Row {item.rowNum}: <span className="font-semibold">{item.email}</span></p>
                              <p className="text-[10px] ml-2 text-gray-500">{item.reason}</p>
                            </div>
                          ))}
                          {validationPreview.issues.existingUnchanged.length > 5 && (
                            <p className="font-semibold">... and {validationPreview.issues.existingUnchanged.length - 5} more unchanged students</p>
                          )}
                        </div>
                      </div>
                    )}

                    {validationPreview.issues.existingWillUpdate && validationPreview.issues.existingWillUpdate.length > 0 && (
                      <div className="bg-white rounded p-2 mt-2">
                        <p className="font-semibold text-blue-600">✓ Existing Students - Will Update ({validationPreview.issues.existingWillUpdate.length}):</p>
                        <p className="text-xs text-blue-600 mb-1">Data changed - will update & increment wallet</p>
                        <div className="text-xs text-blue-700 max-h-24 overflow-y-auto space-y-1 mt-1">
                          {validationPreview.issues.existingWillUpdate.slice(0, 5).map((item, idx) => (
                            <div key={idx} className="bg-blue-50 p-1 rounded">
                              <p>Row {item.rowNum}: <span className="font-semibold">{item.email}</span></p>
                              <div className="text-[10px] ml-2 text-blue-600">
                                {item.changes.semester && (
                                  <p>• Semester: {item.changes.semester.old || 'none'} → {item.changes.semester.new}</p>
                                )}
                                {item.changes.course && (
                                  <p>• Course: {item.changes.course.old || 'none'} → {item.changes.course.new}</p>
                                )}
                                {item.changes.class && (
                                  <p>• Class: {item.changes.class.old || 'none'} → {item.changes.class.new}</p>
                                )}
                              </div>
                            </div>
                          ))}
                          {validationPreview.issues.existingWillUpdate.length > 5 && (
                            <p className="font-semibold">... and {validationPreview.issues.existingWillUpdate.length - 5} more students to update</p>
                          )}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-yellow-600 mt-2 pt-2 border-t border-yellow-300">
                      ⚠️ Rows with issues will be skipped during upload. Only valid rows will be processed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start space-x-2">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <CheckCircle className="text-green-600" size={24} />
                  <h4 className="font-semibold text-green-800">Upload Complete!</h4>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-600">Added:</p>
                    <p className="text-2xl font-bold text-green-600">{results.summary?.added || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Updated:</p>
                    <p className="text-2xl font-bold text-blue-600">{results.summary?.updated || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Skipped:</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {(results.summary?.skippedDuplicate || 0) + (results.summary?.skippedDifferentInstitute || 0)}
                    </p>
                  </div>
                </div>

                {/* Reward Distribution Summary */}
                {results.rewardDistribution && (
                  <div className="bg-white border border-green-300 rounded-lg p-3">
                    <p className="font-semibold text-green-800 mb-2">Coins Distributed:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                      <p>🥈 Silver: <span className="font-bold">{results.rewardDistribution.totalSilverDistributed}</span></p>
                      <p>🏆 Golden: <span className="font-bold">{results.rewardDistribution.totalGoldenDistributed}</span></p>
                      <p className="col-span-2">Recipients: <span className="font-bold">{results.rewardDistribution.recipientCount}</span> students</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Detailed Results */}
              {results.details && (
                <div className="space-y-3">
                  {/* Skipped - Different Institute */}
                  {results.details.skippedDifferentInstitute?.length > 0 && (
                    <details className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <summary className="font-semibold text-red-800 cursor-pointer">
                        ⛔ Skipped - Assigned to Another Institute ({results.details.skippedDifferentInstitute.length})
                      </summary>
                      <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                        {results.details.skippedDifferentInstitute.map((item, idx) => (
                          <div key={idx} className="text-sm text-red-700 bg-white p-2 rounded">
                            <p className="font-medium">{item.email}</p>
                            <p className="text-xs">{item.reason}: {item.currentInstitute}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  {/* Skipped - Duplicate */}
                  {results.details.skippedDuplicate?.length > 0 && (
                    <details className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <summary className="font-semibold text-gray-800 cursor-pointer">
                        ↩️ Skipped - No Changes (Duplicates) ({results.details.skippedDuplicate.length})
                      </summary>
                      <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                        {results.details.skippedDuplicate.map((item, idx) => (
                          <div key={idx} className="text-sm text-gray-700 bg-white p-2 rounded">
                            <p className="font-medium">{item.email}</p>
                            <p className="text-xs">{item.reason}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  {/* Errors */}
                  {results.details.errors?.length > 0 && (
                    <details className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <summary className="font-semibold text-yellow-800 cursor-pointer">
                        ⚠️ Errors ({results.details.errors.length})
                      </summary>
                      <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                        {results.details.errors.map((err, idx) => (
                          <div key={idx} className="text-sm text-yellow-700 bg-white p-2 rounded">
                            <p className="font-medium">{err.email}</p>
                            <p className="text-xs">{err.reason}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Done
              </button>
            </div>
          )}

          {/* Close Button (when no results) */}
          {!results && (
            <div className="flex justify-end pt-4">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExcelUpload;

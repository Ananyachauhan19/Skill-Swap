import React, { useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';

const ExcelUpload = ({ instituteId, instituteName, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        setError('Please upload an Excel file (.xlsx or .xls)');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('excelFile', file);

    try {
      setUploading(true);
      setError(null);

      const response = await fetch(
        `/api/campus-ambassador/institutes/${instituteId}/upload-students`,
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

      setResults(data.results);
      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.message || 'Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Upload Students</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <h3 className="font-semibold text-lg text-gray-700 mb-2">
              {instituteName}
            </h3>
            <p className="text-gray-600 text-sm">
              Upload an Excel file with student information to onboard them to the platform.
            </p>
          </div>

          {/* Excel Format Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-blue-800 mb-2">Excel Format:</h4>
            <div className="space-y-2 text-sm text-blue-700">
              <p className="font-medium">For Schools:</p>
              <ul className="list-disc list-inside ml-2">
                <li>name (required)</li>
                <li>email (required)</li>
                <li>class (required)</li>
              </ul>
              <p className="font-medium mt-2">For Colleges:</p>
              <ul className="list-disc list-inside ml-2">
                <li>name (required)</li>
                <li>email (required)</li>
                <li>course (required)</li>
                <li>semester (required)</li>
              </ul>
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Excel File
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Upload size={20} />
                <span>{uploading ? 'Uploading...' : 'Upload'}</span>
              </button>
            </div>
            {file && (
              <p className="text-sm text-gray-600 mt-2">
                Selected: {file.name}
              </p>
            )}
          </div>

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
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Students Created:</p>
                    <p className="text-2xl font-bold text-green-600">{results.created}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Students Updated:</p>
                    <p className="text-2xl font-bold text-blue-600">{results.updated}</p>
                  </div>
                </div>
              </div>

              {results.errors && results.errors.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">
                    Errors ({results.errors.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {results.errors.map((err, idx) => (
                      <div key={idx} className="text-sm text-yellow-700 bg-white p-2 rounded">
                        <p className="font-medium">Row {idx + 1}:</p>
                        <p>{err.error}</p>
                      </div>
                    ))}
                  </div>
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

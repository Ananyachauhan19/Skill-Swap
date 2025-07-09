import React, { useState } from 'react';
import { BACKEND_URL } from '../config.js';

const ConnectionTest = () => {
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setTestResult('Testing connection...');
    
    try {
      // Test basic API connection
      const response = await fetch(`${BACKEND_URL}/api/sessions`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        setTestResult('✅ Connection successful! Backend is reachable.');
      } else {
        setTestResult(`❌ Connection failed. Status: ${response.status}`);
      }
    } catch (error) {
      setTestResult(`❌ Connection error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSocketConnection = () => {
    setTestResult('Testing socket connection...');
    
    // Import socket dynamically to avoid circular imports
    import('../socket.js').then(({ default: socket }) => {
      if (socket.connected) {
        setTestResult('✅ Socket connected successfully!');
      } else {
        setTestResult('❌ Socket not connected');
      }
    });
  };

  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-blue-200 z-50">
      <h3 className="text-lg font-semibold mb-2">Connection Test</h3>
      <div className="space-y-2">
        <button
          onClick={testConnection}
          disabled={loading}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          Test API
        </button>
        <button
          onClick={testSocketConnection}
          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
        >
          Test Socket
        </button>
      </div>
      {testResult && (
        <div className="mt-2 text-sm">
          <p className="font-semibold">Result:</p>
          <p className="text-gray-700">{testResult}</p>
        </div>
      )}
      <div className="mt-2 text-xs text-gray-500">
        Backend URL: {BACKEND_URL}
      </div>
    </div>
  );
};

export default ConnectionTest; 
import React, { useState } from 'react';
import { BACKEND_URL } from '../config.js';

const QuizementUpload = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [bronzeCost, setBronzeCost] = useState('');
  const [silverCost, setSilverCost] = useState('');
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleDownloadSample = () => {
    window.location.href = `${BACKEND_URL}/api/quizement/sample-csv`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setMessage('');

    if (!file) {
      setErrors(['CSV file is required']);
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('duration', duration);
    formData.append('bronzeCost', bronzeCost);
    formData.append('silverCost', silverCost);
    formData.append('csvFile', file);

    try {
      setSubmitting(true);
      const resp = await fetch(`${BACKEND_URL}/api/quizement/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await resp.json();
      if (!resp.ok) {
        setErrors(data.errors || [data.message || 'Failed to upload test']);
      } else {
        setMessage('Test uploaded successfully');
        setName('');
        setDescription('');
        setDuration('');
        setBronzeCost('');
        setSilverCost('');
        setFile(null);
      }
    } catch (e) {
      setErrors([e.message || 'Failed to upload test']);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-blue-900 mb-4">Upload Quizement Test</h1>
      <p className="text-xs text-gray-600 mb-4">Upload a CSV with the same columns as Campus Assessment: Question, Option A, Option B, Option C, Option D, Correct Answer, Marks.</p>
      <button
        type="button"
        onClick={handleDownloadSample}
        className="mb-4 px-3 py-1 text-xs rounded-full bg-blue-600 text-white"
      >
        Download Sample CSV
      </button>
      <form onSubmit={handleSubmit} className="space-y-3 text-sm">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Test Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Duration (minutes)</label>
            <input
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Bronze coins required</label>
            <input
              type="number"
              min="0"
              value={bronzeCost}
              onChange={(e) => setBronzeCost(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Silver coins required</label>
            <input
              type="number"
              min="0"
              value={silverCost}
              onChange={(e) => setSilverCost(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">CSV File</label>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
            className="w-full text-xs"
          />
        </div>
        {errors.length > 0 && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
            <ul className="list-disc list-inside">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </div>
        )}
        {message && <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2">{message}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-1.5 rounded-full bg-blue-700 text-white text-xs font-semibold disabled:opacity-60"
        >
          {submitting ? 'Uploading...' : 'Upload Test'}
        </button>
      </form>
    </div>
  );
};

export default QuizementUpload;

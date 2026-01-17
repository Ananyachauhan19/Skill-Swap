import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, FileText, Award, Info } from 'lucide-react';

const QuizRulesModal = ({ test, onStart, onCancel }) => {
  const [countdown, setCountdown] = useState(60); // 1 minute countdown

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const canStart = countdown === 0;

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-2">
      <div className="bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 rounded-xl shadow-2xl w-full max-w-2xl h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-3 rounded-t-xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Quiz Rules</h1>
              <p className="text-xs text-gray-600">{test?.name}</p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 flex-1 overflow-y-auto">
          {/* Quiz Info Cards */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {/* Questions */}
            <div className="bg-white rounded-lg p-2 shadow-sm border border-blue-100">
              <div className="flex items-center gap-1 text-blue-700 mb-1">
                <FileText className="w-3 h-3" />
                <span className="text-xs font-semibold">Questions</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{test?.questions?.length || 0}</p>
            </div>

            {/* Duration */}
            <div className="bg-white rounded-lg p-2 shadow-sm border border-purple-100">
              <div className="flex items-center gap-1 text-purple-700 mb-1">
                <Clock className="w-3 h-3" />
                <span className="text-xs font-semibold">Duration</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{test?.duration} min</p>
            </div>

            {/* Total Marks */}
            <div className="bg-white rounded-lg p-2 shadow-sm border border-green-100">
              <div className="flex items-center gap-1 text-green-700 mb-1">
                <Award className="w-3 h-3" />
                <span className="text-xs font-semibold">Marks</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{test?.totalMarks || test?.questions?.reduce((sum, q) => sum + (q.marks || 0), 0) || 0}</p>
            </div>
          </div>

          {/* Rules Section */}
          <div className="space-y-2 mb-3">
            {/* Fullscreen Mode */}
            <div className="flex items-start gap-2 bg-white rounded-lg p-2 shadow-sm border border-gray-200">
              <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-3 h-3 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-xs">Fullscreen Mode</h3>
                <p className="text-gray-600 text-xs">Do not exit fullscreen during the test.</p>
              </div>
            </div>

            {/* No Tab Switching */}
            <div className="flex items-start gap-2 bg-white rounded-lg p-2 shadow-sm border border-gray-200">
              <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-3 h-3 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-xs">No Tab Switching</h3>
                <p className="text-gray-600 text-xs">Do not switch tabs or windows.</p>
              </div>
            </div>

            {/* No Copy-Paste */}
            <div className="flex items-start gap-2 bg-white rounded-lg p-2 shadow-sm border border-gray-200">
              <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-3 h-3 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-xs">No Copy-Paste</h3>
                <p className="text-gray-600 text-xs">Copy-paste is disabled.</p>
              </div>
            </div>

            {/* Violation Limit */}
            <div className="flex items-start gap-2 bg-white rounded-lg p-2 shadow-sm border border-gray-200">
              <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-3 h-3 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-xs">Violation Limit</h3>
                <p className="text-gray-600 text-xs">3 violations = auto-submit.</p>
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-start gap-2 bg-white rounded-lg p-2 shadow-sm border border-gray-200">
              <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                <Info className="w-3 h-3 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-xs">Timer</h3>
                <p className="text-gray-600 text-xs">Submit before time runs out.</p>
              </div>
            </div>

            {/* One Attempt Only */}
            <div className="flex items-start gap-2 bg-white rounded-lg p-2 shadow-sm border border-gray-200">
              <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                <Info className="w-3 h-3 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-xs">One Attempt Only</h3>
                <p className="text-gray-600 text-xs">You can attempt this quiz once.</p>
              </div>
            </div>
          </div>

          {/* Agreement */}
          <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-200 mb-3">
            <p className="text-gray-700 text-xs text-center">
              By clicking "Start Quiz", you agree to follow all rules.
            </p>
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="p-3 bg-white border-t border-gray-200 rounded-b-xl flex-shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg font-semibold text-sm text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onStart}
              disabled={!canStart}
              className={`px-4 py-2 rounded-lg font-semibold text-sm text-white transition-all ${
                canStart
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {canStart ? 'Start Quiz' : `Wait ${formatCountdown(countdown)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizRulesModal;

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

function RegisterInterviewerModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth() || {};

  useEffect(() => {
    try {
      window.dispatchEvent(new Event('authChanged'));
    } catch (e) {
      // ignore
    }
  }, []);

  const isApproved = user && (user.role === 'interviewer' || user.role === 'both' || (Array.isArray(user.roles) && user.roles.includes('interviewer')));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-lg w-full">
          <div className="bg-blue-900 text-white p-6 rounded-t-xl flex items-center justify-between">
            <h3 className="text-xl font-bold">
              Become an Interviewer
            </h3>
            <button onClick={onClose} className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors">
              <FaTimes size={18} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {isApproved ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-900/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">You're Already an Approved Interviewer!</h4>
                <p className="text-slate-600 text-sm">You can start conducting mock interviews right away.</p>
              </div>
            ) : (
              <>
                <div className="bg-blue-900/5 p-4 rounded-lg border border-blue-900/10">
                  <h4 className="font-semibold text-slate-900 mb-2">Why Become an Interviewer?</h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-900 mt-1">✓</span>
                      <span>Share your experience and help others succeed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-900 mt-1">✓</span>
                      <span>Earn while conducting mock interviews</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-900 mt-1">✓</span>
                      <span>Build your professional network</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-900 mt-1">✓</span>
                      <span>Flexible scheduling based on your availability</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-900/5 p-4 rounded-lg border border-blue-900/10">
                  <p className="text-sm text-slate-700">
                    <strong>Note:</strong> Your application will be reviewed by our admin team. You'll be notified once approved.
                  </p>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              {!isApproved && (
                <button
                  onClick={() => {
                    navigate('/register-interviewer');
                    onClose();
                  }}
                  className="flex-1 px-6 py-3 bg-blue-900 text-white rounded-lg font-medium hover:bg-blue-800 transition-colors"
                >
                  Apply Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
}

export default RegisterInterviewerModal;

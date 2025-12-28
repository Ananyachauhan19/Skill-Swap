import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useCampusAmbassador } from '../context/CampusAmbassadorContext';

const CampusLogin = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { validateCampusId } = useCampusAmbassador();
  const [campusId, setCampusId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!campusId.trim()) {
      setError('Please enter your Campus ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await validateCampusId(campusId.trim());
      
      if (typeof onSuccess === 'function') {
        onSuccess(data);
      }
    } catch (err) {
      setError(err.message || 'Failed to validate Campus ID. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-3 sm:p-4 pt-16 sm:pt-20 overflow-auto">
      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(59, 130, 246) 1px, transparent 0)',
          backgroundSize: '48px 48px'
        }} />
      </div>

      <div className="relative w-full max-w-md my-4">
        {/* Main Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with Logo */}
          <div className="bg-gradient-to-br from-blue-900 to-blue-800 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 text-center">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <img
                src="https://res.cloudinary.com/dbltazdsa/image/upload/v1766589377/webimages/skillswap-logo.png"
                alt="SkillSwapHub Logo"
                className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 object-contain rounded-full shadow-lg border-2 border-white flex-shrink-0"
              />
              <span className="text-xl sm:text-2xl font-extrabold text-white font-lora tracking-wide">
                SkillSwapHub
              </span>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Campus Dashboard
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm">
              Enter your Campus ID to access your institute
            </p>
          </div>

          {/* Form Section */}
          <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                  Campus ID
                </label>
                <input
                  type="text"
                  value={campusId}
                  onChange={(e) => {
                    setCampusId(e.target.value);
                    setError(null);
                  }}
                  placeholder="SSH-XXX-12345678"
                  disabled={loading}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-800 focus:border-blue-800 text-center text-sm sm:text-base font-mono text-gray-700 placeholder-gray-400 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-700 text-xs sm:text-sm font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !campusId.trim()}
                className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-xl font-semibold shadow-lg hover:from-blue-800 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Validating...</span>
                  </>
                ) : (
                  <>
                    <span>Access Dashboard</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 sm:mt-6 text-center">
              <button
                onClick={() => navigate('/')}
                className="text-xs sm:text-sm font-medium text-blue-800 hover:text-blue-900 transition-colors inline-flex items-center gap-1"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampusLogin;

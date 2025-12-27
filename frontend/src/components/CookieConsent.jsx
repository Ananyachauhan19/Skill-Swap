import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();

  const ensureVisitorId = () => {
    try {
      let visitorId = localStorage.getItem('visitorId');
      if (!visitorId && typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        visitorId = crypto.randomUUID();
        localStorage.setItem('visitorId', visitorId);
      }
      return visitorId;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    // Check if user has already made a choice
    const consentStatus =
      localStorage.getItem('cookieConsent') ||
      localStorage.getItem('visitorConsent');
    
    if (!consentStatus) {
      // Show modal after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(true);
        setTimeout(() => setIsAnimating(true), 50); // Trigger animation
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleAllow = async () => {
    try {
      const consent = {
        analytics: true,
        enhanced: false,
      };

      // New-style structured consent; legacy string kept for
      // backwards compatibility with older builds.
      localStorage.setItem('cookieConsent', JSON.stringify(consent));
      localStorage.setItem('visitorConsent', 'accepted');
      console.log('[CookieConsent] Recommended cookies accepted and stored');
      ensureVisitorId();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('visitor-consent-granted'));
      }
      hideModal();
    } catch (error) {
      // Still save consent even if anything goes wrong here
      const consent = {
        analytics: true,
        enhanced: false,
      };
      localStorage.setItem('cookieConsent', JSON.stringify(consent));
      localStorage.setItem('visitorConsent', 'accepted');
      ensureVisitorId();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('visitor-consent-granted'));
      }
      hideModal();
    }
  };

  const handleDecline = () => {
    // "Accept All Cookies" – full analytics + enhanced tracking.
    const consent = {
      analytics: true,
      enhanced: true,
    };

    // No network call here; App.jsx will send a
    // lightweight tracking ping on next load using
    // the stored consent and visitorId.
    localStorage.setItem('cookieConsent', JSON.stringify(consent));
    // Legacy value retained so old builds can still
    // interpret the stored choice.
    localStorage.setItem('visitorConsent', 'declined');

    ensureVisitorId();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('visitor-consent-granted'));
    }
    hideModal();
  };

  const hideModal = () => {
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300); // Wait for animation
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-3 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 z-50 w-auto sm:w-96 max-w-[calc(100vw-24px)] sm:max-w-96 bg-white rounded-lg sm:rounded-xl shadow-2xl border border-gray-200 transition-all duration-300 transform ${
        isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="p-4 sm:p-6">
        <div className="flex items-start mb-3 sm:mb-4">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-2 sm:ml-3 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Cookie Consent</h3>
              <div className="hidden sm:flex items-center gap-2 text-[10px] text-gray-500">
                <button
                  onClick={() => {
                    hideModal();
                    navigate('/cookies-policy');
                  }}
                  className="text-blue-600 hover:text-blue-700 underline font-medium"
                >
                  Cookies Policy
                </button>
                <span className="text-gray-300">•</span>
                <button
                  onClick={() => {
                    hideModal();
                    navigate('/terms-conditions');
                  }}
                  className="text-blue-600 hover:text-blue-700 underline font-medium"
                >
                  Terms &amp; Conditions
                </button>
              </div>
            </div>

            <div className="mt-1.5 sm:hidden flex items-center gap-2 text-[10px] text-gray-500">
              <button
                onClick={() => {
                  hideModal();
                  navigate('/cookies-policy');
                }}
                className="text-blue-600 hover:text-blue-700 underline font-medium"
              >
                Cookies Policy
              </button>
              <span className="text-gray-300">•</span>
              <button
                onClick={() => {
                  hideModal();
                  navigate('/terms-conditions');
                }}
                className="text-blue-600 hover:text-blue-700 underline font-medium"
              >
                Terms &amp; Conditions
              </button>
            </div>

            <p className="mt-2 text-[10px] sm:text-xs text-gray-600 leading-relaxed">
              We use cookies to enhance your experience. Choose recommended (essential + analytics) or accept all cookies for full personalization.
            </p>
          </div>
        </div>

        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={handleAllow}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] sm:text-xs font-medium px-3 sm:px-4 py-2 sm:py-2.5 rounded-md transition-colors duration-200"
          >
            Accept Recommended
          </button>
          <button
            onClick={handleDecline}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] sm:text-xs font-medium px-3 sm:px-4 py-2 sm:py-2.5 rounded-md transition-colors duration-200"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;

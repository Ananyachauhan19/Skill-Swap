import { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consentStatus = localStorage.getItem('visitorConsent');
    
    if (!consentStatus) {
      // Show modal after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(true);
        setTimeout(() => setIsAnimating(true), 50); // Trigger animation
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, []);

  const collectVisitorData = () => {
    // Get device type
    const getDeviceType = () => {
      const ua = navigator.userAgent;
      if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return 'tablet';
      }
      if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        return 'mobile';
      }
      return 'desktop';
    };

    // Get browser info
    const getBrowserInfo = () => {
      const ua = navigator.userAgent;
      let browserName = 'Unknown';
      let browserVersion = 'Unknown';

      if (ua.indexOf('Firefox') > -1) {
        browserName = 'Firefox';
        browserVersion = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || 'Unknown';
      } else if (ua.indexOf('SamsungBrowser') > -1) {
        browserName = 'Samsung Browser';
        browserVersion = ua.match(/SamsungBrowser\/(\d+\.\d+)/)?.[1] || 'Unknown';
      } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
        browserName = 'Opera';
        browserVersion = ua.match(/(?:Opera|OPR)\/(\d+\.\d+)/)?.[1] || 'Unknown';
      } else if (ua.indexOf('Trident') > -1) {
        browserName = 'Internet Explorer';
        browserVersion = ua.match(/rv:(\d+\.\d+)/)?.[1] || 'Unknown';
      } else if (ua.indexOf('Edge') > -1) {
        browserName = 'Edge';
        browserVersion = ua.match(/Edge\/(\d+\.\d+)/)?.[1] || 'Unknown';
      } else if (ua.indexOf('Edg') > -1) {
        browserName = 'Edge Chromium';
        browserVersion = ua.match(/Edg\/(\d+\.\d+)/)?.[1] || 'Unknown';
      } else if (ua.indexOf('Chrome') > -1) {
        browserName = 'Chrome';
        browserVersion = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || 'Unknown';
      } else if (ua.indexOf('Safari') > -1) {
        browserName = 'Safari';
        browserVersion = ua.match(/Version\/(\d+\.\d+)/)?.[1] || 'Unknown';
      }

      return { name: browserName, version: browserVersion };
    };

    // Get OS info
    const getOS = () => {
      const ua = navigator.userAgent;
      if (ua.indexOf('Win') > -1) return 'Windows';
      if (ua.indexOf('Mac') > -1) return 'MacOS';
      if (ua.indexOf('Linux') > -1) return 'Linux';
      if (ua.indexOf('Android') > -1) return 'Android';
      if (ua.indexOf('like Mac') > -1) return 'iOS';
      return 'Unknown';
    };

    const browser = getBrowserInfo();

    return {
      device: getDeviceType(),
      browser: browser.name,
      browserVersion: browser.version,
      os: getOS(),
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language,
      referrer: document.referrer || 'Direct',
      userAgent: navigator.userAgent,
      currentPage: window.location.pathname,
      consentGiven: true,
    };
  };

  const handleAllow = async () => {
    try {
      const visitorData = collectVisitorData();
      console.log('[CookieConsent] Collected visitor data:', visitorData);
      
      // Check if visitor already exists (returning visitor)
      const existingVisitorId = localStorage.getItem('visitorId');
      if (existingVisitorId) {
        visitorData.visitorId = existingVisitorId;
        console.log('[CookieConsent] Found existing visitorId:', existingVisitorId);
      }

      console.log('[CookieConsent] Sending data to:', `${BACKEND_URL}/api/visitors/track`);
      const response = await axios.post(`${BACKEND_URL}/api/visitors/track`, visitorData);
      console.log('[CookieConsent] Response received:', response.data);
      
      if (response.data.visitorId) {
        localStorage.setItem('visitorId', response.data.visitorId);
        console.log('[CookieConsent] VisitorId stored in localStorage:', response.data.visitorId);
      }

      localStorage.setItem('visitorConsent', 'accepted');
      console.log('[CookieConsent] Consent accepted and stored');
      hideModal();
    } catch (error) {
      console.error('[CookieConsent] Failed to track visitor:', error);
      console.error('[CookieConsent] Error response:', error.response?.data);
      // Still save consent even if tracking fails
      localStorage.setItem('visitorConsent', 'accepted');
      hideModal();
    }
  };

  const handleDecline = () => {
    localStorage.setItem('visitorConsent', 'declined');
    hideModal();
  };

  const hideModal = () => {
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300); // Wait for animation
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 transition-all duration-300 transform ${
        isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="p-6">
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-blue-600"
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
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-semibold text-gray-900">
              Cookie Consent
            </h3>
            <p className="mt-2 text-xs text-gray-600 leading-relaxed">
              Do you want to allow cookies?
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleAllow}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2.5 rounded-md transition-colors duration-200"
          >
            Allow
          </button>
          <button
            onClick={handleDecline}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-4 py-2.5 rounded-md transition-colors duration-200"
          >
            Decline
          </button>
        </div>

        <p className="mt-3 text-[10px] text-gray-500 text-center">
          You can change your preferences anytime.
        </p>
      </div>
    </div>
  );
};

export default CookieConsent;

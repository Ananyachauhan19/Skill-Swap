const getBackendUrl = () => {
  // Primary source: unified API base URL for both
  // preview/localhost and production deployments.
  const explicitBase = import.meta.env.VITE_API_BASE_URL;
  if (explicitBase) return explicitBase;

  // Backwards-compatible fallbacks for existing env vars
  if (import.meta.env.MODE === 'production') {
    return import.meta.env.VITE_BACKEND_URL_PROD || 'https://api.skillswaphub.in';
  } else {
    return import.meta.env.VITE_BACKEND_URL_DEV || 'http://localhost:5000';
  }
};

export const BACKEND_URL = getBackendUrl();

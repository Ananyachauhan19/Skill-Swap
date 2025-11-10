const getBackendUrl = () => {
  if (import.meta.env.MODE === 'production') {
    return import.meta.env.VITE_BACKEND_URL_PROD || 'https://api.skillswaphub.in';
  } else {
    return import.meta.env.VITE_BACKEND_URL_DEV || 'http://localhost:5000';
  }
};

export const BACKEND_URL = getBackendUrl();
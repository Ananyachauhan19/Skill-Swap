const getBackendUrl = () => {
  if (import.meta.env.MODE === 'production') {
    return import.meta.env.VITE_BACKEND_URL_PROD || 'https://api.skillswaphub.in';
  } else {
    return import.meta.env.VITE_BACKEND_URL_DEV || 'https://api.skillswaphub.in';
  }
};

export const BACKEND_URL = getBackendUrl();

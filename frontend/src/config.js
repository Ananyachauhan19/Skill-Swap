// Function to get the backend URL dynamically
export const getBackendUrl = () => {
  // Check if running in a production environment (e.g., on Render)
  if (import.meta.env.MODE === 'production') {
    return import.meta.env.VITE_BACKEND_URL_PROD ;
  } else {
    // Development environment (local)
    return import.meta.env.VITE_BACKEND_URL_DEV || 'http://localhost:5000';
  }
};

// Export the constant for use in your app
export const BACKEND_URL = getBackendUrl();
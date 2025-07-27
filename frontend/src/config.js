// getBackendUrl.js

// Function to get the backend URL dynamically
export const getBackendUrl = () => {
  // Development environment (local)
  if (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  ) {
    return 'http://localhost:5000';
  }

  // Production: use your Render backend URL
  return 'https://skill-swap-69nw.onrender.com'; 
};

// Export the constant for use in your app
export const BACKEND_URL = getBackendUrl();
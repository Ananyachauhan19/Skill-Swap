// Get the backend URL dynamically
export const getBackendUrl = () => {
  // If we're in development, use localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  
  // For production or cross-network, use the same hostname as the frontend
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = '5000'; // Backend port
  
  return `${protocol}//${hostname}:${port}`;
};

export const BACKEND_URL = getBackendUrl(); 
// Get the backend URL dynamically
export const getBackendUrl = () => {
  // If we're in development, use localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('Using localhost backend URL');
    return 'http://localhost:5000';
  }
  
  // For production or cross-network, use the same hostname as the frontend
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = '5000'; // Backend port
  
  const url = `${protocol}//${hostname}:${port}`;
  console.log('Using cross-network backend URL:', url);
  return url;
};

export const BACKEND_URL = getBackendUrl();
console.log('Backend URL configured as:', BACKEND_URL); 
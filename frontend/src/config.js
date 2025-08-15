export const BACKEND_URL = import.meta.env.PROD
  ? (import.meta.env.VITE_BACKEND_URL_PROD || 'https://api.skillswaphub.in')
  : (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');
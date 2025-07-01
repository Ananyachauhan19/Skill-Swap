import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId="98535489065-jgkc5i63dm0jjm4ac1fq4ngc42etcitk.apps.googleusercontent.com">
  <BrowserRouter> {/* ✅ Add this */}
      <App />
    </BrowserRouter>
  </GoogleOAuthProvider>
);
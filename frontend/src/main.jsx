import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import 'flatpickr/dist/flatpickr.min.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { EmployeeAuthProvider } from './context/EmployeeAuthContext.jsx';
import { CampusAmbassadorProvider } from './context/CampusAmbassadorContext.jsx';
import InternCoordinatorAuthProvider from './context/InternCoordinatorAuthContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId="98535489065-jgkc5i63dm0jjm4ac1fq4ngc42etcitk.apps.googleusercontent.com">
    <AuthProvider>
      <EmployeeAuthProvider>
        <BrowserRouter>
          <CampusAmbassadorProvider>
            <InternCoordinatorAuthProvider>
              <App />
            </InternCoordinatorAuthProvider>
          </CampusAmbassadorProvider>
        </BrowserRouter>
      </EmployeeAuthProvider>
    </AuthProvider>
  </GoogleOAuthProvider>
);
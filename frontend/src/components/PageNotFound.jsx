import React from 'react';

const PageNotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-screen">
    <h1 className="text-4xl font-bold text-red-600 mb-4">404</h1>
    <p className="text-xl text-gray-700 mb-2">User/Page Not Found</p>
    <a href="/" className="text-blue-600 underline">Go to Home</a>
  </div>
);

export default PageNotFound; 
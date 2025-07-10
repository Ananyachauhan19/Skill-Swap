import React from 'react';
import { Navigate } from 'react-router-dom';
import PublicHome from './PublicHome';
import PublicLive from './PublicLive';
import PublicVideos from './PublicVideos';


const publicProfileChildren = [
  { index: true, element: <Navigate to="Home" replace /> },
  { path: 'Home', element: <PublicHome /> },
  { path: 'live', element: <PublicLive /> },
  { path: 'videos', element: <PublicVideos /> },
];

export default publicProfileChildren;

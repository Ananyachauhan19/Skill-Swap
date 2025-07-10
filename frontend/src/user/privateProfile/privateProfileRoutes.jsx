import React from 'react';
import { Navigate } from 'react-router-dom';
import Panel from './Panel';
import Live from './Live';
import Videos from './Videos';
import Draft from './Draft';
import Archive from './Archive';
import Saved from './Saved';
import Analytics from './Analytics';
import Playlist from './Playlist';
import SkillMate from './SkillMate';

const privateProfileChildren = [
  { path: '', element: <Navigate to="panel" replace /> },
  {
    path: 'panel',
    element: <Panel />,
    children: [
      { index: true, element: null }, // Shows welcome message in Panel.jsx
      { path: 'live', element: <Live /> },
      { path: 'videos', element: <Videos /> },
      { path: 'playlist', element: <Playlist /> },
    ],
  },
  { path: 'drafts', element: <Draft /> },
  { path: 'archived', element: <Archive /> },
  { path: 'saved', element: <Saved /> },
  { path: 'analytics', element: <Analytics /> },
  { path: 'skillmates', element: <SkillMate /> },
];

export default privateProfileChildren;

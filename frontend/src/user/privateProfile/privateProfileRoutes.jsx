import React from 'react';
import { Navigate } from 'react-router-dom';
import Panel from './Panel';
import Live from './Live';
import Videos from './Videos';
import Draft from './Draft';
import Archive from './Archive';
import Saved from './Saved';
import Analytics from './Analytics';
import History from './History';
import Home from './HomePage'

const privateProfileChildren = [
  { path: '', element: <Navigate to="panel/your-home" replace /> },
  { path: 'panel', element: <Navigate to="panel/your-home" replace /> },
  {
    path: 'panel',
    element: <Panel />,
    children: [
      { index: true, element: <Navigate to="your-home" replace />  },
      { path: 'your-home', element: <Home /> },
      { path: 'live', element: <Live /> },
      { path: 'videos', element: <Videos /> },
    ],
  },
  { path: 'drafts', element: <Draft /> },
  { path: 'archived', element: <Archive /> },
  { path: 'saved', element: <Saved /> },
  { path: 'analytics', element: <Analytics /> },
  // SkillMates page removed; use global modal via SkillMatesContext instead
  { path: 'history', element: <History /> },
];

export default privateProfileChildren;

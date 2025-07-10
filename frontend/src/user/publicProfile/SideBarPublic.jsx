import React, { useEffect, useState } from 'react';
import {
  FaUserCircle,
  FaRegFileAlt,
} from 'react-icons/fa';
import { useNavigate, useLocation, Outlet, NavLink } from 'react-router-dom';
import BioLink from './BioLink';

const SideBarPublic = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = "border-b-2 border-blue-600 text-blue-600";
  const normalTab = "text-gray-600 hover:text-blue-600";

  const [profile] = useState({
    profilePic: '',
    fullName: 'Ananya Sharma',
    userId: 'ananya123',
    bio: 'I am a passionate developer who loves open source and building cool things with code. Always learning, always growing.',
    linkedin: 'ananya123',
    github: 'ananya123',
    website: 'https://ananya.dev',
    twitter: 'ananya123',
    education: [
      {
        course: 'B.Tech',
        branch: 'Computer Science',
        college: 'IIT Delhi',
        city: 'New Delhi',
        passingYear: '2024'
      }
    ],
    experience: [
      { title: 'Frontend Developer', company: 'Google', duration: '2 yrs', description: 'Worked on UI for Google Search.' },
      { title: 'React Intern', company: 'StartupX', duration: '6 mo', description: 'Built reusable components.' }
    ]
  });

  const [loading] = useState(false);
  const [error] = useState(null);

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      {/* Sidebar*/}
      <aside className="hidden sm:fixed sm:top-15 sm:left-0 sm:w-60 sm:h-screen bg-white px-4 pt-6 shadow z-10 overflow-y-auto sm:block">
        {/* Profile Section */}
        <div className="flex flex-col items-center mb-6 h-32 justify-center">
          {profile.profilePic ? (
            <img
              src={profile.profilePic}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover mb-2"
            />
          ) : (
            <FaUserCircle className="text-7xl text-gray-400 mb-2" />
          )}
          <span className="text-lg font-medium text-gray-800">{profile.userId}</span>
          <span className="text-base font-normal text-gray-600 mt-1">{profile.fullName}</span>
        </div>

        {/* Education Section */}
        <div className="mb-6">
          <div className="font-semibold text-blue-900 mb-1">Education</div>
          {profile.education && profile.education.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {profile.education.map((edu, i) => (
                <li key={i} className="text-xs text-gray-700 whitespace-pre-line">
                  {edu.course && <div>{edu.course}</div>}
                  {edu.branch && <div>{edu.branch}</div>}
                  {edu.college && <div>{edu.college}</div>}
                  {edu.city && <div>{edu.city}</div>}
                  {edu.passingYear && <div>{edu.passingYear}</div>}
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-xs text-gray-400">Not added yet</span>
          )}
        </div>

        {/* Experience Section */}
        <div className="mb-6">
          <div className="font-semibold text-blue-900 mb-1">Experience</div>
          {profile.experience && profile.experience.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {profile.experience.map((exp, i) => (
                <li key={i} className="text-xs text-gray-700">
                  <span className="font-medium">{exp.title}</span>
                  {exp.company ? ` at ${exp.company}` : ''}
                  {exp.duration ? ` (${exp.duration})` : ''}
                  {exp.description ? `: ${exp.description}` : ''}
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-xs text-gray-400">Not added yet</span>
          )}
        </div>
      </aside>

      {/* Main Content Area - responsive margin */}
      <main className="ml-0 md:ml-60 w-full md:w-[calc(100vw-16.1rem)] min-h-screen bg-gray-50">
        {/* Beside Card */}
        <div className="h-45 bg-white p-4 sm:p-6 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 w-full">
            {/* Bio & Links Section */}
            <div className="flex-1 min-w-[220px]">
              <BioLink
                bio={profile.bio}
                links={[
                  ...(profile.github ? [{ type: 'github', url: `https://github.com/${profile.github}` }] : []),
                  ...(profile.linkedin ? [{ type: 'linkedin', url: `https://linkedin.com/in/${profile.linkedin}` }] : []),
                  ...(profile.twitter ? [{ type: 'twitter', url: `https://twitter.com/${profile.twitter}` }] : []),
                  ...(profile.website ? [{ type: 'website', url: profile.website.startsWith('http') ? profile.website : `https://${profile.website}` }] : [])
                ]}
              />
            </div>
            {/* Add SkillMate Button */}
            <div className="flex flex-col items-center justify-center min-w-[150px]">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 text-white text-xs shadow hover:bg-blue-700"
                onClick={() => navigate('add-skillmate', { replace: false })}
              >
                <FaRegFileAlt className="text-sm" />
                Add SkillMate
              </button>
            </div>
            {/* SkillMates and Search Section */}
            <div className="flex flex-col items-center justify-center min-w-[180px] bg-gray-50 rounded-xl p-4 shadow-sm">
              <span className="text-base text-gray-700 font-semibold">0</span>
              <button
                className="flex items-center gap-2 px-3 py-1.5 rounded bg-gray-500 text-white text-xs shadow hover:bg-gray-600 mt-2"
              >
                <FaRegFileAlt className="text-sm" />
                SkillMates
              </button>
              {/* Search bar */}
              <div className="flex items-center gap-2 mt-3 w-full">
                <input
                  type="text"
                  placeholder="Search your video"
                  className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
                <button className="bg-gray-600 text-white px-3 py-1.5 rounded text-xs hover:bg-gray-700">
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-2 sm:px-6 pt-4 sm:pt-6">
          <div className="flex flex-wrap gap-2 sm:gap-4 border-b border-gray-300 mb-4">
            <NavLink
              to="/public-profile/Home"
              className={({ isActive }) =>
                `pb-2 px-2 text-sm font-medium ${isActive ? activeTab : normalTab}`
              }
              end
            >
              Home
            </NavLink>
            <NavLink
              to="/public-profile/live"
              className={({ isActive }) =>
                `pb-2 px-2 text-sm font-medium ${isActive ? activeTab : normalTab}`
              }
            >
              Live
            </NavLink>
            <NavLink
              to="/public-profile/videos"
              className={({ isActive }) =>
                `pb-2 px-2 text-sm font-medium ${isActive ? activeTab : normalTab}`
              }
            >
              Videos
            </NavLink>
            <NavLink
              to="/public-profile/playlist"
              className={({ isActive }) =>
                `pb-2 px-2 text-sm font-medium ${isActive ? activeTab : normalTab}`
              }
            >
              Playlist
            </NavLink>
          </div>
        </div>
        {/* Tab Content Outlet */}
        <div className="p-2 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SideBarPublic;

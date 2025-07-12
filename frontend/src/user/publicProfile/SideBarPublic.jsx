import React, { useEffect, useRef, useState, createContext } from 'react';
import {
  FaRegFileAlt,
  FaChevronDown,
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaGlobe,
} from 'react-icons/fa';
import { useNavigate, useLocation, Outlet, NavLink } from 'react-router-dom';
import ContributionCalendar from '../myprofile/ContributionCalendar';
import SearchBar from '../privateProfile/SearchBar';

// Context to pass searchQuery to PublicHome
export const ProfileContext = createContext();

// Mock contribution data for the calendar
const contributions = {
  '2024-01-01': 5,
  '2024-01-02': 2,
  // Add more contribution data as needed
};

const months = [
  { name: 'Jan', year: 2024, days: 31 },
  { name: 'Feb', year: 2024, days: 29 },
  // Add more months as needed
];

const currentDate = new Date();

const getContributionColor = (count) => {
  if (count === 0) return 'bg-gray-100';
  if (count <= 2) return 'bg-blue-100';
  if (count <= 5) return 'bg-blue-300';
  if (count <= 8) return 'bg-blue-500';
  return 'bg-blue-700';
};

// Fetch user profile data
const fetchUserProfile = async () => {
  try {
    const userData = {
      fullName: 'John Doe',
      userId: 'john_doe123',
      profilePic: 'https://placehold.co/100x100?text=JD',
      profilePicPreview: 'https://placehold.co/100x100?text=JD',
      bio: 'Passionate developer and lifelong learner.',
      linkedin: 'johndoe',
      github: 'johndoe',
      twitter: 'johndoe',
      website: 'https://johndoe.com',
      education: [
        {
          course: 'B.Tech',
          branch: 'Computer Science',
          college: 'XYZ University',
          city: 'New York',
          passingYear: '2020',
        },
      ],
      experience: [
        {
          title: 'Frontend Developer',
          company: 'Tech Corp',
          duration: '2020-2023',
          description: 'Developed user interfaces for web applications.',
        },
      ],
    };
    return userData;
  } catch {
    throw new Error('Failed to fetch user profile');
  }
};

const SideBarPublic = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = 'border-b-2 border-blue-600 text-blue-900 font-semibold';
  const normalTab = 'text-blue-900 hover:text-blue-700';

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSkillMate, setIsSkillMate] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Load user profile data and handle updates
  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const data = await fetchUserProfile();
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
    window.addEventListener('profileUpdated', loadProfile);
    return () => window.removeEventListener('profileUpdated', loadProfile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddSkillMate = () => {
    setIsSkillMate(true);
  };

  const handleRemoveSkillMate = () => {
    setIsSkillMate(false);
    setShowDropdown(false);
  };

  const toggleDropdown = () => setShowDropdown((prev) => !prev);

  return (
    <ProfileContext.Provider value={{ searchQuery, setSearchQuery }}>
      <div className="flex flex-col sm:flex-row min-h-screen w-full bg-gradient-to-b from-[#f9fcff] to-[#eef7ff] font-sans animate-fade-in">
        {/* Sidebar */}
        <aside className="w-full sm:w-60 h-auto min-h-[calc(100vh-4rem)] bg-blue-50 bg-opacity-30 px-4 pt-8 z-10 overflow-y-auto scrollbar-hidden sm:border-r sm:border-blue-200">
          {/* Social Links */}
          <div className="mb-8">
            <div className="font-semibold text-blue-900 mb-3 text-lg">Social</div>
            <div className="flex flex-col gap-3">
              {profile?.linkedin && (
                <a
                  href={`https://linkedin.com/in/${profile.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-900 hover:text-blue-700 text-sm"
                >
                  <FaLinkedin className="text-xl text-blue-800" />
                  LinkedIn
                </a>
              )}
              {profile?.github && (
                <a
                  href={`https://github.com/${profile.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-900 hover:text-blue-700 text-sm"
                >
                  <FaGithub className="text-xl text-blue-800" />
                  GitHub
                </a>
              )}
              {profile?.twitter && (
                <a
                  href={`https://twitter.com/${profile.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-900 hover:text-blue-700 text-sm"
                >
                  <FaTwitter className="text-xl text-blue-800" />
                  Twitter
                </a>
              )}
              {profile?.website && (
                <a
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-900 hover:text-blue-700 text-sm"
                >
                  <FaGlobe className="text-xl text-blue-800" />
                  Website
                </a>
              )}
            </div>
          </div>

          {/* Education Section */}
          <div className="mb-8">
            <div className="font-semibold text-blue-900 mb-3 text-lg">Education</div>
            {loading ? (
              <span className="text-blue-600/70 text-sm">Loading...</span>
            ) : error ? (
              <span className="text-red-500 text-sm">{error}</span>
            ) : profile?.education && profile.education.length > 0 ? (
              <ul className="flex flex-col gap-4">
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
              <span className="text-xs text-gray-700">Not added yet</span>
            )}
          </div>

          {/* Experience Section */}
          <div className="mb-8">
            <div className="font-semibold text-blue-900 mb-3 text-lg">Experience</div>
            {loading ? (
              <span className="text-blue-600/70 text-sm">Loading...</span>
            ) : error ? (
              <span className="text-red-500 text-sm">{error}</span>
            ) : profile?.experience && profile.experience.length > 0 ? (
              <ul className="flex flex-col gap-3">
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
              <span className="text-xs text-gray-700">Not added yet</span>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="w-full min-h-screen pt-8 pb-24 px-4 sm:px-6 overflow-y-auto scrollbar-hidden animate-fade-in scroll-smooth">
          <div className="flex flex-col sm:flex-row items-start mb-6">
            {loading ? (
              <div className="flex items-center justify-center w-[100px] h-[100px] sm:w-[180px] sm:h-[180px] mx-auto sm:mx-0">
                <div className="w-8 h-8 sm:w-12 sm:h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 mx-auto sm:mx-0">
                <span className="text-red-500 text-sm transition-all duration-300 animate-fade-in">{error}</span>
                <button
                  onClick={() => loadProfile()}
                  className="text-blue-900 px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 hover:bg-blue-100 transition-all duration-300"
                  aria-label="Retry loading profile"
                >
                  Retry
                </button>
              </div>
            ) : (
              <img
                src={profile?.profilePicPreview || profile?.profilePic || 'https://placehold.co/100x100?text=User'}
                alt={`${profile?.fullName || 'User'}'s profile picture`}
                className="w-[100px] h-[100px] sm:w-[180px] sm:h-[180px] rounded-full object-cover border-2 border-blue-200 transition-all duration-300 hover:scale-105 mx-auto sm:mx-0"
              />
            )}
            <div className="mt-4 sm:mt-0 sm:ml-4 flex-1 flex flex-col items-center sm:items-start">
              <h1 className="text-xl sm:text-4xl font-bold text-blue-800 transition-colors duration-300">
                {profile?.fullName || 'Full Name'}
              </h1>
              <p className="text-sm text-blue-600/70 transition-colors duration-300">@{profile?.userId || 'username'}</p>
              <p className="text-sm text-blue-600/70 mt-2 max-w-md transition-colors duration-300">
                {profile?.bio || 'Your bio goes here, set it in Setup Profile.'}
              </p>
              <div className="mt-4">
                <button
                  className="border border-blue-200 text-blue-900 px-4 sm:px-8 py-2 rounded-lg text-sm font-medium w-full max-w-xs flex items-center justify-between bg-blue-50 bg-opacity-80 hover:bg-blue-100 transition-all duration-300 transform hover:scale-105"
                  onClick={isSkillMate ? toggleDropdown : handleAddSkillMate}
                  title={isSkillMate ? 'Manage SkillMate' : 'Add SkillMate'}
                  aria-label={isSkillMate ? 'Manage SkillMate' : 'Add SkillMate'}
                >
                  <span>{isSkillMate ? 'SkillMate' : 'Add SkillMate'}</span>
                  {isSkillMate && <FaChevronDown className="text-sm" />}
                </button>
                {showDropdown && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-50 mt-2 w-44 bg-blue-50 border border-blue-200 rounded-lg shadow-lg"
                  >
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-blue-900 hover:bg-blue-100"
                      onClick={() => {
                        alert('Notifications turned ON');
                        setShowDropdown(false);
                      }}
                    >
                      🔔 On Notification
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-blue-900 hover:bg-blue-100"
                      onClick={() => {
                        alert('Notifications muted');
                        setShowDropdown(false);
                      }}
                    >
                      🔕 Mute Notification
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-blue-100"
                      onClick={handleRemoveSkillMate}
                    >
                      ❌ Remove SkillMate
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contribution Calendar */}
          <div className="mb-6">
            <ContributionCalendar
              contributions={contributions}
              months={months}
              currentDate={currentDate}
              getContributionColor={getContributionColor}
            />
          </div>

          {/* Tab Navigation */}
          <div className="px-2 sm:px-6 pt-4 sm:pt-6">
            <div className="flex flex-wrap gap-2 sm:gap-4 border-b border-blue-200 mb-4">
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
                to="/public-profile/contribution"
                className={({ isActive }) =>
                  `pb-2 px-2 text-sm font-medium ${isActive ? activeTab : normalTab}`
                }
              >
                Contribution
              </NavLink>
            </div>
          </div>

          {/* Tab Content Outlet */}
          <div className="relative min-h-[calc(100vh-28rem)] sm:min-h-[calc(100vh-32rem)] overflow-y-auto scrollbar-hidden animate-fade-in scroll-smooth">
            <div className="absolute top-0 right-0 p-2 sm:p-4">
              <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            </div>
            <Outlet />
          </div>
        </main>
      </div>
    </ProfileContext.Provider>
  );
};

export default SideBarPublic;
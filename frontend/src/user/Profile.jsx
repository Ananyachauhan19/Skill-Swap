import React, { useState, useEffect } from 'react';
import { MapPin, GraduationCap, Linkedin, Mail, Settings, LogOut, Menu, X } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { fetchSilverCoinBalance, fetchGoldenCoinBalance } from './settings/CoinBalance.jsx';
import Cookies from 'js-cookie';

// --- Function to fetch user history ---
async function fetchUserHistory() {
  const response = await fetch('/history');
  if (!response.ok) throw new Error('Failed to fetch history');
  const data = await response.json();
  return data;
}

// --- Helper to generate dynamic months for the past 365 days ---
const generateMonths = (currentDate) => {
  const months = [];
  const endDate = new Date(currentDate);
  const startDate = new Date(currentDate);
  startDate.setDate(startDate.getDate() - 364); // 365 days including today

  let current = new Date(startDate);
  while (current <= endDate) {
    const monthIndex = current.getMonth();
    const year = current.getFullYear();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const monthName = current.toLocaleString('default', { month: 'short' });

    if (!months.some(m => m.name === monthName && m.year === year)) {
      months.push({
        name: monthName,
        year: year,
        days: current.getMonth() === endDate.getMonth() && current.getFullYear() === endDate.getFullYear()
          ? endDate.getDate()
          : daysInMonth,
      });
    }
    current.setMonth(current.getMonth() + 1);
    current.setDate(1);
  }

  return months;
};

// --- Generate contribution data for the past 365 days ---
const generateContributionData = (currentDate, history) => {
  const contributions = {};
  const endDate = new Date(currentDate);
  const startDate = new Date(currentDate);
  startDate.setDate(startDate.getDate() - 364);

  let current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    contributions[dateStr] = 0;
    current.setDate(current.getDate() + 1);
  }

  history.forEach(entry => {
    const dateStr = entry.date;
    if (contributions[dateStr] !== undefined) {
      contributions[dateStr] += entry.sessions.length;
    }
  });

  return contributions;
};

// --- Helper to get contribution color ---
const getContributionColor = (count) => {
  if (count === 0) return 'bg-gray-100';
  if (count === 1) return 'bg-blue-200';
  if (count === 2) return 'bg-blue-400';
  if (count === 3) return 'bg-blue-600';
  return 'bg-blue-800';
};

const Profile = () => {
  // --- State Management ---
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    userId: '',
    profilePic: null,
    profilePicPreview: null,
    bio: '',
    country: '',
    education: [],
    teachSkills: [],
    learnSkills: [],
    experience: [],
    certificates: [],
    linkedin: '',
    website: '',
    github: '',
    twitter: '',
    credits: 1200,
    goldCoins: 0, // Add golden skill coins
    badges: ['Starter', 'Helper'],
    rank: 'Bronze'
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contributions, setContributions] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [months, setMonths] = useState(generateMonths(new Date()));
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [silver, setSilver] = useState(0);
  const [gold, setGold] = useState(0);

  // --- Fetch user profile from backend/cookie ---
  useEffect(() => {
    async function fetchProfile() {
      // Replace this with a real API call when backend is ready
      let user = null;
      try { user = JSON.parse(Cookies.get('user')); } catch {}
      setProfile(prev => ({
        ...prev,
        email: user?.email || prev.email,
        userId: user?.userId || prev.userId,
        profilePic: user?.profilePic || prev.profilePic,
        profilePicPreview: user?.profilePicPreview || prev.profilePicPreview,
        fullName: user?.fullName || prev.fullName,
        bio: user?.bio || '',
        country: user?.country || '',
        education: user?.education || [],
        teachSkills: user?.teachSkills || [],
        learnSkills: user?.learnSkills || [],
        experience: user?.experience || [],
        certificates: user?.certificates || [],
        linkedin: user?.linkedin || '',
        website: user?.website || '',
        github: user?.github || '',
        twitter: user?.twitter || '',
        credits: user?.credits ?? prev.credits,
        goldCoins: user?.goldCoins ?? prev.goldCoins,
        badges: user?.badges ?? prev.badges,
        rank: user?.rank ?? prev.rank
      }));
    }
    fetchProfile();

    // Listen for profileUpdated event to reload user data
    const handleProfileUpdated = () => {
      fetchProfile();
    };
    window.addEventListener('profileUpdated', handleProfileUpdated);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdated);
  }, []);

  // --- Daily update for current date and calendar ---
  useEffect(() => {
    const updateDate = () => {
      const newDate = new Date();
      setCurrentDate(newDate);
      setMonths(generateMonths(newDate));
    };

    updateDate();
    const interval = setInterval(updateDate, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Fetch history and update contributions ---
  useEffect(() => {
    setLoading(true);
    fetchUserHistory()
      .then(data => {
        setHistory(data);
        setContributions(generateContributionData(currentDate, data));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [currentDate]);

  // --- Fetch and update silver and gold coin balances ---
  useEffect(() => {
    async function loadCoins() {
      try {
        const silverData = await fetchSilverCoinBalance();
        setSilver(silverData.silver ?? 0);
        const goldData = await fetchGoldenCoinBalance();
        setGold(goldData.gold ?? 0);
      } catch {}
    }
    loadCoins();
  }, []);

  // --- Handle profile picture change ---
  const handleProfilePicChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfile(prev => ({ ...prev, profilePicPreview: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  // --- Toggle mobile menu ---
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // --- Helper to get best available name
  const getDisplayName = () => {
    // 1. State value (from user object)
    if (profile.fullName && profile.fullName.trim() !== '') return profile.fullName;
    // 2. Latest user object in cookie
    let user = null;
    try { user = JSON.parse(Cookies.get('user')); } catch {}
    if (user && user.fullName && user.fullName.trim() !== '') return user.fullName;
    // 3. Registered name from login/register
    const regName = Cookies.get('registeredName') || '';
    if (regName && regName.trim() !== '') return regName;
    // 4. Google/LinkedIn social auth
    let googleUser = null, linkedinUser = null;
    try { googleUser = JSON.parse(Cookies.get('googleUser')); } catch {}
    try { linkedinUser = JSON.parse(Cookies.get('linkedinUser')); } catch {}
    if (googleUser && googleUser.name && googleUser.name.trim() !== '') return googleUser.name;
    if (linkedinUser && linkedinUser.name && linkedinUser.name.trim() !== '') return linkedinUser.name;
    // 5. Fallback
    return '';
  };
  // Helper to get best available email
  const getDisplayEmail = () => {
    if (profile.email && profile.email.trim() !== '') return profile.email;
    let googleUser = null, linkedinUser = null, regEmail = '';
    try { googleUser = JSON.parse(Cookies.get('googleUser')); } catch {}
    try { linkedinUser = JSON.parse(Cookies.get('linkedinUser')); } catch {}
    regEmail = Cookies.get('registeredEmail') || '';
    if (googleUser && googleUser.email) return googleUser.email;
    if (linkedinUser && linkedinUser.email) return linkedinUser.email;
    if (regEmail) return regEmail;
    return '';
  };
  // Helper to get best available userId
  const getDisplayUserId = () => {
    let user = null;
    try { user = JSON.parse(Cookies.get('user')); } catch {}
    return user?.userId || '';
  };

  // --- Full Name Edit State ---
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.fullName);

  const handleEditName = () => {
    setNameInput(profile.fullName);
    setEditingName(true);
  };
  const handleSaveName = () => {
    setProfile(prev => ({ ...prev, fullName: nameInput }));
    setEditingName(false);
    // Optionally, persist to localStorage/user object here
  };
  const handleCancelName = () => {
    setEditingName(false);
  };

  // --- Render Contribution Calendar ---
  const renderContributionCalendar = () => {
    const totalContributions = Object.values(contributions).reduce(
      (sum, count) => sum + count,
      0
    );

    return (
      <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-blue-900">Contribution Activity</h3>
          <select
            className="bg-transparent border border-blue-600 text-gray-700 text-sm px-3 py-1.5 rounded-md hover:bg-blue-600 hover:text-white transition"
            value={`${currentDate.getFullYear() - 1}-${currentDate.getFullYear()}`}
            onChange={(e) => e.preventDefault()}
          >
            <option>{`${currentDate.getFullYear() - 1}-${currentDate.getFullYear()}`}</option>
          </select>
        </div>

        <p className="text-sm text-gray-700 mb-4">
          {totalContributions} Contributions in the last year
        </p>

        <div className="overflow-x-auto hide-scrollbar">
          <div className="flex gap-4">
            {months.map((month, idx) => {
              const { name, year, days } = month;
              const firstDay = new Date(year, months.findIndex(m => m.name === name && m.year === year), 1).getDay();
              const weeks = Math.ceil((firstDay + days) / 7);

              const grid = Array(7)
                .fill()
                .map(() => Array(weeks).fill(null));

              for (let day = 1; day <= days; day++) {
                const dayIndex = (firstDay + day - 1) % 7;
                const weekIndex = Math.floor((firstDay + day - 1) / 7);
                grid[dayIndex][weekIndex] = day;
              }

              const boxClass = "w-3 h-2 rounded-none";

              return (
                <div key={idx} className="min-w-[60px]">
                  <div className="text-[10px] text-blue-900 font-medium text-center mb-2">
                    {name} {year}
                  </div>
                  <div className="flex flex-col gap-1">
                    {grid.map((week, rowIndex) => (
                      <div key={rowIndex} className="flex gap-1">
                        {week.map((day, colIndex) => {
                          if (day === null) {
                            return (
                              <div key={colIndex} className={`${boxClass} bg-transparent`} />
                            );
                          }

                          const dateStr = `${year}-${String(
                            months.findIndex(m => m.name === name && m.year === year) + 1
                          ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

                          const count = contributions[dateStr] || 0;

                          return (
                            <div
                              key={colIndex}
                              className={`${boxClass} ${getContributionColor(count)} hover:border hover:border-blue-300 transition cursor-pointer`}
                              title={`${name} ${day}, ${year} - ${count} contributions`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // --- Main Render ---
  return (
    <div className="min-h-screen bg-blue-50 pt-24 px-2 sm:px-4 md:px-8 lg:px-12 py-8">
      <Toaster position="top-center" />
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Sidebar/Profile Card */}
        <div className="w-full md:w-1/4 bg-white rounded-2xl shadow-lg border border-blue-100 p-6 sm:p-8 flex flex-col gap-8 md:-ml-6">
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-6">
              {profile.profilePicPreview ? (
                <img
                  src={profile.profilePicPreview}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover border-2 border-blue-600"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-blue-200 flex items-center justify-center text-2xl font-bold text-blue-900">
                  {profile.fullName ? profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePicChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                title="Upload Profile Picture"
              />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-blue-900 text-center break-words">{profile.fullName || 'Your Name'}</h2>
            <p className="text-xs text-gray-500 mb-1 text-center break-all">User ID: {getDisplayUserId() || 'Not set'}</p>
          </div>
          <button
            onClick={() => window.location.href = '/edit-profile'}
            className="w-full bg-blue-600 text-white text-base py-2 sm:py-3 rounded-md font-medium hover:bg-blue-700 transition"
          >
            Edit Profile
          </button>
          <div className="flex flex-col gap-4 text-sm text-gray-700">
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-blue-900" />
              <span>{getDisplayEmail()}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={16} className="text-blue-900" />
              <span>{profile.country}</span>
            </div>
            <div className="flex items-center gap-3">
              <GraduationCap size={16} className="text-blue-900" />
              <div>
                {Array.isArray(profile.education) && profile.education.length > 0 ? (
                  profile.education.map((edu, i) => {
                    if (typeof edu === 'string') {
                      return <div key={i} className="mb-1"><span className="font-semibold">{edu}</span></div>;
                    }
                    if (edu && typeof edu === 'object') {
                      return (
                        <div key={i} className="mb-1">
                          <span className="text-grey-600">{edu.degree || ''}{edu.specialization ? ' - ' + edu.specialization : ''}{edu.year ? ' (' + edu.year + ')' : ''}</span>
                          {edu.university && (
                            <div className="text-xs text-gray-600 mt-0.5">{edu.university}</div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })
                ) : (
                  <span className="text-gray-400">Not added yet</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Linkedin size={16} className="text-blue-900" />
              {profile.linkedin ? (
                <a href={`https://linkedin.com/in/${profile.linkedin}`} className="hover:underline" target="_blank" rel="noopener noreferrer">{profile.linkedin}</a>
              ) : <span className="text-gray-400">Not added</span>}
            </div>
            <div className="flex items-center gap-3">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.66 8.84 8.36 9.74.61.11.84-.26.84-.58v-2.02c-3.4.74-4.12-1.64-4.12-1.64-.55-1.4-1.34-1.77-1.34-1.77-1.09-.75.08-.74.08-.74 1.2.08 1.83 1.23 1.83 1.23 1.07 1.83 2.8 1.3 3.48.99.11-.78.42-1.3.76-1.6-2.71-.31-5.56-1.36-5.56-6.06 0-1.34.47-2.44 1.23-3.3-.12-.31-.53-1.56.12-3.25 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02.01 2.05.14 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.65 1.69.24 2.94.12 3.25.77.86 1.23 1.96 1.23 3.3 0 4.71-2.86 5.75-5.58 6.06.43.37.81 1.1.81 2.22v3.29c0 .32.23.7.85.58C18.34 20.84 22 16.84 22 12c0-5.52-4.48-10-10-10z" fill="#1e40af"/></svg>
              {profile.github ? (
                <a href={`https://github.com/${profile.github}`} className="hover:underline" target="_blank" rel="noopener noreferrer">{profile.github}</a>
              ) : <span className="text-gray-400">Not added</span>}
            </div>
            <div className="flex items-center gap-3">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M22.46 6c-.77.35-1.6.58-2.47.69a4.3 4.3 0 0 0 1.88-2.37 8.59 8.59 0 0 1-2.72 1.04A4.28 4.28 0 0 0 16.11 4c-2.37 0-4.29 1.92-4.29 4.29 0 .34.04.67.11.99C7.69 9.13 4.07 7.38 1.64 4.7c-.37.64-.58 1.38-.58 2.17 0 1.5.76 2.82 1.92 3.6-.7-.02-1.36-.21-1.94-.53v.05c0 2.1 1.5 3.85 3.5 4.25-.36.1-.74.16-1.13.16-.28 0-.54-.03-.8-.08.54 1.7 2.1 2.94 3.95 2.97A8.6 8.6 0 0 1 2 19.54c-.63 0-1.25-.04-1.86-.11A12.13 12.13 0 0 0 6.29 21c7.55 0 11.68-6.26 11.68-11.68 0-.18-.01-.36-.02-.54A8.18 8.18 0 0 0 22.46 6z" fill="#1e40af"/></svg>
              {profile.twitter ? (
                <a href={`https://twitter.com/${profile.twitter}`} className="hover:underline" target="_blank" rel="noopener noreferrer">{profile.twitter}</a>
              ) : <span className="text-gray-400">Not added</span>}
              
            </div>
            <div className="flex items-center gap-3">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.66 8.84 8.36 9.74.61.11.84-.26.84-.58v-2.02c-3.4.74-4.12-1.64-4.12-1.64-.55-1.4-1.34-1.77-1.34-1.77-1.09-.75.08-.74.08-.74 1.2.08 1.83 1.23 1.83 1.23 1.07 1.83 2.8 1.3 3.48.99.11-.78.42-1.3.76-1.6-2.71-.31-5.56-1.36-5.56-6.06 0-1.34.47-2.44 1.23-3.3-.12-.31-.53-1.56.12-3.25 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02.01 2.05.14 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.65 1.69.24 2.94.12 3.25.77.86 1.23 1.96 1.23 3.3 0 4.71-2.86 5.75-5.58 6.06.43.37.81 1.1.81 2.22v3.29c0 .32.23.7.85.58C18.34 20.84 22 16.84 22 12c0-5.52-4.48-10-10-10z" fill="#1e40af"/></svg>
              {profile.website ? (
                <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} className="hover:underline" target="_blank" rel="noopener noreferrer">{profile.website}</a>
              ) : <span className="text-gray-400">Not added</span>}
            </div>
          </div>
          <hr className="border-blue-200" />
          <div className="flex flex-col gap-4">
            <button className="flex items-center gap-3 text-sm text-gray-700 hover:bg-blue-100 p-3 rounded-md"
              onClick={() => window.location.href = '/settings/referral-program'}>
              <Mail size={16} className="text-blue-900" />
              Invite Friends
            </button>
            <button className="flex items-center gap-3 text-sm text-gray-700 hover:bg-blue-100 p-3 rounded-md"
              onClick={() => window.location.href = '/accountSettings'}
              style={window.location.pathname === '/accountSettings' ? { backgroundColor: '#e0e7ff', fontWeight: 'bold', color: '#1e40af' } : {}}
            >
              <Settings size={16} className="text-blue-900" />
              Account Settings
            </button>
            <button
              className="flex items-center gap-3 text-sm text-gray-700 hover:bg-blue-100 p-3 rounded-md"
              onClick={() => {
                Cookies.remove('user');
                Cookies.remove('registeredName');
                Cookies.remove('registeredEmail');
                Cookies.remove('googleUser');
                Cookies.remove('linkedinUser');
                window.location.href = '/'; 
              }}
            >
              <LogOut size={16} className="text-blue-900" />
              Logout
            </button>
          </div>
        </div>
        {/* Main Content */}
        <div className="w-full md:w-3/4 flex flex-col gap-8">
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-4 sm:p-8 flex flex-col sm:flex-row gap-4 sm:gap-8">
            {/* Silver and Gold Skill Coins */}
            <div className="flex-1 bg-blue-50 p-4 sm:p-6 rounded-lg text-center min-w-[120px]">
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <span className="text-xl sm:text-2xl">🥈</span>
                <h3 className="text-base sm:text-lg font-semibold text-blue-900">Silver Skill Coins</h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-700">{silver}</p>
            </div>
            <div className="flex-1 bg-blue-50 p-4 sm:p-6 rounded-lg text-center min-w-[120px]">
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <span className="text-xl sm:text-2xl">🥇</span>
                <h3 className="text-base sm:text-lg font-semibold text-yellow-700">Golden Skill Coins</h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-700">{gold}</p>
            </div>
            <div className="flex-1 bg-blue-50 p-4 sm:p-6 rounded-lg text-center min-w-[120px]">
              <h3 className="text-base sm:text-lg font-semibold text-blue-900">Rank</h3>
              <p className="text-xl sm:text-2xl font-bold text-gray-700">{profile.rank}</p>
            </div>
            <div className="flex-1 bg-blue-50 p-4 sm:p-6 rounded-lg text-center min-w-[120px]">
              <h3 className="text-base sm:text-lg font-semibold text-blue-900">Badges</h3>
              <p className="text-xl sm:text-2xl font-bold text-gray-700">{profile.badges.length}</p>
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-2 sm:mt-3 justify-center">
                {profile.badges.map((badge, idx) => (
                  <span key={idx} className="bg-blue-200 text-gray-700 text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* About/Bio Section */}
          {profile.bio && (
            <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-4 sm:p-8 mb-2">
              <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2">About</h3>
              <p className="text-gray-700 text-sm sm:text-base">{profile.bio}</p>
            </div>
          )}

          {/* User Info Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-4 sm:p-8 flex flex-col md:flex-row gap-4 sm:gap-8 items-center mb-2">
            <div className="flex-1 flex flex-col gap-2 w-full">
              
              {/* What they can teach */}
              <div className="mt-2">
                <div className="font-semibold text-blue-900 mb-1">Can Teach:</div>
                {profile.teachSkills && profile.teachSkills.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {profile.teachSkills.map((s, i) => (
                      <li key={i} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium border border-green-200">{s.skill}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-400">Not added yet</div>
                )}
              </div>
              {/* What they want to learn */}
              <div className="mt-2">
                <div className="font-semibold text-blue-900 mb-1">Wants to Learn:</div>
                {profile.learnSkills && profile.learnSkills.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {profile.learnSkills.map((s, i) => (
                      <li key={i} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium border border-yellow-200">{s}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-400">Not added yet</div>
                )}
              </div>
              {/* Experience */}
              <div className="mt-2">
                <div className="font-semibold text-blue-900 mb-1">Experience:</div>
                {profile.experience && profile.experience.length > 0 ? (
                  <ul className="list-disc list-inside text-gray-700 text-sm">
                    {profile.experience.map((exp, i) => {
                      if (typeof exp === 'string') {
                        return <li key={i}>{exp}</li>;
                      } else if (exp && typeof exp === 'object') {
                        // Format: Title at Company (Duration): Description
                        const { title, company, duration, description } = exp;
                        return (
                          <li key={i}>
                            {title ? <span className="font-semibold">{title}</span> : null}
                            {company ? ` at ${company}` : ''}
                            {duration ? ` (${duration})` : ''}
                            {description ? `: ${description}` : ''}
                          </li>
                        );
                      } else {
                        return null;
                      }
                    })}
                  </ul>
                ) : (
                  <div className="text-gray-400">Not added yet</div>
                )}
              </div>
              {/* Certificates */}
              <div className="mt-2">
                <div className="font-semibold text-blue-900 mb-1">Certificates:</div>
                {profile.certificates && profile.certificates.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {profile.certificates.map((cert, i) => {
                      if (typeof cert === 'string') {
                        return (
                          <li key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">{cert}</li>
                        );
                      } else if (cert && typeof cert === 'object') {
                        // Format: Name by Issuer (Year)
                        const { name, issuer, year } = cert;
                        return (
                          <li key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">
                            {name ? name : ''}{issuer ? ` by ${issuer}` : ''}{year ? ` (${year})` : ''}
                          </li>
                        );
                      } else {
                        return null;
                      }
                    })}
                  </ul>
                ) : (
                  <div className="text-gray-400">Not added yet</div>
                )}
              </div>
            </div>
          </div>
          
          {renderContributionCalendar()}
        </div>
      </div>
    </div>
  );
};

export default Profile;
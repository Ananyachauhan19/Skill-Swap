import React, { useState, useEffect } from 'react';
import { MapPin, GraduationCap, Linkedin, Mail, Settings, LogOut, Menu, X } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

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
    username: '',
    profilePicPreview: null,
    bio: '',
    country: '',
    university: '',
    linkedin: '',
    credits: 1200,
    rank: 'Bronze',
    badges: ['Starter', 'Helper'],
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contributions, setContributions] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [months, setMonths] = useState(generateMonths(new Date()));
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // --- Fetch user profile from localStorage ---
  useEffect(() => {
    const regName = localStorage.getItem('registeredName');
    const regEmail = localStorage.getItem('registeredEmail');
    const user = JSON.parse(localStorage.getItem('user'));
    setProfile(prev => ({
      ...prev,
      fullName: (user?.fullName && user.fullName.trim()) ? user.fullName : (regName || prev.fullName),
      username: (user?.email && user.email.trim()) ? user.email : (regEmail || prev.username),
      profilePicPreview: user?.profilePicPreview || prev.profilePicPreview,
      bio: user?.bio || '',
      country: user?.country || '',
      university: user?.education?.university || '',
      education: user?.education || { degree: '', university: '', year: '', specialization: '' },
      teachSkills: user?.teachSkills || [],
      learnSkills: user?.learnSkills || [],
      experience: user?.experience || [],
      certificates: user?.certificates || [],
      credits: user?.credits || prev.credits,
      badges: user?.badges || prev.badges,
      rank: user?.rank || prev.rank
    }));

    const handleProfileUpdate = () => {
      const updatedUser = JSON.parse(localStorage.getItem('user'));
      setProfile(prev => ({
        ...prev,
        fullName: (updatedUser?.fullName && updatedUser.fullName.trim()) ? updatedUser.fullName : (regName || prev.fullName),
        username: (updatedUser?.email && updatedUser.email.trim()) ? updatedUser.email : (regEmail || prev.username),
        profilePicPreview: updatedUser?.profilePicPreview || prev.profilePicPreview,
        bio: updatedUser?.bio || '',
        country: updatedUser?.country || '',
        university: updatedUser?.education?.university || '',
        education: updatedUser?.education || { degree: '', university: '', year: '', specialization: '' },
        teachSkills: updatedUser?.teachSkills || [],
        learnSkills: updatedUser?.learnSkills || [],
        experience: updatedUser?.experience || [],
        certificates: updatedUser?.certificates || [],
        credits: updatedUser?.credits || prev.credits,
        badges: updatedUser?.badges || prev.badges,
        rank: updatedUser?.rank || prev.rank
      }));
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
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
    <div className="min-h-screen bg-blue-50">
      {/* Navbar */}
      <nav className="bg-blue-600 text-white fixed top-0 left-0 right-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 py-4 flex justify-between items-center">
          <div className="text-xl font-bold">MyApp</div>
          <div className="hidden md:flex items-center gap-6">
            <a href="/" className="hover:text-blue-200 transition">Home</a>
            <a href="/profile" className="hover:text-blue-200 transition">Profile</a>
            <a href="/settings" className="hover:text-blue-200 transition">Settings</a>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}
              className="flex items-center gap-2 hover:text-blue-200 transition"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
          <button className="md:hidden" onClick={toggleMenu}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {isMenuOpen && (
          <div className="md:hidden bg-blue-700 px-4 sm:px-8 py-4 flex flex-col gap-4">
            <a href="/" className="hover:text-blue-200 transition" onClick={toggleMenu}>Home</a>
            <a href="/profile" className="hover:text-blue-200 transition" onClick={toggleMenu}>Profile</a>
            <a href="/settings" className="hover:text-blue-200 transition" onClick={toggleMenu}>Settings</a>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
                toggleMenu();
              }}
              className="flex items-center gap-2 hover:text-blue-200 transition"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="pt-20 sm:pt-24 p-4 sm:p-8 md:p-12">
        <Toaster position="top-center" />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/4 bg-white rounded-2xl shadow-lg border border-blue-100 p-8 flex flex-col gap-8 -ml-6">
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 mb-6">
                {profile.profilePicPreview ? (
                  <img
                    src={profile.profilePicPreview}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover border-2 border-blue-600"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-blue-200 flex items-center justify-center text-2xl font-bold text-blue-900">
                    {profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
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
              <h2 className="text-xl font-semibold text-blue-900">{profile.fullName}</h2>
              <p className="text-sm text-gray-700">{profile.username}</p>
            </div>
            {profile.bio && (
              <div className="text-sm text-gray-700">
                <p>{profile.bio}</p>
              </div>
            )}
            <button
              onClick={() => window.location.href = '/edit-profile'}
              className="w-full bg-blue-600 text-white text-base py-3 rounded-md font-medium hover:bg-blue-700 transition"
            >
              Edit Profile
            </button>
            <div className="flex flex-col gap-4 text-sm text-gray-700">
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-blue-900" />
                <span>{profile.country}</span>
              </div>
              <div className="flex items-center gap-3">
                <GraduationCap size={16} className="text-blue-900" />
                <span>{profile.university}</span>
              </div>
              <div className="flex items-center gap-3">
                <Linkedin size={16} className="text-blue-900" />
                <a href={`https://linkedin.com/in/${profile.linkedin}`} className="hover:underline">
                  {profile.linkedin}
                </a>
              </div>
            </div>
            <hr className="border-blue-200" />
            <div className="flex flex-col gap-4">
              <button className="flex items-center gap-3 text-sm text-gray-700 hover:bg-blue-100 p-3 rounded-md">
                <Mail size={16} className="text-blue-900" />
                Invite Friends
              </button>
              <button className="flex items-center gap-3 text-sm text-gray-700 hover:bg-blue-100 p-3 rounded-md">
                <Settings size={16} className="text-blue-900" />
                Account Settings
              </button>
              <button
                className="flex items-center gap-3 text-sm text-gray-700 hover:bg-blue-100 p-3 rounded-md"
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/login';
                }}
              >
                <LogOut size={16} className="text-blue-900" />
                Logout
              </button>
            </div>
          </div>

          <div className="w-full md:w-3/4 flex flex-col gap-8">
            <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 flex gap-8">
              <div className="flex-1 bg-blue-50 p-6 rounded-lg text-center">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">🪙</span>
                  <h3 className="text-lg font-semibold text-blue-900">Credits</h3>
                </div>
                <p className="text-2xl font-bold text-gray-700">{profile.credits}</p>
              </div>
              <div className="flex-1 bg-blue-50 p-6 rounded-lg text-center">
                <h3 className="text-lg font-semibold text-blue-900">Rank</h3>
                <p className="text-2xl font-bold text-gray-700">{profile.rank}</p>
              </div>
              <div className="flex-1 bg-blue-50 p-6 rounded-lg text-center">
                <h3 className="text-lg font-semibold text-blue-900">Badges</h3>
                <p className="text-2xl font-bold text-gray-700">{profile.badges.length}</p>
                <div className="flex flex-wrap gap-3 mt-3 justify-center">
                  {profile.badges.map((badge, idx) => (
                    <span key={idx} className="bg-blue-200 text-gray-700 text-sm px-3 py-1.5 rounded-full">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 flex flex-col md:flex-row gap-8 items-center mb-2">
              <div className="flex-1 flex flex-col gap-2">
                <div className="mt-2 text-sm text-gray-700">
                  <div className="font-semibold text-blue-900 mb-1">Education</div>
                  {profile.education ? (
                    <>
                      <div><span className="font-semibold">Degree:</span> {profile.education.degree}</div>
                      <div><span className="font-semibold">Specialization:</span> {profile.education.specialization}</div>
                      <div><span className="font-semibold">Year:</span> {profile.education.year}</div>
                    </>
                  ) : (
                    <div className="text-gray-400">Not added yet</div>
                  )}
                </div>
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
                <div className="mt-2">
                  <div className="font-semibold text-blue-900 mb-1">Experience:</div>
                  {profile.experience && profile.experience.length > 0 ? (
                    <ul className="list-disc list-inside text-gray-700 text-sm">
                      {profile.experience.map((exp, i) => (
                        <li key={i}>{exp}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-400">Not added yet</div>
                  )}
                </div>
                <div className="mt-2">
                  <div className="font-semibold text-blue-900 mb-1">Certificates:</div>
                  {profile.certificates && profile.certificates.length > 0 ? (
                    <ul className="flex flex-wrap gap-2">
                      {profile.certificates.map((cert, i) => (
                        <li key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">{cert}</li>
                      ))}
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
    </div>
  );
};

export default Profile;
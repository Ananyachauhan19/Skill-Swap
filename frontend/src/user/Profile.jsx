import React, { useState, useEffect } from 'react';
import { MapPin, GraduationCap, Linkedin, Mail, Settings, LogOut } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

// --- Static mock data for user session history ---
const STATIC_HISTORY = [
  {
    date: "2025-07-05",
    sessions: [
      {
        type: "one-on-one",
        with: "Alice Smith",
        when: "2025-07-05T10:00:00Z",
        duration: 45,
        credits: 10,
        subject: "Mathematics",
        topic: "Algebra",
        subtopic: "Linear Equations",
        rating: 5
      },
      {
        type: "interview",
        with: "Bob Lee",
        when: "2025-07-05T14:00:00Z",
        duration: 30,
        credits: 15,
        rating: 4
      },
      {
        type: "gd",
        with: ["Alice Smith", "Bob Lee", "Charlie Kim"],
        when: "2025-07-05T16:00:00Z",
        duration: 60,
        credits: 5
      }
    ]
  },
  {
    date: "2025-07-04",
    sessions: [
      {
        type: "one-on-one",
        with: "Charlie Kim",
        when: "2025-07-04T09:00:00Z",
        duration: 30,
        credits: 8,
        subject: "Physics",
        topic: "Optics",
        subtopic: "Lenses",
        rating: 4
      }
    ]
  }
];

// --- Function to fetch user history ---
async function fetchUserHistory() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(STATIC_HISTORY), 400);
  });
}

// --- Months from July 2025 to June 2026 ---
const MONTHS = [
  { name: 'Jul', year: 2025, days: 31 },
  { name: 'Aug', year: 2025, days: 31 },
  { name: 'Sep', year: 2025, days: 30 },
  { name: 'Oct', year: 2025, days: 31 },
  { name: 'Nov', year: 2025, days: 30 },
  { name: 'Dec', year: 2025, days: 31 },
  { name: 'Jan', year: 2026, days: 31 },
  { name: 'Feb', year: 2026, days: 28 },
  { name: 'Mar', year: 2026, days: 31 },
  { name: 'Apr', year: 2026, days: 30 },
  { name: 'May', year: 2026, days: 31 },
  { name: 'Jun', year: 2026, days: 30 }
];

// --- Generate contribution data from history ---
const generateContributionData = (startDate, history) => {
  const contributions = {};
  const today = new Date(startDate);
  const nextYear = new Date(today);
  nextYear.setFullYear(today.getFullYear() + 1);

  // Initialize all days with 0 contributions (transparent grey)
  let currentDate = new Date(today);
  while (currentDate <= nextYear) {
    const dateStr = currentDate.toISOString().split('T')[0];
    contributions[dateStr] = 0;
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Increment contributions based on history
  history.forEach(entry => {
    const dateStr = entry.date;
    if (contributions[dateStr] !== undefined) {
      contributions[dateStr] += entry.sessions.length;
    }
  });

  return contributions;
};

// Helper to get contribution color
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
    fullName: 'John Doe',
    username: '@johndoe',
    profilePicPreview: null,
    bio: 'Passionate developer and lifelong learner.',
    country: 'United States',
    university: 'Stanford University',
    linkedin: 'johndoe',
    credits: 1200,
    rank: 'Bronze',
    badges: ['Starter', 'Helper'],
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contributions, setContributions] = useState({});
  const [currentDate] = useState(new Date('2025-07-05'));

  // --- Effect Hook for Fetching Data ---
  useEffect(() => {
    fetchUserHistory()
      .then(data => {
        setHistory(data);
        setContributions(generateContributionData(currentDate, data));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [currentDate]);

  // --- Event Handlers ---
  const handleProfilePicChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfile(prev => ({ ...prev, profilePicPreview: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  // --- Helper Functions ---
  function formatTime(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function sessionTypeLabel(type) {
    if (type === 'one-on-one') return <span title="1-on-1" className="inline-block mr-2">👤</span>;
    if (type === 'interview') return <span title="Interview" className="inline-block mr-2">🎤</span>;
    if (type === 'gd') return <span title="Group Discussion" className="inline-block mr-2">👥</span>;
    return null;
  }

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
          value="2025-2026"
          onChange={(e) => e.preventDefault()}
        >
          <option>2025-2026</option>
        </select>
      </div>

      <p className="text-sm text-gray-700 mb-4">
        {totalContributions} Contributions this year
      </p>

      <div className="overflow-x-auto hide-scrollbar">
        <div className="flex gap-4">
          {MONTHS.map((month, idx) => {
            const { name, year, days } = month;
            const firstDay = new Date(
              year,
              MONTHS.findIndex((m) => m.name === name && m.year === year),
              1
            ).getDay();
            const weeks = Math.ceil((firstDay + days) / 7);

            const grid = Array(7)
              .fill()
              .map(() => Array(weeks).fill(null));

            for (let day = 1; day <= days; day++) {
              const dayIndex = (firstDay + day - 1) % 7;
              const weekIndex = Math.floor((firstDay + day - 1) / 7);
              grid[dayIndex][weekIndex] = day;
            }

            const boxClass = "w-3 h-2 rounded-none"; // ✅ perfect square: 12x12px

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
                          MONTHS.findIndex((m) => m.name === name && m.year === year) + 1
                        ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

                        const count = contributions[dateStr] || 0;

                        return (
                          <div
                            key={colIndex}
                            className={`${boxClass} ${getContributionColor(
                              count
                            )} hover:border hover:border-blue-300 transition cursor-pointer`}
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
    <div className="min-h-screen bg-blue-50 pt-24 p-8 md:p-12">
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
            <button className="flex items-center gap-3 text-sm text-gray-700 hover:bg-blue-100 p-3 rounded-md">
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
          {renderContributionCalendar()}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8">
            <h3 className="text-xl font-semibold text-blue-900 mb-6">Your Daily History</h3>
            {loading ? (
              <div className="text-gray-700 text-sm">Loading...</div>
            ) : error ? (
              <div className="text-red-600 text-sm">{error}</div>
            ) : history.length === 0 ? (
              <div className="text-gray-700 text-sm">No history found.</div>
            ) : (
              <ul className="space-y-10">
                {history.map((entry, idx) => (
                  <li key={idx} className="bg-blue-50 rounded-lg p-6 shadow border border-blue-100">
                    <div className="font-semibold text-blue-900 mb-3 text-lg">{entry.date}</div>
                    <ul className="space-y-4">
                      {entry.sessions.map((s, i) => (
                        <li key={i} className="flex items-start gap-4">
                          <div className="pt-1">{sessionTypeLabel(s.type)}</div>
                          <div className="flex-1">
                            <div className="font-medium text-blue-900 text-base">
                              {s.type === 'gd' ? (
                                <>Group Discussion with {Array.isArray(s.with) ? s.with.join(', ') : s.with}</>
                              ) : (
                                <>
                                  {s.type === 'one-on-one' ? '1-on-1 with ' : 'Interview with '}
                                  {s.with}
                                </>
                              )}
                            </div>
                            <div className="text-gray-700 text-sm mt-2">
                              <span className="inline-block mr-5">🕒 {formatTime(s.when)} ({s.duration} min)</span>
                              <span className="inline-block mr-5">💳 {s.credits} credits</span>
                              {s.subject && <span className="inline-block mr-5">📚 {s.subject}</span>}
                              {s.topic && <span className="inline-block mr-5">🔖 {s.topic}</span>}
                              {s.subtopic && <span className="inline-block mr-5">📌 {s.subtopic}</span>}
                              {typeof s.rating === 'number' && <span className="inline-block">⭐ {s.rating}</span>}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
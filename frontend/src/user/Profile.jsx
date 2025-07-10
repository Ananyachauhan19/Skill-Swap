import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { fetchSilverCoinBalance, fetchGoldenCoinBalance } from './settings/CoinBalance.jsx';
import SidebarCard from './myprofile/SidebarCard';
import CoinsBadges from './myprofile/CoinsBadges';
import AboutSection from './myprofile/AboutSection';
import UserInfoSection from './myprofile/UserInfoSection';
import SocialLinksSection from './myprofile/SocialLinksSection';
import ContributionCalendar from './myprofile/ContributionCalendar';

// --- Backend API to fetch user profile ---
const fetchUserProfile = async () => {
  // Simulate backend response with static data for now
  try {
    // Static user profile data
    const staticProfile = {
      fullName: 'John Doe',
      email: localStorage.getItem('registeredEmail') || 'john.doe@example.com',
      userId: 'john_doe123',
      profilePic: 'https://placehold.co/100x100?text=JD',
      profilePicPreview: 'https://placehold.co/100x100?text=JD',
      bio: 'Passionate developer and lifelong learner.',
      country: 'United States',
      education: [{ course: 'B.Tech', branch: 'Computer Science', college: 'XYZ University', city: 'New York', passingYear: '2020' }],
      teachSkills: ['React', 'Node.js'],
      learnSkills: ['Python', 'AI'],
      experience: [{ company: 'Tech Corp', role: 'Frontend Developer', years: '2020-2023' }],
      certificates: ['AWS Certified Developer'],
      linkedin: 'https://linkedin.com/in/johndoe',
      website: 'https://johndoe.com',
      github: 'https://github.com/johndoe',
      twitter: 'https://twitter.com/johndoe',
      credits: 1200,
      goldCoins: 0,
      badges: ['Starter', 'Helper'],
      rank: 'Bronze',
    };
    return staticProfile;
  } catch {
    throw new Error('Failed to fetch user profile');
  }
  // Uncomment for actual backend integration
  /*
  const res = await fetch('/api/user/profile');
  if (!res.ok) throw new Error('Failed to fetch user profile');
  return res.json();
  */
};

// --- Backend API to update user profile ---
const updateUserProfile = async (profile) => {
  // Simulate backend update with static response for now
  try {
    // Return updated profile as-is
    return profile;
  } catch {
    throw new Error('Failed to update user profile');
  }
  // Uncomment for actual backend integration
  /*
  const res = await fetch('/api/user/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error('Failed to update user profile');
  return res.json();
  */
};

// --- Backend API to upload profile picture ---
const uploadProfilePic = async (file) => {
  // Simulate backend upload with static URL for now
  try {
    // Mock URL for uploaded image
    const mockUrl = 'https://placehold.co/100x100?text=NewPic';
    return { url: mockUrl };
  } catch {
    throw new Error('Failed to upload profile picture');
  }
  // Uncomment for actual backend integration
  /*
  const formData = new FormData();
  formData.append('profilePic', file);
  const res = await fetch('/api/user/profile/picture', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload profile picture');
  return res.json();
  */
};

// --- Function to fetch user history ---
async function fetchUserHistory() {
  // Simulate backend response with static history data for now
  try {
    // Static history data
    const staticHistory = [
      { date: '2025-07-09', sessions: ['React Workshop', 'Node.js Q&A'] },
      { date: '2025-07-08', sessions: ['JavaScript Basics'] },
    ];
    return staticHistory;
  } catch {
    throw new Error('Failed to fetch history');
  }
  // Uncomment for actual backend integration
  /*
  const response = await fetch('/history');
  if (!response.ok) throw new Error('Failed to fetch history');
  const data = await response.json();
  return data;
  */
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
    goldCoins: 0,
    badges: ['Starter', 'Helper'],
    rank: 'Bronze',
  });
  const [originalProfile, setOriginalProfile] = useState(null); // for cancel
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [contributions, setContributions] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [months, setMonths] = useState(generateMonths(new Date()));
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [silver, setSilver] = useState(0);
  const [gold, setGold] = useState(0);
  const [editingField, setEditingField] = useState(null);
  const [fieldDraft, setFieldDraft] = useState({}); // holds temporary edits for each field

  // --- Add new state for file uploads (proofs, certificates) ---
  const [teachProofs, setTeachProofs] = useState([]); // [{file, url}]
  const [certFiles, setCertFiles] = useState([]); // [{file, url}]

  // --- Fetch user profile from backend ---
  useEffect(() => {
    setLoading(true);
    fetchUserProfile()
      .then((user) => {
        // Ensure email is set from register/login info
        let email = user.email;
        if (!email) {
          email = localStorage.getItem('registeredEmail') || '';
        }
        setProfile({ ...user, email });
        setOriginalProfile(user ? { ...user, email } : null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
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

  // --- Profile Picture Change ---
  const handleProfilePicChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (e.g., JPG, PNG).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB.');
      return;
    }
    try {
      setLoading(true);
      const previewUrl = URL.createObjectURL(file); // Immediate preview
      setProfile((prev) => ({ ...prev, profilePicPreview: previewUrl }));
      const result = await uploadProfilePic(file);
      setProfile((prev) => ({
        ...prev,
        profilePic: result.url,
        profilePicPreview: result.url,
      }));
      setOriginalProfile((prev) => ({
        ...prev,
        profilePic: result.url,
        profilePicPreview: result.url,
      }));
      toast.success('Profile picture updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to upload profile picture.');
      setProfile((prev) => ({ ...prev, profilePicPreview: prev.profilePic })); // Revert preview
    } finally {
      setLoading(false);
    }
  };

  // --- Edit Mode Controls ---
  const handleEditProfile = () => {
    setOriginalProfile({ ...profile });
    setEditMode(true);
  };
  const handleCancelEdit = () => {
    setProfile({ ...originalProfile });
    setEditMode(false);
  };
  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const updated = await updateUserProfile(profile);
      setProfile(updated);
      setEditMode(false);
      setOriginalProfile({ ...updated });
      window.dispatchEvent(new Event('profileUpdated'));
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Per-field Edit Handlers ---
  const startEdit = (field) => {
    setEditingField(field);
    setFieldDraft({ ...profile });
  };
  const cancelEdit = () => {
    setEditingField(null);
    setFieldDraft({});
  };
  const saveEdit = (field) => {
    if (field === 'links') {
      setProfile(prev => ({
        ...prev,
        linkedin: fieldDraft.linkedin,
        github: fieldDraft.github,
        twitter: fieldDraft.twitter,
        website: fieldDraft.website,
      }));
      setEditingField(null);
      setFieldDraft({});
      setTimeout(() => {
        localStorage.setItem('user', JSON.stringify({
          ...profile,
          linkedin: fieldDraft.linkedin,
          github: fieldDraft.github,
          twitter: fieldDraft.twitter,
          website: fieldDraft.website,
        }));
        window.dispatchEvent(new Event('profileUpdated'));
      }, 0);
    } else if (field === 'education') {
      setProfile(prev => ({
        ...prev,
        education: [
          {
            course: fieldDraft.course || '',
            branch: fieldDraft.branch || '',
            college: fieldDraft.college || '',
            city: fieldDraft.city || '',
            passingYear: fieldDraft.passingYear || '',
          },
          ...prev.education.filter((_, i) => i !== 0), // Preserve other entries
        ],
      }));
      setEditingField(null);
      setFieldDraft({});
      setTimeout(() => {
        localStorage.setItem('user', JSON.stringify({
          ...profile,
          education: [
            {
              course: fieldDraft.course || '',
              branch: fieldDraft.branch || '',
              college: fieldDraft.college || '',
              city: fieldDraft.city || '',
              passingYear: fieldDraft.passingYear || '',
            },
            ...profile.education.filter((_, i) => i !== 0),
          ],
        }));
        window.dispatchEvent(new Event('profileUpdated'));
      }, 0);
    } else {
      setProfile(prev => ({ ...prev, [field]: fieldDraft[field] }));
      setEditingField(null);
      setFieldDraft({});
      setTimeout(() => {
        localStorage.setItem('user', JSON.stringify({ ...profile, [field]: fieldDraft[field] }));
        window.dispatchEvent(new Event('profileUpdated'));
      }, 0);
    }
  };

  // --- Array Field Handlers ---
  const handleArrayChange = (field, idx, value, subfield) => {
    setProfile(prev => {
      const arr = [...(prev[field] || [])];
      if (subfield) {
        arr[idx] = { ...arr[idx], [subfield]: value };
      } else {
        arr[idx] = value;
      }
      return { ...prev, [field]: arr };
    });
  };
  const handleArrayAdd = (field, template = '') => {
    setProfile(prev => ({ ...prev, [field]: [...(prev[field] || []), template] }));
  };
  const handleArrayRemove = (field, idx) => {
    setProfile(prev => {
      const arr = [...(prev[field] || [])];
      arr.splice(idx, 1);
      return { ...prev, [field]: arr };
    });
  };

  // --- Handler for uploading proof in teachSkills ---
  const handleTeachProofUpload = (idx, file) => {
    const url = URL.createObjectURL(file);
    setTeachProofs(prev => {
      const arr = [...prev];
      arr[idx] = { file, url };
      return arr;
    });
  };
  // --- Handler for uploading certificate file ---
  const handleCertFileUpload = (idx, file) => {
    const url = URL.createObjectURL(file);
    setCertFiles(prev => {
      const arr = [...prev];
      arr[idx] = { file, url };
      return arr;
    });
  };

  // --- Helper to get best available name ---
  const getDisplayName = () => {
    if (profile.fullName && profile.fullName.trim() !== '') return profile.fullName;
    let user = null;
    try { user = JSON.parse(localStorage.getItem('user')); } catch {}
    if (user && user.fullName && user.fullName.trim() !== '') return user.fullName;
    const regName = localStorage.getItem('registeredName') || '';
    if (regName && regName.trim() !== '') return regName;
    let googleUser = null, linkedinUser = null;
    try { googleUser = JSON.parse(localStorage.getItem('googleUser')); } catch {}
    try { linkedinUser = JSON.parse(localStorage.getItem('linkedinUser')); } catch {}
    if (googleUser && googleUser.name && googleUser.name.trim() !== '') return googleUser.name;
    if (linkedinUser && linkedinUser.name && linkedinUser.name.trim() !== '') return linkedinUser.name;
    return '';
  };

  // --- Helper to get best available userId ---
  const getDisplayUserId = () => {
    if (profile.userId && profile.userId.trim() !== '') return profile.userId;
    let user = null;
    try { user = JSON.parse(localStorage.getItem('user')); } catch {}
    if (user && user.userId) return user.userId;
    return '';
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

  // Handler to update profile in backend and state
  const handleSectionSave = async (updatedProfile) => {
    setLoading(true);
    try {
      const updated = await updateUserProfile(updatedProfile);
      setProfile(updated);
      setOriginalProfile({ ...updated });
      window.dispatchEvent(new Event('profileUpdated'));
      toast.success('Profile section updated successfully!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Main Render ---
  return (
    <div className={`min-h-screen bg-blue-50 pt-24 px-2 sm:px-4 md:px-8 lg:px-12 py-8 ${editMode ? 'edit-mode-bg' : ''}`}>
      <Toaster position="top-center" />
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Sidebar/Profile Card */}
        <SidebarCard
          profile={profile}
          editingField={editingField}
          fieldDraft={fieldDraft}
          setFieldDraft={setFieldDraft}
          startEdit={startEdit}
          saveEdit={saveEdit}
          cancelEdit={cancelEdit}
          handleProfilePicChange={handleProfilePicChange}
          handleEditProfile={handleEditProfile}
          handleSaveProfile={handleSaveProfile}
          handleCancelEdit={handleCancelEdit}
          editMode={editMode}
          handleArrayChange={handleArrayChange}
          handleArrayAdd={handleArrayAdd}
          handleArrayRemove={handleArrayRemove}
          onSaveEdit={handleSectionSave}
        />
        {/* Main Content */}
        <div className="w-full md:w-3/4 flex flex-col gap-8">
          <CoinsBadges silver={silver} gold={gold} profile={profile} />
          <AboutSection
            profile={profile}
            editingField={editingField}
            fieldDraft={fieldDraft}
            setFieldDraft={setFieldDraft}
            startEdit={startEdit}
            saveEdit={saveEdit}
            cancelEdit={cancelEdit}
            onSaveEdit={handleSectionSave}
          />
          <UserInfoSection
            profile={profile}
            editingField={editingField}
            fieldDraft={fieldDraft}
            startEdit={startEdit}
            saveEdit={saveEdit}
            cancelEdit={cancelEdit}
            handleArrayChange={handleArrayChange}
            handleArrayAdd={handleArrayAdd}
            handleArrayRemove={handleArrayRemove}
            handleTeachProofUpload={handleTeachProofUpload}
            handleCertFileUpload={handleCertFileUpload}
            teachProofs={teachProofs}
            certFiles={certFiles}
            onSaveEdit={handleSectionSave}
          />
          <SocialLinksSection
            profile={profile}
            editingField={editingField}
            fieldDraft={fieldDraft}
            setFieldDraft={setFieldDraft}
            startEdit={startEdit}
            saveEdit={saveEdit}
            cancelEdit={cancelEdit}
            onSaveEdit={handleSectionSave}
          />
          <ContributionCalendar
            contributions={contributions}
            months={months}
            currentDate={currentDate}
            getContributionColor={getContributionColor}
          />
        </div>
      </div>
    </div>
  );
};

export default Profile;
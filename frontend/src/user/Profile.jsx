/* eslint-disable no-undef */
/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { fetchSilverCoinBalance, fetchGoldenCoinBalance } from './settings/CoinBalance.jsx';
import SidebarCard from './myprofile/SidebarCard';
import CoinsBadges from './myprofile/CoinsBadges';
import AboutSection from './myprofile/AboutSection';
import UserInfoSection from './myprofile/UserInfoSection';
import SocialLinksSection from './myprofile/SocialLinksSection';
import { BACKEND_URL } from '../config.js';

// --- Backend API to fetch user profile ---
const fetchUserProfile = async () => {
  const res = await fetch(`${BACKEND_URL}/api/auth/user/profile`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch user profile');
  const user = await res.json();
  
  // Map backend fields to frontend format
  return {
    fullName: user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.firstName || user.username || '',
    userId: user.username || user._id || '',
    email: user.email || '',
    profilePic: user.profilePic || null,
    profilePicPreview: user.profilePic || null,
    bio: user.bio || '',
    country: user.country || '',
    education: user.education || [],
    teachSkills: user.skillsToTeach || [],
    experience: user.experience || [],
    certificates: user.certificates || [],
    linkedin: user.linkedin || '',
    website: user.website || '',
    github: user.github || '',
    twitter: user.twitter || '',
    credits: user.credits || 1200,
    goldCoins: user.goldCoins || 0,
    badges: user.badges || ['Starter', 'Helper'],
    rank: user.rank || 'Bronze',
    // Keep backend fields for compatibility
    firstName: user.firstName,
    lastName: user.lastName,
    skillsToTeach: user.skillsToTeach || [],
  };
};

// --- Backend API to update user profile ---
const updateUserProfile = async (profile) => {
  try {
    // Map frontend profile fields to backend fields
    const backendData = {
      firstName: profile.fullName ? profile.fullName.split(' ')[0] : '',
      lastName: profile.fullName ? profile.fullName.split(' ').slice(1).join(' ') : '',
      bio: profile.bio || '',
      country: profile.country || '',
      profilePic: profile.profilePic || '',
      education: profile.education || [],
      experience: profile.experience || [],
      certificates: profile.certificates || [],
      linkedin: profile.linkedin || '',
      website: profile.website || '',
      github: profile.github || '',
      twitter: profile.twitter || '',
      skillsToTeach: profile.skillsToTeach || profile.teachSkills || [],
      credits: profile.credits || 1200,
      goldCoins: profile.goldCoins || 0,
      silverCoins: profile.silver || 0,
      badges: profile.badges || ['Starter', 'Helper'],
      rank: profile.rank || 'Bronze'
    };

    console.log('Sending profile update to backend:', {
      skillsToTeach: backendData.skillsToTeach,
    });

    const res = await fetch(`${BACKEND_URL}/api/auth/user/profile`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendData),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to update user profile');
    }
    
    const updatedUser = await res.json();
    
    console.log('Received updated user from backend:', {
      skillsToTeach: updatedUser.skillsToTeach,
    });
    
    // Transform backend response back to frontend format
    return {
      ...profile,
      fullName: updatedUser.firstName && updatedUser.lastName 
        ? `${updatedUser.firstName} ${updatedUser.lastName}` 
        : updatedUser.firstName || profile.fullName,
      bio: updatedUser.bio || profile.bio,
      country: updatedUser.country || profile.country,
      profilePic: updatedUser.profilePic || profile.profilePic,
      education: updatedUser.education || profile.education,
      experience: updatedUser.experience || profile.experience,
      certificates: updatedUser.certificates || profile.certificates,
      linkedin: updatedUser.linkedin || profile.linkedin,
      website: updatedUser.website || profile.website,
      github: updatedUser.github || profile.github,
      twitter: updatedUser.twitter || profile.twitter,
      skillsToTeach: updatedUser.skillsToTeach || profile.skillsToTeach,
      credits: updatedUser.credits || profile.credits,
      goldCoins: updatedUser.goldCoins || profile.goldCoins,
      badges: updatedUser.badges || profile.badges,
      rank: updatedUser.rank || profile.rank
    };
  } catch (error) {
    console.error('Profile update error:', error);
    throw new Error('Failed to update user profile');
  }
};

// --- Backend API to upload profile picture ---
const uploadProfilePic = async (file) => {
  try {
    const mockUrl = 'https://placehold.co/100x100?text=NewPic';
    return { url: mockUrl };
  } catch {
    throw new Error('Failed to upload profile picture');
  }
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
    skillsToTeach: [],
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
  const [originalProfile, setOriginalProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [silver, setSilver] = useState(0);
  const [gold, setGold] = useState(0);
  const [editingField, setEditingField] = useState(null);
  const [fieldDraft, setFieldDraft] = useState({});
  const [teachProofs, setTeachProofs] = useState([]);
  const [certFiles, setCertFiles] = useState([]);

  // --- Fetch user profile from backend ---
  useEffect(() => {
    setLoading(true);
    fetchUserProfile()
      .then((user) => {
        setProfile(user);
        setOriginalProfile(user);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

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
      const previewUrl = URL.createObjectURL(file);
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
      setProfile((prev) => ({ ...prev, profilePicPreview: prev.profilePic }));
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
    setProfile(prev => ({ ...prev, [field]: fieldDraft[field] }));
    setEditingField(null);
    setFieldDraft({});
    setTimeout(() => {
      localStorage.setItem('user', JSON.stringify({ ...profile, [field]: fieldDraft[field] }));
      window.dispatchEvent(new Event('profileUpdated'));
    }, 0);
  };

  // --- Array Field Handlers ---
  const handleArrayChange = (field, idx, value, subfield) => {
    if (editingField === 'userInfo') {
      // When editing UserInfoSection, update fieldDraft
      setFieldDraft(prev => {
        const arr = [...(prev[field] || [])];
        if (subfield) {
          arr[idx] = { ...arr[idx], [subfield]: value };
        } else {
          arr[idx] = value;
        }
        return { ...prev, [field]: arr };
      });
    } else {
      // Otherwise update main profile state
      setProfile(prev => {
        const arr = [...(prev[field] || [])];
        if (subfield) {
          arr[idx] = { ...arr[idx], [subfield]: value };
        } else {
          arr[idx] = value;
        }
        return { ...prev, [field]: arr };
      });
    }
  };
  const handleArrayAdd = (field, template = '') => {
    if (editingField === 'userInfo') {
      // When editing UserInfoSection, update fieldDraft
      setFieldDraft(prev => ({ ...prev, [field]: [...(prev[field] || []), template] }));
    } else {
      // Otherwise update main profile state
      setProfile(prev => ({ ...prev, [field]: [...(prev[field] || []), template] }));
    }
  };
  const handleArrayRemove = (field, idx) => {
    if (editingField === 'userInfo') {
      // When editing UserInfoSection, update fieldDraft
      setFieldDraft(prev => {
        const arr = [...(prev[field] || [])];
        arr.splice(idx, 1);
        return { ...prev, [field]: arr };
      });
    } else {
      // Otherwise update main profile state
      setProfile(prev => {
        const arr = [...(prev[field] || [])];
        arr.splice(idx, 1);
        return { ...prev, [field]: arr };
      });
    }
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
        </div>
      </div>
    </div>
  );
};

export default Profile;
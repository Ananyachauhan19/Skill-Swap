import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { fetchSilverCoinBalance, fetchGoldenCoinBalance } from './settings/CoinBalance.jsx';
import SidebarCard from './myprofile/SidebarCard';
import CoinsBadges from './myprofile/CoinsBadges';
import AboutSection from './myprofile/AboutSection';
import UserInfoSection from './myprofile/UserInfoSection';
import SocialLinksSection from './myprofile/SocialLinksSection';
import { BACKEND_URL } from '../config.js';

// Fetch user profile from backend
const fetchUserProfile = async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/user/profile`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to fetch user profile');
    }
    const user = await res.json();

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
      experience: user.experience || [],
      skillsToTeach: user.skillsToTeach || [],
      skillsToLearn: user.skillsToLearn || [],
      certificates: user.certificates || [],
      linkedin: user.linkedin || '',
      website: user.website || '',
      github: user.github || '',
      twitter: user.twitter || '',
      credits: user.credits || 1200,
      goldCoins: user.goldCoins || 0,
      silverCoins: user.silverCoins || 0,
      badges: user.badges || ['Starter', 'Helper'],
      rank: user.rank || 'Bronze',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
    };
  } catch (err) {
    throw err;
  }
};

// Update user profile
const updateUserProfile = async (profile) => {
  try {
    const backendData = {
      firstName: profile.firstName || (profile.fullName ? profile.fullName.split(' ')[0] : ''),
      lastName: profile.lastName || (profile.fullName ? profile.fullName.split(' ').slice(1).join(' ') : ''),
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
      skillsToTeach: profile.skillsToTeach || [],
      skillsToLearn: profile.skillsToLearn || [],
      credits: profile.credits || 1200,
      goldCoins: profile.goldCoins || 0,
      silverCoins: profile.silverCoins || 0,
      badges: profile.badges || ['Starter', 'Helper'],
      rank: profile.rank || 'Bronze',
      username: profile.userId || '',
    };

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

    return {
      fullName: updatedUser.firstName && updatedUser.lastName 
        ? `${updatedUser.firstName} ${updatedUser.lastName}` 
        : updatedUser.firstName || updatedUser.username || '',
      userId: updatedUser.username || updatedUser._id || '',
      email: updatedUser.email || '',
      profilePic: updatedUser.profilePic || null,
      profilePicPreview: updatedUser.profilePic || null,
      bio: updatedUser.bio || '',
      country: updatedUser.country || '',
      education: updatedUser.education || [],
      experience: updatedUser.experience || [],
      skillsToTeach: updatedUser.skillsToTeach || [],
      skillsToLearn: updatedUser.skillsToLearn || [],
      certificates: updatedUser.certificates || [],
      linkedin: updatedUser.linkedin || '',
      website: updatedUser.website || '',
      github: updatedUser.github || '',
      twitter: updatedUser.twitter || '',
      credits: updatedUser.credits || 1200,
      goldCoins: updatedUser.goldCoins || 0,
      silverCoins: updatedUser.silverCoins || 0,
      badges: updatedUser.badges || ['Starter', 'Helper'],
      rank: updatedUser.rank || 'Bronze',
      firstName: updatedUser.firstName || '',
      lastName: updatedUser.lastName || '',
    };
  } catch (error) {
    throw error;
  }
};

// Upload profile picture
const uploadProfilePic = async (file) => {
  try {
    const mockUrl = 'https://placehold.co/100x100?text=NewPic';
    return { url: mockUrl };
  } catch {
    throw new Error('Failed to upload profile picture');
  }
};

const Profile = () => {
  const [profile, setProfile] = useState({
    fullName: '',
    userId: '',
    email: '',
    profilePic: null,
    profilePicPreview: null,
    bio: '',
    country: '',
    education: [],
    experience: [],
    skillsToTeach: [],
    skillsToLearn: [],
    certificates: [],
    linkedin: '',
    website: '',
    github: '',
    twitter: '',
    credits: 1200,
    goldCoins: 0,
    silverCoins: 0,
    badges: ['Starter', 'Helper'],
    rank: 'Bronze',
    firstName: '',
    lastName: '',
  });
  const [originalProfile, setOriginalProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [silver, setSilver] = useState(0);
  const [gold, setGold] = useState(0);
  const [editingField, setEditingField] = useState(null);
  const [fieldDraft, setFieldDraft] = useState({});

  // Fetch user profile
  useEffect(() => {
    setLoading(true);
    fetchUserProfile()
      .then((user) => {
        setProfile(user);
        setOriginalProfile(user);
      })
      .catch((err) => {
        setError(err.message);
        toast.error(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch coins
  useEffect(() => {
    async function loadCoins() {
      try {
        const silverData = await fetchSilverCoinBalance();
        setSilver(silverData.silver || 0);
        const goldData = await fetchGoldenCoinBalance();
        setGold(goldData.gold || 0);
      } catch (err) {
        console.error('Error loading coins:', err.message);
      }
    }
    loadCoins();
  }, []);

  // Profile picture change
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

  // Edit mode controls
  const handleEditProfile = () => {
    setOriginalProfile({ ...profile });
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setProfile({ ...originalProfile });
    setEditMode(false);
    setEditingField(null);
    setFieldDraft({});
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const updated = await updateUserProfile(profile);
      setProfile(updated);
      setOriginalProfile(updated);
      setEditMode(false);
      window.dispatchEvent(new Event('profileUpdated'));
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Per-field edit handlers
  const startEdit = (field) => {
    setEditingField(field);
    setFieldDraft({ ...profile });
  };

  const cancelEdit = () => {
    setEditingField(null);
    setFieldDraft({});
  };

  const saveEdit = async (field) => {
    try {
      setProfile((prev) => ({ ...prev, [field]: fieldDraft[field] }));
      const updated = await updateUserProfile({ ...profile, [field]: fieldDraft[field] });
      setProfile(updated);
      setOriginalProfile(updated);
      setEditingField(null);
      setFieldDraft({});
      window.dispatchEvent(new Event('profileUpdated'));
      toast.success('Profile section updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile section');
    }
  };

  // Array field handlers
  const handleArrayChange = (field, idx, value, subfield) => {
    if (editingField) {
      setFieldDraft((prev) => {
        const arr = [...(prev[field] || [])];
        if (subfield) {
          arr[idx] = { ...arr[idx], [subfield]: value };
        } else {
          arr[idx] = value;
        }
        return { ...prev, [field]: arr };
      });
    } else {
      setProfile((prev) => {
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

  const handleArrayAdd = (field, template = {}) => {
    if (editingField) {
      setFieldDraft((prev) => ({
        ...prev,
        [field]: [...(prev[field] || []), template],
      }));
    } else {
      setProfile((prev) => ({
        ...prev,
        [field]: [...(prev[field] || []), template],
      }));
    }
  };

  const handleArrayRemove = (field, idx) => {
    if (editingField) {
      setFieldDraft((prev) => {
        const arr = [...(prev[field] || [])];
        arr.splice(idx, 1);
        return { ...prev, [field]: arr };
      });
    } else {
      setProfile((prev) => {
        const arr = [...(prev[field] || [])];
        arr.splice(idx, 1);
        return { ...prev, [field]: arr };
      });
    }
  };

  // Section save handler
  const handleSectionSave = async (updatedProfile) => {
    setLoading(true);
    try {
      const updated = await updateUserProfile(updatedProfile);
      setProfile(updated);
      setOriginalProfile(updated);
      window.dispatchEvent(new Event('profileUpdated'));
      toast.success('Profile section updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile section');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-blue-50 pt-24 px-2 sm:px-4 md:px-8 lg:px-12 py-8 ${editMode ? 'edit-mode-bg' : ''}`}>
      <Toaster position="top-center" />
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
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
import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import SidebarCard from './myprofile/SidebarCard';
import CoinsBadges from './myprofile/CoinsBadges';
import AboutSection from './myprofile/AboutSection';
import UserInfoSection from './myprofile/UserInfoSection';
import SocialLinksSection from './myprofile/SocialLinksSection';
import { BACKEND_URL } from '../config.js';
import socket from '../socket.js';

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
      _id: user._id || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      fullName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || user.username || '',
      userId: user.username || '',
      email: user.email || '',
      profileImageUrl: user.profileImageUrl || user.profilePic || '',
      profilePic: user.profilePic || user.profileImageUrl || '',
      profilePicPreview: user.profileImageUrl || user.profilePic || '',
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
      bronzeCoins: user.bronzeCoins || 0,
      badges: user.badges || ['Starter', 'Helper'],
      rank: user.rank || 'Bronze',
    };
  } catch (err) {
    throw err;
  }
};

// Update user profile
const updateUserProfile = async (profile) => {
  try {
    // Sanitize array fields to remove _id
    const sanitizeArray = (arr, validKeys) => {
      return arr.map(item => {
        const sanitized = {};
        validKeys.forEach(key => {
          if (item[key] !== undefined) {
            sanitized[key] = item[key];
          }
        });
        return sanitized;
      });
    };

    const backendData = {
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      bio: profile.bio || '',
      country: profile.country || '',
      profilePic: profile.profilePic || '',
      education: profile.education ? sanitizeArray(profile.education, ['course', 'branch', 'college', 'city', 'passingYear']) : [],
      experience: profile.experience ? sanitizeArray(profile.experience, ['company', 'position', 'duration', 'description']) : [],
      certificates: profile.certificates ? sanitizeArray(profile.certificates, ['name', 'issuer', 'date', 'url']) : [],
      linkedin: profile.linkedin || '',
      website: profile.website || '',
      github: profile.github || '',
      twitter: profile.twitter || '',
      skillsToTeach: profile.skillsToTeach || [],
      skillsToLearn: profile.skillsToLearn || [],
      credits: profile.credits || 1200,
      goldCoins: profile.goldCoins || 0,
      silverCoins: profile.silverCoins || 0,
      bronzeCoins: profile.bronzeCoins || 0,
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
      _id: updatedUser._id || '',
      firstName: updatedUser.firstName || '',
      lastName: updatedUser.lastName || '',
      fullName: updatedUser.firstName && updatedUser.lastName 
        ? `${updatedUser.firstName} ${updatedUser.lastName}` 
        : updatedUser.firstName || updatedUser.username || '',
      userId: updatedUser.username || '',
      email: updatedUser.email || '',
      profileImageUrl: updatedUser.profileImageUrl || updatedUser.profilePic || '',
      profilePic: updatedUser.profilePic || updatedUser.profileImageUrl || '',
      profilePicPreview: updatedUser.profileImageUrl || updatedUser.profilePic || '',
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
      bronzeCoins: updatedUser.bronzeCoins || 0,
      badges: updatedUser.badges || ['Starter', 'Helper'],
      rank: updatedUser.rank || 'Bronze',
    };
  } catch (error) {
    throw error;
  }
};

// Upload profile picture
// Cloudinary-backed profile photo upload
const uploadProfilePic = async (file) => {
  const form = new FormData();
  form.append('image', file);
  const resp = await fetch(`${BACKEND_URL}/api/user/profile-photo`, {
    method: 'PATCH',
    credentials: 'include',
    body: form,
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.message || 'Failed to upload profile picture');
  return { url: data.profileImageUrl };
};

const Profile = () => {
  const [profile, setProfile] = useState({
    _id: '',
    firstName: '',
    lastName: '',
    fullName: '',
    userId: '',
    email: '',
    profilePic: '',
    profilePicPreview: '',
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
    bronzeCoins: 0,
    badges: ['Starter', 'Helper'],
    rank: 'Bronze',
  });
  const [originalProfile, setOriginalProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [silver, setSilver] = useState(0);
  const [gold, setGold] = useState(0);
  const [bronze, setBronze] = useState(0);
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
        const response = await fetch(`${BACKEND_URL}/api/auth/coins`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch coin balances');
        }
        const data = await response.json();
        setSilver(data.silver || 0);
        setGold(data.golden || 0);
        setBronze(data.bronze || 0);
      } catch (err) {
        console.error('Error loading coins:', err.message);
        toast.error('Failed to fetch coin balances.');
      }
    }
    loadCoins();

    // Listen for real-time coin updates
    socket.on('coin-update', (data) => {
      if (typeof data.silverCoins === 'number') {
        setSilver(data.silverCoins);
      }
      if (typeof data.goldCoins === 'number') {
        setGold(data.goldCoins);
      }
      if (typeof data.bronzeCoins === 'number') {
        setBronze(data.bronzeCoins);
      }
    });

    // Cleanup socket listener on unmount
    return () => {
      socket.off('coin-update');
    };
  }, []);

  // Profile picture change
  const handleProfilePicChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (e.g., JPG, PNG).');
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      toast.error('Image size must be less than 1MB.');
      return;
    }
    try {
      setLoading(true);
      const previewUrl = URL.createObjectURL(file);
      setProfile((prev) => ({ ...prev, profilePicPreview: previewUrl }));
      const result = await uploadProfilePic(file);
      const updatedProfile = { ...profile, profilePic: result.url, profileImageUrl: result.url, profilePicPreview: result.url };
      const updated = await updateUserProfile(updatedProfile);
      setProfile(updated);
      setOriginalProfile(updated);
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
      setEditingField(null);
      setFieldDraft({});
      window.dispatchEvent(new Event('profileUpdated'));
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
      setProfile({ ...originalProfile });
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
    setProfile({ ...originalProfile });
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
      setProfile({ ...originalProfile });
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
      setEditingField(null);
      setFieldDraft({});
      window.dispatchEvent(new Event('profileUpdated'));
      toast.success('Profile section updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile section');
      setProfile({ ...originalProfile });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-blue-50 pt-16 sm:pt-20 px-2 sm:px-4 md:px-8 lg:px-12 pb-8 ${editMode ? 'edit-mode-bg' : ''}`}>
      <Toaster position="top-center" />
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
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
        <div className="7xl md:w-3/4 flex flex-col gap-8">
          <CoinsBadges silver={silver} gold={gold} bronze={bronze} profile={profile} />
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
import React, { useState, useEffect } from "react";
import toast, { Toaster } from 'react-hot-toast';
import countryList from 'react-select-country-list';

const Edit_Profile = () => {
  // Unified profile state
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    userId: "USR" + Math.random().toString(36).substr(2, 9).toUpperCase(),
    profilePic: null,
    profilePicPreview: null,
    bio: "",
    country: "",
    education: [],
    teachSkills: [],
    learnSkills: [],
    experience: [],
    certificates: [],
    linkedin: "",
    website: "",
    github: "",
    twitter: "",
    credits: 1200,
    badges: ["Starter", "Helper"],
    rank: "Bronze"
  });

  // Edit states for each section
  const [editBio, setEditBio] = useState(false);
  const [editCountry, setEditCountry] = useState(false);
  const [editEducation, setEditEducation] = useState(false);
  const [editTeach, setEditTeach] = useState(false);
  const [editLearn, setEditLearn] = useState(false);
  const [editExperience, setEditExperience] = useState(false);
  const [editCertificates, setEditCertificates] = useState(false);
  const [editLinkedin, setEditLinkedin] = useState(false);
  const [editWebsite, setEditWebsite] = useState(false);
  const [editGithub, setEditGithub] = useState(false);
  const [editTwitter, setEditTwitter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingPic, setEditingPic] = useState(false);

  // Input states for adding new entries
  const [bioInput, setBioInput] = useState("");
  const [educationInput, setEducationInput] = useState({ degree: '', university: '', year: '', specialization: '' });
  const [teachSkillInput, setTeachSkillInput] = useState({ skill: '', proof: null, proofName: null });
  const [learnSkillInput, setLearnSkillInput] = useState("");
  const [experienceInput, setExperienceInput] = useState({ title: '', company: '', duration: '', description: '' });
  const [certificateInput, setCertificateInput] = useState({ name: '', issuer: '', year: '' });
  const [linkedinInput, setLinkedinInput] = useState("");
  const [websiteInput, setWebsiteInput] = useState("");
  const [githubInput, setGithubInput] = useState("");
  const [twitterInput, setTwitterInput] = useState("");
  const [nameInput, setNameInput] = useState(profile.fullName);

  // Fetch profile from backend on mount
  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      let user = null;
      try {
        user = JSON.parse(localStorage.getItem('user'));
      } catch {}
      setProfile(prev => ({
        ...prev,
        email: (user && user.email) || prev.email,
        profilePicPreview: user?.profilePicPreview || prev.profilePicPreview,
        bio: user?.bio || prev.bio,
        country: user?.country || prev.country,
        education: user?.education || prev.education,
        teachSkills: user?.teachSkills || prev.teachSkills,
        learnSkills: user?.learnSkills || prev.learnSkills,
        experience: user?.experience || prev.experience,
        certificates: user?.certificates || prev.certificates,
        linkedin: user?.linkedin || prev.linkedin,
        website: user?.website || prev.website,
        github: user?.github || prev.github,
        twitter: user?.twitter || prev.twitter,
        credits: user?.credits || prev.credits,
        badges: user?.badges || prev.badges,
        rank: user?.rank || prev.rank
      }));
      setLoading(false);
    }
    fetchProfile();
  }, []);

  // Save profile to backend
  const saveProfile = async () => {
    localStorage.setItem('user', JSON.stringify(profile));
    window.dispatchEvent(new Event('profileUpdated'));
    toast.success("Profile saved!", {
      style: {
        background: '#f0f9ff',
        color: '#1e3a8a',
        fontFamily: 'Nunito, sans-serif',
        border: '1px solid #bfdbfe'
      }
    });
  };

  // Profile Pic Handler
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfile(prev => ({ ...prev, profilePic: file, profilePicPreview: reader.result }));
      reader.readAsDataURL(file);
    } else {
      setProfile(prev => ({ ...prev, profilePic: null, profilePicPreview: null }));
    }
  };

  // Handlers for adding entries
  const handleAddBio = () => {
    if (bioInput.trim()) {
      setProfile(prev => ({ ...prev, bio: bioInput }));
      setBioInput("");
      setEditBio(false);
      saveProfile();
    }
  };

  const handleAddEducation = () => {
    if (educationInput.degree && educationInput.university) {
      const updated = {
        ...profile,
        education: [...profile.education, { ...educationInput }]
      };
      setProfile(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      window.dispatchEvent(new Event('profileUpdated'));
      setEducationInput({ degree: '', university: '', year: '', specialization: '' });
      setEditEducation(false);
      toast.success("Education added!", {
        style: {
          background: '#f0f9ff',
          color: '#1e3a8a',
          fontFamily: 'Nunito, sans-serif',
          border: '1px solid #bfdbfe'
        }
      });
    }
  };

  const handleAddTeachSkill = () => {
    if (teachSkillInput.skill.trim() && !profile.teachSkills.some(s => s.skill === teachSkillInput.skill.trim())) {
      const updated = {
        ...profile,
        teachSkills: [...profile.teachSkills, { ...teachSkillInput }]
      };
      setProfile(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      window.dispatchEvent(new Event('profileUpdated'));
      setTeachSkillInput({ skill: '', proof: null, proofName: null });
      setEditTeach(false);
      toast.success("Teaching skill added!", {
        style: {
          background: '#f0f9ff',
          color: '#1e3a8a',
          fontFamily: 'Nunito, sans-serif',
          border: '1px solid #bfdbfe'
        }
      });
    }
  };

  const handleAddLearnSkill = () => {
    if (learnSkillInput.trim() && !profile.learnSkills.includes(learnSkillInput.trim())) {
      setProfile(prev => ({ ...prev, learnSkills: [...prev.learnSkills, learnSkillInput.trim()] }));
      setLearnSkillInput("");
      setEditLearn(false);
      saveProfile();
    }
  };

  const handleAddExperience = () => {
    if (experienceInput.title && experienceInput.company) {
      const updated = {
        ...profile,
        experience: [...profile.experience, { ...experienceInput }]
      };
      setProfile(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      window.dispatchEvent(new Event('profileUpdated'));
      setExperienceInput({ title: '', company: '', duration: '', description: '' });
      setEditExperience(false);
      toast.success("Experience added!", {
        style: {
          background: '#f0f9ff',
          color: '#1e3a8a',
          fontFamily: 'Nunito, sans-serif',
          border: '1px solid #bfdbfe'
        }
      });
    }
  };

  const handleAddCertificate = () => {
    if (certificateInput.name && certificateInput.issuer) {
      const updated = {
        ...profile,
        certificates: [...profile.certificates, { ...certificateInput }]
      };
      setProfile(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      window.dispatchEvent(new Event('profileUpdated'));
      setCertificateInput({ name: '', issuer: '', year: '' });
      setEditCertificates(false);
      toast.success("Certificate added!", {
        style: {
          background: '#f0f9ff',
          color: '#1e3a8a',
          fontFamily: 'Nunito, sans-serif',
          border: '1px solid #bfdbfe'
        }
      });
    }
  };

  const handleAddLinkedin = () => {
    if (linkedinInput.trim()) {
      setProfile(prev => ({ ...prev, linkedin: linkedinInput }));
      setLinkedinInput("");
      setEditLinkedin(false);
      saveProfile();
    }
  };

  const handleAddWebsite = () => {
    if (websiteInput.trim()) {
      setProfile(prev => ({ ...prev, website: websiteInput }));
      setWebsiteInput("");
      setEditWebsite(false);
      saveProfile();
    }
  };

  const handleAddGithub = () => {
    if (githubInput.trim()) {
      setProfile(prev => ({ ...prev, github: githubInput }));
      setGithubInput("");
      setEditGithub(false);
      saveProfile();
    }
  };

  const handleAddTwitter = () => {
    if (twitterInput.trim()) {
      const updated = { ...profile, twitter: twitterInput };
      setProfile(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      window.dispatchEvent(new Event('profileUpdated'));
      setTwitterInput("");
      setEditTwitter(false);
      toast.success("Twitter profile added!", {
        style: {
          background: '#f0f9ff',
          color: '#1e3a8a',
          fontFamily: 'Nunito, sans-serif',
          border: '1px solid #bfdbfe'
        }
      });
    }
  };

  // Handlers for removing entries
  const handleRemoveEducation = (index) => {
    setProfile(prev => ({ ...prev, education: prev.education.filter((_, i) => i !== index) }));
    saveProfile();
  };

  const handleRemoveTeachSkill = (index) => {
    setProfile(prev => ({ ...prev, teachSkills: prev.teachSkills.filter((_, i) => i !== index) }));
    saveProfile();
  };

  const handleRemoveLearnSkill = (index) => {
    setProfile(prev => ({ ...prev, learnSkills: prev.learnSkills.filter((_, i) => i !== index) }));
    saveProfile();
  };

  const handleRemoveExperience = (index) => {
    setProfile(prev => ({ ...prev, experience: prev.experience.filter((_, i) => i !== index) }));
    saveProfile();
  };

  const handleRemoveCertificate = (index) => {
    setProfile(prev => ({ ...prev, certificates: prev.certificates.filter((_, i) => i !== index) }));
    saveProfile();
  };

  // Remove handlers for social/profile links
  const handleRemoveLinkedin = () => {
    const updated = { ...profile, linkedin: "" };
    setProfile(updated);
    localStorage.setItem('user', JSON.stringify(updated));
    window.dispatchEvent(new Event('profileUpdated'));
    toast.success("LinkedIn removed!", { style: { background: '#f0f9ff', color: '#1e3a8a', fontFamily: 'Nunito, sans-serif', border: '1px solid #bfdbfe' } });
  };
  const handleRemoveTwitter = () => {
    const updated = { ...profile, twitter: "" };
    setProfile(updated);
    localStorage.setItem('user', JSON.stringify(updated));
    window.dispatchEvent(new Event('profileUpdated'));
    toast.success("Twitter removed!", { style: { background: '#f0f9ff', color: '#1e3a8a', fontFamily: 'Nunito, sans-serif', border: '1px solid #bfdbfe' } });
  };
  const handleRemoveGithub = () => {
    const updated = { ...profile, github: "" };
    setProfile(updated);
    localStorage.setItem('user', JSON.stringify(updated));
    window.dispatchEvent(new Event('profileUpdated'));
    toast.success("GitHub removed!", { style: { background: '#f0f9ff', color: '#1e3a8a', fontFamily: 'Nunito, sans-serif', border: '1px solid #bfdbfe' } });
  };
  const handleRemoveWebsite = () => {
    const updated = { ...profile, website: "" };
    setProfile(updated);
    localStorage.setItem('user', JSON.stringify(updated));
    window.dispatchEvent(new Event('profileUpdated'));
    toast.success("Website removed!", { style: { background: '#f0f9ff', color: '#1e3a8a', fontFamily: 'Nunito, sans-serif', border: '1px solid #bfdbfe' } });
  };

  // Attach proof for teach skills
  const handleAttachProof = (index, file) => {
    setProfile(prev => ({
      ...prev,
      teachSkills: prev.teachSkills.map((s, i) => i === index ? { ...s, proof: file, proofName: file?.name } : s)
    }));
    saveProfile();
  };

  // Country dropdown options
  const countryOptions = countryList().getData();

  // Skeleton Loader
  const SkeletonLoader = () => (
    <div className="space-y-10">
      <div className="bg-gradient-to-r from-blue-900 via-blue-500 to-gray-700 h-[25vh] w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
        <div className="absolute left-6 top-6 flex items-center gap-4">
          <div className="w-14 h-14 sm:w-18 sm:h-18 bg-blue-100 rounded-lg"></div>
          <div className="space-y-2">
            <div className="h-6 w-48 bg-blue-100 rounded"></div>
            <div className="h-4 w-32 bg-blue-100 rounded"></div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 -mt-4">
        <div className="w-full lg:w-80 p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></div>
          <div className="h-6 w-40 bg-blue-100 rounded mb-4"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="h-5 w-3/4 bg-blue-100 rounded"></div>
            ))}
          </div>
        </div>
        <div className="flex-1 bg-gray-100 rounded-3xl p-6 relative overflow-hidden ml-4 sm:ml-8">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></div>
          {[...Array(9)].map((_, idx) => (
            <div key={idx} className="mb-6">
              <div className="h-6 w-40 bg-blue-100 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-5 w-full bg-blue-100 rounded"></div>
                <div className="h-5 w-3/4 bg-blue-100 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Helper to get best available name
  const getDisplayName = () => {
    if (profile.fullName && profile.fullName.trim() !== '') return profile.fullName;
    let googleUser = null, linkedinUser = null, regName = '';
    try { googleUser = JSON.parse(localStorage.getItem('googleUser')); } catch {}
    try { linkedinUser = JSON.parse(localStorage.getItem('linkedinUser')); } catch {}
    regName = localStorage.getItem('registeredName') || '';
    if (googleUser && googleUser.name) return googleUser.name;
    if (linkedinUser && linkedinUser.name) return linkedinUser.name;
    if (regName) return regName;
    return '';
  };
  // Helper to get best available email
  const getDisplayEmail = () => {
    if (profile.email && profile.email.trim() !== '') return profile.email;
    let googleUser = null, linkedinUser = null, regEmail = '';
    try { googleUser = JSON.parse(localStorage.getItem('googleUser')); } catch {}
    try { linkedinUser = JSON.parse(localStorage.getItem('linkedinUser')); } catch {}
    regEmail = localStorage.getItem('registeredEmail') || '';
    if (googleUser && googleUser.email) return googleUser.email;
    if (linkedinUser && linkedinUser.email) return linkedinUser.email;
    if (regEmail) return regEmail;
    return '';
  };

  // --- Full Name Edit State ---
  const [editingName, setEditingName] = useState(false);
  const handleEditName = () => {
    setNameInput(profile.fullName);
    setEditingName(true);
  };
  const handleSaveName = () => {
    const updated = { ...profile, fullName: nameInput };
    setProfile(updated);
    localStorage.setItem('user', JSON.stringify(updated));
    window.dispatchEvent(new Event('profileUpdated'));
    setNameInput(nameInput); // Ensure input reflects the latest saved value
    setEditingName(false);
    toast.success("Name updated!", {
      style: {
        background: '#f0f9ff',
        color: '#1e3a8a',
        fontFamily: 'Nunito, sans-serif',
        border: '1px solid #bfdbfe'
      }
    });
  };
  const handleCancelName = () => {
    setEditingName(false);
  };

  // --- Profile Picture Edit State ---
  const handleSavePic = () => {
    setProfile(prev => {
      const updated = { ...prev, profilePic: prev.profilePicPreview };
      localStorage.setItem('user', JSON.stringify(updated));
      window.dispatchEvent(new Event('profileUpdated'));
      return { ...updated, profilePicPreview: null };
    });
    setEditingPic(false);
    toast.success("Profile picture updated!", {
      style: {
        background: '#f0f9ff',
        color: '#1e3a8a',
        fontFamily: 'Nunito, sans-serif',
        border: '1px solid #bfdbfe'
      }
    });
  };
  const handleCancelPic = () => {
    setEditingPic(false);
    setProfile(prev => ({ ...prev, profilePic: prev.profilePic, profilePicPreview: prev.profilePicPreview }));
  };

  useEffect(() => {
    if (!editingName) {
      setNameInput(profile.fullName || "");
    }
  }, [profile.fullName, editingName]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-100 pt-20 pb-8 px-4 sm:px-6 lg:px-8 font-inter">
      <Toaster position="top-center" />

  
      {loading ? (
        <SkeletonLoader />
      ) : (
        <>
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-blue-900 via-blue-500 to-gray-700 h-[25vh] w-full relative flex items-center">
            <div className="absolute left-6 sm:left-10 top-6 flex items-center gap-4">
              <div className="relative group">
                {editingPic ? (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePicChange}
                      className="w-14 h-14 sm:w-18 sm:h-18 rounded-lg border-2 border-blue-200 shadow-md bg-white text-blue-900 font-bold text-lg sm:text-xl font-lora p-2"
                      style={{ background: '#f0f9ff' }}
                    />
                    <div className="flex gap-2 mt-2">
                      <button onClick={handleSavePic} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">Save</button>
                      <button onClick={handleCancelPic} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">Cancel</button>
                    </div>
                  </>
                ) : profile.profilePicPreview ? (
                  <img
                    src={profile.profilePicPreview}
                    alt="Profile"
                    className="w-14 h-14 sm:w-18 sm:h-18 rounded-lg object-cover border-2 border-blue-200 shadow-md transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-lg bg-blue-100 flex items-center justify-center text-blue-900 font-bold text-lg sm:text-xl font-lora border-2 border-blue-200 shadow-md transition duration-300 group-hover:scale-105">
                    {getDisplayName() ? getDisplayName().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                  </div>
                )}
                {!editingPic && (
                  <button onClick={() => setEditingPic(true)} className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1 text-xs shadow hover:bg-blue-700">Edit</button>
                )}
              </div>
              <div className="space-y-1">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      className="text-xl sm:text-2xl font-bold text-blue-900 font-lora border border-blue-300 rounded px-2 py-1 text-center"
                      style={{ minWidth: '120px' }}
                      autoFocus
                    />
                    <button onClick={handleSaveName} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">Save</button>
                    <button onClick={handleCancelName} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-white font-lora">{getDisplayName() || "Your Name"}</h2>
                    <button onClick={handleEditName} className="text-blue-100 hover:underline text-xs bg-blue-700 rounded px-2 py-1">Edit</button>
                  </div>
                )}
                <p className="text-sm font-bold text-gray-200 font-nunito">{getDisplayEmail() || "Email not set"}</p>
                <p className="text-sm font-bold text-gray-200 font-nunito">ID: {profile.userId}</p>
              </div>
            </div>
          </div>
          {/* Main Content */}
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 -mt-4">
            
            <div className="w-full lg:w-80 p-6 lg:sticky lg:top-24 overflow-y-auto max-h-[70vh] animate-slide-up">
              <h3 className="text-lg font-semibold text-blue-900 mb-6 font-lora relative group">
                Profile Options
                <span className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full w-0 group-hover:w-full transition-all duration-300"></span>
              </h3>
              <div className="w-full flex justify-end mb-6">
                <a
                  href="/profile"
                  className="inline-block px-5 py-2 rounded-full bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-all duration-200"
                >
                  Go to Profile
                </a>
              </div>
              <ul className="space-y-4">
                <li>
                  <button className="flex items-center gap-2 text-blue-900 hover:text-blue-700 font-nunito font-medium transition duration-200 w-full text-left">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
                    </svg>
                    Settings
                  </button>
                </li>
                <li>
                  <button className="flex items-center gap-2 text-blue-900 hover:text-blue-700 font-nunito font-medium transition duration-200 w-full text-left">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 2.21-1.79 4-4 4s-4-1.79-4-4 1.79-4 4-4 4 1.79 4 4zm0 0c0 2.21 1.79 4 4 4s4-1.79 4-4-1.79-4-4-4-4 1.79-4 4z" />
                    </svg>
                    Privacy
                  </button>
                </li>
                <li>
                  <button className="flex items-center gap-2 text-blue-900 hover:text-blue-700 font-nunito font-medium transition duration-200 w-full text-left">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Skill Credits ({profile.credits})
                  </button>
                </li>
                <li>
                  <button className="flex items-center gap-2 text-blue-900 hover:text-blue-700 font-nunito font-medium transition duration-200 w-full text-left">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Notifications
                  </button>
                </li>
              </ul>
            </div>
            <div className="flex-1 bg-white/95 rounded-3xl shadow-xl border border-blue-200 p-6 sm:p-8 ml-4 sm:ml-8 z-10 animate-slide-up">
              {/* Tell Us About Yourself */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-900 font-lora relative group">
                    Tell Us About Yourself
                    <span className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full w-0 group-hover:w-full transition-all duration-300"></span>
                  </h3>
                  <button
                    onClick={() => { setEditBio(!editBio); setBioInput(profile.bio || ''); }}
                    className="text-blue-600 hover:underline text-sm font-medium font-nunito"
                  >
                    Edit
                  </button>
                </div>
                {editBio ? (
                  <div className="space-y-4 animate-fade-in">
                    <textarea
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80 font-nunito"
                      placeholder="Describe yourself..."
                      maxLength={500}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddBio}
                        className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 rounded-lg font-semibold hover:scale-105 hover:shadow-lg transition duration-200 transform font-nunito"
                      >
                        Add About
                      </button>
                      <button
                        onClick={() => { setEditBio(false); setBioInput(profile.bio || ''); }}
                        className="bg-gray-200 text-blue-900 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition duration-200 font-nunito"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 font-nunito">{profile.bio || "No bio added yet."}</p>
                )}
              </div>
              <hr className="my-8 border-blue-200 opacity-50" />
              {/* Country */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-900 font-lora relative group">
                    Country
                    <span className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full w-0 group-hover:w-full transition-all duration-300"></span>
                  </h3>
                  <button
                    onClick={() => { setEditCountry(!editCountry); setProfile(prev => ({ ...prev, country: prev.country })); }}
                    className="text-blue-600 hover:underline text-sm font-medium font-nunito"
                  >
                    Edit
                  </button>
                </div>
                {editCountry ? (
                  <div className="space-y-4 animate-fade-in">
                    <select
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80 font-nunito text-gray-700"
                      value={profile.country}
                      onChange={(e) => setProfile(prev => ({ ...prev, country: e.target.value }))}
                    >
                      <option value="">Select your country</option>
                      {countryOptions.map(c => (
                        <option key={c.value} value={c.label}>{c.label}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditCountry(false); saveProfile(); }}
                        className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 rounded-lg font-semibold hover:scale-105 hover:shadow-lg transition duration-200 transform font-nunito"
                      >
                        Save Country
                      </button>
                      <button
                        onClick={() => { setEditCountry(false); setProfile(prev => ({ ...prev, country: prev.country })); }}
                        className="bg-gray-200 text-blue-900 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition duration-200 font-nunito"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 font-nunito">{profile.country || "No country selected."}</p>
                )}
              </div>
              <hr className="my-8 border-blue-200 opacity-50" />
              {/* Education Details */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-900 font-lora relative group">
                    Education Details
                    <span className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full w-0 group-hover:w-full transition-all duration-300"></span>
                  </h3>
                  <button
                    onClick={() => { setEditEducation(!editEducation); setEducationInput({ degree: '', university: '', year: '', specialization: '' }); }}
                    className="text-blue-600 hover:underline text-sm font-medium font-nunito"
                  >
                    Edit
                  </button>
                </div>
                {editEducation ? (
                  <div className="space-y-4 animate-fade-in">
                    <input
                      type="text"
                      value={educationInput.degree}
                      onChange={(e) => setEducationInput(prev => ({ ...prev, degree: e.target.value }))}
                      placeholder="Degree"
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80 font-nunito"
                    />
                    <input
                      type="text"
                      value={educationInput.university}
                      onChange={(e) => setEducationInput(prev => ({ ...prev, university: e.target.value }))}
                      placeholder="University"
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80 font-nunito"
                    />
                    <input
                      type="text"
                      value={educationInput.year}
                      onChange={(e) => setEducationInput(prev => ({ ...prev, year: e.target.value }))}
                      placeholder="Year"
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80 font-nunito"
                    />
                    <input
                      type="text"
                      value={educationInput.specialization}
                      onChange={(e) => setEducationInput(prev => ({ ...prev, specialization: e.target.value }))}
                      placeholder="Specialization"
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80 font-nunito"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddEducation}
                        className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 rounded-lg font-semibold hover:scale-105 hover:shadow-lg transition duration-200 transform font-nunito"
                      >
                        Add Education
                      </button>
                      <button
                        onClick={() => { setEditEducation(false); setEducationInput({ degree: '', university: '', year: '', specialization: '' }); }}
                        className="bg-gray-200 text-blue-900 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition duration-200 font-nunito"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {profile.education.length > 0 ? (
                      profile.education.map((edu, index) => (
                        <div key={index} className="flex justify-between items-center bg-blue-50 rounded-lg p-3 font-nunito text-gray-600">
                          <div>
                            <p className="font-semibold">{edu.degree}</p>
                            <p>{edu.university} {edu.year && `(${edu.year})`}</p>
                            {edu.specialization && <p>{edu.specialization}</p>}
                          </div>
                          <button
                            onClick={() => handleRemoveEducation(index)}
                            className="btn btn-error btn-xs"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600 font-nunito">No education details added.</p>
                    )}
                  </div>
                )}
              </div>
              <hr className="my-8 border-blue-200 opacity-50" />
              {/* I Can Teach */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-900 font-lora relative group">
                    I Can Teach
                    <span className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full w-0 group-hover:w-full transition-all duration-300"></span>
                  </h3>
                  <button
                    onClick={() => { setEditTeach(!editTeach); setTeachSkillInput({ skill: '', proof: null, proofName: null }); }}
                    className="text-blue-600 hover:underline text-sm font-medium font-nunito"
                  >
                    Edit
                  </button>
                </div>
                {editTeach ? (
                  <div className="space-y-4 animate-fade-in">
                    <input
                      type="text"
                      value={teachSkillInput.skill}
                      onChange={(e) => setTeachSkillInput(prev => ({ ...prev, skill: e.target.value }))}
                      placeholder="Skill (e.g., Algebra)"
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80 font-nunito"
                    />
                    <input
                      type="file"
                      onChange={(e) => setTeachSkillInput(prev => ({ ...prev, proof: e.target.files[0], proofName: e.target.files[0]?.name }))}
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80 font-nunito"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddTeachSkill}
                        className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 rounded-lg font-semibold hover:scale-105 hover:shadow-lg transition duration-200 transform font-nunito"
                      >
                        Add Teaching Skill
                      </button>
                      <button
                        onClick={() => { setEditTeach(false); setTeachSkillInput({ skill: '', proof: null, proofName: null }); }}
                        className="bg-gray-200 text-blue-900 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition duration-200 font-nunito"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {profile.teachSkills.length > 0 ? (
                      profile.teachSkills.map((skill, index) => (
                        <div key={index} className="flex justify-between items-center bg-blue-50 rounded-lg p-3 font-nunito text-gray-600">
                          <div>
                            <p className="font-semibold">{skill.skill}</p>
                            {skill.proofName && <p className="text-sm">Proof: {skill.proofName}</p>}
                          </div>
                          <button
                            onClick={() => handleRemoveTeachSkill(index)}
                            className="btn btn-error btn-xs"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600 font-nunito">No teaching skills added.</p>
                    )}
                  </div>
                )}
              </div>
              <hr className="my-8 border-blue-200 opacity-50" />
              {/* I Want to Learn */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-900 font-lora relative group">
                    I Want to Learn
                    <span className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full w-0 group-hover:w-full transition-all duration-300"></span>
                  </h3>
                  <button
                    onClick={() => { setEditLearn(!editLearn); setLearnSkillInput(""); }}
                    className="text-blue-600 hover:underline text-sm font-medium font-nunito"
                  >
                    Edit
                  </button>
                </div>
                {editLearn ? (
                  <div className="space-y-4 animate-fade-in">
                    <input
                      type="text"
                      value={learnSkillInput}
                      onChange={(e) => setLearnSkillInput(e.target.value)}
                      placeholder="Skill (e.g., Python)"
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80 font-nunito"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddLearnSkill}
                        className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 rounded-lg font-semibold hover:scale-105 hover:shadow-lg transition duration-200 transform font-nunito"
                      >
                        Add Learning Interest
                      </button>
                      <button
                        onClick={() => { setEditLearn(false); setLearnSkillInput(""); }}
                        className="bg-gray-200 text-blue-900 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition duration-200 font-nunito"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {profile.learnSkills.length > 0 ? (
                      profile.learnSkills.map((skill, index) => (
                        <div key={index} className="flex justify-between items-center bg-blue-50 rounded-lg p-3 font-nunito text-gray-600">
                          <p>{skill}</p>
                          <button
                            onClick={() => handleRemoveLearnSkill(index)}
                            className="btn btn-error btn-xs"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600 font-nunito">No learning interests added.</p>
                    )}
                  </div>
                )}
              </div>
              <hr className="my-8 border-blue-200 opacity-50" />
              {/* Experience */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-900 font-lora relative group">
                    Experience
                    <span className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full w-0 group-hover:w-full transition-all duration-300"></span>
                  </h3>
                  <button
                    onClick={() => { setEditExperience(!editExperience); setExperienceInput({ title: '', company: '', duration: '', description: '' }); }}
                    className="text-blue-600 hover:underline text-sm font-medium font-nunito"
                  >
                    Edit
                  </button>
                </div>
                {editExperience ? (
                  <div className="space-y-4 animate-fade-in">
                    <input
                      type="text"
                      value={experienceInput.title}
                      onChange={(e) => setExperienceInput(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Job Title"
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80 font-nunito"
                    />
                    <input
                      type="text"
                      value={experienceInput.company}
                      onChange={(e) => setExperienceInput(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="Company"
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80 font-nunito"
                    />
       
                    <input
                      type="text"
                      value={experienceInput.duration}
                      onChange={(e) => setExperienceInput(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="Duration (e.g., 2020-2022)"
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80 font-nunito"
                    />
                    <textarea
                      value={experienceInput.description}
                      onChange={(e) => setExperienceInput(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Description"
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80 font-nunito"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddExperience}
                        className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 rounded-lg font-semibold hover:scale-105 hover:shadow-lg transition duration-200 transform font-nunito"
                      >
                        Add Experience
                      </button>
                      <button
                        onClick={() => { setEditExperience(false); setExperienceInput({ title: '', company: '', duration: '', description: '' }); }}
                        className="bg-gray-200 text-blue-900 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition duration-200 font-nunito"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {profile.experience.length > 0 ? (
                      profile.experience.map((exp, index) => (
                        <div key={index} className="flex justify-between items-center bg-blue-50 rounded-lg p-3 font-nunito text-gray-600">
                          <div>
                            <p className="font-semibold">{exp.title}</p>
                            <p>{exp.company} {exp.duration && `(${exp.duration})`}</p>
                            {exp.description && <p>{exp.description}</p>}
                          </div>
                          <button
                            onClick={() => handleRemoveExperience(index)}
                            className="btn btn-error btn-xs"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600 font-nunito">No experience added.</p>
                    )}
                  </div>
                )}
              </div>
              <hr className="my-8 border-blue-200 opacity-50" />
              {/* Additional Certificates */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-900 font-lora relative group">
                    Additional Certificates
                    <span className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full w-0 group-hover:w-full transition-all duration-300"></span>
                  </h3>
                  <button
                    onClick={() => { setEditCertificates(!editCertificates); setCertificateInput({ name: '', issuer: '', year: '' }); }}
                    className="text-blue-600 hover:underline text-sm font-medium font-nunito"
                  >
                    Edit
                  </button>
                </div>
                {editCertificates ? (
                  <div className="space-y-4 animate-fade-in">
                    <input
                      type="text"
                      value={certificateInput.name}
                      onChange={(e) => setCertificateInput(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Certificate Name"
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80 font-nunito"
                    />
                    <input
                      type="text"
                      value={certificateInput.issuer}
                      onChange={(e) => setCertificateInput(prev => ({ ...prev, issuer: e.target.value }))}
                      placeholder="Issuer"
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80 font-nunito"
                    />
                    <input
                      type="text"
                      value={certificateInput.year}
                      onChange={(e) => setCertificateInput(prev => ({ ...prev, year: e.target.value }))}
                      placeholder="Year"
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80 font-nunito"
                    />
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setCertificateInput(prev => ({ ...prev, pdf: e.target.files[0], pdfName: e.target.files[0]?.name }))}
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80 font-nunito"
                    />
                    {certificateInput.pdfName && (
                      <div className="text-xs text-blue-700">Selected PDF: {certificateInput.pdfName}</div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddCertificate}
                        className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 rounded-lg font-semibold hover:scale-105 hover:shadow-lg transition duration-200 transform font-nunito"
                      >
                        Add Certificate
                      </button>
                      <button
                        onClick={() => { setEditCertificates(false); setCertificateInput({ name: '', issuer: '', year: '' }); }}
                        className="bg-gray-200 text-blue-900 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition duration-200 font-nunito"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {profile.certificates.length > 0 ? (
                      profile.certificates.map((cert, index) => (
                        <div key={index} className="flex justify-between items-center bg-blue-50 rounded-lg p-3 font-nunito text-gray-600">
                          <div>
                            <p className="font-semibold">{cert.name}</p>
                            <p>{cert.issuer} {cert.year && `(${cert.year})`}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveCertificate(index)}
                            className="btn btn-error btn-xs"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600 font-nunito">No certificates added.</p>
                    )}
                  </div>
                )}
              </div>
              <hr className="my-8 border-blue-200 opacity-50" />
              {/* LinkedIn */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-900 font-lora relative group">
                    LinkedIn
                    <span className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full w-0 group-hover:w-full transition-all duration-300"></span>
                  </h3>
                  <button
                    onClick={() => { setEditLinkedin(!editLinkedin); setLinkedinInput(profile.linkedin || ''); }}
                    className="text-blue-600 hover:underline text-sm font-medium font-nunito"
                  >
                    Edit
                  </button>
                </div>
                {editLinkedin ? (
                  <div className="space-y-4 animate-fade-in">
                    <input
                      type="url"
                      value={linkedinInput}
                      onChange={(e) => setLinkedinInput(e.target.value)}
                      placeholder="LinkedIn Profile URL"
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80 font-nunito"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddLinkedin}
                        className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 rounded-lg font-semibold hover:scale-105 hover:shadow-lg transition duration-200 transform font-nunito"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setEditLinkedin(false); setLinkedinInput(profile.linkedin || ''); }}
                        className="bg-gray-200 text-blue-900 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition duration-200 font-nunito"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 rounded-lg p-3 flex justify-between items-center font-nunito text-gray-600">
                    <span>
                      {profile.linkedin ? (
                        <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {profile.linkedin}
                        </a>
                      ) : (
                        "No LinkedIn profile added."
                      )}
                    </span>
                    {profile.linkedin && (
                      <button onClick={handleRemoveLinkedin} className="btn btn-error btn-xs">Remove</button>
                    )}
                  </div>
                )}
              </div>
              <hr className="my-8 border-blue-200 opacity-50" />
              {/* Website */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-900 font-lora relative group">
                    Website
                    <span className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full w-0 group-hover:w-full transition-all duration-300"></span>
                  </h3>
                  <button
                    onClick={() => { setEditWebsite(!editWebsite); setWebsiteInput(profile.website || ''); }}
                    className="text-blue-600 hover:underline text-sm font-medium font-nunito"
                  >
                    Edit
                  </button>
                </div>
                {editWebsite ? (
                  <div className="space-y-4 animate-fade-in">
                    <input
                      type="url"
                      value={websiteInput}
                      onChange={(e) => setWebsiteInput(e.target.value)}
                      placeholder="Personal Website URL"
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80 font-nunito"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddWebsite}
                        className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 rounded-lg font-semibold hover:scale-105 hover:shadow-lg transition duration-200 transform font-nunito"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setEditWebsite(false); setWebsiteInput(profile.website || ''); }}
                        className="bg-gray-200 text-blue-900 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition duration-200 font-nunito"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 rounded-lg p-3 flex justify-between items-center font-nunito text-gray-600">
                    <span>
                      {profile.website ? (
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {profile.website}
                        </a>
                      ) : (
                        "No website added."
                      )}
                    </span>
                    {profile.website && (
                      <button onClick={handleRemoveWebsite} className="btn btn-error btn-xs">Remove</button>
                    )}
                  </div>
                )}
              </div>
              <hr className="my-8 border-blue-200 opacity-50" />
              {/* GitHub */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-900 font-lora relative group">
                    GitHub
                    <span className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full w-0 group-hover:w-full transition-all duration-300"></span>
                  </h3>
                  <button
                    onClick={() => { setEditGithub(!editGithub); setGithubInput(profile.github || ''); }}
                    className="text-blue-600 hover:underline text-sm font-medium font-nunito"
                  >
                    Edit
                  </button>
                </div>
                {editGithub ? (
                  <div className="space-y-4 animate-fade-in">
                    <input
                      type="url"
                      value={githubInput}
                      onChange={(e) => setGithubInput(e.target.value)}
                      placeholder="GitHub Profile URL"
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80 font-nunito"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddGithub}
                        className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 rounded-lg font-semibold hover:scale-105 hover:shadow-lg transition duration-200 transform font-nunito"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setEditGithub(false); setGithubInput(profile.github || ''); }}
                        className="bg-gray-200 text-blue-900 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition duration-200 font-nunito"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 rounded-lg p-3 flex justify-between items-center font-nunito text-gray-600">
                    <span>
                      {profile.github ? (
                        <a href={profile.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {profile.github}
                        </a>
                      ) : (
                        "No GitHub profile added."
                      )}
                    </span>
                    {profile.github && (
                      <button onClick={handleRemoveGithub} className="btn btn-error btn-xs">Remove</button>
                    )}
                  </div>
                )}
              </div>
              <hr className="my-8 border-blue-200 opacity-50" />
              {/* Twitter (X) */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-900 font-lora relative group">
                    X (Twitter)
                    <span className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full w-0 group-hover:w-full transition-all duration-300"></span>
                  </h3>
                  <button
                    onClick={() => { setEditTwitter(!editTwitter); setTwitterInput(profile.twitter || ''); }}
                    className="text-blue-600 hover:underline text-sm font-medium font-nunito"
                  >
                    Edit
                  </button>
                </div>
                {editTwitter ? (
                  <div className="space-y-4 animate-fade-in">
                    <input
                      type="url"
                      value={twitterInput}
                      onChange={(e) => setTwitterInput(e.target.value)}
                      placeholder="X (Twitter) Profile URL"
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80 font-nunito"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddTwitter}
                        className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 rounded-lg font-semibold hover:scale-105 hover:shadow-lg transition duration-200 transform font-nunito"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setEditTwitter(false); setTwitterInput(profile.twitter || ''); }}
                        className="bg-gray-200 text-blue-900 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition duration-200 font-nunito"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 rounded-lg p-3 flex justify-between items-center font-nunito text-gray-600">
                    <span>
                      {profile.twitter ? (
                        <a href={profile.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {profile.twitter}
                        </a>
                      ) : (
                        "No X profile added."
                      )}
                    </span>
                    {profile.twitter && (
                      <button onClick={handleRemoveTwitter} className="btn btn-error btn-xs">Remove</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    
  
    </div>
  );
};

export default Edit_Profile;
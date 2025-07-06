import React, { useState, useEffect } from "react";
import UserInfoSection from "./UserInfoSection";
import SkillsTeachSection from "./SkillsTeachSection";
import SkillsLearnSection from "./SkillsLearnSection";
import BioSection from "./BioSection";
import EducationSection from "./EducationSection";
import ExperienceSection from "./ExperienceSection";
import CertificatesSection from "./CertificatesSection";
import toast, { Toaster } from 'react-hot-toast';
import countryList from 'react-select-country-list';

const Edit_Profile = () => {
  // Unified profile state
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    profilePic: null,
    profilePicPreview: null,
    bio: "",
    education: { degree: '', university: '', year: '', specialization: '' },
    experience: [],
    experienceSummary: "",
    certificates: [],
    teachSkills: [], // [{ skill, proof, proofName }]
    learnSkills: [],
    credits: 1200,
    badges: ["Starter", "Helper"],
    rank: "Bronze",
    country: ""
  });

  // Edit states
  const [editAll, setEditAll] = useState(false);
  const [editBio, setEditBio] = useState(false);
  const [editEducation, setEditEducation] = useState(false);
  const [editTeach, setEditTeach] = useState(false);
  const [editLearn, setEditLearn] = useState(false);
  const [editExperience, setEditExperience] = useState(false);
  const [editCertificates, setEditCertificates] = useState(false);

  // Fetch profile from backend on mount
  useEffect(() => {
    async function fetchProfile() {
      // Get full name and email from login/register 
      const regName = localStorage.getItem('registeredName');
      const regEmail = localStorage.getItem('registeredEmail');
      let user = null;
      try {
        user = JSON.parse(localStorage.getItem('user'));
      } catch {}
      setProfile(prev => ({
        ...prev,
        fullName: (user && user.fullName) || regName || prev.fullName,
        email: (user && user.email) || regEmail || prev.email,
        profilePicPreview: user?.profilePicPreview || prev.profilePicPreview,
        bio: user?.bio || prev.bio,
        country: user?.country || prev.country,
        education: user?.education || prev.education,
        experience: user?.experience || prev.experience,
        experienceSummary: user?.experienceSummary || prev.experienceSummary,
        certificates: user?.certificates || prev.certificates,
        teachSkills: user?.teachSkills || prev.teachSkills,
        learnSkills: user?.learnSkills || prev.learnSkills,
        credits: user?.credits || prev.credits,
        badges: user?.badges || prev.badges,
        rank: user?.rank || prev.rank
      }));
    }
    fetchProfile();
  }, []);

  // Save profile to backend
  const saveProfile = async () => {
    localStorage.setItem('user', JSON.stringify(profile));
    window.dispatchEvent(new Event('profileUpdated'));
    toast.success("Profile saved!");
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

  // Section field handlers
  const setField = (field, value) => setProfile(prev => ({ ...prev, [field]: value }));
  const setEducation = (edu) => setProfile(prev => ({ ...prev, education: { ...edu } }));
  const setExperience = (exp) => setProfile(prev => ({ ...prev, experience: exp }));
  const setExperienceSummary = (summary) => setProfile(prev => ({ ...prev, experienceSummary: summary }));
  const setCertificates = (certs) => setProfile(prev => ({ ...prev, certificates: certs }));
  const setTeachSkills = (skills) => setProfile(prev => ({ ...prev, teachSkills: skills }));
  const setLearnSkills = (skills) => setProfile(prev => ({ ...prev, learnSkills: skills }));

  // Add/Remove handlers for skills
  const [teachSkillInput, setTeachSkillInput] = useState("");
  const handleAddTeachSkill = () => {
    if (teachSkillInput.trim() && !profile.teachSkills.some(s => s.skill === teachSkillInput.trim())) {
      setTeachSkills([...profile.teachSkills, { skill: teachSkillInput.trim(), proof: null, proofName: null }]);
      setTeachSkillInput("");
    }
  };
  const handleAttachProof = (idx, file) => {
    setTeachSkills(profile.teachSkills.map((s, i) => i === idx ? { ...s, proof: file, proofName: file?.name } : s));
  };
  const handleRemoveTeachSkill = (idx) => {
    setTeachSkills(profile.teachSkills.filter((_, i) => i !== idx));
  };

  const [learnSkillInput, setLearnSkillInput] = useState("");
  const handleAddLearnSkill = () => {
    if (learnSkillInput.trim() && !profile.learnSkills.includes(learnSkillInput.trim())) {
      setLearnSkills([...profile.learnSkills, learnSkillInput.trim()]);
      setLearnSkillInput("");
    }
  };
  const handleRemoveLearnSkill = (idx) => {
    setLearnSkills(profile.learnSkills.filter((_, i) => i !== idx));
  };

  // Save & Continue
  const handleSave = async (e) => {
    e.preventDefault();
    setEditAll(false);
    setEditBio(false);
    setEditEducation(false);
    setEditTeach(false);
    setEditLearn(false);
    setEditExperience(false);
    setEditCertificates(false);
    await saveProfile();
  };

  // Country dropdown options
  const countryOptions = countryList().getData();

  return (
    <div className="max-w-5xl mx-auto bg-gradient-to-br from-blue-50 via-white to-blue-100 rounded-3xl shadow-2xl p-0 md:p-10 mt-10 relative border border-blue-100 overflow-hidden">
      <Toaster position="top-center" />
      <div className="absolute -top-10 -left-10 w-48 h-48 bg-blue-200/30 rounded-full blur-2xl z-0 animate-pulse" />
      <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl z-0 animate-pulse" />
      {/* Edit and Save/Cancel buttons */}
      <div className="absolute top-4 right-4 flex gap-2 z-20">
        <button
          onClick={() => window.location.href = '/profile'}
          className="text-sm bg-blue-100 hover:bg-blue-200 border px-3 py-1 rounded-md font-medium"
        >
          View Profile
        </button>
        {editAll ? (
          <>
            <button
              onClick={e => { handleSave(e); }}
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md font-medium hover:bg-blue-700 border"
            >
              Save
            </button>
            <button
              onClick={() => { setEditAll(false); setEditBio(false); setEditEducation(false); setEditTeach(false); setEditLearn(false); setEditExperience(false); setEditCertificates(false); }}
              className="text-sm bg-gray-100 hover:bg-gray-200 border px-3 py-1 rounded-md font-medium"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => { setEditAll(true); setEditBio(true); setEditEducation(true); setEditTeach(true); setEditLearn(true); setEditExperience(true); setEditCertificates(true); }}
            className="text-sm bg-gray-100 hover:bg-gray-200 border px-3 py-1 rounded-md font-medium"
          >
            Edit
          </button>
        )}
      </div>
      <div className="flex flex-col md:flex-row gap-12 relative z-10">
        {/* Main Profile Sections */}
        <div className="flex-1 md:basis-3/4 space-y-10">
          <UserInfoSection
            fullName={profile.fullName}
            setFullName={val => setField('fullName', val)}
            email={profile.email}
            setEmail={val => setField('email', val)}
            profilePicPreview={profile.profilePicPreview}
            handleProfilePicChange={handleProfilePicChange}
            editMode={editAll}
            initials={profile.fullName ? profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : ''}
          />
          <hr className="my-8 border-blue-200" />
          {/* Bio section above country */}
          <BioSection
            bio={profile.bio}
            setBio={val => setField('bio', val)}
            editMode={editAll || editBio}
            onAddClick={() => { setEditBio(true); setEditAll(false); setEditEducation(false); setEditTeach(false); setEditLearn(false); setEditExperience(false); setEditCertificates(false); }}
            onSave={() => { setEditBio(false); }}
            onCancel={() => { setEditBio(false); }}
            autoFocus={!editAll && editBio && !editEducation && !editTeach && !editLearn && !editExperience && !editCertificates}
          />
          <hr className="my-8 border-blue-200" />
          {/* Country selection section */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-lg font-semibold text-blue-900">Country</span>
          </div>
          <select
            className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-700 text-base"
            value={profile.country}
            onChange={e => setProfile(prev => ({ ...prev, country: e.target.value }))}
          >
            <option value="">Select your country</option>
            {countryOptions.map(c => (
              <option key={c.value} value={c.label}>{c.label}</option>
            ))}
          </select>
          <hr className="my-8 border-blue-200" />
          <EducationSection
            education={profile.education}
            setEducation={setEducation}
            editMode={editAll || editEducation}
            onAddClick={() => { setEditEducation(true); setEditAll(false); setEditBio(false); setEditTeach(false); setEditLearn(false); setEditExperience(false); setEditCertificates(false); }}
            onSave={() => { setEditEducation(false); }}
            onCancel={() => { setEditEducation(false); }}
            autoFocus={!editAll && editEducation && !editBio && !editTeach && !editLearn && !editExperience && !editCertificates}
          />
          <hr className="my-8 border-blue-200" />
          <SkillsTeachSection
            teachSkillInput={teachSkillInput}
            setTeachSkillInput={setTeachSkillInput}
            teachSkills={profile.teachSkills}
            handleAddTeachSkill={handleAddTeachSkill}
            handleAttachProof={handleAttachProof}
            handleRemoveTeachSkill={handleRemoveTeachSkill}
            editMode={editAll || editTeach}
            onAddClick={() => { setEditTeach(true); setEditAll(false); setEditBio(false); setEditEducation(false); setEditLearn(false); setEditExperience(false); setEditCertificates(false); }}
            onSave={() => { setEditTeach(false); }}
            onCancel={() => { setEditTeach(false); }}
            autoFocus={!editAll && editTeach && !editBio && !editEducation && !editLearn && !editExperience && !editCertificates}
          />
          <hr className="my-8 border-blue-200" />
          <SkillsLearnSection
            learnSkillInput={learnSkillInput}
            setLearnSkillInput={setLearnSkillInput}
            learnSkills={profile.learnSkills}
            handleAddLearnSkill={handleAddLearnSkill}
            handleRemoveLearnSkill={handleRemoveLearnSkill}
            editMode={editAll || editLearn}
            onAddClick={() => { setEditLearn(true); setEditAll(false); setEditBio(false); setEditEducation(false); setEditTeach(false); setEditExperience(false); setEditCertificates(false); }}
            onSave={() => { setEditLearn(false); }}
            onCancel={() => { setEditLearn(false); }}
            autoFocus={!editAll && editLearn && !editBio && !editEducation && !editTeach && !editExperience && !editCertificates}
          />
          <hr className="my-8 border-blue-200" />
          <ExperienceSection
            experience={profile.experience}
            setExperience={setExperience}
            experienceSummary={profile.experienceSummary}
            setExperienceSummary={setExperienceSummary}
            editMode={editAll || editExperience}
            onAddClick={() => { setEditExperience(true); setEditAll(false); setEditBio(false); setEditEducation(false); setEditTeach(false); setEditLearn(false); setEditCertificates(false); }}
            onSave={() => { setEditExperience(false); }}
            onCancel={() => { setEditExperience(false); }}
            autoFocus={!editAll && editExperience && !editBio && !editEducation && !editTeach && !editLearn && !editCertificates}
          />
          <hr className="my-8 border-blue-200" />
          <CertificatesSection
            certificates={profile.certificates}
            setCertificates={setCertificates}
            editMode={editAll || editCertificates}
            onAddClick={() => { setEditCertificates(true); setEditAll(false); setEditBio(false); setEditEducation(false); setEditTeach(false); setEditLearn(false); setEditExperience(false); }}
            onSave={() => { setEditCertificates(false); }}
            onCancel={() => { setEditCertificates(false); }}
            autoFocus={!editAll && editCertificates && !editBio && !editEducation && !editTeach && !editLearn && !editExperience}
          />
        </div>
      </div>
    </div>
  );
};

export default Edit_Profile;

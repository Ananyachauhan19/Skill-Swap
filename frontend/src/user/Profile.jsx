import React, { useState } from "react";
import UserInfoSection from "./sections/UserInfoSection";
import SkillsTeachSection from "./sections/SkillsTeachSection";
import SkillsLearnSection from "./sections/SkillsLearnSection";
import BioSection from "./sections/BioSection";
import GamificationStats from "./sections/GamificationStats";

const Profile = () => {
  // User Info
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);

  // Skills You Can Teach
  const [teachSkillInput, setTeachSkillInput] = useState("");
  const [teachSkills, setTeachSkills] = useState([]); // [{ skill, proof, proofName }]

  // Skills You Want to Learn
  const [learnSkillInput, setLearnSkillInput] = useState("");
  const [learnSkills, setLearnSkills] = useState([]);

  // Bio
  const [bio, setBio] = useState("");

  // Gamification Stats (dummy data)
  const [credits] = useState(1200);
  const [badges] = useState(["Starter", "Helper"]);
  const [rank] = useState("Bronze");

  // Profile Pic Handler
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    setProfilePic(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePicPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setProfilePicPreview(null);
    }
  };

  // Add teaching skill
  const handleAddTeachSkill = () => {
    if (teachSkillInput.trim() && !teachSkills.some(s => s.skill === teachSkillInput.trim())) {
      setTeachSkills([...teachSkills, { skill: teachSkillInput.trim(), proof: null, proofName: null }]);
      setTeachSkillInput("");
    }
  };

  // Attach proof to a teaching skill
  const handleAttachProof = (idx, file) => {
    setTeachSkills(teachSkills.map((s, i) => i === idx ? { ...s, proof: file, proofName: file?.name } : s));
  };

  // Remove teaching skill
  const handleRemoveTeachSkill = (idx) => {
    setTeachSkills(teachSkills.filter((_, i) => i !== idx));
  };

  // Add learning skill
  const handleAddLearnSkill = () => {
    if (learnSkillInput.trim() && !learnSkills.includes(learnSkillInput.trim())) {
      setLearnSkills([...learnSkills, learnSkillInput.trim()]);
      setLearnSkillInput("");
    }
  };

  // Remove learning skill
  const handleRemoveLearnSkill = (idx) => {
    setLearnSkills(learnSkills.filter((_, i) => i !== idx));
  };

  // Save & Continue (dummy handler)
  const handleSave = (e) => {
    e.preventDefault();
    // TODO: Send all data to backend
    alert("Profile saved! (Implement backend integration)");
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg p-6 mt-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Create Your SkillSwap Profile</h1>
      <form className="space-y-6" onSubmit={handleSave}>
        <UserInfoSection
          fullName={fullName}
          setFullName={setFullName}
          email={email}
          setEmail={setEmail}
          profilePicPreview={profilePicPreview}
          handleProfilePicChange={handleProfilePicChange}
        />
        <SkillsTeachSection
          teachSkillInput={teachSkillInput}
          setTeachSkillInput={setTeachSkillInput}
          teachSkills={teachSkills}
          handleAddTeachSkill={handleAddTeachSkill}
          handleAttachProof={handleAttachProof}
          handleRemoveTeachSkill={handleRemoveTeachSkill}
        />
        <SkillsLearnSection
          learnSkillInput={learnSkillInput}
          setLearnSkillInput={setLearnSkillInput}
          learnSkills={learnSkills}
          handleAddLearnSkill={handleAddLearnSkill}
          handleRemoveLearnSkill={handleRemoveLearnSkill}
        />
        <BioSection bio={bio} setBio={setBio} />
        <GamificationStats credits={credits} badges={badges} rank={rank} />
        <button type="submit" className="w-full py-3 rounded-lg bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition">Save & Continue</button>
      </form>
    </div>
  );
};

export default Profile;

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../context/AuthContext.jsx';
import {
  MapPin,
  GraduationCap,
  Edit2,
  Save,
  XCircle,
  Mail,
  Settings2,
  Plus,
  Trash2,
} from "lucide-react";

// List of all countries (ISO 3166)
const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina",
  "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados",
  "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana",
  "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon",
  "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros",
  "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia",
  "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini",
  "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana",
  "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras",
  "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania",
  "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands",
  "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro",
  "Morocco", "Mozambique", "Myanmar (Burma)", "Namibia", "Nauru", "Nepal", "Netherlands",
  "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
  "Oman", "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay",
  "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa",
  "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles",
  "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia",
  "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname",
  "Sweden", "Switzerland", "Syria", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste",
  "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay",
  "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

const SidebarCard = ({
  profile,
  editingField,
  fieldDraft,
  setFieldDraft,
  startEdit,
  saveEdit,
  cancelEdit,
  handleProfilePicChange,
  handleArrayChange,
  handleArrayAdd,
  handleArrayRemove,
  onSaveEdit,
}) => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [tutorStatus, setTutorStatus] = useState({ isTutor: false, activationRemainingMs: 0, appStatus: null });
  const [countdownText, setCountdownText] = useState('');
  const [locationQuery, setLocationQuery] = useState("");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [userIdError, setUserIdError] = useState("");

  const filteredCountries = locationQuery
    ? COUNTRIES.filter((c) => c.toLowerCase().includes(locationQuery.toLowerCase()))
    : COUNTRIES;

  useEffect(() => {
    if (editingField === "country") {
      setLocationQuery(fieldDraft.country || "");
    }
  }, [editingField, fieldDraft.country]);

  // Fetch tutor status for pending/approved-but-not-active states
  useEffect(() => {
    let timer;
    (async () => {
      try {
        const { BACKEND_URL } = await import('../../config.js');
        const res = await fetch(`${BACKEND_URL}/api/tutor/status`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const appStatus = data?.application?.status || null;
          const isTutor = !!data?.isTutor;
          const activationRemainingMs = data?.activationRemainingMs || 0;
          setTutorStatus({ isTutor, activationRemainingMs, appStatus });
          if (!isTutor && activationRemainingMs > 0) {
            const start = Date.now();
            const tick = async () => {
              const elapsed = Date.now() - start;
              const ms = Math.max(0, activationRemainingMs - elapsed);
              const m = Math.floor(ms / 60000);
              const s = Math.floor((ms % 60000) / 1000);
              setCountdownText(ms > 0 ? `Unlocks in ${m}m ${s}s` : 'Activating...');
              if (ms === 0) {
                // Optional: refetch status once when it hits zero
                try {
                  const check = await fetch(`${BACKEND_URL}/api/tutor/status`, { credentials: 'include' });
                  if (check.ok) {
                    const fresh = await check.json();
                    setTutorStatus({
                      isTutor: !!fresh?.isTutor,
                      activationRemainingMs: fresh?.activationRemainingMs || 0,
                      appStatus: fresh?.application?.status || null,
                    });
                  }
                } catch {}
                clearInterval(timer);
              }
            };
            tick();
            timer = setInterval(tick, 1000);
          } else {
            setCountdownText('');
          }
        }
      } catch (_) {}
    })();
    return () => { if (timer) clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!showLocationDropdown) return;
    function handleClick(e) {
      if (locationInputRef.current && !locationInputRef.current.contains(e.target)) {
        setShowLocationDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showLocationDropdown]);

  // Async check for userId uniqueness
  const checkUserIdUnique = async (userId) => {
    if (!userId) return;
    try {
      // Mocked response for userId check
      const staticResponse = { available: userId !== "taken_id" };
      if (!staticResponse.available) {
        setUserIdError(`${userId} already in use, try another.`);
      } else {
        setUserIdError("");
      }
    } catch {
      setUserIdError("Could not verify user ID.");
    }
  };

  // Get email directly from profile
  const getBestEmail = () => {
    return profile.email || "Not provided";
  };

  // Handler for saving profile fields
  const handleSave = (field) => {
    const updatedProfile = {
      ...profile,
      ...fieldDraft,
      education: fieldDraft.education || profile.education || [],
      country: fieldDraft.country || profile.country || '',
    };
    saveEdit(field);
    if (onSaveEdit) onSaveEdit(updatedProfile);
  };

  return (
    <div className="w-full md:w-1/4 bg-white rounded-2xl shadow-lg border border-blue-100 p-6 sm:p-8 flex flex-col gap-8 md:-ml-6">
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-6">
          {profile.profilePicPreview && typeof profile.profilePicPreview === 'string' && profile.profilePicPreview.startsWith('http') ? (
            <img
              src={profile.profilePicPreview}
              alt="Profile"
              className="w-full h-full rounded-full object-cover border-4 border-blue-600 transition-all duration-200"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-blue-200 flex items-center justify-center text-2xl font-bold text-blue-900 transition-all duration-200">
              {profile.fullName
                ? profile.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                : "U"}
            </div>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleProfilePicChange(e)}
            className="absolute inset-0 opacity-0 cursor-pointer"
            title="Upload Profile Picture"
            ref={fileInputRef}
            style={{ zIndex: 2 }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1.5 hover:bg-blue-800 transition-colors duration-200"
            style={{ zIndex: 3 }}
            title="Edit Profile Picture"
          >
            <Edit2 size={16} />
          </button>
        </div>
        <div className="text-sm text-gray-500 mb-4">Profile: No file chosen</div>
        {editingField === "fullName" ? (
          <div className="flex items-center gap-2 w-full">
            <input
              className="text-lg sm:text-xl font-semibold text-blue-900 text-center break-words border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-2 py-1 rounded w-full"
              value={fieldDraft.fullName}
              onChange={(e) => setFieldDraft((d) => ({ ...d, fullName: e.target.value }))}
              placeholder="Your Name"
            />
            <button
              onClick={() => handleSave("fullName")}
              className="text-green-600 hover:text-green-800 transition-colors duration-200"
            >
              <Save size={18} />
            </button>
            <button
              onClick={cancelEdit}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <XCircle size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full">
            <h2 className="text-lg sm:text-xl font-semibold text-blue-900 text-center break-words flex-1">
              {profile.fullName || "Your Name"}
            </h2>
            <button
              onClick={() => startEdit("fullName")}
              className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              <Edit2 size={18} />
            </button>
          </div>
        )}
        <div className="w-full text-center mt-1">
          <span className="text-xs text-gray-500 bg-blue-100 rounded px-2 py-0.5 inline-block">
            @{profile.userId || profile.username || 'username'}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-blue-900">User ID</div>
            {editingField !== "userId" && (
              <button
                onClick={() => startEdit("userId")}
                className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>
          {editingField === "userId" ? (
            <div className="flex items-center gap-2 w-full">
              <Settings2 size={16} className="text-blue-600" />
              <input
                className="border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-1 py-0.5 rounded text-xs text-gray-700 w-full"
                value={fieldDraft.userId}
                onChange={(e) => {
                  const newUserId = e.target.value;
                  setFieldDraft((d) => ({ ...d, userId: newUserId }));
                  checkUserIdUnique(newUserId);
                }}
                placeholder="Unique User ID"
              />
              <button
                onClick={() => userIdError ? null : handleSave("userId")}
                className={`text-green-600 hover:text-green-800 transition-colors duration-200 ${userIdError ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={!!userIdError}
              >
                <Save size={18} />
              </button>
              <button
                onClick={cancelEdit}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <XCircle size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Settings2 size={16} className="text-blue-600" />
              <span className="text-gray-800 text-sm">
                {profile.userId || profile.username || 'username'}
              </span>
            </div>
          )}
          {userIdError && <div className="text-red-500 text-xs mt-1">{userIdError}</div>}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-blue-900">Email</div>
            {editingField !== "email" && (
              <button
                onClick={() => startEdit("email")}
                className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>
          {editingField === "email" ? (
            <div className="flex items-center gap-2 w-full">
              <Mail size={16} className="text-blue-600" />
              <input
                className="border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-1 py-0.5 rounded text-xs text-gray-700 w-full"
                value={fieldDraft.email || ""}
                onChange={(e) => setFieldDraft((d) => ({ ...d, email: e.target.value }))}
                placeholder="Your Email"
              />
              <button
                onClick={() => handleSave("email")}
                className="text-green-600 hover:text-green-800 transition-colors duration-200"
              >
                <Save size={18} />
              </button>
              <button
                onClick={cancelEdit}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <XCircle size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-blue-600" />
              <span className="text-gray-800 text-sm">{getBestEmail()}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-blue-900">Country</div>
            {editingField !== "country" && (
              <button
                onClick={() => startEdit("country")}
                className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>
          {editingField === "country" ? (
            <div className="relative w-full" ref={locationInputRef}>
              <div className="flex items-center gap-2 w-full">
                <MapPin size={16} className="text-blue-600" />
                <input
                  className="border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-1 py-0.5 rounded text-xs text-gray-700 w-full"
                  value={locationQuery}
                  onChange={(e) => {
                    setLocationQuery(e.target.value);
                    setShowLocationDropdown(true);
                    setFieldDraft((d) => ({ ...d, country: e.target.value }));
                  }}
                  placeholder="Select or type country"
                  onFocus={() => setShowLocationDropdown(true)}
                />
                <button
                  onClick={() => handleSave("country")}
                  className="text-green-600 hover:text-green-800 transition-colors duration-200"
                >
                  <Save size={18} />
                </button>
                <button
                  onClick={cancelEdit}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <XCircle size={18} />
                </button>
              </div>
              {showLocationDropdown && (
                <div className="absolute top-full left-0 w-full bg-white border border-blue-200 rounded-lg mt-1 max-h-48 overflow-y-auto z-10 shadow-sm">
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((country) => (
                      <div
                        key={country}
                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 transition-colors duration-200"
                        onClick={() => {
                          setLocationQuery(country);
                          setFieldDraft((d) => ({ ...d, country }));
                          setShowLocationDropdown(false);
                        }}
                      >
                        {country}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">No countries found</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-blue-600" />
              <span className="text-gray-800 text-sm">{profile.country || "Not specified"}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-blue-900">Education</div>
            {editingField !== "education" && (
              <button
                onClick={() => startEdit("education")}
                className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>
          {editingField === "education" ? (
            <div className="flex flex-col gap-2">
              {(fieldDraft.education || []).map((edu, i) => (
                <div key={i} className="flex flex-col gap-2 bg-blue-50 p-2 rounded-md border border-blue-200">
                  <div className="flex gap-2 items-center flex-wrap">
                    <input
                      className="border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-1 py-0.5 rounded text-xs w-24"
                      value={edu.course || ""}
                      onChange={(e) => handleArrayChange("education", i, e.target.value, "course")}
                      placeholder="Course"
                    />
                    <input
                      className="border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-1 py-0.5 rounded text-xs w-24"
                      value={edu.branch || ""}
                      onChange={(e) => handleArrayChange("education", i, e.target.value, "branch")}
                      placeholder="Branch"
                    />
                    <input
                      className="border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-1 py-0.5 rounded text-xs w-24"
                      value={edu.college || ""}
                      onChange={(e) => handleArrayChange("education", i, e.target.value, "college")}
                      placeholder="College"
                    />
                    <input
                      className="border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-1 py-0.5 rounded text-xs w-20"
                      value={edu.city || ""}
                      onChange={(e) => handleArrayChange("education", i, e.target.value, "city")}
                      placeholder="City"
                    />
                    <input
                      className="border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-1 py-0.5 rounded text-xs w-16"
                      value={edu.passingYear || ""}
                      onChange={(e) => handleArrayChange("education", i, e.target.value, "passingYear")}
                      placeholder="Year"
                    />
                    <button
                      onClick={() => handleArrayRemove("education", i)}
                      className="text-red-500 hover:text-red-700 transition-colors duration-200"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => handleArrayAdd("education", { course: "", branch: "", college: "", city: "", passingYear: "" })}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs mt-1 transition-colors duration-200"
              >
                <Plus size={14} /> Add Education
              </button>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleSave("education")}
                  className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 flex items-center gap-1 transition-colors duration-200"
                >
                  <Save size={16} /> Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="bg-gray-300 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-400 flex items-center gap-1 transition-colors duration-200"
                >
                  <XCircle size={16} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-gray-800 text-sm">
              {(profile.education && profile.education.length > 0) ? (
                profile.education.map((edu, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <GraduationCap size={16} className="text-blue-600" />
                    <span>
                      {edu.course ? `${edu.course}` : ""}
                      {edu.branch ? `, ${edu.branch}` : ""}
                      {edu.college ? `, ${edu.college}` : ""}
                      {edu.city ? `, ${edu.city}` : ""}
                      {edu.passingYear ? ` (${edu.passingYear})` : ""}
                    </span>
                  </div>
                ))
              ) : (
                <span>Not specified</span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {/* Apply as Tutor / Verified Tutor Button */}
        {(user?.isTutor === true) ? (
          <button
            type="button"
            className="group relative px-5 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-0.5 flex items-center justify-center gap-3 overflow-hidden bg-red-600 hover:bg-red-700 text-white border-2 border-red-300"
            onClick={async () => {
              const confirmed = window.confirm('Unregister as Tutor? This will switch your role to learner and disable tutor features.');
              if (!confirmed) return;
                try {
                const { BACKEND_URL } = await import('../../config.js');
                const res = await fetch(`${BACKEND_URL}/api/auth/unregister-tutor`, {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                });
                if (!res.ok) {
                  const err = await res.json().catch(() => ({ message: 'Request failed' }));
                  alert(err.message || 'Failed to unregister as tutor');
                  return;
                }
                const data = await res.json();
                alert('You are now a learner. Tutor features disabled.');
                // Refetch fresh profile to ensure global consistency
                try {
                  const refetch = await fetch(`${BACKEND_URL}/api/auth/user/profile`, { credentials: 'include' });
                  if (refetch.ok) {
                    const fresh = await refetch.json();
                    // update global auth context too
                    setUser(prev => ({ ...(prev || {}), ...fresh }));
                    if (typeof onSaveEdit === 'function') {
                      onSaveEdit(fresh);
                    }
                  } else {
                    if (typeof onSaveEdit === 'function') {
                      onSaveEdit({ ...profile, isTutor: false, role: 'learner' });
                    }
                  }
                } catch {
                  if (typeof onSaveEdit === 'function') {
                    onSaveEdit({ ...profile, isTutor: false, role: 'learner' });
                  }
                }
              } catch (e) {
                alert('Network error while unregistering as tutor');
              }
            }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-sm font-bold">Unregister as Tutor</span>
          </button>
        ) : tutorStatus.appStatus === 'approved' && tutorStatus.activationRemainingMs > 0 ? (
          <div className="px-5 py-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 shadow-sm flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>
            <span className="text-sm font-medium">{countdownText || 'Unlocks soon'}</span>
          </div>
        ) : tutorStatus.appStatus === 'pending' ? (
          <div className="px-5 py-4 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-800 shadow-sm flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>
            <span className="text-sm font-medium">Pending review</span>
          </div>
        ) : (
          <button
            className="group relative px-5 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-0.5 flex items-center justify-center gap-3 overflow-hidden"
            style={{ 
              background: 'linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(37, 99, 235) 100%)',
              border: '3px solid rgba(59, 130, 246, 0.5)',
              boxShadow: '0 0 20px rgba(30, 58, 138, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgb(37, 99, 235) 0%, rgb(59, 130, 246) 100%)';
              e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.8)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(37, 99, 235, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(37, 99, 235) 100%)';
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(30, 58, 138, 0.3)';
            }}
            onClick={() => navigate('/tutor/apply')}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:translate-x-full transition-all duration-700"></div>
            <svg 
              className="w-6 h-6 text-white transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 relative z-10" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
              <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
              <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
            </svg>
            <span className="text-sm font-bold text-white relative z-10 tracking-wide">Apply as Tutor</span>
            <svg 
              className="w-5 h-5 text-white transition-transform duration-300 group-hover:translate-x-2 relative z-10" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              strokeWidth={3}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M13 7l5 5m0 0l-5 5m5-5H6" 
              />
            </svg>
          </button>
        )}
        
        <button
          className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-800 flex items-center justify-center gap-2 text-sm font-medium transition-colors duration-200"
          onClick={() => {}}
        >
          Invite Your Friends
        </button>
        <button
          className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-800 flex items-center justify-center gap-2 text-sm font-medium transition-colors duration-200"
          onClick={() => {}}
        >
          <Settings2 size={16} />
          Account Settings
        </button>
      </div>
    </div>
  );
};

export default SidebarCard;
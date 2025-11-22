import React, { useState, useEffect, useRef } from "react";
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
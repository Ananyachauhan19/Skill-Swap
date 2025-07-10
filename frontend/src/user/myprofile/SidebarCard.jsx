import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  GraduationCap,
  Edit2,
  Save,
  XCircle,
  Mail,
  UserPlus,
  Settings2,
} from "lucide-react";

// List of all countries (ISO 3166, short version)
const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo (Congo-Brazzaville)",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czechia",
  "Democratic Republic of the Congo",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar (Burma)",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine State",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
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
  handleEditProfile,
  handleSaveProfile,
  handleCancelEdit,
  editMode,
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
    ? COUNTRIES.filter((c) =>
        c.toLowerCase().includes(locationQuery.toLowerCase())
      )
    : COUNTRIES;

  useEffect(() => {
    if (editingField === "location") {
      setLocationQuery(fieldDraft.location || "");
    }
  }, [editingField, fieldDraft.location]);

  useEffect(() => {
    if (!showLocationDropdown) return;
    function handleClick(e) {
      if (
        locationInputRef.current &&
        !locationInputRef.current.contains(e.target)
      ) {
        setShowLocationDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showLocationDropdown]);

  // --- Async check for userId uniqueness ---
  const checkUserIdUnique = async (userId) => {
    if (!userId) return;
    try {
      // Simulate backend check with static response
      const staticResponse = { available: userId !== "taken_id" };
      if (!staticResponse.available) {
        setUserIdError(`${userId} already in use, try another.`);
      } else {
        setUserIdError("");
      }
      // Uncomment for actual backend integration
      /*
      const res = await fetch(`/api/user/check-userid?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (!data.available) {
        setUserIdError(`${userId} already in use, try another.`);
      } else {
        setUserIdError('');
      }
      */
    } catch {
      setUserIdError("Could not verify user ID.");
    }
  };

  // --- Get email directly from profile ---
  const getBestEmail = () => {
    return profile.email || "Not provided";
  };

  // --- Handler for saving profile fields ---
  const handleSave = (field) => {
    saveEdit(field);
    if (onSaveEdit) onSaveEdit({ ...profile, ...fieldDraft });
  };

  return (
    <div
      className={`w-full md:w-1/4 bg-white rounded-2xl shadow-lg border border-blue-100 p-6 sm:p-8 flex flex-col gap-8 md:-ml-6 ${
        editMode ? "ring-2 ring-blue-400" : ""
      }`}
    >
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-6">
  {profile.profilePicPreview && typeof profile.profilePicPreview === 'string' && profile.profilePicPreview.startsWith('http') ? (
    <img
      src={profile.profilePicPreview}
      alt="Profile"
      className="w-full h-full rounded-full object-cover border-2 border-blue-600"
      onError={() => {
        console.log('Image failed to load:', profile.profilePicPreview);
        setProfile((prev) => ({ ...prev, profilePicPreview: null }));
      }}
    />
  ) : (
    <div className="w-full h-full rounded-full bg-blue-200 flex items-center justify-center text-2xl font-bold text-blue-900">
      {profile.fullName
        ? profile.fullName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "U"}
    </div>
  )}
  <input
    type="file"
    accept="image/jpeg,image/png,image/gif"
    onChange={(e) => {
      console.log('File input triggered, files:', e.target.files);
      handleProfilePicChange(e);
    }}
    className="absolute inset-0 opacity-0 cursor-pointer"
    title="Upload Profile Picture"
    ref={fileInputRef}
    style={{ zIndex: 2 }}
  />
  <button
    type="button"
    onClick={() => {
      console.log('Edit button clicked');
      fileInputRef.current?.click();
    }}
    className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1 hover:bg-blue-800"
    style={{ zIndex: 3 }}
    title="Edit Profile Picture"
  >
    <Edit2 size={16} />
  </button>
</div>
        {editingField === "fullName" ? (
          <div className="flex items-center gap-2 w-full">
            <input
              className="text-lg sm:text-xl font-semibold text-blue-900 text-center break-words border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-2 py-1 rounded w-full"
              value={fieldDraft.fullName}
              onChange={(e) =>
                setFieldDraft((d) => ({ ...d, fullName: e.target.value }))
              }
              placeholder="Your Name"
            />
            <button
              onClick={() => handleSave("fullName")}
              className="text-green-600 hover:text-green-800"
            >
              <Save size={18} />
            </button>
            <button
              onClick={cancelEdit}
              className="text-gray-400 hover:text-gray-600"
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
              className="text-blue-600 hover:text-blue-800"
            >
              <Edit2 size={18} />
            </button>
          </div>
        )}
        {editingField === "userId" ? (
          <div className="flex items-center gap-2 w-full">
            <input
              className="border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-1 py-0.5 rounded text-xs text-gray-700 w-32 text-center"
              value={fieldDraft.userId}
              onChange={async (e) => {
                setFieldDraft((d) => ({ ...d, userId: e.target.value }));
                await checkUserIdUnique(e.target.value);
              }}
              placeholder="User ID"
            />
            <button
              onClick={() => handleSave("userId")}
              className="text-green-600 hover:text-green-800"
              disabled={!!userIdError}
            >
              <Save size={16} />
            </button>
            <button
              onClick={cancelEdit}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle size={16} />
            </button>
            {userIdError && (
              <span className="text-xs text-red-500 ml-2">{userIdError}</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full">
            <p className="text-xs text-gray-500 mb-1 text-center break-all flex-1">
              User ID: {profile.userId || "Not set"}
            </p>
            <button
              onClick={() => startEdit("userId")}
              className="text-blue-600 hover:text-blue-800"
            >
              <Edit2 size={16} />
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
          <Mail size={16} /> Email
        </label>
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-700 break-all flex-1">
            {getBestEmail()}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
          <MapPin size={16} /> Location
        </label>
        {editingField === "location" ? (
          <div
            className="relative flex items-center gap-2"
            ref={locationInputRef}
          >
            <input
              className="flex-1 border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-2 py-1 rounded text-sm text-gray-700"
              value={locationQuery}
              onChange={(e) => {
                setLocationQuery(e.target.value);
                setFieldDraft((d) => ({ ...d, location: e.target.value }));
                setShowLocationDropdown(true);
              }}
              placeholder="Type to search country"
              onFocus={() => setShowLocationDropdown(true)}
              autoComplete="off"
            />
            <button
              onClick={() => handleSave("location")}
              className="text-green-600 hover:text-green-800"
            >
              <Save size={16} />
            </button>
            <button
              onClick={cancelEdit}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle size={16} />
            </button>
            {showLocationDropdown && filteredCountries.length > 0 && (
              <div className="absolute left-0 top-full z-10 w-full bg-white border border-blue-200 rounded shadow max-h-48 overflow-y-auto mt-1">
                {filteredCountries.slice(0, 50).map((country) => (
                  <div
                    key={country}
                    className="px-3 py-1 hover:bg-blue-100 cursor-pointer text-sm text-gray-700"
                    onClick={() => {
                      setFieldDraft((d) => ({ ...d, location: country }));
                      setLocationQuery(country);
                      setShowLocationDropdown(false);
                    }}
                  >
                    {country}
                  </div>
                ))}
                {filteredCountries.length > 50 && (
                  <div className="px-3 py-1 text-xs text-gray-400">
                    Showing first 50 results...
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-700 break-all flex-1">
              {profile.location || "Not specified"}
            </p>
            <button
              onClick={() => startEdit("location")}
              className="text-blue-600 hover:text-blue-800"
            >
              <Edit2 size={16} />
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
  <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><GraduationCap size={16}/> Education</label>
  {editingField === 'education' ? (
    <div className="flex flex-col gap-2">
      <input
        className="border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-2 py-1 rounded text-sm text-gray-700"
        value={fieldDraft.course || ''}
        onChange={e => setFieldDraft(d => ({ ...d, course: e.target.value }))}
        placeholder="Course (e.g. B.Tech)"
      />
      <input
        className="border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-2 py-1 rounded text-sm text-gray-700"
        value={fieldDraft.branch || ''}
        onChange={e => setFieldDraft(d => ({ ...d, branch: e.target.value }))}
        placeholder="Branch (e.g. Computer Science)"
      />
      <input
        className="border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-2 py-1 rounded text-sm text-gray-700"
        value={fieldDraft.college || ''}
        onChange={e => setFieldDraft(d => ({ ...d, college: e.target.value }))}
        placeholder="College Name"
      />
      <input
        className="border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-2 py-1 rounded text-sm text-gray-700"
        value={fieldDraft.city || ''}
        onChange={e => setFieldDraft(d => ({ ...d, city: e.target.value }))}
        placeholder="City"
      />
      <input
        className="border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-2 py-1 rounded text-sm text-gray-700"
        value={fieldDraft.passingYear || ''}
        onChange={e => setFieldDraft(d => ({ ...d, passingYear: e.target.value }))}
        placeholder="Passing Year"
        type="number"
        min="1950"
        max={new Date().getFullYear() + 10}
      />
      <div className="flex gap-2 mt-2">
        <button onClick={() => handleSave('education')} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 flex items-center gap-1"><Save size={16}/>Save</button>
        <button onClick={cancelEdit} className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400 flex items-center gap-1"><XCircle size={16}/>Cancel</button>
      </div>
    </div>
  ) : (
    <div className="flex items-center gap-2 w-full">
      {profile.education && Array.isArray(profile.education) && profile.education.length > 0 ? (
        <div className="text-sm text-gray-700 break-all flex-1 flex flex-col">
          {profile.education[0].course && <span>{profile.education[0].course}</span>}
          {profile.education[0].branch && <span>{profile.education[0].branch}</span>}
          {profile.education[0].college && <span>{profile.education[0].college}</span>}
          {profile.education[0].city && <span>{profile.education[0].city}</span>}
          {profile.education[0].passingYear && <span>{profile.education[0].passingYear}</span>}
        </div>
      ) : (
        <span className="text-gray-400 flex-1">Not provided</span>
      )}
      <button onClick={() => startEdit('education')} className="text-blue-600 hover:text-blue-800"><Edit2 size={16}/></button>
    </div>
  )}
</div>
      <div className="flex flex-col gap-2 mt-4">
        <button
          onClick={() => (window.location.href = "/settings/referral-program")}
          className="flex items-center gap-2 text-blue-700 hover:text-blue-900 transition font-medium"
        >
          <UserPlus size={18} />
          Invite Your Friends
        </button>
        <button
          onClick={() => (window.location.href = "/accountSettings")}
          className="flex items-center gap-2 text-blue-700 hover:text-blue-900 transition font-medium"
        >
          <Settings2 size={18} />
          Account Settings
        </button>
      </div>
    </div>
  );
};

export default SidebarCard;

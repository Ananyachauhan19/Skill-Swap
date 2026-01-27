import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { FiArrowLeft, FiUser, FiMail, FiMapPin } from 'react-icons/fi';
import { BACKEND_URL } from '../config.js';

// Read-only versions of profile sections
const ReadOnlySidebarCard = ({ profile }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-4">
      {/* Profile Picture */}
      <div className="flex justify-center mb-4">
        {profile.profilePic ? (
          <img
            src={profile.profilePic}
            alt={profile.fullName}
            className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-100"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-blue-100">
            {profile.firstName?.[0]}{profile.lastName?.[0]}
          </div>
        )}
      </div>

      {/* User Name */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">{profile.fullName}</h2>
        <p className="text-sm text-gray-600">@{profile.userId}</p>
      </div>

      {/* Basic Info */}
      <div className="space-y-3 text-sm">
        {profile.email && (
          <div className="flex items-center gap-2 text-gray-700">
            <FiMail className="w-4 h-4 text-gray-400" />
            <span className="truncate">{profile.email}</span>
          </div>
        )}
        {profile.country && (
          <div className="flex items-center gap-2 text-gray-700">
            <FiMapPin className="w-4 h-4 text-gray-400" />
            <span>{profile.country}</span>
          </div>
        )}
      </div>

      {/* Skills to Teach */}
      {profile.skillsToTeach && profile.skillsToTeach.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Skills to Teach</h3>
          <div className="flex flex-wrap gap-1.5">
            {profile.skillsToTeach.map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-blue-50 text-blue-800 text-[10px] rounded-full border border-blue-200"
              >
                {skill.class && `${skill.class} • `}
                {skill.subject}
                {skill.topic && skill.topic !== "ALL" && ` - ${skill.topic}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Skills to Learn */}
      {profile.skillsToLearn && profile.skillsToLearn.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Skills to Learn</h3>
          <div className="flex flex-wrap gap-1.5">
            {profile.skillsToLearn.map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-purple-50 text-purple-800 text-[10px] rounded-full border border-purple-200"
              >
                {skill.class && `${skill.class} • `}
                {skill.subject}
                {skill.topic && skill.topic !== "ALL" && ` - ${skill.topic}`}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ReadOnlyCoinsBadges = ({ profile }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-bold text-gray-900 mb-3">SkillCoins & Badges</h3>
      <div className="grid grid-cols-2 gap-3">
        {/* Bronze Coins */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-600 mb-1">Bronze Coins</div>
          <div className="text-2xl font-bold text-amber-700">
            {profile.bronzeCoins || 0}
          </div>
        </div>

        {/* Silver Coins */}
        <div className="bg-gray-100 border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-600 mb-1">Silver Coins</div>
          <div className="text-2xl font-bold text-gray-700">
            {profile.silverCoins || 0}
          </div>
        </div>
      </div>

      {/* Badges */}
      {profile.badges && profile.badges.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Badges</div>
          <div className="flex flex-wrap gap-2">
            {profile.badges.map((badge, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold rounded-full"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Rank */}
      {profile.rank && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Rank</div>
          <span className="inline-block px-4 py-2 bg-gradient-to-r from-orange-400 to-red-500 text-white text-sm font-bold rounded-lg">
            {profile.rank}
          </span>
        </div>
      )}
    </div>
  );
};

const ReadOnlyAboutSection = ({ profile }) => {
  if (!profile.bio) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-bold text-gray-900 mb-3">About</h3>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
    </div>
  );
};

const ReadOnlyUserInfoSection = ({ profile }) => {
  const hasEducation = profile.education && profile.education.length > 0;
  const hasExperience = profile.experience && profile.experience.length > 0;
  const hasCertificates = profile.certificates && profile.certificates.length > 0;

  if (!hasEducation && !hasExperience && !hasCertificates) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-bold text-gray-900 mb-4">Education & Experience</h3>

      {/* Education */}
      {hasEducation && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Education</h4>
          <div className="space-y-2">
            {profile.education.map((edu, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-sm font-semibold text-gray-900">
                  {edu.course}
                  {edu.branch && ` - ${edu.branch}`}
                </div>
                {edu.college && (
                  <div className="text-xs text-gray-600 mt-1">{edu.college}</div>
                )}
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  {edu.city && <span>{edu.city}</span>}
                  {edu.passingYear && (
                    <>
                      {edu.city && <span>•</span>}
                      <span>Batch of {edu.passingYear}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {hasExperience && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Experience</h4>
          <div className="space-y-2">
            {profile.experience.map((exp, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-sm font-semibold text-gray-900">{exp.position}</div>
                {exp.company && (
                  <div className="text-xs text-gray-600 mt-1">{exp.company}</div>
                )}
                {exp.duration && (
                  <div className="text-xs text-gray-500 mt-1">{exp.duration}</div>
                )}
                {exp.description && (
                  <p className="text-xs text-gray-700 mt-2">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificates */}
      {hasCertificates && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Certificates</h4>
          <div className="space-y-2">
            {profile.certificates.map((cert, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-sm font-semibold text-gray-900">{cert.name}</div>
                {cert.issuer && (
                  <div className="text-xs text-gray-600 mt-1">{cert.issuer}</div>
                )}
                {cert.date && (
                  <div className="text-xs text-gray-500 mt-1">{cert.date}</div>
                )}
                {cert.url && (
                  <a
                    href={cert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                  >
                    View Certificate →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ReadOnlySocialLinksSection = ({ profile }) => {
  const hasLinks = profile.linkedin || profile.website || profile.github || profile.twitter;

  if (!hasLinks) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-bold text-gray-900 mb-3">Social Links</h3>
      <div className="space-y-2">
        {profile.linkedin && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600 w-20">LinkedIn:</span>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline truncate"
            >
              {profile.linkedin}
            </a>
          </div>
        )}
        {profile.github && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600 w-20">GitHub:</span>
            <a
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline truncate"
            >
              {profile.github}
            </a>
          </div>
        )}
        {profile.twitter && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600 w-20">Twitter:</span>
            <a
              href={profile.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline truncate"
            >
              {profile.twitter}
            </a>
          </div>
        )}
        {profile.website && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600 w-20">Website:</span>
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline truncate"
            >
              {profile.website}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminUserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user profile by userId
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${BACKEND_URL}/api/admin/users/profile/${userId}`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to fetch user profile');
        }

        const user = await res.json();

        setProfile({
          _id: user._id || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          fullName: user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.firstName || user.username || '',
          userId: user.username || '',
          email: user.email || '',
          profilePic: user.profilePic || user.profileImageUrl || '',
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
          bronzeCoins: user.bronzeCoins || 0,
          silverCoins: user.silverCoins || 0,
          badges: user.badges || [],
          rank: user.rank || '',
        });
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600">Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-md w-full text-center">
          <div className="text-red-600 text-4xl mb-3">⚠️</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Failed to Load Profile</h2>
          <p className="text-sm text-gray-600 mb-4">{error || 'User not found'}</p>
          <button
            onClick={() => navigate('/admin/users')}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <Toaster position="top-center" />
      
      {/* Header with Back Button */}
      <div className="max-w-7xl mx-auto mb-4">
        <button
          onClick={() => navigate('/admin/users')}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Users
        </button>
      </div>

      {/* Admin Badge */}
      <div className="max-w-7xl mx-auto mb-4">
        <div className="bg-blue-100 border border-blue-300 rounded-lg px-4 py-2 flex items-center gap-2">
          <FiUser className="w-4 h-4 text-blue-700" />
          <span className="text-xs font-semibold text-blue-900">
            Viewing as Admin • Read-Only Mode
          </span>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="md:w-1/4">
          <ReadOnlySidebarCard profile={profile} />
        </div>

        {/* Main Content */}
        <div className="md:w-3/4 flex flex-col gap-6">
          <ReadOnlyCoinsBadges profile={profile} />
          <ReadOnlyAboutSection profile={profile} />
          <ReadOnlyUserInfoSection profile={profile} />
          <ReadOnlySocialLinksSection profile={profile} />
        </div>
      </div>
    </div>
  );
};

export default AdminUserProfile;

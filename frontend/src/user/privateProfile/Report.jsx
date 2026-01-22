import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../../config";
import { useAuth } from "../../context/AuthContext.jsx";
import { motion } from "framer-motion";
import { 
  FaExclamationTriangle, 
  FaUserShield, 
  FaVideo, 
  FaArrowLeft,
  FaCheckCircle,
  FaHandshake
} from "react-icons/fa";
import { MdReport } from "react-icons/md";

const ReportPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const video = state?.video;
  const reportedUser = state?.user || state?.reportedUser;
  const requestData = state?.request;
  const isReceived = state?.isReceived;
  
  const reportType = video ? "video" : requestData ? "request" : "account";

  const [email, setEmail] = useState("");
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [other, setOther] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const issuesForVideo = [
    { label: "Inappropriate content", icon: "🚫" },
    { label: "Misleading or spam", icon: "⚠️" },
    { label: "Hate speech or abuse", icon: "💢" },
    { label: "Copyright violation", icon: "©️" },
    { label: "Violence or dangerous acts", icon: "⛔" },
  ];
  
  const issuesForRequest = [
    { label: "Inappropriate behavior", icon: "🚫" },
    { label: "Spam or misleading request", icon: "⚠️" },
    { label: "Harassment or abuse", icon: "💢" },
    { label: "No-show or ghosting", icon: "👻" },
    { label: "Unprofessional conduct", icon: "⛔" },
    { label: "Other issue", icon: "❓" },
  ];
  
  const issues = reportType === "request" ? issuesForRequest : issuesForVideo;

  const handleCheckboxChange = (issue) => {
    setSelectedIssues((prev) =>
      prev.includes(issue)
        ? prev.filter((item) => item !== issue)
        : [...prev, issue]
    );
  };

  // Auto-fill reporter email from logged-in user
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedIssues.length === 0) {
      alert("Please select at least one issue.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        type: reportType,
        email,
        issues: selectedIssues,
        otherDetails: other,
        video: reportType === "video" ? video : undefined,
        request: reportType === "request" ? requestData : undefined,
        reportedUser: reportType === "account" || reportType === "request" ? reportedUser : undefined,
        isReceived: reportType === "request" ? isReceived : undefined,
      };

      const res = await fetch(`${BACKEND_URL}/api/report`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to submit report");
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        navigate(-1);
      }, 2000);
    } catch (err) {
      alert(err.message || "Failed to submit report");
      setIsSubmitting(false);
    }
  };

  const isFormValid = email && selectedIssues.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 py-6 px-3 sm:py-10 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="mb-4 sm:mb-6 flex items-center gap-2 text-gray-600 hover:text-blue-700 transition-colors duration-200 group"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-200" />
          <span className="text-sm sm:text-base font-medium">Back</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header Section */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-4 py-6 sm:px-8 sm:py-8">
            <div className="flex items-center gap-3 sm:gap-4 mb-3">
              <div className="bg-white/20 backdrop-blur-sm p-3 sm:p-4 rounded-full">
                <MdReport className="text-white text-2xl sm:text-3xl" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-white">
                  {reportType === "video" ? "Report Video" : reportType === "request" ? "Report Request" : "Report User Account"}
                </h1>
                <p className="text-red-100 text-xs sm:text-sm mt-1">
                  Help us maintain a safe community
                </p>
              </div>
            </div>
          </div>

          {/* Info Alert */}
          <div className="mx-4 sm:mx-8 mt-4 sm:mt-6 bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 rounded-r-lg">
            <div className="flex items-start gap-2 sm:gap-3">
              <FaExclamationTriangle className="text-blue-600 mt-0.5 flex-shrink-0 text-sm sm:text-base" />
              <div>
                <p className="text-xs sm:text-sm text-blue-900 font-medium">
                  Reports are reviewed by our admin team
                </p>
                <p className="text-xs sm:text-sm text-blue-700 mt-1">
                  All reports are sent to{" "}
                  <span className="font-semibold">info@skillswaphub.in</span>
                </p>
              </div>
            </div>
          </div>

          {/* Reported Content Info */}
          {reportType === "video" && video && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-4 sm:mx-8 mt-4 sm:mt-6 p-4 sm:p-5 border-2 border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-white hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="bg-red-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                  <FaVideo className="text-red-600 text-lg sm:text-xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate mb-1">
                    {video.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Owner: <span className="font-medium">@{video.userId}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {reportType === "account" && reportedUser && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-4 sm:mx-8 mt-4 sm:mt-6 p-4 sm:p-5 border-2 border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-white hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="bg-red-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                  <FaUserShield className="text-red-600 text-lg sm:text-xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate mb-1">
                    {reportedUser.fullName || reportedUser.name || reportedUser.username || "User"}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Username: <span className="font-medium">@{reportedUser.username || reportedUser.userId || reportedUser._id}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {reportType === "request" && requestData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-4 sm:mx-8 mt-4 sm:mt-6 p-4 sm:p-5 border-2 border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-white hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="bg-red-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                  <FaHandshake className="text-red-600 text-lg sm:text-xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                    {requestData.type === 'interview' ? 'Interview Request' : 
                     requestData.type === 'expert' ? 'Expert Session Request' : 
                     requestData.type === 'skillmate' ? 'SkillMate Request' : 'Session Request'}
                  </h3>
                  <div className="space-y-1.5 text-xs sm:text-sm text-gray-600">
                    {requestData.company && (
                      <p><span className="font-medium">Company:</span> {requestData.company}</p>
                    )}
                    {requestData.position && (
                      <p><span className="font-medium">Position:</span> {requestData.position}</p>
                    )}
                    {requestData.subject && (
                      <p><span className="font-medium">Subject:</span> {requestData.subject}</p>
                    )}
                    {requestData.topic && (
                      <p><span className="font-medium">Topic:</span> {requestData.topic}</p>
                    )}
                    <p><span className="font-medium">Status:</span> {requestData.status}</p>
                    {reportedUser && (
                      <p><span className="font-medium">{isReceived ? 'Requester' : 'Recipient'}:</span> @{reportedUser.username || reportedUser.userId || reportedUser._id}</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-5 sm:space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                Your Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="youremail@example.com"
                disabled={!!user?.email}
              />
            </div>

            {/* Problem List */}
            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-3">
                What is the problem? <span className="text-red-500">*</span>
                <span className="text-xs sm:text-sm font-normal text-gray-500 ml-2">
                  (Select all that apply)
                </span>
              </label>
              <div className="space-y-2 sm:space-y-3">
                {issues.map((issue, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`flex items-center p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedIssues.includes(issue.label)
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                    onClick={() => handleCheckboxChange(issue.label)}
                  >
                    <input
                      type="checkbox"
                      id={`issue-${idx}`}
                      checked={selectedIssues.includes(issue.label)}
                      onChange={() => handleCheckboxChange(issue.label)}
                      className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer flex-shrink-0"
                    />
                    <label
                      htmlFor={`issue-${idx}`}
                      className="ml-3 flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-gray-800 font-medium cursor-pointer flex-1"
                    >
                      <span className="text-lg sm:text-xl">{issue.icon}</span>
                      <span>{issue.label}</span>
                    </label>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Other Text Field */}
            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                Additional Details <span className="text-gray-500 text-xs sm:text-sm font-normal">(Optional)</span>
              </label>
              <textarea
                rows={4}
                value={other}
                onChange={(e) => setOther(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                placeholder="Explain the issue in more detail to help us understand better..."
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <motion.button
                type="button"
                onClick={() => navigate(-1)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 border-2 border-gray-300"
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                disabled={!isFormValid || isSubmitting || submitSuccess}
                whileHover={isFormValid && !isSubmitting ? { scale: 1.02 } : {}}
                whileTap={isFormValid && !isSubmitting ? { scale: 0.98 } : {}}
                className={`w-full sm:flex-1 px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${
                  isFormValid && !isSubmitting && !submitSuccess
                    ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {submitSuccess ? (
                  <>
                    <FaCheckCircle className="text-lg sm:text-xl" />
                    <span>Report Submitted!</span>
                  </>
                ) : isSubmitting ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <MdReport className="text-lg sm:text-xl" />
                    <span>Submit Report</span>
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 sm:mt-6 text-center px-4"
        >
          <p className="text-xs sm:text-sm text-gray-600">
            Your report helps keep SkillSwap safe for everyone. Thank you for your vigilance.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ReportPage;

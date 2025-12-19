import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../../config";
import { useAuth } from "../../context/AuthContext.jsx";

const ReportPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const video = state?.video;
  const reportedUser = state?.user || state?.reportedUser;
  const reportType = video ? "video" : "account";

  const [email, setEmail] = useState("");
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [other, setOther] = useState("");

  const issues = [
    "Inappropriate content",
    "Misleading or spam",
    "Hate speech or abuse",
    "Copyright violation",
    "Violence or dangerous acts",
  ];

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

    try {
      const payload = {
        type: reportType,
        email,
        issues: selectedIssues,
        otherDetails: other,
        video: reportType === "video" ? video : undefined,
        reportedUser: reportType === "account" ? reportedUser : undefined,
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

      alert("Report submitted successfully! Our team will review it at skillswaphubb@gmail.com.");
      navigate(-1);
    } catch (err) {
      alert(err.message || "Failed to submit report");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-2">
        {reportType === "video" ? "Report a Video" : "Report a User Account"}
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        Reports are sent to <span className="font-semibold">skillswaphubb@gmail.com</span> and reviewed by the admin team.
      </p>

      {reportType === "video" && video && (
        <div className="mb-4 p-4 border rounded bg-gray-50">
          <h3 className="font-semibold text-lg truncate">{video.title}</h3>
          <p className="text-sm text-gray-600">
            Owner: @{video.userId}
          </p>
        </div>
      )}

      {reportType === "account" && reportedUser && (
        <div className="mb-4 p-4 border rounded bg-gray-50">
          <h3 className="font-semibold text-lg truncate">
            {reportedUser.fullName || reportedUser.name || reportedUser.username || "User"}
          </h3>
          <p className="text-sm text-gray-600">
            @{reportedUser.username || reportedUser.userId || reportedUser._id}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Your Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            placeholder="you@example.com"
            disabled={!!user?.email}
          />
        </div>

        {/* Problem List */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What is the problem? (Select all that apply)
          </label>
          <div className="space-y-2">
            {issues.map((issue, idx) => (
              <div key={idx} className="flex items-center">
                <input
                  type="checkbox"
                  id={`issue-${idx}`}
                  checked={selectedIssues.includes(issue)}
                  onChange={() => handleCheckboxChange(issue)}
                  className="mr-2"
                />
                <label htmlFor={`issue-${idx}`}>{issue}</label>
              </div>
            ))}
          </div>
        </div>

        {/* Other Text Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Other Details (optional)
          </label>
          <textarea
            rows={4}
            value={other}
            onChange={(e) => setOther(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            placeholder="Explain the issue in more detail..."
          />
        </div>

        {/* Submit */}
        <div className="text-right">
          <button
            type="submit"
            className="bg-red-600 text-white px-5 py-2 rounded hover:bg-red-700"
          >
            Submit Report
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportPage;

import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ReportPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const video = state?.video;

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

  const handleSubmit = (e) => {
    e.preventDefault();

    const reportData = {
      email,
      issues: selectedIssues,
      otherDetails: other,
      reportedVideo: video,
    };

    console.log("Report submitted:", reportData); // Replace with API call
    alert("Report submitted successfully!");
    navigate(-1); // Go back
  };

  return (
    <div className="max-w-xl mx-auto p-18 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Report a Video</h2>

      {video && (
        <div className="mb-4 p-4 border rounded bg-gray-50">
          <h3 className="font-semibold text-lg">{video.title}</h3>
          <p className="text-sm text-gray-600">@{video.userId}</p>
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

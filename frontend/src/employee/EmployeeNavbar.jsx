import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useEmployeeAuth } from "../context/EmployeeAuthContext.jsx";

export default function EmployeeNavbar() {
  const { employee, logout } = useEmployeeAuth();
  const location = useLocation();

  const navLinks = [
    { to: "/employee/dashboard", label: "Dashboard" },
    // Use the same category slug used by EmployeeApplicationsPage ("interview-expert")
    { to: "/employee/applications/interview-expert", label: "Interview Approvals" },
    { to: "/employee/applications/tutor", label: "Tutor Approvals" },
    // Add more links as needed
  ];

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link to="/employee/dashboard" className="font-bold text-blue-900 text-lg">
          SkillSwap Employee
        </Link>
        <div className="hidden md:flex gap-4 ml-6">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium px-2 py-1 rounded transition-colors ${
                location.pathname.startsWith(link.to)
                  ? "bg-blue-100 text-blue-900"
                  : "text-gray-700 hover:bg-blue-50"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 font-medium">
          {employee?.name || employee?.email}
        </span>
        <button
          onClick={logout}
          className="ml-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-semibold"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

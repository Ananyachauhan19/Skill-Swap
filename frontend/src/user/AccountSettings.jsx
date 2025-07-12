import React, { useState } from "react";
import {
  Mail,
  ShieldCheck,
  CreditCard,
  Settings,
  IndianRupee,
  BookOpen,
  Headphones,
  Globe,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const sections = [
  {
    title: "Contact Information",
    icon: <Mail className="w-5 h-5 text-blue-900" />,
    items: [
      "New Email Address (with verification option)",
      "New Phone Number (with OTP verification)",
    ],
  },
  {
    title: "Security & Privacy",
    icon: <ShieldCheck className="w-5 h-5 text-blue-900" />,
    items: [
      "Change Password",
      "Two-Factor Authentication (2FA)",
      "Login Activity / Active Devices",
      "Deactivate Account",
    ],
  },
  {
    title: "Payments & Subscriptions",
    icon: <CreditCard className="w-5 h-5 text-blue-900" />,
    items: [
      "Saved Payment Methods",
      "Billing History",
      "Invoices & Receipts",
      "Active Subscriptions / Packages",
      "Upgrade or Cancel Plan",
    ],
  },
  {
    title: "Platform Preferences",
    icon: <Settings className="w-5 h-5 text-blue-900" />,
    items: [
      "Theme Mode (Light/Dark)",
      "Notification Settings",
      "Email Notifications",
    ],
  },
  {
    title: "Credits & Coins",
    icon: <IndianRupee className="w-5 h-5 text-blue-900" />,
    items: [
      "Current Silver & Golden Coin Balance",
      "Coin Earning History",
      "Coin & Payment Spending History",
      "Buy More Coins / Redeem Offers",
    ],
  },
  {
    title: "Learning & Teaching Records",
    icon: <BookOpen className="w-5 h-5 text-blue-900" />,
    items: [
      "My Sessions (as Learner/Expert)",
      "Past Bookings",
      "Skill Badges / Certifications Earned",
    ],
  },
  {
    title: "Support & Feedback",
    icon: <Headphones className="w-5 h-5 text-blue-900" />,
    items: [
      "Help Center / Support Ticket",
      "Submit Feedback",
      "Report a Problem",
      "View Support History",
    ],
  },
  {
    title: "Referral & Time Zone",
    icon: <Globe className="w-5 h-5 text-blue-900" />,
    items: [
      "Referral Program (invite & earn)",
      "Time Zone Settings",
    ],
  },
];

const themeOptions = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System Default" },
];
const notificationOptions = [
  { value: "all", label: "All Notifications" },
  { value: "important", label: "Only Important" },
  { value: "none", label: "None" },
];

const AccountSettings = () => {
  const [activeSection, setActiveSection] = useState(sections[0].title);
  const [theme, setTheme] = useState("system");
  const [notification, setNotification] = useState("all");
  const navigate = useNavigate();

  const handleAction = (sectionTitle, item) => {
    const navigateMap = {
      "Email Address (with verification option)": "/settings/email",
      "New Email Address (with verification option)": "/settings/email",
      "Phone Number (with OTP verification)": "/settings/phone",
      "New Phone Number (with OTP verification)": "/settings/phone",
      "Linked Social Accounts (e.g., Google, Facebook, GitHub)": "/settings/social",
      "Change Password": "/settings/password",
      "Two-Factor Authentication (2FA)": "/settings/twofactor",
      "Login Activity / Active Devices": "/settings/activedevices",
      "Deactivate Account": "/settings/deactivate",
      "Saved Payment Methods": "/settings/payment-methods",
      "Billing History": "/settings/billing-history",
      "Invoices & Receipts": "/settings/invoices",
      "Active Subscriptions / Packages": "/settings/subscriptions",
      "Upgrade or Cancel Plan": "/settings/plan",
      "Current Silver & Golden Coin Balance": "/settings/coin-balance",
      "Coin Earning History": "/settings/coin-earning-history",
      "Coin Spending / Usage History": "/settings/coin-spending-history",
      "Buy More Coins / Redeem Offers": "/settings/buy-redeem-coins",
      "My Sessions (as Learner/Expert)": "/settings/my-sessions",
      "Past Bookings": "/settings/past-bookings",
      "Skill Badges / Certifications Earned": "/settings/skill-badges",
      "Help Center / Support Ticket": "/help",
      "Submit Feedback": "/help#contact-support",
      "Report a Problem": "/help#contact-support",
      "View Support History": "/settings/support-history",
      "Referral Program (invite & earn)": "/settings/referral-program",
      "Time Zone Settings": "/settings/timezone-settings",
    };

    if (item === "Submit Feedback" || item === "Report a Problem") {
      window.location.href = navigateMap[item];
    } else if (navigateMap[item]) {
      navigate(navigateMap[item]);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-gradient-to-b from-[#f0f6ff] to-white font-sans">
      <div className="flex flex-1 mt-[3%] gap-6">
        <aside className="sticky top-[3%] w-64 h-fit bg-blue-50/90 backdrop-blur-sm p-6 shadow-lg">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-[#00008B]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <h1 className="text-xl font-bold text-blue-900">Account Settings</h1>
          </div>
          <nav className="space-y-2">
            {sections.map((section) => (
              <button
                key={section.title}
                onClick={() => setActiveSection(section.title)}
                className={`flex items-center gap-3 p-3 rounded-lg text-gray-600 font-medium text-sm transition-all duration-300 w-full text-left ${
                  activeSection === section.title
                    ? "bg-white text-blue-900 font-semibold shadow-md"
                    : "hover:bg-blue-100 hover:translate-x-1"
                }`}
              >
                <span className="text-blue-900 text-lg">{section.icon}</span>
                <span>{section.title}</span>
              </button>
            ))}
          </nav>
          <div className="mt-4 pt-2 border-t border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              Active
            </div>
            <p className="text-xs text-gray-600 mt-1">Member since Jan 2023</p>
          </div>
        </aside>

        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            {sections
              .filter((s) => s.title === activeSection)
              .map((section) => (
                <div
                  key={section.title}
                  className="bg-white rounded-xl p-6 shadow-md border border-gray-100 animate-fade-in"
                >
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-900 to-blue-600 text-white rounded-t-lg -m-6 mb-4">
                    <span className="text-lg">{section.icon}</span>
                    <h2 className="text-lg font-bold">{section.title}</h2>
                  </div>
                  <div className="grid gap-3">
                    {section.items.map((item) => {
                      if (
                        section.title === "Platform Preferences" &&
                        item === "Theme Mode (Light/Dark)"
                      ) {
                        return (
                          <div
                            key={item}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100"
                          >
                            <div>
                              <h3 className="font-semibold text-blue-900">Theme Mode</h3>
                              <p className="text-sm text-gray-600">Customize your viewing experience</p>
                            </div>
                            <select
                              value={theme}
                              onChange={(e) => setTheme(e.target.value)}
                              className="border border-gray-200 rounded-lg p-2 text-gray-600 text-sm bg-white w-full sm:w-48"
                            >
                              {themeOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      }
                      if (
                        section.title === "Platform Preferences" &&
                        item === "Notification Settings"
                      ) {
                        return (
                          <div
                            key={item}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100"
                          >
                            <div>
                              <h3 className="font-semibold text-blue-900">Notification Settings</h3>
                              <p className="text-sm text-gray-600">Control your notification preferences</p>
                            </div>
                            <select
                              value={notification}
                              onChange={(e) => setNotification(e.target.value)}
                              className="border border-gray-200 rounded-lg p-2 text-gray-600 text-sm bg-white w-full sm:w-48"
                            >
                              {notificationOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      }
                      return (
                        <button
                          key={item}
                          onClick={() => handleAction(section.title, item)}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-100 text-gray-600 font-medium border border-gray-200 hover:bg-blue-50 hover:text-blue-900 hover:border-blue-300 hover:translate-x-1"
                        >
                          <span>{item}</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-blue-900"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AccountSettings;

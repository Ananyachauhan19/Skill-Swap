/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { BACKEND_URL } from '../config.js';
import { FiSearch, FiMail, FiMessageSquare, FiChevronDown, FiChevronUp, FiExternalLink } from "react-icons/fi";
import { FaCoins, FaUserGraduate, FaChalkboardTeacher, FaHistory, FaLock } from "react-icons/fa";
import faqs from "./faqs";

const HelpSupportPage = () => {
  // FAQ search state
  const [faqSearch, setFaqSearch] = useState("");
  const [showAllFaqs, setShowAllFaqs] = useState(false);
  // Contact form state
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [formStatus, setFormStatus] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Filtered FAQs
  const filteredFaqs = faqs.filter((faq) =>
    faq.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
    faq.answer.toLowerCase().includes(faqSearch.toLowerCase())
  );

  const visibleFaqs = showAllFaqs || faqSearch ? filteredFaqs : filteredFaqs.slice(0, 3);

  // Handle form input
  function handleFormChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Handle form submit
  async function handleFormSubmit(e) {
    e.preventDefault();
    setFormStatus("");
    if (!form.name || !form.email || !form.message) {
      setFormStatus("Please fill in all fields.");
      return;
    }
    // Simple email validation
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      setFormStatus("Please enter a valid email address.");
      return;
    }
    setFormLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/support/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to submit request");
      setFormStatus("Your request has been submitted! We'll get back to you soon.");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      setFormStatus("Failed to submit your request. Please try again later.");
    } finally {
      setFormLoading(false);
    }
  }

  useEffect(() => {
    if (window.location.hash === "#contact-support") {
      const el = document.getElementById("contact-support");
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-gray-800 bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="text-center mb-12 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-8 text-white">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Help & Support</h1>
        <p className="text-lg sm:text-xl opacity-90 max-w-3xl mx-auto">
          Find answers, get help, or contact our support team
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Pro Features: Skill Coin Packages */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex items-center mb-4">
                <FaCoins className="text-yellow-500 text-2xl mr-3" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Pro Feature: Skill Coin Packages</h2>
              </div>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mb-6 text-yellow-800">
                <p className="font-semibold mb-3">Unlock more learning and teaching opportunities with Skill Coin Packages!</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-yellow-200">
                    <h3 className="font-bold text-yellow-700 mb-2">Silver Coin Packages</h3>
                    <ul className="text-sm space-y-1">
                      <li>• Buy for live 1-on-1 sessions</li>
                      <li>• Worth: ₹0.25 per coin</li>
                      <li>• Packages coming soon!</li>
                    </ul>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-yellow-200">
                    <h3 className="font-bold text-yellow-700 mb-2">Golden Coin Packages</h3>
                    <ul className="text-sm space-y-1">
                      <li>• Buy for premium content</li>
                      <li>• Worth: ₹2 per coin</li>
                      <li>• Packages coming soon!</li>
                    </ul>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-yellow-200">
                    <h3 className="font-bold text-yellow-700 mb-2">Combo Packages</h3>
                    <ul className="text-sm space-y-1">
                      <li>• Mix of Golden & Silver</li>
                      <li>• Special discounted price</li>
                      <li>• Details coming soon!</li>
                    </ul>
                  </div>
                </div>
                <p className="mt-4 text-xs text-yellow-700">Stay tuned for more details and the ability to purchase packages directly from your dashboard!</p>
              </div>
            </div>
          </div>

          {/* How SkillSwapHub Works Section */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex items-center mb-6">
                <img src="/assets/skillswap-logo.webp" alt="SkillSwapHub" className="h-8 mr-3" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">How SkillSwapHub Works</h2>
              </div>
              
              <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
                    <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
                      <FaUserGraduate className="mr-2" /> For Learners
                    </h3>
                    <ul className="space-y-3 text-sm">
                      <li className="flex">
                        <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">1</span>
                        <span>Set up your profile with skills you want to learn</span>
                      </li>
                      <li className="flex">
                        <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">2</span>
                        <span>Book sessions using Skill Coins</span>
                      </li>
                      <li className="flex">
                        <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">3</span>
                        <span>Track your progress with the Contribution Calendar</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-purple-50 p-5 rounded-lg border border-purple-100">
                    <h3 className="font-semibold text-purple-800 mb-3 flex items-center">
                      <FaChalkboardTeacher className="mr-2" /> For Tutors
                    </h3>
                    <ul className="space-y-3 text-sm">
                      <li className="flex">
                        <span className="bg-purple-100 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">1</span>
                        <span>Showcase your expertise in your profile</span>
                      </li>
                      <li className="flex">
                        <span className="bg-purple-100 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">2</span>
                        <span>Host sessions and earn Skill Coins</span>
                      </li>
                      <li className="flex">
                        <span className="bg-purple-100 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">3</span>
                        <span>Grow your reputation with badges and ranks</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <h3 className="font-semibold text-lg mb-4 text-gray-700">Common User Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-medium mb-2 flex items-center">
                    <FaUserGraduate className="text-blue-600 mr-2" /> Profile & Privacy
                  </h4>
                  <p className="text-sm text-gray-600">Edit your profile, update skills, and adjust privacy settings.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-medium mb-2 flex items-center">
                    <FaCoins className="text-yellow-600 mr-2" /> Book Sessions
                  </h4>
                  <p className="text-sm text-gray-600">Book, edit, or cancel 1-on-1 sessions, mock interviews, or group discussions.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-medium mb-2 flex items-center">
                    <FaHistory className="text-green-600 mr-2" /> History & Payments
                  </h4>
                  <p className="text-sm text-gray-600">View your session history and payment records.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-medium mb-2 flex items-center">
                    <FaLock className="text-red-600 mr-2" /> Account Security
                  </h4>
                  <p className="text-sm text-gray-600">Reset password and manage account security.</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Frequently Asked Questions</h2>
                <div className="relative w-64">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search FAQs..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={faqSearch}
                    onChange={(e) => {
                      setFaqSearch(e.target.value);
                      setShowAllFaqs(false);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                {visibleFaqs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FiSearch className="mx-auto text-3xl mb-2" />
                    <p>No FAQs found matching your search</p>
                  </div>
                ) : (
                  visibleFaqs.map((faq, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm transition-shadow">
                      <div className="p-4">
                        <h3 className="font-medium text-gray-800">{faq.question}</h3>
                        <p className="mt-2 text-sm text-gray-600">{faq.answer}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {filteredFaqs.length > 3 && !showAllFaqs && !faqSearch && (
                <button
                  onClick={() => setShowAllFaqs(true)}
                  className="mt-6 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium flex items-center justify-center"
                >
                  Show More FAQs <FiChevronDown className="ml-2" />
                </button>
              )}
              {showAllFaqs && !faqSearch && filteredFaqs.length > 3 && (
                <button
                  onClick={() => setShowAllFaqs(false)}
                  className="mt-6 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium flex items-center justify-center"
                >
                  Show Less <FiChevronUp className="ml-2" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Contact Support */}
          <div id="contact-support" className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex items-center mb-6">
                <FiMessageSquare className="text-blue-600 text-2xl mr-3" />
                <h2 className="text-xl font-bold text-gray-800">Contact Support</h2>
              </div>
              
              <form className="space-y-4" onSubmit={handleFormSubmit}>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={form.name}
                    onChange={handleFormChange}
                    disabled={formLoading}
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={form.email}
                    onChange={handleFormChange}
                    disabled={formLoading}
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">How can we help?</label>
                  <textarea
                    id="message"
                    name="message"
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={form.message}
                    onChange={handleFormChange}
                    disabled={formLoading}
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  className={`w-full py-2 px-4 rounded-lg font-medium text-white ${formLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} transition-colors`}
                  disabled={formLoading}
                >
                  {formLoading ? 'Sending...' : 'Send Message'}
                </button>
                
                {formStatus && (
                  <div className={`mt-2 text-sm ${formStatus.includes('submitted') ? 'text-green-600' : 'text-red-600'}`}>
                    {formStatus}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Quick Help */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 sm:p-8">
              <h3 className="font-bold text-lg mb-4 text-gray-800">Quick Help</h3>
              <div className="space-y-4">
                <a href="#" className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  <FiMail className="text-blue-600 mr-3" />
                  <span>Email Support</span>
                </a>
                <a href="#" className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  <FiExternalLink className="text-blue-600 mr-3" />
                  <span>Community Forum</span>
                </a>
                <a href="#" className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  <FiExternalLink className="text-blue-600 mr-3" />
                  <span>Documentation</span>
                </a>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 sm:p-8">
              <h3 className="font-bold text-lg mb-4 text-gray-800">System Status</h3>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm">All systems operational</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Last updated: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupportPage;
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BACKEND_URL } from '../../config.js';
import { useAuth } from '../../context/AuthContext';
import { 
  FiHelpCircle, FiMail, FiMessageSquare, FiSend, 
  FiBook, FiUsers, FiSettings, FiChevronDown,
  FiCheckCircle, FiAlertCircle
} from "react-icons/fi";

const HelpSupportPage = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [formStatus, setFormStatus] = useState({ type: "", message: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("General");

  const categories = ["General", "Technical", "Billing", "Account", "Other"];

  const quickHelp = [
    {
      icon: <FiBook className="w-6 h-6" />,
      title: "Getting Started",
      description: "Learn the basics of SkillSwap Hub",
      link: "/faq"
    },
    {
      icon: <FiUsers className="w-6 h-6" />,
      title: "Community",
      description: "Join our community discussions",
      link: "/community"
    },
    {
      icon: <FiSettings className="w-6 h-6" />,
      title: "Account Settings",
      description: "Manage your account preferences",
      link: "/settings"
    }
  ];

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormStatus({ type: "", message: "" });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormStatus({ type: "", message: "" });
    
    if (!form.name || !form.email || !form.subject || !form.message) {
      setFormStatus({ type: "error", message: "Please fill in all fields." });
      return;
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      setFormStatus({ type: "error", message: "Please enter a valid email address." });
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/support/contact`, {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, category: selectedCategory }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit request");
      
      setFormStatus({ 
        type: "success", 
        message: "Your message has been sent successfully! We'll get back to you within 24-48 hours." 
      });
      setForm(prev => ({ ...prev, subject: "", message: "" }));
      setSelectedCategory("General");
    } catch (err) {
      setFormStatus({ 
        type: "error", 
        message: err.message || "Failed to send your message. Please try again later." 
      });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-blue-100/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 md:pt-[72px] xl:pt-20 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-transparent to-slate-100/50 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-800 to-blue-900 rounded-2xl mb-4 sm:mb-6 shadow-lg">
              <FiHelpCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              Help & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-blue-900">Support</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed px-4">
              We're here to help! Get answers to your questions or reach out to our support team.
            </p>
          </motion.div>

          {/* Quick Help Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto"
          >
            {quickHelp.map((item, index) => (
              <motion.a
                key={index}
                href={item.link}
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl p-5 sm:p-6 border border-gray-200 hover:border-blue-300 transition-all shadow-sm hover:shadow-lg group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center mb-4 text-blue-800 group-hover:from-blue-800 group-hover:to-blue-900 group-hover:text-white transition-all">
                  {item.icon}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600">{item.description}</p>
              </motion.a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
          >
            {/* Form Header */}
            <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-6 sm:px-8 py-6 sm:py-8">
              <div className="flex items-center gap-3 mb-2">
                <FiMessageSquare className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                  Send Us a Message
                </h2>
              </div>
              <p className="text-sm sm:text-base text-blue-100">
                Fill out the form below and we'll respond within 24-48 hours
              </p>
            </div>

            {/* Form Body */}
            <form onSubmit={handleFormSubmit} className="p-6 sm:p-8 space-y-5 sm:space-y-6">
              {/* Name & Email Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    disabled={formLoading || !!user}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleFormChange}
                    disabled={formLoading || !!user}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category *
                </label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    disabled={formLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none disabled:bg-gray-50 disabled:cursor-not-allowed bg-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <FiChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={form.subject}
                  onChange={handleFormChange}
                  disabled={formLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Brief description of your issue"
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={form.message}
                  onChange={handleFormChange}
                  disabled={formLoading}
                  rows="6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  placeholder="Describe your issue in detail..."
                ></textarea>
              </div>

              {/* Status Message */}
              <AnimatePresence>
                {formStatus.message && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex items-start gap-3 p-4 rounded-lg ${
                      formStatus.type === "success"
                        ? "bg-green-50 border border-green-200"
                        : "bg-red-50 border border-red-200"
                    }`}
                  >
                    {formStatus.type === "success" ? (
                      <FiCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <p className={`text-sm ${
                      formStatus.type === "success" ? "text-green-800" : "text-red-800"
                    }`}>
                      {formStatus.message}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={formLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <FiSend className="w-5 h-5" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Section */}
      <section className="pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
            
            <div className="relative z-10 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
                Other Ways to Reach Us
              </h2>
              <p className="text-sm sm:text-base text-blue-100 mb-6 sm:mb-8">
                Prefer email or need immediate assistance? We're here to help!
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-4 sm:px-6 sm:py-5 border border-white/20">
                  <FiMail className="w-6 h-6 text-white mx-auto mb-2" />
                  <p className="text-xs text-blue-100 mb-1">Email Us</p>
                  <p className="text-sm sm:text-base text-white font-bold">support@skillswaphub.in</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-4 sm:px-6 sm:py-5 border border-white/20">
                  <FiHelpCircle className="w-6 h-6 text-white mx-auto mb-2" />
                  <p className="text-xs text-blue-100 mb-1">Response Time</p>
                  <p className="text-sm sm:text-base text-white font-bold">24-48 Hours</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HelpSupportPage;

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  FiUsers, FiTrendingUp, FiAward, FiHeart, 
  FiTarget, FiZap, FiGlobe, FiCode, FiBriefcase,
  FiBook, FiTrendingDown, FiUserPlus, FiUserCheck, FiClipboard
} from "react-icons/fi";
import RecruitmentApplication from "./user/RecruitmentApplication";

const Career = () => {
  const navigate = useNavigate();
  const [showRecruitmentForm, setShowRecruitmentForm] = useState(false);

  const handleShowRecruitmentForm = () => {
    setShowRecruitmentForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const benefits = [
    { icon: <FiTrendingUp />, title: "Competitive Salaries", desc: "Performance bonuses & ESOPs for early team members" },
    { icon: <FiZap />, title: "Flexible Work", desc: "Remote-friendly with result-based performance" },
    { icon: <FiAward />, title: "Learning Allowance", desc: "Free premium features & upskilling support" },
    { icon: <FiGlobe />, title: "Global Impact", desc: "Shape the future of education worldwide" },
  ];

  const departments = [
    {
      icon: <FiCode className="text-3xl" />,
      title: "Technology & Product",
      roles: ["Software Developers (Frontend, Backend, Full Stack)", "AI/ML Engineers", "Data Engineers", "UI/UX Designers", "Product Managers"],
      color: "from-blue-800 to-blue-900"
    },
    {
      icon: <FiBriefcase className="text-3xl" />,
      title: "Business & Strategy",
      roles: ["Business Development Managers", "Strategic Partnerships", "Operations & Growth Managers", "Market Research Analysts"],
      color: "from-blue-700 to-blue-800"
    },
    {
      icon: <FiBook className="text-3xl" />,
      title: "Content & Education",
      roles: ["Academic Content Creators", "Video Tutors & Mentors", "Community Managers", "Instructional Designers"],
      color: "from-blue-600 to-blue-700"
    },
    {
      icon: <FiTrendingUp className="text-3xl" />,
      title: "Marketing & Creative",
      roles: ["Digital Marketing Specialists", "Brand Managers", "Video Editors", "Copywriters & Content Writers"],
      color: "from-blue-500 to-blue-600"
    },
  ];

  const values = [
    { icon: <FiZap />, title: "Innovation First", desc: "We constantly challenge the norm" },
    { icon: <FiUsers />, title: "Collaboration Over Competition", desc: "We grow by supporting one another" },
    { icon: <FiBook />, title: "Learning Culture", desc: "Every day is a new opportunity to grow" },
    { icon: <FiHeart />, title: "Impact-Driven Work", desc: "We measure success by the difference we create" },
  ];

  if (showRecruitmentForm) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowRecruitmentForm(false)}
          className="fixed top-20 left-4 z-50 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors shadow-lg"
        >
          ← Back to Careers
        </button>
        <RecruitmentApplication />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-blue-100/20">
      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-16 md:pb-20 px-3 sm:px-4 md:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/5 via-blue-800/5 to-blue-700/5" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto relative z-10"
        >
          <div className="text-center mb-8 sm:mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-block mb-4 sm:mb-6"
            >
              <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white px-4 py-1.5 sm:px-6 sm:py-2 rounded-full text-xs sm:text-sm font-semibold shadow-lg">
                We're Hiring! Join Our Mission
              </div>
            </motion.div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold mb-4 sm:mb-6 bg-gradient-to-r from-blue-900 to-blue-900 bg-clip-text text-transparent px-2">
              Build the Future of Learning
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 max-w-3xl mx-auto mb-6 sm:mb-8 leading-relaxed px-3 sm:px-4">
              Join SkillSwap Hub and be part of a revolutionary peer-to-peer learning ecosystem where 
              <span className="font-semibold text-blue-900"> you teach, learn, and earn</span> – all at once!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto px-2">
              <motion.button
                onClick={() => setShowRecruitmentForm(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white px-4 py-2.5 sm:px-5 sm:py-3 md:px-6 md:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <FiUserPlus className="text-base sm:text-lg md:text-xl" />
                <span className="hidden lg:inline">Tutor Verifier</span>
                <span className="lg:hidden">Verifier</span>
              </motion.button>
              <motion.button
                onClick={() => navigate('/tutor/apply')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white px-4 py-2.5 sm:px-5 sm:py-3 md:px-6 md:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <FiUserCheck className="text-base sm:text-lg md:text-xl" />
                <span className="hidden lg:inline">Apply as Tutor</span>
                <span className="lg:hidden">Tutor</span>
              </motion.button>
              <motion.button
                onClick={() => navigate('/register-interviewer')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white px-4 py-2.5 sm:px-5 sm:py-3 md:px-6 md:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <FiClipboard className="text-base sm:text-lg md:text-xl" />
                <span className="hidden lg:inline">Apply as Interviewer</span>
                <span className="lg:hidden">Interviewer</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Mission Statement */}
      <section className="py-10 sm:py-12 md:py-16 px-3 sm:px-4 md:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 px-2">Our Mission</h2>
            <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-blue-200 shadow-lg">
              <p className="text-sm sm:text-base md:text-lg text-gray-800 leading-relaxed mb-3 sm:mb-4">
                At SkillSwap Hub, we're democratizing education and empowering individuals to both 
                <span className="font-semibold text-blue-900"> share knowledge and acquire new skills</span>. 
                We're building a community where learning, teaching, and earning go hand-in-hand.
              </p>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-6">
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 rounded-full shadow">
                  <FiTarget className="text-blue-900 text-sm sm:text-base" />
                  <span className="text-xs sm:text-sm font-semibold text-blue-900">Democratize Education</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 rounded-full shadow">
                  <FiUsers className="text-blue-900 text-sm sm:text-base" />
                  <span className="text-xs sm:text-sm font-semibold text-blue-900">Empower Individuals</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 rounded-full shadow">
                  <FiGlobe className="text-blue-900 text-sm sm:text-base" />
                  <span className="text-xs sm:text-sm font-semibold text-blue-900">Build Community</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Work With Us */}
      <section className="py-10 sm:py-12 md:py-16 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">Why Join Us?</h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-3">
              Every task you do contributes directly to changing how the world learns
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
              >
                <div className="text-3xl sm:text-4xl text-blue-900 mb-3 sm:mb-4">{benefit.icon}</div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1.5 sm:mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-xs sm:text-sm">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="py-10 sm:py-12 md:py-16 px-3 sm:px-4 md:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">Open Positions</h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-3">
              We're hiring across multiple functions. Find your perfect role!
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
            {departments.map((dept, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-gray-50 to-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-r ${dept.color} text-white mb-3 sm:mb-4 shadow-lg text-xl sm:text-2xl`}>
                  {dept.icon}
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4">{dept.title}</h3>
                <ul className="space-y-1.5 sm:space-y-2">
                  {dept.roles.map((role, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 sm:gap-2 text-gray-700">
                      <span className="text-blue-900 mt-0.5 text-sm sm:text-base">•</span>
                      <span className="text-xs sm:text-sm">{role}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Internships Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-6 sm:mt-8 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-blue-200 shadow-lg"
          >
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl">
                <FiUserPlus className="text-xl sm:text-2xl md:text-3xl" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900">Internships & Campus Ambassadors</h3>
                <p className="text-xs sm:text-sm text-gray-600">Perfect for students seeking real-world startup experience</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
              <div className="bg-white rounded-lg p-3 sm:p-4 shadow">
                <p className="font-semibold text-gray-900 text-sm sm:text-base">Interns</p>
                <p className="text-xs sm:text-sm text-gray-600">Tech, Marketing, Operations, Design, Research</p>
              </div>
              <div className="bg-white rounded-lg p-3 sm:p-4 shadow">
                <p className="font-semibold text-gray-900 text-sm sm:text-base">Student Ambassadors</p>
                <p className="text-xs sm:text-sm text-gray-600">Represent SkillSwap Hub at your college/university</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-10 sm:py-12 md:py-16 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">Our Core Values</h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-3">
              The principles that guide everything we do
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-center shadow-lg border border-gray-200 hover:border-blue-900 hover:shadow-xl transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-100 text-blue-900 text-xl sm:text-2xl mb-3 sm:mb-4">
                  {value.icon}
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2">{value.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Life at SkillSwap Hub */}
      <section className="py-10 sm:py-12 md:py-16 px-3 sm:px-4 md:px-6 lg:px-8 bg-gradient-to-br from-blue-800 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-2">Life at SkillSwap Hub</h2>
            <p className="text-sm sm:text-base md:text-lg text-blue-100 max-w-2xl mx-auto px-3">
              More than just a workplace – it's where innovation meets passion
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {[
              "Brainstorm breakthrough ideas with passionate people",
              "Celebrate wins & learn from challenges together",
              "Friday fun sessions & team-building activities",
              "Fast-tracked career growth in a high-energy environment"
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                <div className="text-3xl sm:text-4xl mb-2 sm:mb-3 md:mb-4">
                  {index === 0 ? "💡" : index === 1 ? "🎉" : index === 2 ? "🎮" : "🚀"}
                </div>
                <p className="text-xs sm:text-sm">{item}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 sm:py-12 md:py-16 lg:py-20 px-3 sm:px-4 md:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-gray-100">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-5 md:mb-6 px-2">
            Ready to Make an Impact?
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-700 mb-6 sm:mb-7 md:mb-8 leading-relaxed px-3">
            At SkillSwap Hub, you don't just build a career — you build the future of learning. 
            If you're ready to be part of a global movement that empowers millions, we want to hear from you!
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto px-2">
            <motion.button
              onClick={() => setShowRecruitmentForm(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white px-4 py-3 sm:px-5 sm:py-3.5 md:px-6 md:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <FiUserPlus className="text-base sm:text-lg md:text-xl" />
              <span className="hidden lg:inline">Tutor Verifier</span>
              <span className="lg:hidden">Verifier</span>
            </motion.button>
            <motion.button
              onClick={() => navigate('/tutor/apply')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white px-4 py-3 sm:px-5 sm:py-3.5 md:px-6 md:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <FiUserCheck className="text-base sm:text-lg md:text-xl" />
              <span className="hidden lg:inline">Apply as Tutor</span>
              <span className="lg:hidden">Tutor</span>
            </motion.button>
            <motion.button
              onClick={() => navigate('/register-interviewer')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white px-4 py-3 sm:px-5 sm:py-3.5 md:px-6 md:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <FiClipboard className="text-base sm:text-lg md:text-xl" />
              <span className="hidden lg:inline">Apply as Interviewer</span>
              <span className="lg:hidden">Interviewer</span>
            </motion.button>
          </div>
          <p className="mt-6 sm:mt-7 md:mt-8 text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-900 to-blue-900 bg-clip-text text-transparent px-2">
            Teach what you know, Learn what you don't – Earn while you do! 🌍
          </p>
        </motion.div>
      </section>
    </div>
  );
};

export default Career;

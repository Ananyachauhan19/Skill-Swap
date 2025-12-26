import React, { useState, useEffect, useRef } from "react";
import {Link} from 'react-router-dom';
import { 
  ChevronDown, Users, Target, Heart, Lightbulb, Zap, 
  Globe, BookOpen, TrendingUp, Award, Star, Rocket, 
  ArrowRight, Play, Menu, X
} from "lucide-react";
import { motion } from "framer-motion";

const About = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedSection, setExpandedSection] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Globe },
    { id: "mission", label: "Mission & Vision", icon: Target },
    { id: "features", label: "What Makes Us Unique", icon: Star },
    { id: "values", label: "Core Values", icon: Heart },
    { id: "team", label: "Our Team", icon: Users },
    { id: "future", label: "Future Plans", icon: Rocket },
  ];

  const TabButton = ({ tab, isActive, onClick }) => (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`flex items-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-all duration-300 ${
        isActive
          ? "bg-[#0A2540] text-white shadow-sm"
          : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
      }`}
    >
      <tab.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
      <span className="font-semibold text-xs sm:text-sm">{tab.label}</span>
    </motion.button>
  );

  const SectionCard = ({ children, className = "" }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-white border border-gray-100 rounded-xl p-8 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}
    >
      {children}
    </motion.div>
  );

  const CollapsibleSection = ({ title, children, sectionKey }) => (
    <SectionCard>
      <motion.button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between text-left group"
      >
        <h3 className="text-lg font-semibold text-[#0A2540] group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        <motion.div
          animate={{ rotate: expandedSection === sectionKey ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown size={20} className="text-gray-600" />
        </motion.div>
      </motion.button>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ 
          height: expandedSection === sectionKey ? "auto" : 0,
          opacity: expandedSection === sectionKey ? 1 : 0
        }}
        transition={{ duration: 0.4 }}
        className="overflow-hidden"
      >
        <div className="pt-4">
          {children}
        </div>
      </motion.div>
    </SectionCard>
  );

  const TeamMemberCard = ({ name, role, description, index, image }) => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
    >
      <div className="flex items-center mb-4">
        <div className="w-14 h-14 rounded-full overflow-hidden bg-[#0A2540] flex items-center justify-center text-white font-bold text-lg mr-4">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{name.split(" ").map(n => n[0]).join("")}</span>
          )}
        </div>
        <div>
          <h4 className="font-bold text-[#0A2540] text-lg">{name}</h4>
          <p className="text-gray-600 text-sm font-medium">{role}</p>
        </div>
      </div>
      <p className="text-gray-600 leading-relaxed text-sm">{description}</p>
    </motion.div>
  );

  const FeatureCard = ({ title, description, icon, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
    >
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-[#0A2540] mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed text-sm">{description}</p>
    </motion.div>
  );

  const ValueCard = ({ title, content, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -3 }}
      className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md border border-gray-100 transition-all duration-300"
    >
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-[#0A2540] rounded-full flex items-center justify-center text-white font-bold mr-3 text-sm">
          {index + 1}
        </div>
        <h3 className="text-base font-bold text-[#0A2540]">{title}</h3>
      </div>
      <p className="text-gray-600 leading-relaxed text-sm">{content}</p>
    </motion.div>
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-home-bg pt-16 md:pt-[72px] lg:pt-20">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-[#0A2540] to-[#1e3a8a] text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBzdHJva2U9IiMzODg0ZTMiIHN0cm9rZS13aWR0aD0iMSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMTUiLz48L2c+PC9zdmc+')] opacity-10"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 tracking-tight px-2"
            >
              About <span className="text-blue-200">SkillSwap Hub</span>
            </motion.h1>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="text-sm sm:text-base md:text-lg lg:text-xl mb-6 sm:mb-8 bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 inline-block border border-white/20 max-w-4xl mx-4"
            >
              <p className="font-semibold leading-relaxed italic">
                We're bridging the gap between skills and jobs because skills are the real currency, 
                but jobs are your gateway to success
              </p>
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="text-lg sm:text-xl md:text-2xl font-medium max-w-4xl mx-auto opacity-95 mb-6 sm:mb-10 px-4"
            >
              Teach What You Know, Learn What You Don't – Earn While You Do!
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              
            </motion.div>
          </motion.div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-blue-50 to-transparent"></div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 -mt-8 relative z-20">
        {/* Mobile: Dropdown Tabs */}
        <div className="md:hidden mb-8">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg font-semibold text-gray-700 focus:outline-none focus:border-blue-600 transition-colors"
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop: Button Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden md:flex flex-wrap gap-3 lg:gap-4 justify-center mb-12"
        >
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </motion.div>

        {/* Content Sections */}
        <div ref={sectionRef} className="space-y-10 sm:space-y-12 lg:space-y-16 pb-12 sm:pb-16 lg:pb-20">
          {isVisible && (
            <>
              {activeTab === "overview" && (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-12"
                >
                  <motion.div variants={itemVariants}>
                    <SectionCard>
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-[#0A2540] mr-4">
                          <BookOpen size={22} />
                        </div>
                        <h2 className="text-2xl font-bold text-[#0A2540]">Welcome to SkillSwap Hub</h2>
                      </div>
                      <p className="text-gray-700 leading-relaxed text-lg mb-6">
                        Welcome to SkillSwap Hub, the world's first revolutionary platform where you can learn, teach, and earn – all in one place. We are not just a learning community, but a global ecosystem of knowledge exchange where every skill matters, every learner counts, and every teacher grows.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-lg">
                        In today's fast-changing world, education is no longer confined to classrooms, textbooks, or expensive courses. People across the globe are looking for a smarter, more engaging, and more personalized way of learning. That's where SkillSwap Hub steps in – a unique platform designed to empower students, professionals, educators, and innovators by giving them the freedom to both gain knowledge and share knowledge while also building an income stream.
                      </p>
                    </SectionCard>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <SectionCard>
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-[#0A2540] mr-4">
                          <Zap size={22} />
                        </div>
                        <h2 className="text-2xl font-bold text-[#0A2540]">How SkillSwap Hub Works</h2>
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[
                          { step: "Sign Up & Create Your Profile", desc: "Showcase your skills and what you want to learn." },
                          { step: "Find Learners & Tutors", desc: "Get matched with people who fit your goals." },
                          { step: "Start Learning or Teaching", desc: "Join 1:1 live tutoring sessions, group discussions, or micro-tutoring." },
                          { step: "Earn & Grow", desc: "Teach what you know, get paid for it, and reinvest your time in learning something new." }
                        ].map((item, index) => (
                          <motion.div
                            key={index}
                            whileHover={{ y: -3 }}
                            className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all"
                          >
                            <div className="w-10 h-10 bg-[#0A2540] text-white rounded-full flex items-center justify-center font-bold mb-4 text-sm">
                              {index + 1}
                            </div>
                            <h3 className="font-semibold text-[#0A2540] mb-2 text-sm">{item.step}</h3>
                            <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
                          </motion.div>
                        ))}
                      </div>
                      <p className="text-[#0A2540] font-medium text-center text-base bg-blue-50 p-5 rounded-lg border border-gray-100">
                        The cycle never ends – you teach, learn, and earn simultaneously, making SkillSwap Hub not just a platform, but a lifestyle.
                      </p>
                    </SectionCard>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <SectionCard>
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-[#0A2540] mr-4">
                          <TrendingUp size={22} />
                        </div>
                        <h2 className="text-2xl font-bold text-[#0A2540]">Why SkillSwap Hub Exists</h2>
                      </div>
                      <p className="text-gray-700 leading-relaxed text-lg mb-6">
                        Because we realized one big truth: Everyone has something to teach, and everyone has something to learn. Traditional education often overlooks practical skills, creativity, and fast-emerging expertise. But in today's world, these skills often make the biggest difference.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-lg">
                        Whether it's AI tools & automation, data analytics, personal branding, digital marketing, content creation, financial literacy, cybersecurity, career-oriented soft skills, or even advanced interview preparation – every skill holds real value. SkillSwap Hub provides the platform where these modern, in-demand skills can shine, empowering individuals not only to learn but also to share their expertise with others. Here, skills become opportunities, and opportunities turn into growth.
                      </p>
                    </SectionCard>
                  </motion.div>
                </motion.div>
              )}

              {activeTab === "mission" && (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-12"
                >
                  <motion.div variants={itemVariants}>
                    <SectionCard>
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-[#0A2540] mr-4">
                          <Target size={22} />
                        </div>
                        <h2 className="text-2xl font-bold text-[#0A2540]">Our Vision</h2>
                      </div>
                      <p className="text-gray-700 leading-relaxed text-lg mb-6">
                        Our vision is simple yet powerful: to create a world where knowledge is not restricted, but exchanged freely, fairly, and globally. We dream of a society where learning is accessible to everyone, where teaching is not limited to classrooms, and where earning opportunities come directly from your skills.
                      </p>
                      <div className="bg-blue-50 p-5 rounded-lg border border-gray-100">
                        <p className="text-[#0A2540] font-medium text-base italic">
                          This is the world we dream of. A world where learning never stops, where opportunities don't depend on wealth or location, and where anyone, anywhere, can rise by lifting others.
                        </p>
                      </div>
                    </SectionCard>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <SectionCard>
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-[#0A2540] mr-4">
                          <Rocket size={22} />
                        </div>
                        <h2 className="text-2xl font-bold text-[#0A2540]">Our Mission</h2>
                      </div>
                      <p className="text-gray-700 leading-relaxed text-lg mb-6 font-medium">
                        To democratize mastery: transforming every individual into a lifelong learner, teacher, and innovator, and turning knowledge into a global currency of impact and opportunity.
                      </p>
                      <div className="grid md:grid-cols-2 gap-6">
                        {[
                          {
                            title: "Knowledge as Currency",
                            desc: "We're not just building a learning platform, but creating an ecosystem where skills, ideas, and expertise hold real-world value—like a global economy of knowledge."
                          },
                          {
                            title: "Everyone Can Lead",
                            desc: "Every learner can become not just a student, but also a teacher and influencer, whether they're from a small town or a global city."
                          },
                          {
                            title: "Lifelong Innovation",
                            desc: "Learning is not a finite activity, but a lifelong journey and a continuous source of innovation and growth."
                          },
                          {
                            title: "Impact Beyond Borders",
                            desc: "This mission connects education with earning, empowering every individual to make a tangible impact in their community and the world."
                          }
                        ].map((item, index) => (
                          <motion.div
                            key={index}
                            whileHover={{ y: -3 }}
                            className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all"
                          >
                            <h3 className="font-semibold text-[#0A2540] mb-3 text-base">{item.title}</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                          </motion.div>
                        ))}
                      </div>
                    </SectionCard>
                  </motion.div>
                </motion.div>
              )}

              {activeTab === "features" && (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-12"
                >
                  <motion.div variants={itemVariants}>
                    <SectionCard>
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-[#0A2540] mr-4">
                          <Star size={22} />
                        </div>
                        <h2 className="text-2xl font-bold text-[#0A2540]">What Makes Us Unique?</h2>
                      </div>
                      <div className="space-y-6">
                        {[
                          {
                            title: "Dual Role System",
                            content: "On SkillSwap Hub, you don't have to choose between being a learner or a teacher. Every user automatically gets both roles. For example, you can teach coding to someone while at the same time learning graphic design from another person. This flexibility encourages knowledge exchange and creates a balanced ecosystem where everyone grows together."
                          },
                          {
                            title: "Peer-to-Peer Learning",
                            content: "Instead of relying only on professional tutors or pre-recorded courses, SkillSwap Hub allows you to learn directly from real people who have mastered specific skills. It's like learning guitar from a friend who's already good at it, or improving your interview skills from someone who recently cracked a job. This makes learning more practical, relatable, and effective."
                          },
                          {
                            title: "Global Reach",
                            content: "The platform is not restricted by geography. Whether you're in a small town or a big city, you can connect with learners and teachers across the globe. This global exposure helps you not only learn different skills but also understand diverse cultures, work ethics, and perspectives."
                          },
                          {
                            title: "Affordable & Accessible",
                            content: "Traditional coaching, online courses, or private tuitions can be very expensive. SkillSwap Hub offers a cost-effective alternative because it's peer-to-peer. Many sessions are free or priced much lower than market standards. Plus, anyone with internet access can join, making it inclusive for students, professionals, and learners from all backgrounds."
                          },
                          {
                            title: "Gamified & Interactive Learning",
                            content: "SkillSwap Hub is not boring or one-sided. The platform uses gamification techniques such as badges, leaderboards, quizzes, and skill challenges to keep users engaged. This makes learning feel like a game where you compete, collaborate, and celebrate achievements — making the process both fun and rewarding."
                          },
                          {
                            title: "Earning Potential",
                            content: "Unlike most platforms where you only pay to learn, SkillSwap Hub lets you earn by teaching others. If you have a valuable skill — whether it's coding, photography, public speaking, or even cooking — you can conduct sessions, provide guidance, and get paid. This creates a self-sustaining ecosystem where knowledge not only grows but also generates income."
                          }
                        ].map((feature, index) => (
                          <CollapsibleSection
                            key={index}
                            title={`${index + 1}. ${feature.title}`}
                            sectionKey={`feature-${index}`}
                          >
                            <p className="text-gray-700 leading-relaxed">{feature.content}</p>
                          </CollapsibleSection>
                        ))}
                      </div>
                    </SectionCard>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <SectionCard>
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-[#0A2540] mr-4">
                          <Award size={22} />
                        </div>
                        <h2 className="text-2xl font-bold text-[#0A2540]">The Impact We Aim For</h2>
                      </div>
                      <div className="grid md:grid-cols-2 gap-6 mb-8">
                        {[
                          "For Students: Affordable access to real-world learning beyond textbooks.",
                          "For Professionals: A chance to upskill, reskill, and share expertise.",
                          "For Educators & Mentors: A direct platform to reach learners without middlemen.",
                          "For Innovators: A community-driven ecosystem to test, refine, and share ideas.",
                          "For Freelancers & Earners: An opportunity to monetize their skills by teaching, mentoring, or conducting micro-sessions with flexible timings."
                        ].map((impact, index) => (
                          <motion.div
                            key={index}
                            whileHover={{ y: -3 }}
                            className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all"
                          >
                            <div className="w-8 h-8 bg-[#0A2540] text-white rounded-full flex items-center justify-center font-bold mb-3 text-sm">
                              {index + 1}
                            </div>
                            <p className="text-gray-700 font-medium text-sm leading-relaxed">{impact}</p>
                          </motion.div>
                        ))}
                      </div>
                      <div className="bg-[#0A2540] text-white p-6 rounded-lg text-center">
                        <p className="text-base font-medium">
                          Our long-term impact is to create a global marketplace of knowledge – where skills are exchanged just like currencies, and education becomes a lifelong journey.
                        </p>
                      </div>
                    </SectionCard>
                  </motion.div>
                </motion.div>
              )}

              {activeTab === "values" && (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-12"
                >
                  <motion.div variants={itemVariants}>
                    <SectionCard>
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-[#0A2540] mr-4">
                          <Heart size={22} />
                        </div>
                        <h2 className="text-2xl font-bold text-[#0A2540]">Our Core Values</h2>
                      </div>
                      <div className="space-y-6">
                        {[
                          {
                            title: "Collaboration over Competition – Knowledge grows when shared.",
                            content: "We believe true learning happens when individuals come together, exchange ideas, and uplift each other. Unlike competitive environments that create pressure and barriers, SkillSwap Hub promotes a culture where peers collaborate to achieve success together. Every user is both a learner and a teacher, ensuring that knowledge flows in multiple directions, making the community stronger. Collaboration builds empathy, teamwork, and trust – essential values for growth in both education and professional life."
                          },
                          {
                            title: "Accessibility for All – Every individual should have equal access to quality learning.",
                            content: "Education is a right, not a privilege. At SkillSwap Hub, we are committed to making learning opportunities available to everyone. Our platform ensures inclusivity by removing financial, geographical, and social barriers. Whether you are a school student, a college aspirant, a working professional, or a lifelong learner – you can find opportunities to gain and share knowledge. By integrating free access models and affordable micro-tutoring, we make sure no one is left behind in the journey of self-improvement."
                          },
                          {
                            title: "Innovation & Growth – Constant evolution to meet the demands of the modern learner.",
                            content: "The world is changing rapidly, and so are the ways we learn and teach. At SkillSwap Hub, we constantly innovate with features like AI matchmaking, gamification, interactive sessions, and community-based challenges. We are not just building a platform; we are building an evolving ecosystem that adapts to the demands of modern education. Innovation drives both personal and collective growth, ensuring that learners acquire not only knowledge but also adaptability and creativity."
                          },
                          {
                            title: "Transparency & Trust – Honest, secure, and fair exchange of knowledge and earnings.",
                            content: "Trust is the foundation of any learning exchange. SkillSwap Hub ensures all interactions are secure, transparent, and fair. Our system provides clarity in how tutors earn, how learners pay, and how every transaction is handled. By implementing verified profiles, fair rating systems, and open feedback mechanisms, we build credibility in every connection. This value protects both learners and educators, ensuring that honesty and fairness remain at the heart of our ecosystem."
                          },
                          {
                            title: "Empowerment through Skills – Skills are the real currency of the future.",
                            content: "In today's world, skills matter more than degrees. SkillSwap Hub believes that skills are the true currency of the future. We empower individuals to not only learn but also monetize their expertise. By teaching others, users gain confidence, leadership skills, and financial independence. The platform prepares people for real-world challenges, ensuring they stay relevant, employable, and future-ready. Skill empowerment creates a ripple effect – one person's skill can change many lives."
                          }
                        ].map((value, index) => (
                          <CollapsibleSection
                            key={index}
                            title={value.title}
                            sectionKey={`value-${index}`}
                          >
                            <p className="text-gray-700 leading-relaxed">{value.content}</p>
                          </CollapsibleSection>
                        ))}
                      </div>
                    </SectionCard>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <SectionCard>
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-[#0A2540] mr-4">
                          <Lightbulb size={22} />
                        </div>
                        <h2 className="text-2xl font-bold text-[#0A2540]">Teach, Learn, and Earn – The SkillSwap Hub Way</h2>
                      </div>
                      <div className="bg-[#0A2540] text-white p-8 rounded-lg text-center">
                        <p className="text-lg mb-6 font-medium">
                          At the end of the day, our motto says it all:
                        </p>
                        <p className="text-3xl font-bold mb-6">
                          Teach What You Know, Learn What You Don't – Earn While You Do!
                        </p>
                        <p className="text-xl opacity-95">
                          This is not just a tagline, it's the foundation of our movement. Every user who joins SkillSwap Hub becomes a part of a knowledge revolution that will shape the future of learning.
                        </p>
                      </div>
                    </SectionCard>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <SectionCard>
                      <h2 className="text-2xl font-bold text-blue-800 mb-6">Our Promise</h2>
                      <div className="grid md:grid-cols-2 gap-6">
                        {[
                          "Provide a safe, inclusive, and transparent platform.",
                          "Keep learning affordable, flexible, and fun.",
                          "Continuously innovate with features like AI matchmaking, gamification, interview practice, group learning, and more.",
                          "Build a global family of learners and teachers who uplift each other."
                        ].map((promise, index) => (
                          <motion.div 
                            key={index}
                            whileHover={{ x: 3 }}
                            className="flex items-start space-x-4 bg-blue-50 p-4 rounded-lg border border-gray-100"
                          >
                            <div className="w-6 h-6 bg-[#0A2540] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 text-xs">
                              ✓
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed">{promise}</p>
                          </motion.div>
                        ))}
                      </div>
                    </SectionCard>
                  </motion.div>
                </motion.div>
              )}

              {activeTab === "team" && (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-12"
                >
                  <motion.div variants={itemVariants}>
                    <SectionCard>
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-[#0A2540] mr-4">
                          <Users size={22} />
                        </div>
                        <h2 className="text-2xl font-bold text-[#0A2540]">Our Team</h2>
                      </div>
                      <p className="text-gray-700 leading-relaxed text-lg mb-6">
                        Behind SkillSwap Hub is a passionate and visionary team of educators, technologists, innovators, and dreamers, united by a single belief: knowledge should be accessible to everyone. Our mission is to build a platform that empowers learners and tutors alike, enabling them to seek, teach, and earn in a seamless, engaging, and meaningful way.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-lg mb-6">
                        Our team brings together expertise from diverse domains — education, software development, AI, design, and entrepreneurship — to create a platform that is not just functional but also transformative. We are learners ourselves, so we deeply understand the challenges of finding quality, affordable, and accessible education. Every feature we build is guided by empathy, inclusivity, and innovation, ensuring that our platform addresses real user needs while creating a supportive community.
                      </p>
                      <div className="bg-blue-50 p-5 rounded-lg border border-gray-100">
                        <p className="text-[#0A2540] font-medium text-base">
                          More than just a team, we see ourselves as the first members of this global learning community, working tirelessly to ensure SkillSwap Hub grows into a movement that changes the way people learn, teach, and earn.
                        </p>
                      </div>
                    </SectionCard>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <SectionCard>
                      <h3 className="text-2xl font-bold text-blue-800 mb-8 text-center">Meet Our Founders</h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                          {
                            name: "Abhishek Kumar",
                            role: "Founder & CEO",
                            image: "https://res.cloudinary.com/dbltazdsa/image/upload/v1766589383/webimages/team/abhishek.jpeg",
                            description: "Abhishek is the visionary behind SkillSwap Hub. With a passion for technology, education, and innovation, Abhishek drives the platform's strategy, vision, and growth. A coder, problem-solver, and lifelong learner, he ensures that the platform evolves with the needs of students and tutors, combining technology with practical learning solutions."
                          },
                          {
                            name: "Ananya Chauhan",
                            role: "Co-Founder",
                            image: "https://res.cloudinary.com/dbltazdsa/image/upload/v1766589384/webimages/team/Ananya.jpg",
                            description: "Ananya leads community engagement. Her expertise in growth strategies, and communication ensures that SkillSwap Hub reaches learners and tutors globally. She is passionate about building inclusive communities and helping users unlock their full potential."
                          },
                          {
                            name: "Anubhav Dhyani",
                            role: "CTO",
                            image: "https://res.cloudinary.com/dbltazdsa/image/upload/v1766589383/webimages/team/anubhav.jpeg",
                            description: "Anubhav heads the technology and product development. With a strong background in software development, AI, and system architecture, he ensures that SkillSwap Hub is scalable, secure, and feature-rich, providing a seamless experience to every user."
                          },
                          {
                            name: "Vivek",
                            role: "Co-Founder",
                            image: "https://res.cloudinary.com/dbltazdsa/image/upload/v1766589384/webimages/team/vivek.jpeg",
                            description: "Vivek focuses on platform operations and user experience. His attention to detail and dedication ensures that every session, SkillCoin transaction, and gamification feature works flawlessly, creating a smooth experience for all learners and tutors."
                          },
                          {
                            name: "Akshit",
                            role: "Co-Founder",
                            image: "https://res.cloudinary.com/dbltazdsa/image/upload/v1766589383/webimages/team/akshit.jpeg",
                            description: "Akshit brings his expertise in data, analytics, and innovation to optimize platform features. His insights help in improving AI matchmaking, gamification, and content recommendations, making the learning process smarter and more personalized."
                          }
                        ].map((member, index) => (
                          <TeamMemberCard
                            key={index}
                            name={member.name}
                            role={member.role}
                            description={member.description}
                            index={index}
                            image={member.image}
                          />
                        ))}
                      </div>
                      <div className="mt-10 bg-[#0A2540] text-white p-6 rounded-lg text-center">
                        <p className="text-base font-medium">
                          Together, these five co-founders combine their vision, expertise, and passion to make SkillSwap Hub a global hub for learning, teaching, and earning.
                        </p>
                      </div>
                    </SectionCard>
                  </motion.div>
                </motion.div>
              )}

              {activeTab === "future" && (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-12"
                >
                  <motion.div variants={itemVariants}>
                    <SectionCard>
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-[#0A2540] mr-4">
                          <Rocket size={22} />
                        </div>
                        <h2 className="text-2xl font-bold text-[#0A2540]">The Future of SkillSwap Hub</h2>
                      </div>
                      <div className="grid md:grid-cols-2 gap-8">
                        {[
                          {
                            title: "SkillShorts",
                            description: "Bite-sized 1-minute learning videos that pack real-world knowledge, hacks, and tricks in the most engaging way possible. Unlike YouTube where creators often struggle, on SkillSwap Hub you can earn up to 5x more for the same content, thanks to our skill-focused community and reward system. It's not just learning, it's learning that pays.",
                            icon: "🎬"
                          },
                          {
                            title: "AI Quziment (AI + Quiz + Placement)",
                            description: "This isn't just a quiz tool — it's your career assistant. Based on your performance, AI will tell you exactly where you stand, what you need to improve, and even connect you to real opportunities. Imagine finishing a coding quiz and instantly getting: 'Hey! Based on your score, a hackathon is happening this week — here's the link' or 'You're now qualified for this freelance project/job — apply directly here.' No more endless searching. We bring opportunities straight to you.",
                            icon: "🤖"
                          },
                          {
                            title: "Smart Quizzing & Challenges",
                            description: "AI-powered quizzes, skill tests, and real-time challenges that not only keep learners engaged but also build practical confidence.",
                            icon: "🧠"
                          },
                          {
                            title: "Interactive Communities",
                            description: "Skill-based groups (AI, design, marketing, leadership, and more) where you can connect, collaborate, and grow with like-minded learners and professionals.",
                            icon: "👥"
                          },
                          {
                            title: "Verified Skill Badges",
                            description: "Showcase your expertise with AI-verified skill badges that make your profile stand out in jobs, freelancing, and networking.",
                            icon: "🏆"
                          },
                          {
                            title: "Immersive Learning (AR/VR powered)",
                            description: "Imagine this — you put on your VR headset and suddenly you're standing on a virtual stage with 500 people watching you, practicing public speaking in real time. Or you're in a 3D coding arena, competing with others in a gamified environment where every line of code you write builds your digital world. That's the kind of wow-factor learning experience we're building — practical, futuristic, and unforgettable.",
                            icon: "🥽"
                          }
                        ].map((feature, index) => (
                          <FeatureCard
                            key={index}
                            title={feature.title}
                            description={feature.description}
                            icon={feature.icon}
                            index={index}
                          />
                        ))}
                      </div>
                      <div className="mt-12 bg-[#0A2540] text-white p-8 rounded-lg text-center">
                        <p className="text-lg font-medium">
                          These upcoming features will ensure that SkillSwap Hub is not just another platform, but a next-gen ecosystem where learning feels personal, futuristic, and limitless.
                        </p>
                      </div>
                    </SectionCard>
                  </motion.div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Call to Action */}
      <div className="relative bg-gradient-to-r from-[#0A2540] to-[#1e3a8a] text-white overflow-hidden py-16">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBzdHJva2U9IiMzODg0ZTMiIHN0cm9rZS13aWR0aD0iMSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMTUiLz48L2c+PC9zdmc+')] opacity-10"></div>
        
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-6"
          >
            Join the SkillSwap Hub Revolution
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl md:text-2xl mb-10 opacity-95"
          >
            Teach What You Know, Learn What You Don't – Earn While You Do! <br />
            Be part of a movement that's shaping the future of learning.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/home">
              <motion.button 
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 bg-white text-[#0A2540] rounded-lg font-semibold flex items-center justify-center space-x-2 shadow-sm hover:shadow-md transition-all"
              >
                <span>Get Started</span>
                <ArrowRight size={18} />
              </motion.button>
            </Link>
            <motion.button 
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-[#0A2540] transition-all"
            >
              Learn More
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default About;
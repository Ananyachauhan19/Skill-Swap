import React, { useState, useEffect, useRef } from "react";
import { 
  ChevronDown, Users, Target, Heart, Lightbulb, Zap, 
  Globe, BookOpen, TrendingUp, Award, Star, Rocket, 
  ArrowRight, Play, Github, Linkedin, Twitter, Menu, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
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
      whileHover={{ y: -5, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center space-x-2 px-6 py-4 rounded-xl transition-all duration-300 ${
        isActive
          ? "bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-lg shadow-blue-500/30"
          : "bg-blue-50 text-blue-800 hover:bg-blue-100"
      }`}
    >
      <tab.icon size={20} />
      <span className="font-semibold">{tab.label}</span>
    </motion.button>
  );

  const SectionCard = ({ children, className = "" }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-white border border-blue-100 rounded-2xl p-8 shadow-lg shadow-blue-100/50 hover:shadow-blue-200/70 transition-all duration-300 ${className}`}
    >
      {children}
    </motion.div>
  );

  const CollapsibleSection = ({ title, children, sectionKey }) => (
    <SectionCard>
      <motion.button
        onClick={() => toggleSection(sectionKey)}
        whileHover={{ x: 5 }}
        className="w-full flex items-center justify-between text-left group"
      >
        <h3 className="text-xl font-semibold text-blue-800 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        <motion.div
          animate={{ rotate: expandedSection === sectionKey ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown size={24} className="text-blue-700" />
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

  const TeamMemberCard = ({ name, role, description, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -10, scale: 1.02 }}
      className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-2xl shadow-lg shadow-blue-100/50 hover:shadow-blue-200/70 transition-all duration-300 border border-blue-100"
    >
      <div className="flex items-center mb-4">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4 shadow-lg shadow-blue-400/40">
          {name.split(" ").map(n => n[0]).join("")}
        </div>
        <div>
          <h4 className="font-bold text-blue-800">{name}</h4>
          <p className="text-blue-600 font-medium">{role}</p>
        </div>
      </div>
      <p className="text-gray-700 leading-relaxed">{description}</p>
      <div className="flex space-x-3 mt-4">
        {[Twitter, Linkedin, Github].map((Icon, i) => (
          <motion.a 
            key={i}
            href="#"
            whileHover={{ scale: 1.2, y: -2 }}
            className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 hover:bg-blue-200 transition-colors"
          >
            <Icon size={16} />
          </motion.a>
        ))}
      </div>
    </motion.div>
  );

  const FeatureCard = ({ title, description, icon, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -10 }}
      className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-2xl shadow-lg shadow-blue-100/50 hover:shadow-blue-200/70 transition-all duration-300 border border-blue-100"
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-blue-800 mb-3">{title}</h3>
      <p className="text-gray-700 leading-relaxed">{description}</p>
    </motion.div>
  );

  const ValueCard = ({ title, content, index }) => (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white p-6 rounded-2xl shadow-lg shadow-blue-100/50 border border-blue-100"
    >
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold mr-3">
          {index + 1}
        </div>
        <h3 className="text-lg font-bold text-blue-800">{title}</h3>
      </div>
      <p className="text-gray-700 leading-relaxed">{content}</p>
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-700 to-blue-500 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBzdHJva2U9IiMzODg0ZTMiIHN0cm9rZS13aWR0aD0iMSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMTUiLz48L2c+PC9zdmc+')] opacity-10"></div>
        
        <div className="max-w-7xl mx-auto px-4 py-20 relative z-10">
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
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight"
            >
              About <span className="text-blue-200">SkillSwap Hub</span>
            </motion.h1>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="text-lg md:text-xl mb-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6 inline-block border border-white/20"
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
              className="text-xl md:text-2xl font-medium max-w-4xl mx-auto opacity-95 mb-10"
            >
              Teach What You Know, Learn What You Don't – And Earn While You Do!
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <motion.button 
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-white text-blue-700 rounded-xl font-semibold flex items-center space-x-2 shadow-lg"
              >
                <span>Get Started</span>
                <ArrowRight size={18} />
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 border border-white text-white rounded-xl font-semibold flex items-center space-x-2"
              >
                <Play size={18} fill="white" />
                <span>Watch Video</span>
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-blue-50 to-transparent"></div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-12 -mt-8 relative z-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap gap-4 justify-center mb-12"
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
        <div ref={sectionRef} className="space-y-16 pb-20">
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
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 mr-4">
                          <BookOpen size={24} />
                        </div>
                        <h2 className="text-3xl font-bold text-blue-800">Welcome to SkillSwap Hub</h2>
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
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 mr-4">
                          <Zap size={24} />
                        </div>
                        <h2 className="text-3xl font-bold text-blue-800">How SkillSwap Hub Works</h2>
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
                            whileHover={{ y: -5 }}
                            className="bg-gradient-to-b from-white to-blue-50 p-5 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-all"
                          >
                            <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold mb-4">
                              {index + 1}
                            </div>
                            <h3 className="font-semibold text-blue-800 mb-2">{item.step}</h3>
                            <p className="text-sm text-gray-600">{item.desc}</p>
                          </motion.div>
                        ))}
                      </div>
                      <p className="text-blue-700 font-medium text-center text-lg bg-blue-50 p-4 rounded-xl">
                        The cycle never ends – you teach, learn, and earn simultaneously, making SkillSwap Hub not just a platform, but a lifestyle.
                      </p>
                    </SectionCard>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <SectionCard>
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 mr-4">
                          <TrendingUp size={24} />
                        </div>
                        <h2 className="text-3xl font-bold text-blue-800">Why SkillSwap Hub Exists</h2>
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
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 mr-4">
                          <Target size={24} />
                        </div>
                        <h2 className="text-3xl font-bold text-blue-800">Our Vision</h2>
                      </div>
                      <p className="text-gray-700 leading-relaxed text-lg mb-6">
                        Our vision is simple yet powerful: to create a world where knowledge is not restricted, but exchanged freely, fairly, and globally. We dream of a society where learning is accessible to everyone, where teaching is not limited to classrooms, and where earning opportunities come directly from your skills.
                      </p>
                      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                        <p className="text-blue-700 font-medium text-lg italic">
                          This is the world we dream of. A world where learning never stops, where opportunities don't depend on wealth or location, and where anyone, anywhere, can rise by lifting others.
                        </p>
                      </div>
                    </SectionCard>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <SectionCard>
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 mr-4">
                          <Rocket size={24} />
                        </div>
                        <h2 className="text-3xl font-bold text-blue-800">Our Mission</h2>
                      </div>
                      <p className="text-gray-700 leading-relaxed text-lg mb-6 font-medium">
                        To democratize mastery: transforming every individual into a lifelong learner, teacher, and innovator, and turning knowledge into a global currency of impact and opportunity.
                      </p>
                      <div className="grid md:grid-cols-2 gap-6">
                        {[
                          {
                            title: "Knowledge as Currency",
                            desc: "Hum sirf learning nahi, balki ek aisa ecosystem create kar rahe hain jahan skills, ideas aur expertise ka real-world value hai—jaise ek global economy of knowledge."
                          },
                          {
                            title: "Everyone Can Lead",
                            desc: "Har learner sirf seekhne wala nahi, balki teacher aur influencer bhi ban sakta hai, chahe wo small town se ho ya global city se."
                          },
                          {
                            title: "Lifelong Innovation",
                            desc: "Learning ko finite activity nahi, balki lifelong journey aur innovation ka source banaya ja raha hai."
                          },
                          {
                            title: "Impact Beyond Borders",
                            desc: "Yeh mission education aur earning ko connect karta hai, aur har ek individual ko empower karta hai to make tangible impact in their community and the world."
                          }
                        ].map((item, index) => (
                          <motion.div
                            key={index}
                            whileHover={{ y: -5 }}
                            className="bg-gradient-to-b from-white to-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-all"
                          >
                            <h3 className="font-semibold text-blue-800 mb-3 text-lg">{item.title}</h3>
                            <p className="text-gray-700">{item.desc}</p>
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
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 mr-4">
                          <Star size={24} />
                        </div>
                        <h2 className="text-3xl font-bold text-blue-800">What Makes Us Unique?</h2>
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
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 mr-4">
                          <Award size={24} />
                        </div>
                        <h2 className="text-3xl font-bold text-blue-800">The Impact We Aim For</h2>
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
                            whileHover={{ y: -5 }}
                            className="bg-gradient-to-b from-white to-blue-50 p-5 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-all"
                          >
                            <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold mb-3">
                              {index + 1}
                            </div>
                            <p className="text-gray-700 font-medium">{impact}</p>
                          </motion.div>
                        ))}
                      </div>
                      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6 rounded-xl text-center">
                        <p className="text-lg font-medium">
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
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 mr-4">
                          <Heart size={24} />
                        </div>
                        <h2 className="text-3xl font-bold text-blue-800">Our Core Values</h2>
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
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 mr-4">
                          <Lightbulb size={24} />
                        </div>
                        <h2 className="text-3xl font-bold text-blue-800">Teach, Learn, and Earn – The SkillSwap Hub Way</h2>
                      </div>
                      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-8 rounded-2xl text-center shadow-lg shadow-blue-500/30">
                        <p className="text-xl mb-6 font-medium">
                          At the end of the day, our motto says it all:
                        </p>
                        <p className="text-3xl font-bold mb-6">
                          Teach What You Know, Learn What You Don't – And Earn While You Do!
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
                            whileHover={{ x: 5 }}
                            className="flex items-start space-x-4 bg-blue-50 p-4 rounded-xl"
                          >
                            <div className="w-6 h-6 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                              ✓
                            </div>
                            <p className="text-gray-700">{promise}</p>
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
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 mr-4">
                          <Users size={24} />
                        </div>
                        <h2 className="text-3xl font-bold text-blue-800">Our Team</h2>
                      </div>
                      <p className="text-gray-700 leading-relaxed text-lg mb-6">
                        Behind SkillSwap Hub is a passionate and visionary team of educators, technologists, innovators, and dreamers, united by a single belief: knowledge should be accessible to everyone. Our mission is to build a platform that empowers learners and tutors alike, enabling them to seek, teach, and earn in a seamless, engaging, and meaningful way.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-lg mb-6">
                        Our team brings together expertise from diverse domains — education, software development, AI, design, and entrepreneurship — to create a platform that is not just functional but also transformative. We are learners ourselves, so we deeply understand the challenges of finding quality, affordable, and accessible education. Every feature we build is guided by empathy, inclusivity, and innovation, ensuring that our platform addresses real user needs while creating a supportive community.
                      </p>
                      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                        <p className="text-blue-700 font-medium text-lg">
                          More than just a team, we see ourselves as the first members of this global learning community, working tirelessly to ensure SkillSwap Hub grows into a movement that changes the way people learn, teach, and earn.
                        </p>
                      </div>
                    </SectionCard>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <SectionCard>
                      <h3 className="text-2xl font-bold text-blue-800 mb-8 text-center">Meet Our Co-Founders</h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                          {
                            name: "Abhishek Kumar",
                            role: "Founder & CEO",
                            description: "Abhishek is the visionary behind SkillSwap Hub. With a passion for technology, education, and innovation, Abhishek drives the platform's strategy, vision, and growth. A coder, problem-solver, and lifelong learner, he ensures that the platform evolves with the needs of students and tutors, combining technology with practical learning solutions."
                          },
                          {
                            name: "Ananya Chauhan",
                            role: "CMO",
                            description: "Ananya leads marketing and community engagement. Her expertise in branding, growth strategies, and communication ensures that SkillSwap Hub reaches learners and tutors globally. She is passionate about building inclusive communities and helping users unlock their full potential."
                          },
                          {
                            name: "Anubhav Dhyani",
                            role: "CTO",
                            description: "Anubhav heads the technology and product development. With a strong background in software development, AI, and system architecture, he ensures that SkillSwap Hub is scalable, secure, and feature-rich, providing a seamless experience to every user."
                          },
                          {
                            name: "Vivek",
                            role: "Co-Founder",
                            description: "Vivek focuses on platform operations and user experience. His attention to detail and dedication ensures that every session, SkillCoin transaction, and gamification feature works flawlessly, creating a smooth experience for all learners and tutors."
                          },
                          {
                            name: "Akshit",
                            role: "Co-Founder",
                            description: "Akshit brings his expertise in data, analytics, and innovation to optimize platform features. His insights help in improving AI matchmaking, gamification, and content recommendations, making the learning process smarter and more personalized."
                          }
                        ].map((member, index) => (
                          <TeamMemberCard
                            key={index}
                            name={member.name}
                            role={member.role}
                            description={member.description}
                            index={index}
                          />
                        ))}
                      </div>
                      <div className="mt-10 bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6 rounded-2xl text-center">
                        <p className="text-lg font-medium">
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
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 mr-4">
                          <Rocket size={24} />
                        </div>
                        <h2 className="text-3xl font-bold text-blue-800">The Future of SkillSwap Hub</h2>
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
                      <div className="mt-12 bg-gradient-to-r from-blue-600 to-blue-500 text-white p-8 rounded-2xl text-center">
                        <p className="text-xl font-medium">
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
      <div className="relative bg-gradient-to-r from-blue-700 to-blue-500 text-white overflow-hidden py-20">
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
            Teach What You Know, Learn What You Don't – And Earn While You Do! <br />
            Be part of a movement that's shaping the future of learning.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white text-blue-700 rounded-xl font-semibold flex items-center justify-center space-x-2 shadow-lg"
            >
              <span>Get Started Now</span>
              <ArrowRight size={20} />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 border border-white text-white rounded-xl font-semibold hover:bg-white/20 transition-colors"
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
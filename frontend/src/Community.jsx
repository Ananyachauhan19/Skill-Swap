import React from "react";
import { motion } from "framer-motion";
import { 
  FiMessageSquare, FiUsers, FiVideo, FiTrendingUp, 
  FiAward, FiGlobe, FiZap, FiTarget,
  FiShield, FiStar, FiHeart, FiCpu
} from "react-icons/fi";

const Community = () => {
  const communityFeatures = [
    {
      icon: <FiMessageSquare className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: "Discussion Forums",
      description: "Ask questions, share answers, and dive deep into knowledge exchange with peers and experts."
    },
    {
      icon: <FiUsers className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: "Skill Circles",
      description: "Join focused groups based on interests such as Coding, Design, Business, Languages, and more."
    },
    {
      icon: <FiVideo className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: "Live Events & Webinars",
      description: "Attend community-driven sessions, Q&A rounds, and participate in exciting skill challenges."
    },
    {
      icon: <FiTrendingUp className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: "Daily Challenges & Quizzes",
      description: "Boost your knowledge, test your skills, and track your personal growth journey."
    },
    {
      icon: <FiCpu className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: "Idea Sharing Space",
      description: "Pitch your ideas, receive constructive feedback, and collaborate with like-minded peers."
    },
    {
      icon: <FiAward className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: "Success Stories",
      description: "Get inspired by real people who achieved incredible growth through SkillSwap Hub."
    },
    {
      icon: <FiGlobe className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: "Support & Networking",
      description: "Connect with mentors, tutors, freelancers, and learners from around the world."
    }
  ];

  const benefits = [
    {
      icon: <FiZap className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "Learn Together, Grow Faster",
      description: "Share your struggles and get solutions instantly from our supportive community."
    },
    {
      icon: <FiStar className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "Recognition Matters",
      description: "Earn badges, ranks, and rewards for your valuable contributions to the community."
    },
    {
      icon: <FiTarget className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "Collaboration Opportunities",
      description: "Find partners for projects, startups, or research initiatives that align with your goals."
    },
    {
      icon: <FiShield className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "Safe & Inclusive",
      description: "We ensure a respectful, encouraging, and inclusive environment for everyone."
    },
    {
      icon: <FiGlobe className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "Global Exposure",
      description: "Connect with learners and professionals from different parts of the world."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-blue-100/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 md:pt-[72px] xl:pt-20 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-transparent to-slate-100/50 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-800 to-blue-900 rounded-2xl mb-4 sm:mb-6 shadow-lg">
              <FiUsers className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              Welcome to the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-blue-900">SkillSwap Hub</span> Community
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed px-4">
              At SkillSwap Hub, we believe that learning doesn't happen in isolation—it grows when people connect, share, and inspire each other. Our community is not just a group of users; it's a family of dreamers, doers, and changemakers.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-10 border border-blue-100 max-w-5xl mx-auto"
          >
            <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed text-center">
              Here, everyone has a voice. Whether you're a student, a professional, an educator, or an innovator, our community is designed to give you <span className="font-semibold text-blue-900">support, recognition, and opportunities to grow</span>.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Community Features Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 sm:mb-12 md:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What You'll Find in Our Community
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto">
              Explore a vibrant ecosystem of resources, connections, and opportunities designed to accelerate your learning journey.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {communityFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(30, 64, 175, 0.15)" }}
                className="bg-white rounded-xl p-5 sm:p-6 border border-gray-200 hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-xl group"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center mb-4 text-blue-800 group-hover:from-blue-800 group-hover:to-blue-900 group-hover:text-white transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-900 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 sm:mb-12 md:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Join the SkillSwap Hub Community?
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto">
              Discover the benefits that make our community a powerful catalyst for your personal and professional growth.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl p-5 sm:p-6 border border-gray-200 hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-md">
                    {benefit.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 rounded-2xl sm:rounded-3xl p-8 sm:p-10 md:p-12 text-center shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 sm:mb-6">
                <FiHeart className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
                Be a Part of Something Bigger
              </h2>
              
              <div className="space-y-4 sm:space-y-5 mb-6 sm:mb-8 text-blue-50">
                <p className="text-sm sm:text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
                  SkillSwap Hub is more than just a platform—it's a <span className="font-semibold text-white">movement towards collaborative learning and earning</span>.
                </p>
                <p className="text-sm sm:text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
                  Here, your questions matter, your skills shine, and your voice inspires.
                </p>
                <p className="text-sm sm:text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
                  So don't just scroll. <span className="font-semibold text-white">Join the conversation, share your knowledge, and become a changemaker</span> in the SkillSwap Hub community.
                </p>
              </div>

              <div className="inline-block bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4 sm:px-8 sm:py-5 border border-white/20">
                <p className="text-base sm:text-lg md:text-xl font-bold text-white">
                  Together, we are building the future of learning—one connection at a time.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer Encouragement */}
      <section className="pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-xl p-6 sm:p-8 border border-blue-200 shadow-lg"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <FiStar className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 fill-yellow-500" />
              <FiStar className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-500 fill-yellow-500" />
              <FiStar className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 fill-yellow-500" />
            </div>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium italic">
              "Your journey to becoming a <span className="text-blue-900 font-bold">SkillSwap Hub changemaker</span> starts now. Welcome to the community!"
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Community;

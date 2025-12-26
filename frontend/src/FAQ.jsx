import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiHelpCircle } from "react-icons/fi";

const faqList = [
  {
    question: "What is SkillSwap Hub?",
    answer:
      "SkillSwap Hub is the world's first peer-to-peer and micro-tutoring platform where users can learn new skills, teach what they know, and even earn money. It's designed for students, professionals, and educators who want a single platform for 1:1 live sessions, group discussions, interview practice, quizzes, and much more.",
  },
  {
    question: "Is SkillSwap Hub free to use?",
    answer:
      "Yes! Registration is completely free. Every new user also receives 100 Silver Coins upon signing up, which can be used to explore sessions and try out the platform. If used wisely, these coins can help learners and tutors build momentum — and some users may even continue their learning journey lifelong without paying anything extra.",
  },
  {
    question: "How does SkillSwap Hub work?",
    answer:
      "• Sign up on the platform.\n• Select whether you want to learn, teach, or both.\n• Explore skills, join live sessions, practice interviews, or participate in group discussions.\n• If you are a tutor, you can host sessions and earn money by sharing your expertise.",
  },
  {
    question: "Who can join SkillSwap Hub?",
    answer:
      "Anyone with a passion for learning or teaching can join!\n• Students (school, college, exam aspirants)\n• Working professionals (career upskilling, interview prep)\n• Tutors, mentors, and subject experts",
  },
  {
    question: "How do I earn on SkillSwap Hub?",
    answer:
      "• By becoming a Skill Tutor and hosting paid live sessions.\n• By sharing Skill Shorts (quick lessons).\n• By conducting mock interviews, quizzes, or group discussions.",
  },
  {
    question: "What types of skills are available on SkillSwap Hub?",
    answer:
      "We cover a wide range of online-friendly skills, including:\n• Academic subjects (Math, Science, Coding, etc.)\n• Competitive exam prep\n• Career & job interview skills\n• Soft skills (communication, leadership, public speaking)\n• Digital-first skills (AI tools, digital marketing, graphic design, freelancing, entrepreneurship, etc.)\n(Note: Unlike traditional platforms, we focus only on skills that can be effectively learned online.)",
  },
  {
    question: "How is SkillSwap Hub different from other learning platforms?",
    answer:
      "SkillSwap Hub is unique because it's the only platform that allows you to:\n• Learn, Teach, and Earn — all at the same place\n• Peer-to-peer skill exchange\n• Live 1:1 micro-tutoring\n• Gamification & rewards\n• Real interview practice\n• Community-driven learning",
  },
  {
    question: "Can I access SkillSwap Hub on mobile?",
    answer:
      "Yes! SkillSwap Hub is fully mobile-friendly and can be accessed directly through any web browser on your smartphone.\nCurrently, we don't have a mobile app, but our responsive website ensures you get a smooth, app-like experience on both Android and iOS devices.",
  },
  {
    question: "How safe is SkillSwap Hub?",
    answer:
      "Your safety and privacy are our priority.\n• Secure payment gateways\n• Verified tutor profiles\n• AI-based matchmaking ensures relevant & safe connections",
  },
  {
    question: "How do I contact support?",
    answer:
      "You can reach our support team anytime via:\nEmail: support@skillswaphub.in\nPhone: Contact us through the Help & Support section",
  },
];

const FAQItem = ({ faq, index, isOpen, toggleOpen }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden"
    >
      <button
        onClick={toggleOpen}
        className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left hover:bg-blue-50/50 transition-colors duration-200"
      >
        <div className="flex items-start gap-3 flex-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-blue-900 font-bold text-sm sm:text-base">{index + 1}</span>
          </div>
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 leading-snug">
            {faq.question}
          </h3>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0"
        >
          <FiChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-blue-900" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
              <div className="pl-0 sm:pl-13 border-l-2 border-blue-100 ml-4 sm:ml-5">
                <p className="text-xs sm:text-sm lg:text-base text-gray-700 leading-relaxed whitespace-pre-line pl-4">
                  {faq.answer}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleOpen = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-blue-100/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 md:pt-[72px] xl:pt-20 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-transparent to-slate-100/50 pointer-events-none" />
        
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-6 sm:mb-8"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-800 to-blue-900 rounded-2xl mb-4 sm:mb-6 shadow-lg">
              <FiHelpCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
              Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-blue-900">Questions</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
              Find answers to common questions about SkillSwap Hub. Can't find what you're looking for? Feel free to contact our support team.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ List Section */}
      <section className="pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-3 sm:space-y-4">
            {faqList.map((faq, index) => (
              <FAQItem
                key={index}
                faq={faq}
                index={index}
                isOpen={openIndex === index}
                toggleOpen={() => toggleOpen(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support Section */}
      <section className="pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 rounded-2xl p-6 sm:p-8 md:p-10 text-center shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
            
            <div className="relative z-10">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4">
                Still Have Questions?
              </h2>
              <p className="text-sm sm:text-base text-blue-100 mb-4 sm:mb-6 max-w-2xl mx-auto">
                Our support team is here to help you. Reach out to us anytime and we'll get back to you as soon as possible.
              </p>
              <div className="inline-block bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 sm:px-6 sm:py-4 border border-white/20">
                <p className="text-sm sm:text-base text-white font-medium">
                  📧 Email: <span className="font-bold">support@skillswaphub.in</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;

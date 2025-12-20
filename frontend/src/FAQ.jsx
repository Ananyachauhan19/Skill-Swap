import React from "react";

const faqList = [
  {
    question: "What is SkillSwap Hub?",
    answer:
      "SkillSwap Hub is the world’s first peer-to-peer and micro-tutoring platform where users can learn new skills, teach what they know, and even earn money. It’s designed for students, professionals, and educators who want a single platform for 1:1 live sessions, group discussions, interview practice, quizzes, and much more.",
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
      "SkillSwap Hub is unique because it’s the only platform that allows you to:\n• Learn, Teach, and Earn — all at the same place\n• Peer-to-peer skill exchange\n• Live 1:1 micro-tutoring\n• Gamification & rewards\n• Real interview practice\n• Community-driven learning",
  },
  {
    question: "Can I access SkillSwap Hub on mobile?",
    answer:
      "Yes! SkillSwap Hub is fully mobile-friendly and can be accessed directly through any web browser on your smartphone.\nCurrently, we don’t have a mobile app, but our responsive website ensures you get a smooth, app-like experience on both Android and iOS devices.",
  },
  {
    question: "How safe is SkillSwap Hub?",
    answer:
      "Your safety and privacy are our priority.\n• Secure payment gateways\n• Verified tutor profiles\n• AI-based matchmaking ensures relevant & safe connections",
  },
  {
    question: "How do I contact support?",
    answer:
      "You can reach our support team anytime via:\nEmail: support@skillswaphub.com\nPhone : ananya se number puchh lena ",
  },
];

const FAQ = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-6 sm:pb-10 text-gray-800">
    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 text-center lg:text-left">SkillSwap Hub – Frequently Asked Questions (FAQs)</h1>
    <div className="space-y-6 sm:space-y-8">
      {faqList.map((faq, idx) => (
        <div key={idx}>
          <h2 className="text-lg font-semibold mb-2">{idx + 1}. {faq.question}</h2>
          <p className="whitespace-pre-line text-gray-700">{faq.answer}</p>
        </div>
      ))}
    </div>
  </div>
);

export default FAQ;

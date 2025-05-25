import React from "react";

const features = [
  { icon: "🤝", title: "Peer-to-peer Micro-tutoring", desc: "Connect directly with peers for focused, short learning sessions." },
  { icon: "💎", title: "Credit-based Learning", desc: "Earn and spend credits as you teach and learn new skills." },
  { icon: "🏆", title: "Gamification & Leaderboard", desc: "Climb the leaderboard and unlock achievements as you participate." },
];

const steps = [
  { icon: "📝", title: "Sign Up", desc: "Create your free SkillSwap account." },
  { icon: "🔍", title: "Find or Offer Skills", desc: "Browse or list skills you want to learn or teach." },
  { icon: "💬", title: "Connect & Learn", desc: "Schedule a session and start swapping skills!" },
];

const testimonials = [
  {
    quote: "SkillSwap Hub made learning fun and rewarding. I improved my coding and taught design in return!",
    name: "Jamie Lee",
  },
  {
    quote: "The credit system motivates me to keep sharing my skills. The leaderboard is a great touch!",
    name: "Priya Singh",
  },
];

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white py-16 px-4 text-center shadow-sm">
        <h1 className="text-4xl md:text-5xl font-bold text-blue-700 mb-4">SkillSwap Hub</h1>
        <p className="text-lg md:text-xl text-gray-700 mb-6 max-w-2xl mx-auto">
          A peer-to-peer platform for micro-tutoring, credit-based learning, and gamified skill growth.
        </p>
        <div className="flex justify-center gap-4 mb-8">
          <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition" onClick={() => window.location.href='/register'}>
            Join Now
          </button>
          <button className="bg-white border border-blue-600 text-blue-700 px-6 py-2 rounded hover:bg-blue-50 transition" onClick={() => window.location.href='/skills'}>
            Explore Skills
          </button>
        </div>
        <img
          src="https://undraw.co/api/illustrations/learning-collaboration.svg"
          alt="Learning collaboration"
          className="mx-auto max-w-xs md:max-w-md"
        />
      </section>

      {/* Features */}
      <section className="py-12 px-4 bg-gray-50">
        <h2 className="text-2xl font-semibold text-center mb-8 text-gray-800">Key Features</h2>
        <div className="flex flex-col md:flex-row justify-center gap-8">
          {features.map((f) => (
            <div key={f.title} className="bg-white rounded-lg shadow p-6 flex-1 text-center">
              <div className="text-4xl mb-2">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
              <p className="text-gray-600 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 px-4 bg-white">
        <h2 className="text-2xl font-semibold text-center mb-8 text-gray-800">How It Works</h2>
        <div className="flex flex-col md:flex-row justify-center gap-8">
          {steps.map((step, idx) => (
            <div key={step.title} className="flex flex-col items-center">
              <div className="text-4xl mb-2">{step.icon}</div>
              <div className="font-semibold">{step.title}</div>
              <div className="text-gray-600 text-sm text-center">{step.desc}</div>
              {idx < steps.length - 1 && (
                <div className="hidden md:block h-12 border-l-2 border-gray-200 mx-4"></div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 px-4 bg-blue-50">
        <h2 className="text-2xl font-semibold text-center mb-8 text-gray-800">Student Stories</h2>
        <div className="flex flex-col md:flex-row justify-center gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
              <blockquote className="italic text-gray-700 mb-2">“{t.quote}”</blockquote>
              <div className="font-semibold text-blue-700">— {t.name}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
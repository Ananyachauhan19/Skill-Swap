import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaGlobe, FaLightbulb, FaHandshake, FaChartLine, FaShieldAlt, FaClock, FaQuoteLeft, FaChevronLeft, FaChevronRight, FaStar } from 'react-icons/fa';
import axios from 'axios';

const WhyChooseSection = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const response = await axios.get(`${backendUrl}/api/testimonials?limit=5`);
        if (response.data && response.data.length > 0) {
          setTestimonials(response.data);
        } else {
          // Fallback testimonials if none exist
          setTestimonials([
            { _id: 1, username: 'Alex', description: 'SkillSwap changed the way I learn coding. Highly recommended!', rating: 5 },
            { _id: 2, username: 'Sarah', description: 'Great community and amazing tutors. I learned so much in just a week.', rating: 5 },
            { _id: 3, username: 'John', description: 'The best platform for peer-to-peer learning. Love it!', rating: 4 }
          ]);
        }
      } catch (error) {
        console.error('Error fetching testimonials:', error);
        setTestimonials([
          { _id: 1, username: 'Alex', description: 'SkillSwap changed the way I learn coding. Highly recommended!', rating: 5 },
          { _id: 2, username: 'Sarah', description: 'Great community and amazing tutors. I learned so much in just a week.', rating: 5 },
          { _id: 3, username: 'John', description: 'The best platform for peer-to-peer learning. Love it!', rating: 4 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const features = [
    {
      icon: <FaGlobe />,
      title: "Global Community",
      description: "Connect with learners and experts from over 50 countries.",
      color: "blue"
    },
    {
      icon: <FaLightbulb />,
      title: "Innovative Learning",
      description: "Experience a new way of learning through direct interaction.",
      color: "yellow"
    },
    {
      icon: <FaHandshake />,
      title: "Trusted Platform",
      description: "Verified profiles and secure environment for your peace of mind.",
      color: "green"
    },
    {
      icon: <FaChartLine />,
      title: "Career Growth",
      description: "Enhance your skills and boost your career prospects.",
      color: "purple"
    },
    {
      icon: <FaShieldAlt />,
      title: "Secure & Safe",
      description: "Your data and privacy are our top priority.",
      color: "red"
    },
    {
      icon: <FaClock />,
      title: "Flexible Schedule",
      description: "Learn at your own pace, anytime, anywhere.",
      color: "indigo"
    }
  ];

  return (
    <section className="py-6 sm:py-8 bg-home-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#0A2540] mb-3"
          >
            Why Choose SkillSwap Hub?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            We provide the best environment for you to learn, teach, and grow.
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6 lg:gap-8 mb-12 sm:mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-3 sm:p-6 lg:p-8 rounded-lg sm:rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 group"
            >
              <div className={`w-8 h-8 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-${feature.color}-50 text-${feature.color}-600 flex items-center justify-center text-base sm:text-2xl mb-2 sm:mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto`}>
                {feature.icon}
              </div>
              <h3 className="text-xs sm:text-xl font-bold text-gray-900 mb-1 sm:mb-3 text-center">{feature.title}</h3>
              <p className="text-[10px] sm:text-base text-gray-600 leading-relaxed text-center hidden sm:block">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Testimonials Slider */}
        <div className="bg-[#0A2540] rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

          <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
            <FaQuoteLeft className="text-4xl text-blue-400 mx-auto mb-8 opacity-50" />

            <div className="min-h-[180px] sm:min-h-[200px] flex items-center justify-center">
              {testimonials.length > 0 && (
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4 sm:space-y-6"
                >
                  <p className="text-base sm:text-xl md:text-2xl font-medium leading-relaxed italic">
                    "{testimonials[currentTestimonial].description}"
                  </p>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex text-yellow-400 gap-1">
                      {[...Array(testimonials[currentTestimonial].rating || 5)].map((_, i) => (
                        <FaStar key={i} />
                      ))}
                    </div>
                    <h4 className="font-bold text-lg">{testimonials[currentTestimonial].username}</h4>
                    <p className="text-blue-200 text-sm">Learner</p>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="flex justify-center gap-4 mt-8">
              <button onClick={prevTestimonial} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <FaChevronLeft className="text-white" />
              </button>
              <button onClick={nextTestimonial} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <FaChevronRight className="text-white" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default WhyChooseSection;
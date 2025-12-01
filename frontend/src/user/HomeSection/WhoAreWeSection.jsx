import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaGlobe, FaUsers, FaLightbulb } from 'react-icons/fa';
import axios from 'axios';

const WhoAreWeSection = () => {
  const [totalUsers, setTotalUsers] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const { data } = await axios.get(`${backendUrl}/api/auth/stats/public`);
        setTotalUsers(data?.totalUsers ?? null);
      } catch (err) {
        setTotalUsers(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);
  return (
    <section className="py-4 sm:py-6 bg-home-bg overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <div className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                About Us
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0A2540] leading-tight">
                We Are Building the Future of <br />
                <span className="text-blue-600">Collaborative Learning</span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                SkillSwap Hub is more than just a platform; it's a global movement. We believe that everyone has something to teach and something to learn. Our mission is to democratize education by connecting curious minds with passionate experts.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <FaGlobe className="text-xl" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Global Reach</h3>
                <p className="text-sm text-gray-500">Connecting learners from every corner of the world.</p>
              </div>
              <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                  <FaUsers className="text-xl" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Community First</h3>
                <p className="text-sm text-gray-500">Built by the community, for the community.</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0A2540] to-blue-900 text-white relative overflow-hidden">
              <div className="relative z-10 flex items-start gap-4">
                <div className="p-3 rounded-full bg-white/10">
                  <FaLightbulb className="text-yellow-400 text-xl" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Our Mission</h3>
                  <p className="text-blue-100 text-sm leading-relaxed">
                    To create a world where knowledge is shared freely and accessible to everyone, regardless of their background or location.
                  </p>
                </div>
              </div>
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-10 -mb-10"></div>
            </div>
          </motion.div>

          {/* Right Image Composition */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1471&q=80"
                alt="Team collaboration"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

              <div className="absolute bottom-6 left-6 right-6 text-white">
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map(i => (
                      <img key={i} src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-10 h-10 rounded-full border-2 border-white" />
                    ))}
                  </div>
                  <span className="font-semibold text-sm">
                    {loading ? 'Loading…' : (totalUsers != null ? `${totalUsers.toLocaleString()} Learners` : 'Our Learners')}
                  </span>
                </div>
                <p className="text-sm text-gray-200">Join our growing family today.</p>
              </div>
            </div>

            {/* Floating Badge */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="absolute -top-6 -right-6 bg-white p-4 rounded-xl shadow-xl border border-gray-100 hidden md:block"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                  <span className="text-xl font-bold text-green-600">98%</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Success Rate</p>
                  <p className="text-sm font-bold text-gray-900">in Skill Matching</p>
                </div>
              </div>
            </motion.div>

            {/* Decorative Elements */}
            <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-100/50 rounded-full blur-3xl opacity-50"></div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default WhoAreWeSection;
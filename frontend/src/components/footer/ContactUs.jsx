import React from 'react';
import { motion } from 'framer-motion';
import { 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiClock, 
  FiMessageSquare,
  FiGlobe,
  FiSend,
  FiUsers,
  FiLifeBuoy
} from 'react-icons/fi';

const ContactUs = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  const contactMethods = [
    {
      icon: FiMail,
      title: 'Email Us',
      primary: 'support@skillswaphub.in',
      secondary: 'For general inquiries and support',
      action: 'mailto:support@skillswaphub.in',
      color: 'blue'
    },
    {
      icon: FiClock,
      title: 'Response Time',
      primary: '24-48 Hours',
      secondary: 'Average response time for all queries',
      color: 'green'
    },
    {
      icon: FiGlobe,
      title: 'Support Hours',
      primary: '24/7 Support',
      secondary: 'We\'re here to help anytime',
      color: 'purple'
    }
  ];

  const supportCategories = [
    {
      icon: FiLifeBuoy,
      title: 'Technical Support',
      description: 'Having trouble with the platform? Our technical team is ready to assist you.',
      link: '/help'
    },
    {
      icon: FiMessageSquare,
      title: 'General Inquiries',
      description: 'Questions about our services, features, or how to get started? Reach out!',
      link: '/help'
    },
    {
      icon: FiUsers,
      title: 'Community Help',
      description: 'Connect with other learners and share your experiences in our community.',
      link: '/community'
    }
  ];

  const quickLinks = [
    {
      icon: FiSend,
      title: 'Submit a Query',
      description: 'Fill out our contact form and we\'ll get back to you soon',
      link: '/help',
      color: 'blue'
    },
    {
      icon: FiMessageSquare,
      title: 'View FAQs',
      description: 'Find quick answers to commonly asked questions',
      link: '/faq',
      color: 'indigo'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pt-16 md:pt-[72px] xl:pt-20">
      {/* Hero Section */}
      <motion.section 
        className="relative bg-gradient-to-br from-blue-800 to-blue-900 text-white py-20 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Background Decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-700 rounded-full opacity-20 blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="text-center"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Icon Badge */}
            <motion.div 
              className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-6"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <FiMail className="w-10 h-10 text-white" />
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Get in <span className="text-blue-300">Touch</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              We're here to help! Reach out to us through any of the methods below and we'll get back to you as soon as possible.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Contact Methods Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {contactMethods.map((method, index) => (
            <motion.a
              key={index}
              href={method.action || '#'}
              onClick={(e) => !method.action && e.preventDefault()}
              className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group ${
                method.action ? 'cursor-pointer' : 'cursor-default'
              }`}
              variants={itemVariants}
              whileHover={{ y: -5 }}
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${
                method.color === 'blue' ? 'from-blue-500 to-blue-600' :
                method.color === 'green' ? 'from-green-500 to-green-600' :
                'from-purple-500 to-purple-600'
              } rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <method.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{method.title}</h3>
              <p className="text-xl font-semibold text-blue-600 mb-2">{method.primary}</p>
              <p className="text-gray-600">{method.secondary}</p>
            </motion.a>
          ))}
        </motion.div>
      </section>

      {/* Support Categories Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              How Can We <span className="text-blue-600">Help You?</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the category that best matches your needs for faster assistance
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {supportCategories.map((category, index) => (
              <motion.a
                key={index}
                href={category.link}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border-2 border-gray-200 hover:border-blue-500 transition-all duration-300 group"
                variants={itemVariants}
                whileHover={{ y: -5 }}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <category.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{category.title}</h3>
                <p className="text-gray-600 leading-relaxed">{category.description}</p>
              </motion.a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Quick <span className="text-blue-600">Actions</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get started with these helpful resources
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {quickLinks.map((link, index) => (
            <motion.a
              key={index}
              href={link.link}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group border-2 border-transparent hover:border-blue-500"
              variants={itemVariants}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-start gap-6">
                <div className={`w-14 h-14 bg-gradient-to-br ${
                  link.color === 'blue' ? 'from-blue-500 to-blue-600' : 'from-indigo-500 to-indigo-600'
                } rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                  <link.icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{link.title}</h3>
                  <p className="text-gray-600">{link.description}</p>
                </div>
              </div>
            </motion.a>
          ))}
        </motion.div>
      </section>

      {/* Contact Info Banner */}
      <section className="py-16 bg-gradient-to-br from-blue-800 to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Still Have Questions?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Our support team is available 24/7 to assist you. Don't hesitate to reach out via email or submit a query through our contact form.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.a
                  href="mailto:support@skillswaphub.in"
                  className="bg-white text-blue-900 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 inline-flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiMail className="w-5 h-5" />
                  Email Support
                </motion.a>
                <motion.a
                  href="/help"
                  className="bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-600 transition-all duration-300 inline-flex items-center justify-center gap-2 border-2 border-white/20"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiSend className="w-5 h-5" />
                  Submit Query
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Additional Info Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 md:p-12 border-2 border-gray-200"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <FiMapPin className="w-6 h-6 text-blue-600" />
                Our Commitment
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                At SkillSwapHub, we're dedicated to providing exceptional support to all our users. Whether you're a learner seeking knowledge or a tutor sharing expertise, we're here to ensure your experience is smooth and successful.
              </p>
              <p className="text-gray-600 leading-relaxed">
                We value your feedback and continuously work to improve our platform based on your suggestions and needs.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <FiClock className="w-6 h-6 text-blue-600" />
                What to Expect
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Quick response times - typically within 24-48 hours</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Professional and friendly support team</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Comprehensive solutions to your queries</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Follow-up support until your issue is resolved</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default ContactUs;

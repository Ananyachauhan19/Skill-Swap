/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { BACKEND_URL } from '../../config.js';

const FAQSection = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${BACKEND_URL}/api/interview/faqs`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch FAQs');
        const data = await res.json();
        const list = Array.isArray(data) ? data : (Array.isArray(data.faqs) ? data.faqs : []);
        // Normalize keys to { question, answer }
        const normalized = list.map(item => ({
          question: item.question || item.q || '',
          answer: item.answer || item.a || '',
        })).filter(x => x.question && x.answer);
        setFaqs(normalized);
      } catch (err) {
        console.error('FAQ fetch error:', err);
        setError('Could not load FAQs.');
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (loading) {
    return (
      <section className="bg-white rounded-3xl p-4 sm:p-6 lg:p-10 shadow-lg">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#3b82f6] border-t-transparent"></div>
          <p className="text-[#4b5563] mt-4 text-sm sm:text-base">Loading FAQs...</p>
        </div>
      </section>
    );
  }

  if (error || faqs.length === 0) {
    return null; // Don't show section if no FAQs
  }

  return (
    <section className="w-full bg-home-bg overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 mb-8 sm:mb-10 pb-6 border-b border-gray-200">
        <div className="flex items-center justify-center gap-2 sm:gap-3 w-full flex-wrap">
          <div className="w-6 sm:w-8 h-0.5 bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent rounded-full"></div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1e3a8a] text-center">
            ❓ Frequently Asked
          </h2>
          <div className="w-6 sm:w-8 h-0.5 bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent rounded-full"></div>
        </div>
        <p className="text-center text-[#6b7280] text-xs sm:text-sm lg:text-base max-w-2xl px-2">Find answers to common questions about our interview platform</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
        {faqs.map((faq, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md shadow-sm"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full flex items-center justify-between p-3 sm:p-5 text-left hover:bg-blue-50 transition-colors group"
            >
              <h3 className="font-bold text-[#1e3a8a] pr-2 sm:pr-4 flex-1 text-sm sm:text-base">
                <span className="text-[#3b82f6] mr-2 group-hover:scale-110 transition-transform">
                  {openIndex === index ? '✓' : '+'}
                </span>
                {faq.question}
              </h3>
              <div className="flex-shrink-0 text-[#3b82f6] text-sm sm:text-base">
                {openIndex === index ? (
                  <FaChevronUp className="transform transition-transform" />
                ) : (
                  <FaChevronDown className="transform transition-transform" />
                )}
              </div>
            </button>
            
            {openIndex === index && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="px-3 sm:px-5 pb-4 sm:pb-5 pt-2 sm:pt-3 text-[#4b5563] text-xs sm:text-sm border-t border-gray-200 bg-gray-50"
              >
                {faq.answer}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
      </div>
    </section>
  );
};

export default FAQSection;


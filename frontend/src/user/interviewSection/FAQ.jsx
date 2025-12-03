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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-center text-gray-600 text-sm">Find answers to common questions about our interview platform</p>
        </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-white rounded-xl border border-gray-200"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-blue-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 pr-4 flex-1">
                {faq.question}
              </h3>
              <div className="flex-shrink-0 text-blue-600">
                {openIndex === index ? (
                  <FaChevronUp />
                ) : (
                  <FaChevronDown />
                )}
              </div>
            </button>
            
            {openIndex === index && (
              <div className="px-5 pb-5 pt-3 text-gray-600 text-sm border-t border-gray-200">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
      </div>
    </section>
  );
};

export default FAQSection;


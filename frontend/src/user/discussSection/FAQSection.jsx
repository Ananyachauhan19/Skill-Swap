import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from '../../config.js';

const FAQItem = ({ faq, index }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-md p-4 border border-indigo-200 transition-all duration-300 hover:shadow-lg hover:bg-indigo-50">
      <button
        className="w-full flex items-center justify-between text-left"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${index}`}
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold text-blue-900 text-lg">Q: {faq.question}</span>
        </div>
        <svg
          className={`w-5 h-5 text-indigo-600 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        id={`faq-answer-${index}`}
        className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="text-gray-700 text-sm mt-2 pl-8">A: {faq.answer}</div>
      </div>
    </div>
  );
};

const FAQSection = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${BACKEND_URL}/api/group-discussions/faqs`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => setFaqs(data))
      .catch(err => setError('Could not load FAQs.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="w-full bg-blue-50 py-12 px-4 sm:px-6">
      <h3 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-8 text-center">FAQs about Group Discussions</h3>
      <div className="max-w-3xl mx-auto space-y-4">
        {loading ? (
          <div className="text-blue-700 text-lg font-semibold py-12">Loading...</div>
        ) : error ? (
          <div className="text-red-600 text-lg font-semibold py-12">{error}</div>
        ) : (
          faqs.length === 0 ? (
            <div className="text-gray-500 text-center">No FAQs found.</div>
          ) : (
            faqs.map((faq, idx) => (
              <FAQItem key={idx} faq={faq} index={idx} />
            ))
          )
        )}
      </div>
    </section>
  );
};

export default FAQSection;
import React, { useEffect, useState } from 'react';
import { BACKEND_URL } from '../../config.js';

const FAQSection = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFaqs = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${BACKEND_URL}/api/interview-faqs`);
        if (!res.ok) throw new Error('Failed to fetch FAQs');
        const data = await res.json();
        setFaqs(Array.isArray(data.faqs) ? data.faqs : []);
      } catch (err) {
        setError('Could not load FAQs.');
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  return (
    <section className="w-full bg-blue-50 border-t border-blue-200 py-8 px-2 mt-10">
      <h3 className="text-2xl font-bold text-center mb-6 text-blue-800">FAQs about Interview</h3>
      {loading ? (
        <div className="text-center text-blue-700">Loading FAQs...</div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow p-4">
              <div className="font-semibold text-blue-800 mb-1">Q: {faq.question}</div>
              <div className="text-gray-700">A: {faq.answer}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default FAQSection;

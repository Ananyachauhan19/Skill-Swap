import React, { useState } from 'react';

const staticFaqs = [
  {
    question: 'What is a Group Discussion (GD)?',
    answer: 'A Group Discussion is a collaborative conversation among participants on a given topic, often moderated by an expert.'
  },
  {
    question: 'How do I join a GD session?',
    answer: 'Browse the available sessions and click "Book Slot" to reserve your seat. You need enough credits to join.'
  }
];

const FAQSection = () => {
  // Backend-ready code (commented for now):
  // const [faqs, setFaqs] = useState([]);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState('');
  // useEffect(() => {
  //   const fetchFaqs = async () => {
  //     setLoading(true);
  //     setError('');
  //     try {
  //       const res = await fetch('/api/gd-faqs');
  //       if (!res.ok) throw new Error('Failed to fetch FAQs');
  //       const data = await res.json();
  //       setFaqs(Array.isArray(data.faqs) ? data.faqs : []);
  //     } catch (err) {
  //       setError('Could not load FAQs.');
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchFaqs();
  // }, []);

  return (
    <section className="w-full bg-blue-50 border-t border-blue-200 py-8 px-2 mt-10">
      <h3 className="text-2xl font-bold text-center mb-6 text-blue-800">FAQs about Group Discussions</h3>
      <div className="max-w-2xl mx-auto space-y-4">
        {staticFaqs.map((faq, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow p-4">
            <div className="font-semibold text-blue-800 mb-1">Q: {faq.question}</div>
            <div className="text-gray-700">A: {faq.answer}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FAQSection;

import React from 'react';

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
  return (
    <section className="w-full bg-blue-50 border-t border-blue-200 py-8 px-2 mt-10">
      <h3 className="text-2xl font-bold text-center mb-6 text-blue-900">FAQs about Group Discussions</h3>
      <div className="max-w-2xl mx-auto space-y-4">
        {staticFaqs.map((faq, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow p-4">
            <div className="font-semibold text-gray-800 mb-1">Q: {faq.question}</div>
            <div className="text-gray-800">A: {faq.answer}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FAQSection;
import React, { useState } from 'react';

const InterviewSessionRatingModal = ({ open, onSubmit, interviewerName = '' }) => {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!rating || !feedback.trim()) {
      setError('Please provide a rating and feedback.');
      return;
    }
    setError('');
    onSubmit({ rating, feedback });
  };

  return (
    <div className="fixed inset-0 bg-white bg-opacity-40 flex items-center justify-center z-50">
      <form className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative flex flex-col gap-4" onSubmit={handleSubmit}>
        <h3 className="text-xl font-bold mb-2 text-blue-800">Rate Your Interview</h3>
        <div className="text-blue-700 mb-2">{interviewerName && `Expert: ${interviewerName}`}</div>
        <div className="flex items-center gap-2">
          <span className="font-medium">Rating:</span>
          {[1,2,3,4,5].map(star => (
            <button
              key={star}
              type="button"
              className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
              onClick={() => setRating(star)}
              aria-label={`Rate ${star}`}
            >
              ★
            </button>
          ))}
        </div>
        <textarea
          className="border border-blue-200 rounded px-3 py-2 min-h-[60px]"
          placeholder="Share your feedback (required)"
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          required
        />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors">Submit Rating</button>
      </form>
    </div>
  );
};

export default InterviewSessionRatingModal;

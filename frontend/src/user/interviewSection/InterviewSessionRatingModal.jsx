import React, { useState } from 'react';
import { FaTimes, FaStar, FaComment, FaCheckCircle } from 'react-icons/fa';
import { AnimatePresence, motion } from 'framer-motion';
import { BACKEND_URL } from '../../config.js';

const InterviewSessionRatingModal = ({ isOpen, onClose, interview, onRatingSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Get interviewer name from interview object
  const interviewerName = interview?.assignedInterviewer?.username || 
                         `${interview?.assignedInterviewer?.firstName || ''} ${interview?.assignedInterviewer?.lastName || ''}`.trim() ||
                         interview?.assignedInterviewer?.firstName ||
                         'Interviewer';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!rating) {
      setError('Please provide a rating.');
      return;
    }
    
    if (!feedback.trim()) {
      setError('Please share your feedback.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/interview/${interview._id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          rating,
          feedback: feedback.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit rating');
      }

      const data = await response.json();
      console.log('Rating submitted successfully:', data);
      
      setSuccess(true);
      
      // Call the callback if provided
      if (onRatingSubmitted) {
        onRatingSubmitted(data);
      }

      // Close modal after a short delay to show success message
      setTimeout(() => {
        setSuccess(false);
        setRating(5);
        setFeedback('');
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Error submitting rating:', err);
      setError(err.message || 'Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingLabels = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[rgb(30,58,138)] to-[rgb(37,70,165)] text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">Rate Your Interview</h3>
                  <p className="text-blue-100 text-sm">Share your experience with {interviewerName}</p>
                </div>
                <button 
                  onClick={onClose} 
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                  disabled={isSubmitting}
                >
                  <FaTimes size={20} />
                </button>
              </div>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Success Message */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl"
                >
                  <FaCheckCircle className="text-green-500 text-xl flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-green-900">Rating submitted successfully!</p>
                    <p className="text-sm text-green-700">Thank you for your feedback.</p>
                  </div>
                </motion.div>
              )}

              {/* Rating Section */}
              <div>
                <label className="block text-gray-900 font-semibold mb-3 text-sm">
                  How would you rate this interview?
                </label>
                <div className="flex items-center justify-center gap-3 p-6 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border border-gray-200">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`text-4xl transition-all duration-150 transform hover:scale-110 ${
                          star <= (hoveredRating || rating) 
                            ? 'text-yellow-400 drop-shadow-lg' 
                            : 'text-gray-300'
                        }`}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        aria-label={`Rate ${star} stars`}
                        disabled={isSubmitting || success}
                      >
                        <FaStar />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-center mt-3">
                  <span className="text-lg font-bold text-[rgb(30,58,138)]">
                    {ratingLabels[hoveredRating || rating]}
                  </span>
                  <span className="text-gray-500 ml-2">({hoveredRating || rating}/5)</span>
                </div>
              </div>

              {/* Feedback Section */}
              <div>
                <label className="block text-gray-900 font-semibold mb-2 text-sm items-center gap-2">
                  <FaComment className="text-[rgb(30,58,138)]" />
                  Share your feedback
                </label>
                <textarea
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 min-h-[120px] focus:border-[rgb(30,58,138)] focus:ring-2 focus:ring-[rgb(30,58,138)]/20 transition-all resize-none text-gray-900 placeholder-gray-400"
                  placeholder="Tell us about your interview experience... What went well? What could be improved?"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  disabled={isSubmitting || success}
                  maxLength={1000}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">Be specific and constructive</p>
                  <p className="text-xs text-gray-400">{feedback.length}/1000</p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                  disabled={isSubmitting || success}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[rgb(30,58,138)] to-[rgb(37,70,165)] text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={isSubmitting || success || !feedback.trim()}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : success ? (
                    <span className="flex items-center justify-center gap-2">
                      <FaCheckCircle />
                      Submitted!
                    </span>
                  ) : (
                    'Submit Rating'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InterviewSessionRatingModal;

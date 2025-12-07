import React, { useState, useEffect } from 'react';
import { FaStar, FaTimes, FaSpinner } from 'react-icons/fa';
import { BACKEND_URL } from '../config';

const TutorFeedbackModal = ({ isOpen, onClose, tutorId, tutorName }) => {
  const [loading, setLoading] = useState(false);
  const [feedbackData, setFeedbackData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && tutorId) {
      fetchFeedback();
    }
  }, [isOpen, tutorId]);

  const fetchFeedback = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${BACKEND_URL}/api/tutors/${tutorId}/feedback`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }
      
      const data = await response.json();
      setFeedbackData(data);
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setError('Failed to load feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getRatingDistribution = () => {
    if (!feedbackData?.ratingDistribution) return [];
    const { ratingDistribution, totalRatings } = feedbackData;
    return [5, 4, 3, 2, 1].map(star => ({
      star,
      count: ratingDistribution[star] || 0,
      percentage: totalRatings > 0 ? ((ratingDistribution[star] || 0) / totalRatings * 100).toFixed(0) : 0
    }));
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}
            size={14}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border-2 border-gray-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Tutor Feedback</h2>
            <p className="text-blue-100 text-sm mt-1">{tutorName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <FaSpinner className="animate-spin text-blue-600 text-3xl" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchFeedback}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : feedbackData ? (
            <>
              {/* Rating Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-8">
                  {/* Average Rating */}
                  <div className="text-center">
                    <div className="text-5xl font-bold text-gray-900 mb-2">
                      {feedbackData.averageRating?.toFixed(1) || '0.0'}
                    </div>
                    <div className="flex items-center justify-center mb-2">
                      {renderStars(Math.round(feedbackData.averageRating || 0))}
                    </div>
                    <p className="text-sm text-gray-600">
                      {feedbackData.totalRatings || 0} {feedbackData.totalRatings === 1 ? 'rating' : 'ratings'}
                    </p>
                  </div>

                  {/* Rating Distribution */}
                  <div className="flex-1">
                    {getRatingDistribution().map(({ star, count, percentage }) => (
                      <div key={star} className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-gray-700 w-12">
                          {star} star
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                            style={{ width: `${percentage}%` }}
                          >
                            {percentage > 15 && (
                              <span className="text-xs font-semibold text-white">
                                {percentage}%
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Individual Reviews */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Student Reviews ({feedbackData.reviews?.length || 0})
                </h3>
                
                {feedbackData.reviews && feedbackData.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {feedbackData.reviews.map((review, index) => (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                      >
                        {/* Review Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                              {review.studentName?.charAt(0).toUpperCase() || 'S'}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {review.studentName || 'Anonymous'}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {renderStars(review.rating)}
                                <span className="text-xs text-gray-500">
                                  {new Date(review.ratedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Session Details */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {review.class && (
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                              {review.class}
                            </span>
                          )}
                          {review.subject && (
                            <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                              {review.subject}
                            </span>
                          )}
                          {review.topic && (
                            <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">
                              {review.topic}
                            </span>
                          )}
                        </div>

                        {/* Review Text */}
                        {review.reviewText && (
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {review.reviewText}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No reviews yet</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No feedback data available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorFeedbackModal;

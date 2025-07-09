import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StarRating = ({ rating, size = 'text-blue-300 text-base' }) => (
  <span className={`${size} transition-colors duration-300`}>
    {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
  </span>
);

const getProfilePic = (t) => {
  if (t.profilePic) return t.profilePic;
  const initials = t.username
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=CBD5E1&color=1E3A8A&bold=true`;
};

const DEMO_TESTIMONIALS = [
  {
    username: 'Aarav Sharma',
    rating: 5,
    description: 'The live sessions helped me clear my doubts instantly. The tutors are amazing!',
    profilePic: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    username: 'Priya Verma',
    rating: 4,
    description: 'I love the recorded videos. I can learn at my own pace and revisit topics anytime.',
    profilePic: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
  {
    username: 'Rahul Singh',
    rating: 5,
    description: 'Unlocking sessions with golden coins is so easy and affordable. Highly recommended!',
    profilePic: 'https://randomuser.me/api/portraits/men/65.jpg',
  },
  {
    username: 'Sanya Kapoor',
    rating: 3,
    description: 'Good platform, but can improve the search experience.',
    profilePic: 'https://randomuser.me/api/portraits/women/68.jpg',
  },
  {
    username: 'Vikram Patel',
    rating: 4,
    description: 'Great tutors and easy to use. Would recommend to friends.',
    profilePic: 'https://randomuser.me/api/portraits/men/77.jpg',
  },
];

const Testimonial = ({ showAll = false }) => {
  const [testimonials, setTestimonials] = useState(DEMO_TESTIMONIALS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', rating: 5, description: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  // Calculate overall rating and breakdown
  const ratingCounts = [5, 4, 3, 2, 1].map((star) => testimonials.filter((t) => Number(t.rating) === star).length);
  const totalRatings = ratingCounts.reduce((a, b) => a + b, 0);
  const averageRating = totalRatings
    ? (testimonials.reduce((sum, t) => sum + Number(t.rating), 0) / totalRatings).toFixed(1)
    : '0.0';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.description) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to submit testimonial');
      const newTestimonial = await res.json();
      setTestimonials([newTestimonial, ...testimonials]);
      setForm({ username: '', rating: 5, description: '' });
      setShowForm(false);
    } catch (err) {
      setError('Could not submit testimonial.');
    } finally {
      setSubmitting(false);
    }
  };

  const visibleTestimonials = showAll ? testimonials : testimonials.slice(0, 3);

  return (
    <div className="w-full bg-gradient-to-b from-blue-100 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl font-extrabold text-center text-blue-900 mb-8"
      >
        What Our Users Say
      </motion.h2>

      {/* Overall Review Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8 mb-10 flex flex-col md:flex-row items-center gap-8"
      >
        <div className="flex flex-col items-center md:items-start md:w-1/3">
          <div className="text-5xl font-bold text-blue-900">{averageRating}</div>
          <StarRating rating={Math.round(Number(averageRating))} size="text-blue-300 text-2xl" />
          <div className="text-blue-600 text-sm mt-2">{totalRatings} reviews</div>
        </div>
        <div className="flex-1 w-full">
          {[5, 4, 3, 2, 1].map((star, idx) => (
            <div key={star} className="flex items-center gap-3 mb-2">
              <span className="w-10 text-sm text-blue-900 font-medium">{star} star</span>
              <div className="flex-1 bg-blue-100 rounded-full h-4 overflow-hidden">
                <motion.div
                  className="bg-blue-600 h-4 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: totalRatings ? `${(ratingCounts[idx] / totalRatings) * 100}%` : '0%' }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <span className="w-8 text-xs text-blue-700 text-right">{ratingCounts[idx]}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Add Testimonial Button */}
      <div className="flex flex-col items-center mb-10">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-3 bg-blue-700 text-white rounded-full font-semibold text-lg hover:bg-blue-800 transition-colors duration-300"
          onClick={() => setShowForm((f) => !f)}
        >
          + Share Your Feedback
        </motion.button>
        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg flex flex-col gap-4 mt-6"
              onSubmit={handleSubmit}
            >
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Your Name"
                className="border border-blue-200 rounded-lg px-4 py-3 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200"
                required
              />
              <div className="flex items-center gap-3">
                <label className="font-medium text-blue-900">Rating:</label>
                <select
                  name="rating"
                  value={form.rating}
                  onChange={handleChange}
                  className="border border-blue-200 rounded-lg px-3 py-2 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200"
                >
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <StarRating rating={form.rating} />
              </div>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Write your testimonial..."
                className="border border-blue-200 rounded-lg px-4 py-3 text-blue-900 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200"
                required
              />
              <div className="flex gap-3 justify-end">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 rounded-lg bg-blue-200 text-blue-900 font-semibold hover:bg-blue-300 transition-colors duration-200"
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-800 transition-colors duration-200"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </motion.button>
              </div>
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 text-sm mt-2"
                >
                  {error}
                </motion.div>
              )}
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Testimonials List */}
      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-blue-900 text-lg font-semibold py-12 text-center"
        >
          Loading...
        </motion.div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-500 text-lg font-semibold py-12 text-center"
        >
          {error}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          <AnimatePresence>
            {visibleTestimonials.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-blue-600 text-center"
              >
                No testimonials found.
              </motion.div>
            ) : (
              visibleTestimonials.map((t, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center hover:shadow-xl transition-shadow duration-300"
                >
                  <img
                    src={getProfilePic(t)}
                    alt={t.username}
                    className="w-20 h-20 rounded-full object-cover mb-4 border-2 border-blue-200"
                  />
                  <div className="font-semibold text-blue-900 text-lg">{t.username}</div>
                  <StarRating rating={Number(t.rating)} size="text-blue-300 text-lg" />
                  <div className="text-blue-700 mt-3 text-center text-sm leading-relaxed">
                    {t.description}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Show More Button */}
      {!showAll && !loading && !error && testimonials.length > 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-center mt-8"
        >
          <a
            className="text-blue-700 font-semibold text-lg hover:text-blue-900 transition-colors duration-200"
            href="/testimonials"
          >
            Show More
          </a>
        </motion.div>
      )}
    </div>
  );
};

export default Testimonial;
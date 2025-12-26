/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from '../config.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const StarRating = ({ rating, size = 'text-blue-600 text-base' }) => (
  <span className={size}>
    {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
  </span>
);

// Local Avatar renderer to avoid external service failures
const Avatar = ({ name, src, size = 80 }) => {
  const initials = (name || '?')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const [imgOk, setImgOk] = useState(Boolean(src));

  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center border-2 border-blue-300"
      style={{ width: size, height: size }}
    >
      {imgOk && src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgOk(false)}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
            color: '#1e3a8a',
            fontWeight: 700,
            fontSize: Math.max(14, Math.floor(size / 2.6)),
          }}
        >
          {initials}
        </div>
      )}
    </div>
  );
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
  const { user } = useAuth();
  const [testimonials, setTestimonials] = useState(DEMO_TESTIMONIALS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', rating: 5, description: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Prefill form with authenticated user's name when available
  useEffect(() => {
    if (user) {
      const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || '';
      setForm((f) => ({ ...f, username: displayName }));
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/testimonials?limit=50`);
        if (!res.ok) throw new Error('Failed to fetch testimonials');
        const data = await res.json();
        if (!active) return;
        setTestimonials(Array.isArray(data) && data.length ? data : DEMO_TESTIMONIALS);
        setError(null);
      } catch (e) {
        // Fallback to demo if backend not available
        setTestimonials(DEMO_TESTIMONIALS);
        setError(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const safeTestimonials = Array.isArray(testimonials) ? testimonials : [];
  const ratingCounts = [5, 4, 3, 2, 1].map(star => safeTestimonials.filter(t => Number(t?.rating) === star).length);
  const totalRatings = ratingCounts.reduce((a, b) => a + b, 0);
  const averageRating = totalRatings ? (safeTestimonials.reduce((sum, t) => sum + Number(t?.rating || 0), 0) / totalRatings).toFixed(1) : '0.0';

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.username || !form.description) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/testimonials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          // attach the user's profile picture if logged in
          ...(user && user.profilePic ? { profilePic: user.profilePic } : {}),
        }),
      });
      if (!res.ok) throw new Error('Failed to submit rating');
      const newTestimonial = await res.json();
      setTestimonials([newTestimonial, ...testimonials]);
      setForm({ username: '', rating: 5, description: '' });
      setShowForm(false);
    } catch (err) {
      setError('Could not submit rating.');
    } finally {
      setSubmitting(false);
    }
  };

  const visibleTestimonials = showAll ? safeTestimonials : safeTestimonials.slice(0, 3);

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 to-blue-100 pt-16 md:pt-[72px] lg:pt-20 pb-12 px-4 sm:px-6 lg:px-8 border-t border-blue-300">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl font-extrabold text-center mb-8 text-blue-900 tracking-tight"
      >
        Rating
      </motion.h2>
      {/* Overall Review Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6 mb-10 flex flex-col md:flex-row items-center gap-6 border border-blue-300"
      >
        <div className="flex flex-col items-center md:items-start md:w-1/3">
          <div className="text-5xl font-bold text-blue-900">{averageRating}</div>
          <StarRating rating={Math.round(Number(averageRating))} size="text-blue-600 text-3xl" />
          <div className="text-gray-600 text-sm mt-2">{totalRatings} ratings</div>
        </div>
        <div className="flex-1 w-full mt-6 md:mt-0">
          {[5,4,3,2,1].map((star, idx) => (
            <div key={star} className="flex items-center gap-3 mb-2">
              <span className="w-12 text-sm text-blue-900 font-semibold flex items-center">
                <Star className="w-4 h-4 mr-1 text-blue-600" /> {star}
              </span>
              <div className="flex-1 bg-blue-50 rounded-full h-4 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-blue-700 to-blue-500 h-4 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: totalRatings ? `${(ratingCounts[idx] / totalRatings) * 100}%` : '0%' }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <span className="w-12 text-xs text-gray-600 text-right">{ratingCounts[idx]}</span>
            </div>
          ))}
        </div>
      </motion.div>
      {/* Add Raiting Button */}
      <div className="flex flex-col items-center mb-10">
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)" }}
          whileTap={{ scale: 0.95 }}
          className="mb-6 px-6 py-3 bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded-full font-semibold flex items-center gap-2 hover:from-blue-800 hover:to-blue-600 transition-all duration-300 shadow-lg"
          onClick={() => setShowForm(f => !f)}
        >
          <PlusCircle className="w-5 h-5 text-white" /> Add Your Rating
        </motion.button>
        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg flex flex-col gap-4 border border-blue-300"
              onSubmit={handleSubmit}
            >
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Your Name"
                className="border border-blue-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-blue-50"
                required
              />
              <div className="flex items-center gap-3">
                <label className="font-medium text-blue-900">Rating:</label>
                <select
                  name="rating"
                  value={form.rating}
                  onChange={handleChange}
                  className="border border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-blue-50"
                >
                  {[5,4,3,2,1].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <StarRating rating={form.rating} />
              </div>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Write your rating..."
                className="border border-blue-300 rounded-lg px-4 py-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-blue-50"
                required
              />
              <div className="flex gap-3 justify-end">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-all duration-200"
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-700 to-blue-500 text-white font-semibold hover:from-blue-800 hover:to-blue-600 transition-all duration-300 disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </motion.button>
              </div>
              {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
            </motion.form>
          )}
        </AnimatePresence>
      </div>
      {/* Testimonials List */}
      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-blue-800 text-lg font-semibold py-12 text-center"
        >
          Loading...
        </motion.div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-600 text-lg font-semibold py-12 text-center"
        >
          {error}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {!Array.isArray(visibleTestimonials) || visibleTestimonials.length === 0 ? (
            <div className="col-span-full text-gray-500 text-center">No ratings found.</div>
          ) : (
            visibleTestimonials.map((t, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center hover:shadow-xl transition-all duration-300 border border-blue-300"
              >
                <div className="mb-3">
                  <Avatar name={t?.username} src={t?.profilePic} size={80} />
                </div>
                <div className="font-semibold text-blue-900 text-lg">{t?.username}</div>
                <StarRating rating={Number(t?.rating || 0)} size="text-blue-600 text-xl" />
                <div className="text-gray-700 mt-3 text-center text-sm">{t?.description}</div>
              </motion.div>
            ))
          )}
        </div>
      )}
      {!showAll && !loading && !error && safeTestimonials.length > 3 && (
        <div className="flex justify-center mt-8">
          <motion.a
            whileHover={{ scale: 1.05 }}
            className="text-blue-800 font-semibold text-base hover:text-blue-900 transition-all duration-200 underline"
            href="/testimonials"
          >
            Show More
          </motion.a>
        </div>
      )}
    </div>
  );
};

export default Testimonial;
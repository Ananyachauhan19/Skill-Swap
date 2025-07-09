/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';

const StarRating = ({ rating, size = 'text-yellow-400 text-base' }) => (
  <span className={size}>
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
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=E0E7FF&color=1E40AF&bold=true`;
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
    // Commented out backend fetch for now to use static data
    // const fetchTestimonials = async () => {
    //   setLoading(true);
    //   setError(null);
    //   try {
    //     const res = await fetch('/api/testimonials');
    //     if (!res.ok) throw new Error('Failed to fetch testimonials');
    //     const data = await res.json();
    //     setTestimonials(data);
    //   } catch (err) {
    //     setError('Could not load testimonials.');
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchTestimonials();
    setLoading(false);
  }, []);

  // Calculate overall rating and breakdown
  const ratingCounts = [5, 4, 3, 2, 1].map(star => testimonials.filter(t => Number(t.rating) === star).length);
  const totalRatings = ratingCounts.reduce((a, b) => a + b, 0);
  const averageRating = totalRatings ? (testimonials.reduce((sum, t) => sum + Number(t.rating), 0) / totalRatings).toFixed(1) : '0.0';

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
      // Replace with your backend API endpoint
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

  // Only show first 3 testimonials unless showAll is true
  const visibleTestimonials = showAll ? testimonials : testimonials.slice(0, 3);

  return (
    <div className="w-full bg-blue-50 py-10 px-2 mt-10 border-t border-blue-200">
      <h2 className="text-2xl font-bold text-center mb-6 text-blue-800">Testimonials</h2>
      {/* Overall Review Section */}
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6 mb-8 flex flex-col md:flex-row items-center gap-6">
        <div className="flex flex-col items-center md:items-start md:w-1/3">
          <div className="text-4xl font-bold text-blue-800">{averageRating}</div>
          <StarRating rating={Math.round(Number(averageRating))} size="text-yellow-400 text-2xl" />
          <div className="text-gray-500 text-sm mt-1">{totalRatings} reviews</div>
        </div>
        <div className="flex-1 w-full">
          {[5,4,3,2,1].map((star, idx) => (
            <div key={star} className="flex items-center gap-2 mb-1">
              <span className="w-8 text-sm text-blue-900 font-semibold">{star} star</span>
              <div className="flex-1 bg-blue-100 rounded h-3 overflow-hidden">
                <div
                  className="bg-blue-500 h-3 rounded"
                  style={{ width: totalRatings ? `${(ratingCounts[idx] / totalRatings) * 100}%` : '0%' }}
                />
              </div>
              <span className="w-8 text-xs text-gray-600 text-right">{ratingCounts[idx]}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Add Testimonial Button */}
      <div className="flex flex-col items-center mb-6">
        <button
          className="mb-4 px-6 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors"
          onClick={() => setShowForm(f => !f)}
        >
          + Add your testimonial
        </button>
        {showForm && (
          <form className="bg-white rounded-lg shadow p-6 w-full max-w-md flex flex-col gap-3" onSubmit={handleSubmit}>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Your Name"
              className="border border-blue-200 rounded px-3 py-2"
              required
            />
            <div className="flex items-center gap-2">
              <label className="font-medium">Rating:</label>
              <select
                name="rating"
                value={form.rating}
                onChange={handleChange}
                className="border border-blue-200 rounded px-2 py-1"
              >
                {[5,4,3,2,1].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <StarRating rating={form.rating} />
            </div>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Write your testimonial..."
              className="border border-blue-200 rounded px-3 py-2 min-h-[60px]"
              required
            />
            <div className="flex gap-2 justify-end">
              <button type="button" className="px-4 py-1 rounded bg-gray-200" onClick={() => setShowForm(false)} disabled={submitting}>Cancel</button>
              <button type="submit" className="px-4 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit'}</button>
            </div>
            {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
          </form>
        )}
      </div>
      {/* Testimonials List */}
      {loading ? (
        <div className="text-blue-700 text-lg font-semibold py-12">Loading...</div>
      ) : error ? (
        <div className="text-red-600 text-lg font-semibold py-12">{error}</div>
      ) : (
        <div className="flex flex-wrap gap-6 justify-center">
          {visibleTestimonials.length === 0 ? (
            <div className="col-span-full text-gray-500 text-center">No testimonials found.</div>
          ) : (
            visibleTestimonials.map((t, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow p-5 w-full max-w-xs flex flex-col items-center">
                <img
                  src={getProfilePic(t)}
                  alt={t.username}
                  className="w-16 h-16 rounded-full object-cover mb-2 border border-blue-200"
                />
                <div className="font-semibold text-blue-800">{t.username}</div>
                <StarRating rating={Number(t.rating)} />
                <div className="text-gray-700 mt-2 text-center whitespace-pre-line">{t.description}</div>
              </div>
            ))
          )}
        </div>
      )}
      {/* Show More Button */}
      {!showAll && !loading && !error && testimonials.length > 3 && (
        <div className="flex justify-center mt-6">
          <a
            className="text-blue-700 font-semibold underline text-base hover:text-blue-900 transition cursor-pointer"
            href="/testimonials"
          >
            Show More
          </a>
        </div>
      )}
    </div>
  );
};

export default Testimonial;

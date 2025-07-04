import React, { useState } from 'react';

const defaultTestimonials = [
  {
    username: 'Priya',
    profilePic: 'https://randomuser.me/api/portraits/women/5.jpg',
    rating: 5,
    description: 'The GD session was very interactive and helped me boost my confidence!'
  },
  {
    username: 'Rahul',
    profilePic: 'https://randomuser.me/api/portraits/men/6.jpg',
    rating: 4,
    description: 'Great expert moderation and diverse topics.'
  }
];

const StarRating = ({ rating }) => (
  <span className="text-yellow-400 transition-all duration-300 hover:scale-110" aria-label={`Rating: ${rating} out of 5 stars`}>
    {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
  </span>
);

const GDTestimonialSection = () => {
  const [testimonials, setTestimonials] = useState(defaultTestimonials);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', rating: 5, description: '' });

  const getProfilePic = (t) => {
    if (t.profilePic) return t.profilePic;
    const initials = t.username
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=E0E7FF&color=1E40AF&bold=true`;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.username || !form.description) return;
    setTestimonials([form, ...testimonials]);
    setForm({ username: '', rating: 5, description: '' });
    setShowForm(false);
  };

  return (
    <section className="w-full bg-blue-50 py-12 px-4 sm:px-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-8 text-center">Testimonials</h2>
      <div className="flex flex-col items-center mb-8 max-w-7xl mx-auto">
        <button
          className="mb-6 px-6 py-3 bg-indigo-600 text-white rounded-full font-semibold text-lg shadow-md hover:bg-indigo-700 transition-all duration-300 hover:scale-105"
          onClick={() => setShowForm(f => !f)}
        >
          + Add Your Testimonial
        </button>
        {showForm && (
          <form className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md flex flex-col gap-4 border border-indigo-200 animate-fadeIn" onSubmit={handleSubmit}>
            <div className="flex flex-col">
              <label className="font-semibold text-blue-900 text-sm mb-1">Your Name</label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Enter your name"
                className="border border-indigo-200 rounded px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                required
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="font-semibold text-blue-900 text-sm">Rating:</label>
              <select
                name="rating"
                value={form.rating}
                onChange={handleChange}
                className="border border-indigo-200 rounded px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <StarRating rating={Number(form.rating)} />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold text-blue-900 text-sm mb-1">Your Testimonial</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Write your testimonial..."
                className="border border-indigo-200 rounded px-3 py-2 min-h-[80px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                required
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-all duration-300"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all duration-300"
              >
                Submit
              </button>
            </div>
          </form>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-center max-w-7xl mx-auto">
        {testimonials.map((t, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl shadow-md p-6 w-full max-w-xs flex flex-col items-center border border-indigo-200 transition-all duration-300 hover:shadow-lg hover:scale-105"
          >
            <picture>
              <source srcSet={t.profilePic ? `${t.profilePic.replace('.jpg', '.webp')}` : ''} type="image/webp" />
              <img
                src={getProfilePic(t)}
                alt={t.username}
                className="w-16 h-16 rounded-full object-cover mb-3 border border-indigo-200"
              />
            </picture>
            <div className="font-semibold text-blue-900 text-base">{t.username}</div>
            <StarRating rating={Number(t.rating)} />
            <div className="text-gray-700 mt-2 text-sm text-center whitespace-pre-line">{t.description}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default GDTestimonialSection;
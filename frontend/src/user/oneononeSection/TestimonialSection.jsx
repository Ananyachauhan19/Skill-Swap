import React, { useState } from 'react';

const defaultTestimonials = [
  {
    username: 'Alice',
    profilePic: 'https://randomuser.me/api/portraits/women/1.jpg',
    rating: 5,
    description: 'Great platform! Found the perfect tutor for my needs.'
  },
  {
    username: 'Bob',
    profilePic: 'https://randomuser.me/api/portraits/men/2.jpg',
    rating: 4,
    description: 'Easy to use and lots of options.'
  }
];

const StarRating = ({ rating }) => (
  <span className="text-yellow-400">
    {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
  </span>
);

const TestimonialSection = () => {
  const [testimonials, setTestimonials] = useState(defaultTestimonials);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', profilePic: '', rating: 5, description: '' });

  // Simulate fetching user profile (replace with real user context in production)
  const userProfile = {
    username: 'Your Name',
    profilePic: '', // Set to a URL if user has a profile picture
  };

  const getProfilePic = (t) => {
    if (t.profilePic) return t.profilePic;
    // If user has a profile pic in their profile, use it
    if (t.username === userProfile.username && userProfile.profilePic) return userProfile.profilePic;
    // Otherwise, show initials
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
    setForm({ username: '', profilePic: '', rating: 5, description: '' });
    setShowForm(false);
  };

  return (
    <div className="w-full bg-blue-50 py-10 px-2 mt-10 border-t border-blue-200">
      <h2 className="text-2xl font-bold text-center mb-6 text-blue-800">Testimonials</h2>
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
              <button type="button" className="px-4 py-1 rounded bg-gray-200" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="px-4 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700">Submit</button>
            </div>
          </form>
        )}
      </div>
      <div className="flex flex-wrap gap-6 justify-center">
        {testimonials.map((t, idx) => (
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
        ))}
      </div>
    </div>
  );
};

export default TestimonialSection;

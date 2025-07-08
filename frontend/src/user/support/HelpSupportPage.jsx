import React, { useEffect, useState } from "react";

// Backend function: Fetch support tickets
// async function fetchSupportTickets() {
//   const res = await fetch('/api/support/tickets');
//   return res.json();
// }
// Backend function: Submit new support ticket
// async function submitSupportTicket(data) {
//   return fetch('/api/support/tickets', { method: 'POST', body: JSON.stringify(data) });
// }

const HelpSupportPage = () => {
  // Static fallback data for development/demo
  const [tickets, setTickets] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ subject: '', description: '' });
  const [loading, setLoading] = useState(false);

  // useEffect(() => {
  //   fetchSupportTickets().then(setTickets);
  // }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      // await submitSupportTicket(form);
      setMessage("Support ticket submitted successfully!");
      setForm({ subject: '', description: '' });
    } catch (err) {
      setError("Failed to submit ticket.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8 bg-white rounded-xl shadow border border-blue-100 mt-8">
      <h1 className="text-2xl font-bold mb-6 text-blue-900 text-center">Help Center / Support Ticket</h1>
      <form id="contact-support" onSubmit={handleSubmit} className="space-y-4 mb-8">
        <input
          type="text"
          name="subject"
          value={form.subject}
          onChange={handleChange}
          placeholder="Subject"
          className="w-full border border-blue-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          required
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Describe your issue..."
          className="w-full border border-blue-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 min-h-[100px]"
          required
        />
        <button type="submit" className="bg-blue-700 text-white px-6 py-2 rounded font-semibold shadow hover:bg-blue-800 transition-all duration-200" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </form>
      {message && <p className="text-green-600 text-sm mb-2 text-center">{message}</p>}
      {error && <p className="text-red-600 text-sm mb-2 text-center">{error}</p>}
      <h2 className="text-lg font-semibold mb-2 text-blue-800">Your Previous Tickets</h2>
      <div className="bg-blue-50 rounded p-4 min-h-[60px] text-sm">
        {tickets.length ? tickets.map(t => (
          <div key={t.id} className="mb-2">
            <div className="font-bold text-blue-900">{t.subject}</div>
            <div className="text-gray-700">{t.description}</div>
            <div className="text-xs text-gray-500">Status: {t.status}</div>
          </div>
        )) : <span className="text-gray-500">No previous tickets found.</span>}
      </div>
    </div>
  );
};

export default HelpSupportPage;

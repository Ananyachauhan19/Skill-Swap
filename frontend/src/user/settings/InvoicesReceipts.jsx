import React, { useState, useEffect } from "react";

// Backend function: Fetch invoices and receipts
// async function fetchInvoices() {
//   return fetch('/api/payments/invoices').then(res => res.json());
// }

const InvoicesReceipts = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadInvoices() {
      setLoading(true);
      setError("");
      try {
        // const data = await fetchInvoices();
        // setInvoices(data);
        setInvoices([]); // Remove when backend is ready
      } catch (err) {
        setError("Failed to load invoices.");
      } finally {
        setLoading(false);
      }
    }
    loadInvoices();
  }, []);

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
        <h2 className="text-2xl font-semibold text-blue-900 text-center mb-6">Invoices & Receipts</h2>
        {error && <div className="text-red-600 text-sm mb-4 text-center">{error}</div>}
        {loading ? (
          <div className="text-center text-blue-600 flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center text-blue-600">No invoices or receipts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-blue-900 bg-blue-50">
                  <th className="py-3 px-4 text-left">Invoice #</th>
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Amount</th>
                  <th className="py-3 px-4 text-left">Download</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <tr key={i} className="border-t border-blue-100">
                    <td className="py-3 px-4 text-blue-900">{inv.number}</td>
                    <td className="py-3 px-4 text-blue-900">{inv.date}</td>
                    <td className="py-3 px-4 text-blue-900">{inv.amount}</td>
                    <td className="py-3 px-4">
                      <a href={inv.downloadUrl} className="text-blue-600 hover:text-blue-800 transition" target="_blank" rel="noopener noreferrer">Download</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicesReceipts;
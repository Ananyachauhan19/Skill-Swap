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
    <div className="min-h-screen w-full bg-blue-50 flex flex-col items-center pt-16 sm:pt-20">
      <div className="max-w-2xl w-full p-6 bg-white rounded-xl shadow border border-blue-100 mt-8 mx-auto">
        <h2 className="text-xl font-bold mb-4 text-center">Invoices & Receipts</h2>
        {error && <div className="text-red-600 text-sm mb-2 text-center">{error}</div>}
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : invoices.length === 0 ? (
          <div className="text-center text-gray-500">No invoices or receipts found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-blue-900">
                <th className="py-2">Invoice #</th>
                <th className="py-2">Date</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Download</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => (
                <tr key={i} className="border-t">
                  <td className="py-2">{inv.number}</td>
                  <td className="py-2">{inv.date}</td>
                  <td className="py-2">{inv.amount}</td>
                  <td className="py-2">
                    <a href={inv.downloadUrl} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Download</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default InvoicesReceipts;

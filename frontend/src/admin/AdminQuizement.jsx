import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config.js';

const AdminQuizement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    employeeId: '',
    password: '',
    status: 'active',
  });
  const [formError, setFormError] = useState('');
  const [confirmData, setConfirmData] = useState(null);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/api/admin/quizement-employees`, {
        withCredentials: true,
      });
      setEmployees(res.data || []);
      setError('');
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || 'Failed to load Quizzment employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.employeeId || !form.password) {
      setFormError('All fields are required');
      return;
    }
    setConfirmData({ ...form });
  };

  const handleConfirmCreate = async () => {
    if (!confirmData) return;
    try {
      setSaving(true);
      setFormError('');
      const res = await axios.post(
        `${BACKEND_URL}/api/admin/quizement-employees`,
        confirmData,
        { withCredentials: true }
      );
      setEmployees((prev) => [res.data, ...prev]);
      setShowForm(false);
      setConfirmData(null);
      setForm({ fullName: '', email: '', employeeId: '', password: '', status: 'active' });
    } catch (e) {
      console.error(e);
      setFormError(e.response?.data?.message || 'Failed to create Quizzment employee');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
      const res = await axios.put(
        `${BACKEND_URL}/api/admin/quizement-employees/${id}`,
        { status: nextStatus },
        { withCredentials: true }
      );
      setEmployees((prev) => prev.map((e) => (e._id === id ? res.data : e)));
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Quizzment Employees</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage dedicated Quizzment Employees who can create public quizzes for all users.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowForm(true);
              setConfirmData(null);
            }}
            className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold shadow-sm hover:bg-blue-800"
          >
            Add Quizzment Employee
          </button>
        </div>

        {loading && <p className="text-sm text-gray-600">Loading...</p>}
        {error && !loading && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}

        {!loading && employees.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Employee ID</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {employees.map((emp) => (
                    <tr key={emp._id}>
                      <td className="px-4 py-3 text-gray-900 font-medium">{emp.fullName}</td>
                      <td className="px-4 py-3 text-gray-700">{emp.email}</td>
                      <td className="px-4 py-3 text-gray-700">{emp.employeeId}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            emp.status === 'active'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {emp.status === 'active' ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-xs">
                        <button
                          type="button"
                          onClick={() => toggleStatus(emp._id, emp.status)}
                          className="px-3 py-1 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 mr-2"
                        >
                          {emp.status === 'active' ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && employees.length === 0 && !error && (
          <p className="text-sm text-gray-600">No Quizzment employees have been added yet.</p>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Add Quizzment Employee</h2>
            <p className="text-xs text-gray-600 mb-4">
              Email must be unique across the platform. Existing users or employees cannot be added.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Employee ID</label>
                <input
                  type="text"
                  name="employeeId"
                  value={form.employeeId}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>

              {formError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{formError}</p>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setConfirmData(null);
                    setFormError('');
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Confirm Creation</h3>
            <p className="text-xs text-gray-600 mb-4">
              Are you sure you want to create this Quizzment Employee? They will be able to create public quizzes for all users.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 mb-4">
              <div><span className="font-semibold">Name:</span> {confirmData.fullName}</div>
              <div><span className="font-semibold">Email:</span> {confirmData.email}</div>
              <div><span className="font-semibold">Employee ID:</span> {confirmData.employeeId}</div>
              <div><span className="font-semibold">Status:</span> {confirmData.status === 'active' ? 'Active' : 'Disabled'}</div>
            </div>
            {formError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3">{formError}</p>
            )}
            <div className="flex justify-end gap-2 text-sm">
              <button
                type="button"
                onClick={() => setConfirmData(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCreate}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-800 disabled:opacity-60"
              >
                {saving ? 'Creating...' : 'Create Employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuizement;

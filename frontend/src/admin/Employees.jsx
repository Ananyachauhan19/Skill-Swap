import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import {
  FiSearch,
  FiUsers,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiToggleLeft,
  FiToggleRight,
  FiMail,
  FiKey,
  FiShield,
  FiX,
} from 'react-icons/fi';

const ACCESS_OPTIONS = [
  { id: 'interviewer', label: 'Interview Expert approvals only' },
  { id: 'tutor', label: 'Tutor approvals only' },
  { id: 'both', label: 'Both interview + tutor approvals' },
];

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    employeeId: '',
    email: '',
    password: '',
    accessPermissions: 'both',
    isDisabled: false,
  });

  const resetForm = () => {
    setForm({
      name: '',
      employeeId: '',
      email: '',
      password: '',
      accessPermissions: 'both',
      isDisabled: false,
    });
    setEditingEmployee(null);
  };

  const openCreate = () => {
    resetForm();
    setDrawerOpen(true);
  };

  const openEdit = (emp) => {
    setEditingEmployee(emp);
    setForm({
      name: emp.name || '',
      employeeId: emp.employeeId || '',
      email: emp.email || '',
      password: '',
      accessPermissions: emp.accessPermissions || 'both',
      isDisabled: !!emp.isDisabled,
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => {
      resetForm();
    }, 200);
  };

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`${BACKEND_URL}/api/admin/employees`, {
        withCredentials: true,
      });
      const list = Array.isArray(res.data) ? res.data : res.data.employees || [];
      setEmployees(list);
    } catch (e) {
      console.error('Failed to load employees', e);
      setError(e.response?.data?.message || e.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (!form.name || !form.employeeId || !form.email) {
        throw new Error('Name, Employee ID, and Email are required');
      }

      if (!editingEmployee && !form.password) {
        throw new Error('Password is required for new employees');
      }

      if (editingEmployee) {
        // Update basic fields & access / disabled flag
        await axios.put(
          `${BACKEND_URL}/api/admin/employees/${editingEmployee._id}`,
          {
            name: form.name,
            email: form.email,
            accessPermissions: form.accessPermissions,
            isDisabled: form.isDisabled,
          },
          { withCredentials: true },
        );
      } else {
        await axios.post(
          `${BACKEND_URL}/api/admin/employees`,
          {
            name: form.name,
            employeeId: form.employeeId,
            email: form.email,
            password: form.password,
            accessPermissions: form.accessPermissions,
          },
          { withCredentials: true },
        );
      }

      await loadEmployees();
      closeDrawer();
    } catch (e) {
      console.error('Failed to save employee', e);
      setError(e.response?.data?.message || e.message || 'Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingEmployee) return;
    if (!window.confirm('Delete this employee? This cannot be undone.')) return;
    setDeleting(true);
    setError('');
    try {
      await axios.delete(`${BACKEND_URL}/api/admin/employees/${editingEmployee._id}`, {
        withCredentials: true,
      });
      await loadEmployees();
      closeDrawer();
    } catch (e) {
      console.error('Failed to delete employee', e);
      setError(e.response?.data?.message || e.message || 'Failed to delete employee');
    } finally {
      setDeleting(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    if (!searchQuery) return employees;
    const q = searchQuery.toLowerCase();
    return employees.filter((e) => {
      return (
        e.name?.toLowerCase().includes(q) ||
        e.employeeId?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q)
      );
    });
  }, [employees, searchQuery]);

  const formatDate = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Main list */}
      <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-3 bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <FiUsers size={18} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-semibold text-gray-900">Employees</h1>
              <p className="text-xs sm:text-sm text-gray-500">Manage approval staff and their access permissions.</p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm"
          >
            <FiPlus size={16} />
            <span>Add employee</span>
          </button>
        </div>

        {/* Search bar */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 bg-white">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, employee ID, or email"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="hidden sm:flex items-center text-xs text-gray-500">
            <span className="font-medium mr-1">{filteredEmployees.length}</span>
            <span>employees</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Employee ID</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Access</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Created</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                    No employees found.
                  </td>
                </tr>
              )}
              {filteredEmployees.map((emp) => {
                const isDisabled = !!emp.isDisabled;
                const accessLabel =
                  ACCESS_OPTIONS.find((o) => o.id === emp.accessPermissions)?.label || '—';
                return (
                  <tr
                    key={emp._id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => openEdit(emp)}
                  >
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">
                          {(emp.name || emp.employeeId || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{emp.name || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-700">{emp.employeeId}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-700">{emp.email}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                        <FiShield className="mr-1" size={12} />
                        {accessLabel}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {isDisabled ? (
                        <span className="inline-flex items-center rounded-full border border-gray-300 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                          <FiToggleLeft className="mr-1" size={12} />
                          Disabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                          <FiToggleRight className="mr-1" size={12} />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-600">{formatDate(emp.createdAt)}</td>
                    <td
                      className="px-4 py-2 whitespace-nowrap text-right text-gray-500"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => openEdit(emp)}
                        className="inline-flex items-center px-2 py-1 text-xs rounded-md border border-gray-300 hover:bg-gray-100 mr-2"
                      >
                        <FiEdit2 className="mr-1" size={12} /> Edit
                      </button>
                      <button
                        onClick={async () => {
                          setEditingEmployee(emp);
                          await handleDelete();
                        }}
                        className="inline-flex items-center px-2 py-1 text-xs rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <FiTrash2 className="mr-1" size={12} /> Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-[420px] bg-white border-l border-gray-200 shadow-xl transform transition-transform duration-300 ease-out z-40 ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {editingEmployee ? 'Edit employee' : 'Add employee'}
              </h2>
              <p className="text-xs text-gray-500">
                {editingEmployee
                  ? 'Update access and status for this employee.'
                  : 'Create a new approval employee account.'}
              </p>
            </div>
            <button
              onClick={closeDrawer}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-2">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Full name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. John Doe"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Employee ID</label>
                <input
                  type="text"
                  name="employeeId"
                  value={form.employeeId}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Unique ID used for login"
                  required
                  disabled={!!editingEmployee}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="employee@example.com"
                    required
                  />
                </div>
              </div>

              {!editingEmployee && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Initial password</label>
                  <div className="relative">
                    <FiKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Temporary password"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-gray-500">
                    They will be forced to change this password on first login.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <FiShield size={12} /> Access permissions
                </label>
                <div className="space-y-1">
                  {ACCESS_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className="flex items-start gap-2 text-xs text-gray-700 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="accessPermissions"
                        value={opt.id}
                        checked={form.accessPermissions === opt.id}
                        onChange={handleChange}
                        className="mt-[2px]"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {editingEmployee && (
                <div className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
                  <div className="text-xs text-gray-700">
                    <div className="font-medium mb-0.5">Status</div>
                    <div className="text-gray-500">Toggle to disable or enable this employee.</div>
                  </div>
                  <label className="inline-flex items-center gap-1 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isDisabled"
                      checked={form.isDisabled}
                      onChange={handleChange}
                      className="mr-1"
                    />
                    {form.isDisabled ? 'Disabled' : 'Active'}
                  </label>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between gap-3">
                {editingEmployee && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <FiTrash2 size={12} />
                    {deleting ? 'Deleting...' : 'Delete employee'}
                  </button>
                )}
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Employees;

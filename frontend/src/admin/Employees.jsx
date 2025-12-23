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

  const [tutorOptions, setTutorOptions] = useState({ subjects: [], classes: [], classSubjectMap: {} });

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
    // Tutor-approval scope
    tutorScopeAll: true,
    allowedClasses: [],
    allowedSubjects: [],
  });

  const resetForm = () => {
    setForm({
      name: '',
      employeeId: '',
      email: '',
      password: '',
      accessPermissions: 'both',
      isDisabled: false,
      tutorScopeAll: true,
      allowedClasses: [],
      allowedSubjects: [],
    });
    setEditingEmployee(null);
  };

  // Filter subjects based on selected classes
  const filteredSubjects = useMemo(() => {
    if (form.allowedClasses.length === 0) {
      return tutorOptions.subjects;
    }
    const subjectSet = new Set();
    form.allowedClasses.forEach(cls => {
      const subjects = tutorOptions.classSubjectMap[cls] || [];
      console.log(`Subjects for class "${cls}":`, subjects.length, subjects.slice(0, 3));
      subjects.forEach(subj => subjectSet.add(subj));
    });
    const result = Array.from(subjectSet).sort((a, b) => a.localeCompare(b));
    console.log('Filtered subjects result:', result.length, result.slice(0, 5));
    return result;
  }, [form.allowedClasses, tutorOptions.subjects, tutorOptions.classSubjectMap]);

  const openCreate = () => {
    resetForm();
    setDrawerOpen(true);
  };

  const openEdit = (emp) => {
    setEditingEmployee(emp);
    const hasTutorAccess = emp.accessPermissions === 'tutor' || emp.accessPermissions === 'both';
    const allowedClasses = Array.isArray(emp.allowedClasses) ? emp.allowedClasses : [];
    const allowedSubjects = Array.isArray(emp.allowedSubjects) ? emp.allowedSubjects : [];
    const tutorScopeAll = !hasTutorAccess || (allowedClasses.length === 0 && allowedSubjects.length === 0);
    setForm({
      name: emp.name || '',
      employeeId: emp.employeeId || '',
      email: emp.email || '',
      password: '',
      accessPermissions: emp.accessPermissions || 'both',
      isDisabled: !!emp.isDisabled,
      tutorScopeAll,
      allowedClasses,
      allowedSubjects,
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
    // Load tutor approval options (subjects and classes)
    (async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/admin/tutor/approval-options`, {
          withCredentials: true,
        });
        const data = res.data || {};
        console.log('Tutor options received:', {
          classes: data.classes?.length,
          subjects: data.subjects?.length,
          classSubjectMapKeys: Object.keys(data.classSubjectMap || {}).length
        });
        console.log('Sample classSubjectMap:', Object.keys(data.classSubjectMap || {}).slice(0, 5));
        setTutorOptions({
          subjects: Array.isArray(data.subjects) ? data.subjects : [],
          classes: Array.isArray(data.classes) ? data.classes : [],
          classSubjectMap: data.classSubjectMap || {},
        });
      } catch (e) {
        console.error('Failed to load tutor approval options', e);
      }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCheckboxListChange = (name, value) => {
    setForm((prev) => {
      const currentValues = prev[name] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      return {
        ...prev,
        [name]: newValues,
      };
    });
  };

  // Clear invalid subjects when classes change
  useEffect(() => {
    if (form.allowedClasses.length > 0 && form.allowedSubjects.length > 0) {
      const validSubjects = form.allowedSubjects.filter(subj => filteredSubjects.includes(subj));
      if (validSubjects.length !== form.allowedSubjects.length) {
        setForm(prev => ({ ...prev, allowedSubjects: validSubjects }));
      }
    }
  }, [form.allowedClasses, form.allowedSubjects, filteredSubjects]);

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

      // Validate tutor scope when tutor access is enabled
      const hasTutorAccess = form.accessPermissions === 'tutor' || form.accessPermissions === 'both';
      if (hasTutorAccess && !form.tutorScopeAll) {
        if (!form.allowedClasses.length || !form.allowedSubjects.length) {
          throw new Error('Select at least one class and one subject, or choose "All classes + all subjects"');
        }
      }

      const payloadBase = {
        name: form.name,
        email: form.email,
        accessPermissions: form.accessPermissions,
      };

      if (hasTutorAccess) {
        if (form.tutorScopeAll) {
          payloadBase.allowedClasses = [];
          payloadBase.allowedSubjects = [];
        } else {
          payloadBase.allowedClasses = form.allowedClasses;
          payloadBase.allowedSubjects = form.allowedSubjects;
        }
      }

      if (editingEmployee) {
        // Update basic fields & access / disabled flag
        await axios.put(
          `${BACKEND_URL}/api/admin/employees/${editingEmployee._id}`,
          {
            ...payloadBase,
            isDisabled: form.isDisabled,
          },
          { withCredentials: true },
        );
      } else {
        await axios.post(
          `${BACKEND_URL}/api/admin/employees`,
          {
            ...payloadBase,
            employeeId: form.employeeId,
            password: form.password,
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
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Employee ID</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Access</th>
                <th className="px-5 py-3 w-64">Tutor Scope</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                    No employees found.
                  </td>
                </tr>
              )}
              {filteredEmployees.map((emp) => {
                const isDisabled = !!emp.isDisabled;
                const accessLabel =
                  ACCESS_OPTIONS.find((o) => o.id === emp.accessPermissions)?.label || '—';
                const hasTutorAccess = emp.accessPermissions === 'tutor' || emp.accessPermissions === 'both';
                const allowedClasses = Array.isArray(emp.allowedClasses) ? emp.allowedClasses : [];
                const allowedSubjects = Array.isArray(emp.allowedSubjects) ? emp.allowedSubjects : [];
                const hasScope = allowedClasses.length > 0 || allowedSubjects.length > 0;
                
                return (
                  <tr
                    key={emp._id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => openEdit(emp)}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">
                          {(emp.name || emp.employeeId || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{emp.name || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-700">{emp.employeeId}</td>
                    <td className="px-4 py-4 text-gray-700">{emp.email}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                        <FiShield className="mr-1.5" size={12} />
                        {accessLabel}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {hasTutorAccess ? (
                        hasScope ? (
                          <div className="text-xs space-y-2">
                            {allowedClasses.length > 0 && (
                              <div className="bg-blue-50 rounded px-2 py-1.5 border border-blue-100">
                                <span className="font-semibold text-gray-800">Classes: </span>
                                <span className="text-gray-700">
                                  {allowedClasses.slice(0, 2).join(', ')}
                                  {allowedClasses.length > 2 && (
                                    <span className="text-blue-600 font-medium ml-1">+{allowedClasses.length - 2}</span>
                                  )}
                                </span>
                              </div>
                            )}
                            {allowedSubjects.length > 0 && (
                              <div className="bg-purple-50 rounded px-2 py-1.5 border border-purple-100">
                                <span className="font-semibold text-gray-800">Subjects: </span>
                                <span className="text-gray-700">
                                  {allowedSubjects.slice(0, 2).join(', ')}
                                  {allowedSubjects.length > 2 && (
                                    <span className="text-purple-600 font-medium ml-1">+{allowedSubjects.length - 2}</span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center text-xs text-gray-600 italic bg-gray-100 px-2.5 py-1 rounded">All classes + subjects</span>
                        )
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {isDisabled ? (
                        <span className="inline-flex items-center rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
                          <FiToggleLeft className="mr-1.5" size={12} />
                          Disabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                          <FiToggleRight className="mr-1.5" size={12} />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-gray-600">{formatDate(emp.createdAt)}</td>
                    <td
                      className="px-4 py-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(emp)}
                          className="inline-flex items-center px-3 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <FiEdit2 className="mr-1.5" size={12} /> Edit
                        </button>
                        <button
                          onClick={async () => {
                            setEditingEmployee(emp);
                            await handleDelete();
                          }}
                          className="inline-flex items-center px-3 py-1.5 text-xs rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <FiTrash2 className="mr-1.5" size={12} /> Delete
                        </button>
                      </div>
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
                  <label className="text-xs font-medium text-gray-700">Password</label>
                  <div className="relative">
                    <FiKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Password"
                      required
                    />
                  </div>
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

              {(form.accessPermissions === 'tutor' || form.accessPermissions === 'both') && (
                <div className="space-y-2 border border-indigo-100 rounded-lg px-3 py-2 bg-indigo-50/40">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-gray-800">Tutor approval scope</div>
                      <p className="text-[11px] text-gray-600">
                        Limit which tutor applications this employee can review by class and subject.
                      </p>
                    </div>
                    <label className="flex items-center gap-1 text-[11px] text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        name="tutorScopeAll"
                        checked={form.tutorScopeAll}
                        onChange={handleChange}
                      />
                      All classes + all subjects
                    </label>
                  </div>

                  {!form.tutorScopeAll && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-gray-700 mb-1 block">
                            Classes ({form.allowedClasses.length} selected)
                          </label>
                          <div className="border border-gray-300 rounded-lg px-2 py-2 bg-white max-h-40 overflow-y-auto space-y-1">
                            {tutorOptions.classes.length === 0 ? (
                              <div className="text-[11px] text-gray-400 italic py-1">Loading classes...</div>
                            ) : (
                              tutorOptions.classes.map((cls) => (
                                <label
                                  key={cls}
                                  className="flex items-center gap-2 text-xs text-gray-700 hover:bg-gray-50 px-1 py-0.5 rounded cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={form.allowedClasses.includes(cls)}
                                    onChange={() => handleCheckboxListChange('allowedClasses', cls)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span>{cls}</span>
                                </label>
                              ))
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-gray-700 mb-1 block">
                            Subjects ({form.allowedSubjects.length} selected)
                            {form.allowedClasses.length > 0 && (
                              <span className="text-gray-500 font-normal ml-1">
                                (filtered by selected classes)
                              </span>
                            )}
                          </label>
                          <div className="border border-gray-300 rounded-lg px-2 py-2 bg-white max-h-40 overflow-y-auto space-y-1">
                            {form.allowedClasses.length === 0 ? (
                              <div className="text-[11px] text-amber-600 italic py-1 px-1 bg-amber-50 rounded border border-amber-200">
                                Please select at least one class first to see relevant subjects
                              </div>
                            ) : filteredSubjects.length === 0 ? (
                              <div className="text-[11px] text-gray-400 italic py-1">No subjects found for selected classes</div>
                            ) : (
                              filteredSubjects.map((subj) => (
                                <label
                                  key={subj}
                                  className="flex items-center gap-2 text-xs text-gray-700 hover:bg-gray-50 px-1 py-0.5 rounded cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={form.allowedSubjects.includes(subj)}
                                    onChange={() => handleCheckboxListChange('allowedSubjects', subj)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span>{subj}</span>
                                </label>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      {form.allowedClasses.length > 0 && form.allowedSubjects.length > 0 && (
                        <div className="mt-3 border border-indigo-100 bg-white/60 rounded-md p-2">
                          <div className="text-[11px] font-medium text-gray-700 mb-1">
                            Effective tutor approval combinations
                          </div>
                          <div className="max-h-32 overflow-auto border border-gray-100 rounded">
                            <table className="w-full text-[11px]">
                              <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                  <th className="px-2 py-1 text-left font-medium">Class</th>
                                  <th className="px-2 py-1 text-left font-medium">Subject</th>
                                </tr>
                              </thead>
                              <tbody>
                                {form.allowedClasses.flatMap((cls) =>
                                  form.allowedSubjects.map((subj) => (
                                    <tr key={`${cls}::${subj}`} className="border-t border-gray-50">
                                      <td className="px-2 py-1 text-gray-800">{cls}</td>
                                      <td className="px-2 py-1 text-gray-800">{subj}</td>
                                    </tr>
                                  )),
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

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

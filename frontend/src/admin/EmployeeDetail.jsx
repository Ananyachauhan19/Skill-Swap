import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import {
  FiArrowLeft,
  FiMail,
  FiPhone,
  FiKey,
  FiShield,
  FiTrash2,
  FiToggleLeft,
  FiToggleRight,
  FiCalendar,
  FiUser,
} from 'react-icons/fi';

const ACCESS_OPTIONS = [
  { id: 'interviewer', label: 'Interview Expert approvals only' },
  { id: 'tutor', label: 'Tutor approvals only' },
  { id: 'both', label: 'Both interview + tutor approvals' },
];

const EmployeeDetail = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [error, setError] = useState('');
  const [tutorOptions, setTutorOptions] = useState({ subjects: [], classes: [], classSubjectMap: {} });

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    accessPermissions: 'both',
    isDisabled: false,
    tutorScopeAll: true,
    allowedClasses: [],
    allowedSubjects: [],
  });

  const isNewEmployee = employeeId === 'new';

  useEffect(() => {
    loadEmployee();
    loadTutorOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const loadEmployee = async () => {
    if (isNewEmployee) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/api/admin/employees`, {
        withCredentials: true,
      });
      const list = Array.isArray(res.data) ? res.data : res.data.employees || [];
      const emp = list.find(e => e._id === employeeId);
      
      if (!emp) {
        setError('Employee not found');
        setLoading(false);
        return;
      }

      setEmployee(emp);
      const hasTutorAccess = emp.accessPermissions === 'tutor' || emp.accessPermissions === 'both';
      const allowedClasses = Array.isArray(emp.allowedClasses) ? emp.allowedClasses : [];
      const allowedSubjects = Array.isArray(emp.allowedSubjects) ? emp.allowedSubjects : [];
      const tutorScopeAll = !hasTutorAccess || (allowedClasses.length === 0 && allowedSubjects.length === 0);

      setForm({
        name: emp.name || '',
        email: emp.email || '',
        phone: emp.phone || '',
        accessPermissions: emp.accessPermissions || 'both',
        isDisabled: !!emp.isDisabled,
        tutorScopeAll,
        allowedClasses,
        allowedSubjects,
      });
    } catch (e) {
      console.error('Failed to load employee', e);
      setError(e.response?.data?.message || 'Failed to load employee');
    } finally {
      setLoading(false);
    }
  };

  const loadTutorOptions = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/admin/tutor/approval-options`, {
        withCredentials: true,
      });
      const data = res.data || {};
      setTutorOptions({
        subjects: Array.isArray(data.subjects) ? data.subjects : [],
        classes: Array.isArray(data.classes) ? data.classes : [],
        classSubjectMap: data.classSubjectMap || {},
      });
    } catch (e) {
      console.error('Failed to load tutor options', e);
    }
  };

  const filteredSubjects = React.useMemo(() => {
    if (form.allowedClasses.length === 0) {
      return tutorOptions.subjects;
    }
    const subjectSet = new Set();
    form.allowedClasses.forEach(cls => {
      const subjects = tutorOptions.classSubjectMap[cls] || [];
      subjects.forEach(subj => subjectSet.add(subj));
    });
    return Array.from(subjectSet).sort((a, b) => a.localeCompare(b));
  }, [form.allowedClasses, tutorOptions.subjects, tutorOptions.classSubjectMap]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCheckboxListChange = (name, value) => {
    setForm(prev => {
      const currentValues = prev[name] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [name]: newValues };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (!form.name || !form.email) {
        throw new Error('Name and Email are required');
      }

      if (isNewEmployee && !form.employeeId) {
        throw new Error('Employee ID is required');
      }

      if (isNewEmployee && !form.password) {
        throw new Error('Password is required for new employees');
      }

      const hasTutorAccess = form.accessPermissions === 'tutor' || form.accessPermissions === 'both';
      if (hasTutorAccess && !form.tutorScopeAll) {
        if (!form.allowedClasses.length || !form.allowedSubjects.length) {
          throw new Error('Select at least one class and one subject, or choose "All classes + all subjects"');
        }
      }

      const payloadBase = {
        name: form.name,
        email: form.email,
        phone: form.phone,
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

      if (isNewEmployee) {
        await axios.post(
          `${BACKEND_URL}/api/admin/employees`,
          {
            ...payloadBase,
            employeeId: form.employeeId,
            password: form.password,
          },
          { withCredentials: true }
        );
        navigate('/admin/employees');
      } else {
        await axios.put(
          `${BACKEND_URL}/api/admin/employees/${employeeId}`,
          {
            ...payloadBase,
            isDisabled: form.isDisabled,
          },
          { withCredentials: true }
        );
        await loadEmployee();
      }
    } catch (e) {
      console.error('Failed to save employee', e);
      setError(e.response?.data?.message || e.message || 'Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this employee? This cannot be undone.')) return;
    setDeleting(true);
    setError('');

    try {
      await axios.delete(`${BACKEND_URL}/api/admin/employees/${employeeId}`, {
        withCredentials: true,
      });
      navigate('/admin/employees');
    } catch (e) {
      console.error('Failed to delete employee', e);
      setError(e.response?.data?.message || 'Failed to delete employee');
    } finally {
      setDeleting(false);
    }
  };

  const handleResetPassword = async () => {
    const newPassword = window.prompt('Enter a new temporary password (min 6 characters):');
    if (!newPassword) return;
    if (newPassword.length < 6) {
      window.alert('Password must be at least 6 characters long.');
      return;
    }

    setResettingPassword(true);
    setError('');

    try {
      await axios.post(
        `${BACKEND_URL}/api/admin/employees/${employeeId}/reset-password`,
        { password: newPassword },
        { withCredentials: true }
      );
      window.alert('Password reset successfully. Employee will be asked to change it on next login.');
    } catch (e) {
      console.error('Failed to reset password', e);
      setError(e.response?.data?.message || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600">Loading employee...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/admin/employees')}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <FiArrowLeft size={16} />
            Back to Employees
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          {/* Page Title */}
          <div className="px-5 py-4 border-b border-gray-200">
            <h1 className="text-lg font-semibold text-gray-900">
              {isNewEmployee ? 'Add New Employee' : 'Employee Details'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {isNewEmployee
                ? 'Create a new employee account with approval permissions'
                : 'Update employee information and access permissions'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-5 mt-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <FiUser size={14} />
                  Basic Information
                </h3>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                    required
                  />
                </div>

                {isNewEmployee && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Employee ID *</label>
                    <input
                      type="text"
                      name="employeeId"
                      value={form.employeeId}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="EMP001"
                      required
                    />
                  </div>
                )}

                {!isNewEmployee && employee && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Employee ID</label>
                    <input
                      type="text"
                      value={employee.employeeId}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-600"
                      disabled
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="employee@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+91-9876543210"
                    />
                  </div>
                </div>

                {isNewEmployee && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Password *</label>
                    <div className="relative">
                      <FiKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Min 6 characters"
                        required
                      />
                    </div>
                  </div>
                )}

                {!isNewEmployee && employee && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Created</label>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <FiCalendar size={14} />
                      {new Date(employee.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Access & Permissions */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <FiShield size={14} />
                  Access & Permissions
                </h3>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Access Level</label>
                  <div className="space-y-2">
                    {ACCESS_OPTIONS.map(opt => (
                      <label
                        key={opt.id}
                        className="flex items-start gap-2 text-xs text-gray-700 cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
                      >
                        <input
                          type="radio"
                          name="accessPermissions"
                          value={opt.id}
                          checked={form.accessPermissions === opt.id}
                          onChange={handleChange}
                          className="mt-0.5"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {(form.accessPermissions === 'tutor' || form.accessPermissions === 'both') && (
                  <div className="border border-indigo-200 rounded-lg p-3 bg-indigo-50/40">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="text-xs font-semibold text-gray-900">Tutor Approval Scope</div>
                        <p className="text-[11px] text-gray-600 mt-0.5">
                          Limit which tutor applications can be reviewed
                        </p>
                      </div>
                      <label className="flex items-center gap-1.5 text-[11px] cursor-pointer whitespace-nowrap">
                        <input
                          type="checkbox"
                          name="tutorScopeAll"
                          checked={form.tutorScopeAll}
                          onChange={handleChange}
                          className="rounded"
                        />
                        All classes + subjects
                      </label>
                    </div>

                    {!form.tutorScopeAll && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-medium text-gray-700 mb-1">
                            Classes ({form.allowedClasses.length} selected)
                          </label>
                          <div className="border border-gray-300 rounded-lg px-2 py-2 bg-white max-h-32 overflow-y-auto">
                            {tutorOptions.classes.map(cls => (
                              <label
                                key={cls}
                                className="flex items-center gap-2 text-xs hover:bg-gray-50 px-1 py-1 rounded cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={form.allowedClasses.includes(cls)}
                                  onChange={() => handleCheckboxListChange('allowedClasses', cls)}
                                  className="rounded"
                                />
                                {cls}
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-gray-700 mb-1">
                            Subjects ({form.allowedSubjects.length} selected)
                          </label>
                          <div className="border border-gray-300 rounded-lg px-2 py-2 bg-white max-h-32 overflow-y-auto">
                            {form.allowedClasses.length === 0 ? (
                              <div className="text-[11px] text-amber-600 italic py-1">
                                Select classes first
                              </div>
                            ) : filteredSubjects.length === 0 ? (
                              <div className="text-[11px] text-gray-400 italic py-1">
                                No subjects found
                              </div>
                            ) : (
                              filteredSubjects.map(subj => (
                                <label
                                  key={subj}
                                  className="flex items-center gap-2 text-xs hover:bg-gray-50 px-1 py-1 rounded cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={form.allowedSubjects.includes(subj)}
                                    onChange={() => handleCheckboxListChange('allowedSubjects', subj)}
                                    className="rounded"
                                  />
                                  {subj}
                                </label>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!isNewEmployee && (
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-gray-900">Account Status</div>
                        <p className="text-[11px] text-gray-600 mt-0.5">
                          {form.isDisabled ? 'Account is disabled' : 'Account is active'}
                        </p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="isDisabled"
                          checked={form.isDisabled}
                          onChange={handleChange}
                        />
                        <span className="text-xs">{form.isDisabled ? 'Disabled' : 'Active'}</span>
                        {form.isDisabled ? (
                          <FiToggleLeft className="text-gray-400" size={20} />
                        ) : (
                          <FiToggleRight className="text-green-600" size={20} />
                        )}
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-6 mt-6 border-t border-gray-200">
              <div className="flex gap-3">
                {!isNewEmployee && (
                  <>
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      disabled={resettingPassword}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs font-medium hover:bg-amber-100 disabled:opacity-50"
                    >
                      <FiKey size={14} />
                      {resettingPassword ? 'Resetting...' : 'Reset Password'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 disabled:opacity-50"
                    >
                      <FiTrash2 size={14} />
                      {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/admin/employees')}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetail;

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import {
  FiSearch,
  FiUsers,
  FiPlus,
  FiToggleLeft,
  FiToggleRight,
  FiShield,
} from 'react-icons/fi';

const ACCESS_OPTIONS = [
  { id: 'interviewer', label: 'Interview Expert approvals only' },
  { id: 'tutor', label: 'Tutor approvals only' },
  { id: 'both', label: 'Both interview + tutor approvals' },
];

const Employees = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
    <div className="flex flex-col h-full bg-gray-50">
      {/* Main container */}
      <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden m-4">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-3 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
              <FiUsers size={16} />
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Employee Management</h1>
              <p className="text-xs text-gray-600">Manage approval staff and permissions</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/employees/new')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm transition-all hover:shadow-md"
          >
            <FiPlus size={16} />
            Add Employee
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
              placeholder="Search by name, ID, or email..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
            <span className="font-semibold">{filteredEmployees.length}</span>
            <span>employees</span>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr className="text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                <th className="px-4 py-2.5">Employee</th>
                <th className="px-4 py-2.5">Employee ID</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Phone</th>
                <th className="px-4 py-2.5">Access Level</th>
                <th className="px-4 py-2.5">Tutor Scope</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-500">
                    {searchQuery ? 'No employees found matching your search.' : 'No employees yet.'}
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
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/admin/employees/${emp._id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[11px] font-semibold text-white shadow-sm">
                          {(emp.name || emp.employeeId || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-xs">{emp.name || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-mono text-[11px]">{emp.employeeId}</td>
                    <td className="px-4 py-3 text-gray-700">{emp.email}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                        <FiShield className="mr-1" size={10} />
                        {accessLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {hasTutorAccess ? (
                        hasScope ? (
                          <div className="text-[11px] space-y-1">
                            {allowedClasses.length > 0 && (
                              <div className="bg-blue-50 rounded px-2 py-0.5 border border-blue-100">
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
                              <div className="bg-purple-50 rounded px-2 py-0.5 border border-purple-100">
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
                          <span className="inline-flex items-center text-[11px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded">All</span>
                        )
                      ) : (
                        <span className="text-[11px] text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isDisabled ? (
                        <span className="inline-flex items-center rounded-md border border-gray-300 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                          <FiToggleLeft className="mr-1" size={10} />
                          Disabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                          <FiToggleRight className="mr-1" size={10} />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(emp.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Employees;

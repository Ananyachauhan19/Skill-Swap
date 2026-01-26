import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import InternCoordinatorDetailsModal from './InternCoordinatorDetails';
import QuizementEmployeeDetailsModal from './QuizementEmployeeDetails';
import CampusAmbassadorDetailsModal from './CampusAmbassadorDetails';
import {
  FiSearch,
  FiUsers,
  FiPlus,
  FiToggleLeft,
  FiToggleRight,
  FiShield,
  FiBarChart2,
  FiFileText,
  FiUserPlus,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiX,
  FiActivity,
  FiBriefcase,
} from 'react-icons/fi';

const EMPLOYEE_TABS = [
  { id: 'approval-staff', label: 'Approval Staff', icon: FiUsers, description: 'Manage interviewer & tutor approvals' },
  { id: 'quizement', label: 'Quizement Staff', icon: FiFileText, description: 'Manage quiz creation staff' },
  { id: 'campus-ambassadors', label: 'Campus Ambassadors', icon: FiShield, description: 'Manage campus ambassadors' },
  { id: 'intern-employees', label: 'Intern Coordinators', icon: FiBriefcase, description: 'Employees who add and manage interns' },
];

const ACCESS_OPTIONS = [
  { id: 'interviewer', label: 'Interview Expert approvals only' },
  { id: 'tutor', label: 'Tutor approvals only' },
  { id: 'both', label: 'Both interview + tutor approvals' },
];

const EmployeesUnified = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'approval-staff';

  const [approvalStaff, setApprovalStaff] = useState([]);
  const [quizementStaff, setQuizementStaff] = useState([]);
  const [campusAmbassadors, setCampusAmbassadors] = useState([]);
  const [internEmployees, setInternEmployees] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Load data based on active tab
  useEffect(() => {
    loadEmployees();
  }, [activeTab]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (activeTab === 'approval-staff') {
        const res = await axios.get(`${BACKEND_URL}/api/admin/employees`, {
          withCredentials: true,
        });
        const list = Array.isArray(res.data) ? res.data : res.data.employees || [];
        setApprovalStaff(list);
      } else if (activeTab === 'quizement') {
        const res = await axios.get(`${BACKEND_URL}/api/admin/quizement-employees`, {
          withCredentials: true,
        });
        setQuizementStaff(res.data || []);
      } else if (activeTab === 'campus-ambassadors') {
        const res = await axios.get(`${BACKEND_URL}/api/admin/campus-ambassadors`, {
          withCredentials: true,
        });
        const ambassadors = Array.isArray(res.data?.ambassadors)
          ? res.data.ambassadors
          : [];
        setCampusAmbassadors(ambassadors);
      } else if (activeTab === 'intern-employees') {
        const res = await axios.get(`${BACKEND_URL}/api/admin/intern-employees`, {
          withCredentials: true,
        });
        setInternEmployees(res.data || []);
      }
    } catch (e) {
      console.error('Failed to load employees', e);
      setError(e.response?.data?.message || e.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
    setSearchQuery('');
  };

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

  // Filter employees based on search
  const filteredData = useMemo(() => {
    if (!searchQuery) {
      if (activeTab === 'approval-staff') return approvalStaff;
      if (activeTab === 'quizement') return quizementStaff;
      if (activeTab === 'campus-ambassadors') return campusAmbassadors;
      if (activeTab === 'intern-employees') return internEmployees;
      return [];
    }

    const q = searchQuery.toLowerCase();
    
    if (activeTab === 'approval-staff') {
      return approvalStaff.filter((e) =>
        e.name?.toLowerCase().includes(q) ||
        e.employeeId?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q)
      );
    } else if (activeTab === 'quizement') {
      return quizementStaff.filter((e) =>
        e.fullName?.toLowerCase().includes(q) ||
        e.employeeId?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q)
      );
    } else if (activeTab === 'campus-ambassadors') {
      return campusAmbassadors.filter((a) =>
        a.firstName?.toLowerCase().includes(q) ||
        a.lastName?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q)
      );
    } else if (activeTab === 'intern-employees') {
      return internEmployees.filter((e) =>
        e.name?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.role?.toLowerCase().includes(q)
      );
    }
    return [];
  }, [activeTab, approvalStaff, quizementStaff, campusAmbassadors, internEmployees, searchQuery]);

  const handleDeleteCampusAmbassador = async (ambassadorId) => {
    if (!window.confirm('Are you sure you want to remove this Campus Ambassador?')) return;
    
    try {
      setLoading(true);
      await axios.delete(`${BACKEND_URL}/api/admin/campus-ambassadors/${ambassadorId}`, {
        withCredentials: true
      });
      
      setSuccess('Campus Ambassador removed successfully!');
      setTimeout(() => setSuccess(''), 3000);
      loadEmployees();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove Campus Ambassador');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const toggleQuizementStatus = async (id, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
      const res = await axios.put(
        `${BACKEND_URL}/api/admin/quizement-employees/${id}`,
        { status: nextStatus },
        { withCredentials: true }
      );
      setQuizementStaff((prev) => prev.map((e) => (e._id === id ? res.data : e)));
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading && !filteredData.length) {
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
      <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden m-4">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
                <FiUsers size={16} />
              </div>
              <div>
                <h1 className="text-base font-semibold text-gray-900">Employee Management</h1>
                <p className="text-xs text-gray-600">Manage all staff and their roles</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white px-4">
          <div className="flex gap-1">
            {EMPLOYEE_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Description & Actions */}
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              {EMPLOYEE_TABS.find((t) => t.id === activeTab)?.description}
            </p>
            <button
              onClick={() => {
                if (activeTab === 'approval-staff') navigate('/admin/employees/new');
                else if (activeTab === 'quizement') navigate('/admin/quizzment/new');
                else if (activeTab === 'campus-ambassadors') navigate('/admin/campus-ambassadors/new');
                else if (activeTab === 'intern-employees') navigate('/admin/intern-employees/new');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm transition-all hover:shadow-md"
            >
              <FiPlus size={18} />
              Add New
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
            <FiXCircle className="text-red-600" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mx-4 mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
            <FiCheckCircle className="text-green-600" size={20} />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Search Bar */}
        <div className="px-4 py-3">
          <div className="relative max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={`Search ${EMPLOYEE_TABS.find((t) => t.id === activeTab)?.label.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-4 pb-4">
          {activeTab === 'approval-staff' && (
            <ApprovalStaffTable
              data={filteredData}
              formatDate={formatDate}
              navigate={navigate}
            />
          )}

          {activeTab === 'quizement' && (
            <QuizementStaffTable
              data={filteredData}
              formatDate={formatDate}
              toggleStatus={toggleQuizementStatus}
            />
          )}

          {activeTab === 'campus-ambassadors' && (
            <CampusAmbassadorsTable
              data={filteredData}
              formatDate={formatDate}
              handleDelete={handleDeleteCampusAmbassador}
            />
          )}

          {activeTab === 'intern-employees' && (
            <InternEmployeesTable
              data={filteredData}
              formatDate={formatDate}
              handleDelete={async (id) => {
                if (!window.confirm('Are you sure you want to delete this intern employee?')) return;
                try {
                  await axios.delete(`${BACKEND_URL}/api/admin/intern-employees/${id}`, {
                    withCredentials: true
                  });
                  setSuccess('Intern employee deleted successfully');
                  setTimeout(() => setSuccess(''), 3000);
                  loadEmployees();
                } catch (err) {
                  setError(err.response?.data?.message || 'Failed to delete');
                  setTimeout(() => setError(''), 3000);
                }
              }}
            />
          )}

          {filteredData.length === 0 && !loading && (
            <div className="text-center py-12">
              <FiUsers size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No employees found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Approval Staff Table Component
const ApprovalStaffTable = ({ data, formatDate, navigate }) => {
  const getAccessLabel = (access) => {
    const option = ACCESS_OPTIONS.find((o) => o.id === access);
    return option?.label || access;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Employee
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Role Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Access Level
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Joined
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((emp) => (
            <tr key={emp._id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div>
                  <p className="font-medium text-gray-900">{emp.name || 'N/A'}</p>
                  <p className="text-sm text-gray-500">{emp.email}</p>
                  <p className="text-xs text-gray-400">ID: {emp.employeeId}</p>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Approval Staff
                </span>
              </td>
              <td className="px-4 py-3">
                <p className="text-sm text-gray-700">{getAccessLabel(emp.accessPermissions || emp.access)}</p>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    emp.isDisabled || emp.disabled
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {emp.isDisabled || emp.disabled ? (
                    <>
                      <FiToggleLeft size={14} />
                      Disabled
                    </>
                  ) : (
                    <>
                      <FiToggleRight size={14} />
                      Active
                    </>
                  )}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {formatDate(emp.createdAt)}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => navigate(`/admin/employees/${emp._id}`)}
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Quizement Staff Table Component
const QuizementStaffTable = ({ data, formatDate, toggleStatus }) => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Role Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((emp) => (
              <tr key={emp._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{emp.fullName || 'N/A'}</p>
                    <p className="text-sm text-gray-500">{emp.email}</p>
                    <p className="text-xs text-gray-400">ID: {emp.employeeId}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Quizement Staff
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      emp.status === 'disabled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {emp.status === 'disabled' ? (
                      <>
                        <FiToggleLeft size={14} />
                        Disabled
                      </>
                    ) : (
                      <>
                        <FiToggleRight size={14} />
                        Active
                      </>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {formatDate(emp.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setSelectedEmployee(emp._id)}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedEmployee && (
        <QuizementEmployeeDetailsModal
          employeeId={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onUpdate={() => window.location.reload()}
        />
      )}
    </>
  );
};

// Campus Ambassadors Table Component
const CampusAmbassadorsTable = ({ data, formatDate, handleDelete }) => {
  const [selectedAmbassador, setSelectedAmbassador] = useState(null);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Ambassador
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Role Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((ambassador) => (
              <tr key={ambassador._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {ambassador.firstName} {ambassador.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{ambassador.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Campus Ambassador
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <FiToggleRight size={14} />
                    Active
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {formatDate(ambassador.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setSelectedAmbassador(ambassador._id)}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedAmbassador && (
        <CampusAmbassadorDetailsModal
          ambassadorId={selectedAmbassador}
          onClose={() => setSelectedAmbassador(null)}
          onUpdate={() => window.location.reload()}
        />
      )}
    </>
  );
};

// Intern Employees Table Component
const InternEmployeesTable = ({ data, formatDate, handleDelete, navigate }) => {
  const [selectedCoordinator, setSelectedCoordinator] = useState(null);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Role Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((emp) => (
              <tr key={emp._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{emp.name}</p>
                    <p className="text-sm text-gray-500">{emp.email}</p>
                    <p className="text-xs text-gray-400">Role: {emp.role}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Intern Coordinator
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      !emp.isActive
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {!emp.isActive ? (
                      <>
                        <FiToggleLeft size={14} />
                        Inactive
                      </>
                    ) : (
                      <>
                        <FiToggleRight size={14} />
                        Active
                      </>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {formatDate(emp.lastLoginAt)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {formatDate(emp.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setSelectedCoordinator(emp._id)}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCoordinator && (
        <InternCoordinatorDetailsModal
          coordinatorId={selectedCoordinator}
          onClose={() => setSelectedCoordinator(null)}
          onUpdate={() => window.location.reload()}
        />
      )}
    </>
  );
};

export default EmployeesUnified;

import React, { useState, useEffect } from 'react';
import { FiFileText, FiPlus, FiEdit2, FiTrash2, FiEye, FiCopy, FiCheckCircle, FiXCircle, FiX, FiSave, FiSearch, FiFilter, FiDownload } from 'react-icons/fi';
import { BACKEND_URL } from '../config';

const CertificateTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    isActive: ''
  });

  const types = ['all', 'joining_letter', 'hiring_certificate', 'completion_certificate'];

  const sampleData = {
    name: 'John Doe',
    role: 'Full Stack Development',
    joiningDate: 'January 15, 2026',
    completionDate: 'April 15, 2026',
    duration: '3 months',
    internEmployeeId: 'SSH-0001',
    qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  };

  useEffect(() => {
    fetchTemplates();
  }, [filters]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type && filters.type !== 'all') params.append('type', filters.type);
      if (filters.search) params.append('search', filters.search);
      if (filters.isActive !== '') params.append('isActive', filters.isActive);

      const response = await fetch(`${BACKEND_URL}/api/admin/certificate-templates?${params}`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/certificate-templates/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        fetchTemplates();
      } else {
        alert(data.message || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const handleToggleActive = async (template) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/certificate-templates/${template._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !template.isActive })
      });
      const data = await response.json();
      if (data.success) {
        fetchTemplates();
      }
    } catch (error) {
      console.error('Error toggling template:', error);
    }
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setEditForm({
      type: template.type,
      name: template.name,
      htmlContent: template.htmlContent,
      isActive: template.isActive
    });
    setShowEditor(true);
  };

  const handlePreview = (template) => {
    let html = template.htmlContent;
    // Replace all variables with sample data
    Object.keys(sampleData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, sampleData[key]);
    });
    setPreviewHtml(html);
    setShowPreview(true);
  };

  const handleSaveTemplate = async () => {
    if (!editForm.name || !editForm.type || !editForm.htmlContent) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const url = selectedTemplate
        ? `${BACKEND_URL}/api/admin/certificate-templates/${selectedTemplate._id}`
        : `${BACKEND_URL}/api/admin/certificate-templates`;
      
      const response = await fetch(url, {
        method: selectedTemplate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editForm)
      });

      const data = await response.json();
      if (data.success) {
        fetchTemplates();
        setShowEditor(false);
        setSelectedTemplate(null);
        setEditForm({});
      } else {
        alert(data.message || 'Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const TypeBadge = ({ type }) => {
    const colors = {
      joining_letter: 'bg-blue-100 text-blue-700',
      hiring_certificate: 'bg-purple-100 text-purple-700',
      completion_certificate: 'bg-green-100 text-green-700'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-700'}`}>
        {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  const isNewTemplate = !selectedTemplate;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiFileText className="text-blue-600" />
            Certificate Templates
          </h1>
          <p className="text-gray-600 mt-1">Manage certificate templates for interns</p>
        </div>
        <button
          onClick={() => {
            setSelectedTemplate(null);
            setEditForm({ isActive: true });
            setShowEditor(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <FiPlus />
          Create Template
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiSearch className="inline mr-1" />
              Search
            </label>
            <input
              type="text"
              placeholder="Search templates..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiFilter className="inline mr-1" />
              Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {types.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.isActive}
              onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading templates...</p>
          </div>
        ) : templates.map(template => (
          <div key={template._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                <p className="text-xs text-gray-500 font-mono">{template.type}</p>
              </div>
              <button
                onClick={() => handleToggleActive(template)}
                className={`p-1 rounded ${template.isActive ? 'text-green-600' : 'text-gray-400'}`}
                title={template.isActive ? 'Active' : 'Inactive'}
              >
                {template.isActive ? <FiCheckCircle size={20} /> : <FiXCircle size={20} />}
              </button>
            </div>

            <div className="mb-3">
              <TypeBadge type={template.type} />
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">Variables:</p>
              <div className="flex flex-wrap gap-1">
                {['name', 'role', 'joiningDate', 'duration', 'internEmployeeId', 'qrCode'].map(v => (
                  <span key={v} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                    {'{{'}{v}{'}}'}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 border-t border-gray-200 pt-3">
              <button
                onClick={() => handlePreview(template)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded transition"
                title="Preview"
              >
                <FiEye size={16} />
                Preview
              </button>
              <button
                onClick={() => handleEdit(template)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded transition"
                title="Edit"
              >
                <FiEdit2 size={16} />
                Edit
              </button>
              <button
                onClick={() => handleDelete(template._id)}
                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition"
                title="Delete"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FiFileText size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">No certificate templates found</p>
          <button
            onClick={() => setShowEditor(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Create Your First Template
          </button>
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FiEdit2 className="text-blue-600" />
                {isNewTemplate ? 'Create New Template' : `Edit: ${editForm.name}`}
              </h2>
              <button 
                onClick={() => { 
                  setShowEditor(false); 
                  setSelectedTemplate(null); 
                  setEditForm({});
                }} 
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Template Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="e.g., Intern Joining Letter"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editForm.type || ''}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Type</option>
                      <option value="joining_letter">Joining Letter</option>
                      <option value="hiring_certificate">Hiring Certificate</option>
                      <option value="completion_certificate">Completion Certificate</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={editForm.isActive || false}
                        onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      Active Template
                    </label>
                    <p className="text-xs text-gray-500 mt-1">Only one template per type can be active</p>
                  </div>
                </div>

                {/* Right Column - Variables Info */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Available Variables</h4>
                  <p className="text-sm text-gray-600 mb-3">Use these placeholders in your HTML:</p>
                  <div className="space-y-1 text-sm">
                    <div><code className="bg-white px-2 py-0.5 rounded">{'{{name}}'}</code> - Intern's name</div>
                    <div><code className="bg-white px-2 py-0.5 rounded">{'{{role}}'}</code> - Internship role</div>
                    <div><code className="bg-white px-2 py-0.5 rounded">{'{{joiningDate}}'}</code> - Start date</div>
                    <div><code className="bg-white px-2 py-0.5 rounded">{'{{completionDate}}'}</code> - End date</div>
                    <div><code className="bg-white px-2 py-0.5 rounded">{'{{duration}}'}</code> - Internship duration</div>
                    <div><code className="bg-white px-2 py-0.5 rounded">{'{{internEmployeeId}}'}</code> - Intern ID</div>
                    <div><code className="bg-white px-2 py-0.5 rounded">{'{{qrCode}}'}</code> - QR code image</div>
                  </div>
                </div>
              </div>

              {/* HTML Content Editor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HTML Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editForm.htmlContent || ''}
                  onChange={(e) => setEditForm({ ...editForm, htmlContent: e.target.value })}
                  placeholder="Enter HTML content with variables..."
                  rows={20}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Tip: Include complete HTML with styles. Use inline CSS for best compatibility.
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
              <button
                onClick={() => {
                  setShowEditor(false);
                  setSelectedTemplate(null);
                  setEditForm({});
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition flex items-center gap-2"
              >
                <FiX />
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={saving || !editForm.name || !editForm.type || !editForm.htmlContent}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave />
                    {isNewTemplate ? 'Create Template' : 'Save Changes'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-[98vw] max-h-[98vh] flex flex-col">
            <div className="px-6 py-3 border-b border-gray-200 flex justify-between items-center bg-white flex-shrink-0">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FiEye className="text-blue-600" />
                Certificate Preview
              </h2>
              <button 
                onClick={() => setShowPreview(false)} 
                className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="overflow-auto flex-1 bg-white p-4">
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-full max-w-[1200px]" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateTemplates;

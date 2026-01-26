import React, { useState, useEffect } from 'react';
import { 
  FiMail, FiEdit2, FiTrash2, FiCopy, FiEye, FiPlus, 
  FiSearch, FiFilter, FiCheckCircle, FiXCircle, FiSave, FiX, FiTag 
} from 'react-icons/fi';

const EmailTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', search: '', isActive: '' });
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [previewData, setPreviewData] = useState({});
  const [preview, setPreview] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [isNewTemplate, setIsNewTemplate] = useState(false);

  const categories = ['all', 'authentication', 'interview', 'session', 'assessment', 'support', 'general', 'intern'];

  const baseLayoutTemplate = `<div style="font-family: system-ui, Arial; max-width: 640px; margin:0 auto; padding:16px;">
  <div style="background:#0ea5e9; color:#fff; padding:12px 16px; border-radius:8px 8px 0 0;">
    <strong>SkillSwap Hub</strong>
  </div>
  <div style="border:1px solid #e5e7eb; border-top:none; padding:16px; border-radius:0 0 8px 8px;">
    <h2 style="margin:0 0 12px; color:#0f172a;">Your Title Here</h2>
    
    <!-- Your content goes here -->
    <p>Dear \${userName},</p>
    <p>Your email content...</p>
    
    <div style="text-align:center; margin:24px 0;">
      <a href="https://skillswaphub.in" style="display:inline-block; background:#0ea5e9; color:#fff; padding:12px 24px; text-decoration:none; border-radius:6px; font-weight:500;">Go to Dashboard</a>
    </div>
    
    <p style="margin-top:16px; color:#334155;">Best regards,<br/>SkillSwap Hub Team</p>
    <p style="margin:16px 0 0; color:#334155;">If you have any questions, please contact our support team at <a href="mailto:info@skillswaphub.in" style="color:#2563eb; text-decoration:none;">info@skillswaphub.in</a>.</p>
    <hr style="margin:24px 0; border:none; border-top:1px solid #e5e7eb"/>
    <p style="color:#64748b; font-size:12px;">This email was sent automatically by SkillSwap Hub. Please do not reply to this message.</p>
  </div>
</div>`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Base layout copied to clipboard!');
  };

  useEffect(() => {
    fetchTemplates();
  }, [filters]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      if (filters.isActive !== '') params.append('isActive', filters.isActive);

      const response = await fetch(`/api/admin/email-templates?${params}`, {
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
      const response = await fetch(`/api/admin/email-templates/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        fetchTemplates();
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const handlePreview = async (template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
    setPreviewData({});
    setPreview(null);
  };

  const generatePreview = async () => {
    try {
      const response = await fetch(`/api/admin/email-templates/${selectedTemplate._id}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(previewData)
      });
      const data = await response.json();
      if (data.success) {
        setPreview(data.preview);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setEditForm({
      name: template.name,
      templateKey: template.templateKey,
      description: template.description || '',
      subject: template.subject,
      htmlBody: template.htmlBody,
      variables: template.variables.join(', '),
      category: template.category,
      isActive: template.isActive
    });
    setIsNewTemplate(false);
    setShowEditor(true);
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setEditForm({
      name: '',
      templateKey: '',
      description: '',
      subject: '',
      htmlBody: '',
      variables: '',
      category: 'general',
      isActive: true
    });
    setIsNewTemplate(true);
    setShowEditor(true);
  };

  const handleSaveTemplate = async () => {
    setSaving(true);
    try {
      const payload = {
        ...editForm,
        variables: editForm.variables.split(',').map(v => v.trim()).filter(Boolean)
      };

      const url = isNewTemplate 
        ? '/api/admin/email-templates'
        : `/api/admin/email-templates/${selectedTemplate._id}`;
      
      const method = isNewTemplate ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.success) {
        alert(isNewTemplate ? 'Template created successfully!' : 'Template updated successfully!');
        setShowEditor(false);
        setSelectedTemplate(null);
        fetchTemplates();
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

  const handleDuplicate = async (template) => {
    const newKey = prompt('Enter new template key:', `${template.templateKey}_copy`);
    if (!newKey) return;

    try {
      const response = await fetch(`/api/admin/email-templates/${template._id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newTemplateKey: newKey })
      });
      const data = await response.json();
      if (data.success) {
        fetchTemplates();
        alert('Template duplicated successfully!');
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      alert('Failed to duplicate template');
    }
  };

  const handleToggleActive = async (template) => {
    try {
      const response = await fetch(`/api/admin/email-templates/${template._id}`, {
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
      console.error('Error toggling template status:', error);
    }
  };

  const CategoryBadge = ({ category }) => {
    const colors = {
      authentication: 'bg-purple-100 text-purple-700',
      interview: 'bg-blue-100 text-blue-700',
      session: 'bg-green-100 text-green-700',
      assessment: 'bg-orange-100 text-orange-700',
      support: 'bg-pink-100 text-pink-700',
      general: 'bg-gray-100 text-gray-700',
      intern: 'bg-teal-100 text-teal-700'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[category] || colors.general}`}>
        {category}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiMail className="text-blue-600" />
            Email Templates
          </h1>
          <p className="text-gray-600 mt-1">Manage all email notification templates</p>
        </div>
        <button
          onClick={() => setShowEditor(true)}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiFilter className="inline mr-1" />
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat} value={cat === 'all' ? '' : cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.isActive}
              onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div key={template._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                <p className="text-xs text-gray-500 font-mono">{template.templateKey}</p>
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
              <CategoryBadge category={template.category} />
            </div>

            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>

            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">Subject:</p>
              <p className="text-sm text-gray-700 font-medium line-clamp-1">{template.subject}</p>
            </div>

            {template.variables && template.variables.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Variables ({template.variables.length}):</p>
                <div className="flex flex-wrap gap-1">
                  {template.variables.slice(0, 3).map(v => (
                    <span key={v} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      ${'{' + v + '}'}
                    </span>
                  ))}
                  {template.variables.length > 3 && (
                    <span className="text-xs text-gray-500">+{template.variables.length - 3} more</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-3 border-t border-gray-100">
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
                onClick={() => handleDuplicate(template)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded transition"
                title="Duplicate"
              >
                <FiCopy size={16} />
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

      {templates.length === 0 && (
        <div className="text-center py-12">
          <FiMail size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600">No templates found</p>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold">Preview: {selectedTemplate.name}</h2>
              <button onClick={() => setShowPreview(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Sample Data</h3>
                  {selectedTemplate.variables.map(variable => (
                    <div key={variable} className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">{variable}</label>
                      <input
                        type="text"
                        value={previewData[variable] || ''}
                        onChange={(e) => setPreviewData({ ...previewData, [variable]: e.target.value })}
                        placeholder={`Enter ${variable}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                  <button
                    onClick={generatePreview}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Generate Preview
                  </button>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Preview</h3>
                  {preview ? (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-700">Subject: {preview.subject}</p>
                      </div>
                      <div 
                        className="p-4 bg-white"
                        dangerouslySetInnerHTML={{ __html: preview.html }}
                      />
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                      Fill in sample data and click "Generate Preview"
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor Modal - Full Featured */}
      {showEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
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
            <div className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column - Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Basic Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="e.g., Password Reset Email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Key <span className="text-red-500">*</span>
                      {!isNewTemplate && <span className="text-xs text-gray-500 ml-2">(Read-only)</span>}
                    </label>
                    <input
                      type="text"
                      value={editForm.templateKey}
                      onChange={(e) => setEditForm({ ...editForm, templateKey: e.target.value })}
                      placeholder="e.g., passwordReset"
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${!isNewTemplate ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      disabled={!isNewTemplate}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Unique identifier (camelCase, no spaces)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="authentication">Authentication</option>
                      <option value="interview">Interview</option>
                      <option value="session">Session</option>
                      <option value="assessment">Assessment</option>
                      <option value="general">General</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Brief description of when this email is sent..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Variables (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={editForm.variables}
                      onChange={(e) => setEditForm({ ...editForm, variables: e.target.value })}
                      placeholder="e.g., userName, resetLink, expiryTime"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use in templates as: ${'{variableName}'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                      Template is Active
                    </label>
                  </div>
                </div>

                {/* Right Column - Template Content */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Email Content</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.subject}
                      onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                      placeholder="e.g., Password Reset Instructions"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use variables: ${'{variableName}'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      HTML Body <span className="text-red-500">*</span>
                    </label>
                    <div className="mb-2">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(baseLayoutTemplate)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded flex items-center gap-1 transition"
                      >
                        <FiCopy size={12} />
                        Copy Base Layout Template
                      </button>
                    </div>
                    <textarea
                      value={editForm.htmlBody}
                      onChange={(e) => setEditForm({ ...editForm, htmlBody: e.target.value })}
                      placeholder="Full HTML content of the email..."
                      rows={20}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use the base layout button above for consistent branding
                    </p>
                  </div>

                  {/* Variables Preview */}
                  {editForm.variables && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-1">
                        <FiTag />
                        Available Variables:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {editForm.variables.split(',').map(v => v.trim()).filter(Boolean).map(variable => (
                          <span 
                            key={variable}
                            className="bg-white text-blue-700 px-2 py-1 rounded text-xs font-mono border border-blue-300"
                          >
                            ${'{' + variable + '}'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* HTML Tips */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">💡 HTML Tips:</p>
                <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                  <li>Use inline styles for email compatibility</li>
                  <li>Test on multiple email clients</li>
                  <li>Keep width under 600px for mobile</li>
                  <li>Use the baseLayout function for consistency</li>
                  <li>Variables: ${'{variableName}'} will be replaced with actual values</li>
                </ul>
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
                disabled={saving || !editForm.name || !editForm.templateKey || !editForm.subject || !editForm.htmlBody}
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
    </div>
  );
};

export default EmailTemplates;

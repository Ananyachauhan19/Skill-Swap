const EmailTemplate = require('../models/EmailTemplate');

// Get all email templates (Admin)
exports.getAllTemplates = async (req, res) => {
  try {
    const { category, isActive, search } = req.query;
    
    const query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { templateKey: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const templates = await EmailTemplate.find(query)
      .populate('lastModifiedBy', 'firstName lastName email')
      .sort({ category: 1, name: 1 });
    
    res.json({
      success: true,
      count: templates.length,
      templates
    });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email templates',
      error: error.message
    });
  }
};

// Get single email template by key or ID (Admin)
exports.getTemplate = async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Try to find by templateKey first, then by ID
    let template = await EmailTemplate.findOne({ templateKey: identifier })
      .populate('lastModifiedBy', 'firstName lastName email');
    
    if (!template) {
      template = await EmailTemplate.findById(identifier)
        .populate('lastModifiedBy', 'firstName lastName email');
    }
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }
    
    res.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Error fetching email template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email template',
      error: error.message
    });
  }
};

// Update email template (Admin)
exports.updateTemplate = async (req, res) => {
  try {
    const { identifier } = req.params;
    const { name, description, subject, htmlBody, variables, category, isActive } = req.body;
    
    // Find template by templateKey or ID
    let template = await EmailTemplate.findOne({ templateKey: identifier });
    
    if (!template) {
      template = await EmailTemplate.findById(identifier);
    }
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }
    
    // Update fields
    if (name !== undefined) template.name = name;
    if (description !== undefined) template.description = description;
    if (subject !== undefined) template.subject = subject;
    if (htmlBody !== undefined) template.htmlBody = htmlBody;
    if (variables !== undefined) template.variables = variables;
    if (category !== undefined) template.category = category;
    if (isActive !== undefined) template.isActive = isActive;
    
    template.lastModifiedBy = req.user._id;
    
    await template.save();
    
    await template.populate('lastModifiedBy', 'firstName lastName email');
    
    res.json({
      success: true,
      message: 'Email template updated successfully',
      template
    });
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email template',
      error: error.message
    });
  }
};

// Create new email template (Admin)
exports.createTemplate = async (req, res) => {
  try {
    const { templateKey, name, description, subject, htmlBody, variables, category } = req.body;
    
    // Check if template key already exists
    const existingTemplate = await EmailTemplate.findOne({ templateKey });
    
    if (existingTemplate) {
      return res.status(400).json({
        success: false,
        message: 'A template with this key already exists'
      });
    }
    
    const template = new EmailTemplate({
      templateKey,
      name,
      description,
      subject,
      htmlBody,
      variables: variables || [],
      category: category || 'general',
      lastModifiedBy: req.user._id
    });
    
    await template.save();
    await template.populate('lastModifiedBy', 'firstName lastName email');
    
    res.status(201).json({
      success: true,
      message: 'Email template created successfully',
      template
    });
  } catch (error) {
    console.error('Error creating email template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create email template',
      error: error.message
    });
  }
};

// Delete email template (Admin)
exports.deleteTemplate = async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Find template by templateKey or ID
    let template = await EmailTemplate.findOne({ templateKey: identifier });
    
    if (!template) {
      template = await EmailTemplate.findById(identifier);
    }
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }
    
    await template.deleteOne();
    
    res.json({
      success: true,
      message: 'Email template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting email template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete email template',
      error: error.message
    });
  }
};

// Preview email template with sample data (Admin)
exports.previewTemplate = async (req, res) => {
  try {
    const { identifier } = req.params;
    const sampleData = req.body;
    
    // Find template by templateKey or ID
    let template = await EmailTemplate.findOne({ templateKey: identifier });
    
    if (!template) {
      template = await EmailTemplate.findById(identifier);
    }
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }
    
    const rendered = template.render(sampleData);
    
    res.json({
      success: true,
      preview: rendered
    });
  } catch (error) {
    console.error('Error previewing email template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to preview email template',
      error: error.message
    });
  }
};

// Get template categories (Admin)
exports.getCategories = async (req, res) => {
  try {
    const categories = await EmailTemplate.distinct('category');
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

// Duplicate a template (Admin)
exports.duplicateTemplate = async (req, res) => {
  try {
    const { identifier } = req.params;
    const { newTemplateKey, newName } = req.body;
    
    if (!newTemplateKey) {
      return res.status(400).json({
        success: false,
        message: 'New template key is required'
      });
    }
    
    // Find original template
    let originalTemplate = await EmailTemplate.findOne({ templateKey: identifier });
    
    if (!originalTemplate) {
      originalTemplate = await EmailTemplate.findById(identifier);
    }
    
    if (!originalTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Original template not found'
      });
    }
    
    // Check if new template key already exists
    const existingTemplate = await EmailTemplate.findOne({ templateKey: newTemplateKey });
    
    if (existingTemplate) {
      return res.status(400).json({
        success: false,
        message: 'A template with this key already exists'
      });
    }
    
    // Create duplicate
    const duplicateTemplate = new EmailTemplate({
      templateKey: newTemplateKey,
      name: newName || `${originalTemplate.name} (Copy)`,
      description: originalTemplate.description,
      subject: originalTemplate.subject,
      htmlBody: originalTemplate.htmlBody,
      variables: originalTemplate.variables,
      category: originalTemplate.category,
      lastModifiedBy: req.user._id
    });
    
    await duplicateTemplate.save();
    await duplicateTemplate.populate('lastModifiedBy', 'firstName lastName email');
    
    res.status(201).json({
      success: true,
      message: 'Email template duplicated successfully',
      template: duplicateTemplate
    });
  } catch (error) {
    console.error('Error duplicating email template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to duplicate email template',
      error: error.message
    });
  }
};

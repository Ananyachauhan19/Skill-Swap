const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
  templateKey: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  htmlBody: {
    type: String,
    required: true
  },
  variables: {
    type: [String],
    default: []
  },
  category: {
    type: String,
    enum: ['authentication', 'interview', 'session', 'assessment', 'general'],
    default: 'general'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster lookups
emailTemplateSchema.index({ templateKey: 1, isActive: 1 });

// Method to get template with variable substitution
emailTemplateSchema.methods.render = function(variables = {}) {
  let subject = this.subject;
  let htmlBody = this.htmlBody;

  // Replace all variables in subject and body
  Object.keys(variables).forEach(key => {
    const placeholder = new RegExp(`\\$\\{${key}\\}`, 'g');
    subject = subject.replace(placeholder, variables[key] || '');
    htmlBody = htmlBody.replace(placeholder, variables[key] || '');
  });

  return { subject, html: htmlBody };
};

// Static method to get and render a template
emailTemplateSchema.statics.getTemplate = async function(templateKey, variables = {}) {
  const template = await this.findOne({ templateKey, isActive: true });
  
  if (!template) {
    throw new Error(`Email template '${templateKey}' not found`);
  }

  return template.render(variables);
};

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);

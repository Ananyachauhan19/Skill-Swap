const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  ambassadorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CampusAmbassador',
    required: true,
    index: true
  },
  actionType: {
    type: String,
    required: true,
    enum: [
      'Institute Added',
      'Institute Edited',
      'Institute Deleted',
      'Student Upload',
      'Coins Distributed',
      'Assessment Uploaded'
    ],
    index: true
  },
  instituteName: {
    type: mongoose.Schema.Types.Mixed, // String or Array of strings
    required: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  performedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
activityLogSchema.index({ ambassadorId: 1, performedAt: -1 });
activityLogSchema.index({ ambassadorId: 1, actionType: 1, performedAt: -1 });

// Static method to create activity log
activityLogSchema.statics.logActivity = async function(ambassadorId, actionType, data = {}) {
  try {
    const activityLog = new this({
      ambassadorId,
      actionType,
      instituteName: data.instituteName,
      metadata: data.metadata || {},
      performedAt: new Date()
    });
    
    await activityLog.save();
    return activityLog;
  } catch (error) {
    console.error('[ActivityLog] Error logging activity:', error);
    // Don't throw - logging should not break the main operation
    return null;
  }
};

// Virtual to get formatted description
activityLogSchema.virtual('description').get(function() {
  const meta = this.metadata || {};
  
  switch (this.actionType) {
    case 'Institute Added':
      return `Created new institute: ${this.instituteName}`;
    
    case 'Institute Edited':
      return `Updated institute details: ${this.instituteName}`;
    
    case 'Institute Deleted':
      return `Removed institute: ${this.instituteName}`;
    
    case 'Student Excel Uploaded':
      const studentCount = meta.totalStudentsUploaded || 0;
      const coinsInfo = meta.coinsAssignedDuringUpload 
        ? ` with ${meta.silverCoinsPerStudent || 0} silver & ${meta.goldenCoinsPerStudent || 0} golden coins each`
        : '';
      return `Uploaded ${studentCount} students to ${this.instituteName}${coinsInfo}`;
    
    case 'Coins Distributed':
      const affectedCount = meta.totalStudentsAffected || 0;
      return `Distributed ${meta.silverCoinsPerStudent || 0} silver & ${meta.goldenCoinsPerStudent || 0} golden coins to ${affectedCount} students in ${this.instituteName}`;
    
    case 'Assessment Uploaded':
      const institutes = Array.isArray(this.instituteName) ? this.instituteName : [this.instituteName];
      const instituteText = institutes.length > 1 
        ? `${institutes.length} institutes` 
        : institutes[0];
      return `Uploaded assessment "${meta.testName}" for ${instituteText}`;
    
    default:
      return `Performed action: ${this.actionType}`;
  }
});

// Ensure virtuals are included when converting to JSON
activityLogSchema.set('toJSON', { virtuals: true });
activityLogSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);

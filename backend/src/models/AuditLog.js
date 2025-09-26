const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // Frontend: id (mapped from _id)
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  action: {
    type: String,
    required: true,
    trim: true,
    enum: [
      'Lead Created',
      'Lead Updated', 
      'Status Changed',
      'Lead Assigned',
      'Lead Unassigned',
      'Document Uploaded',
      'Document Removed',
      'Note Added',
      'Lead Approved',
      'Lead Rejected',
      'Lead Completed',
      'Priority Score Updated',
      'AI Insight Generated'
    ]
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  details: {
    type: String,
    required: true,
    trim: true
  },
  oldValue: {
    type: String,
    trim: true,
    default: null
  },
  newValue: {
    type: String,
    trim: true,
    default: null
  },
  ipAddress: {
    type: String,
    trim: true,
    default: null,
    match: [/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$/, 'Invalid IP address']
  },
  userAgent: {
    type: String,
    trim: true,
    default: null,
    maxlength: 500
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for frontend compatibility - map _id to id
auditLogSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Indexes for better performance
auditLogSchema.index({ leadId: 1, timestamp: -1 });
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

// Static method to get audit logs for a specific lead
auditLogSchema.statics.getLeadAuditLogs = function(leadId, limit = 50) {
  return this.find({ leadId })
    .populate('user', 'username role')
    .populate('leadId', 'customerName email')
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get audit logs for a specific user
auditLogSchema.statics.getUserAuditLogs = function(userId, limit = 100) {
  return this.find({ user: userId })
    .populate('leadId', 'customerName email productType')
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get recent audit logs across all leads
auditLogSchema.statics.getRecentAuditLogs = function(limit = 100, actions = null) {
  const query = actions ? { action: { $in: actions } } : {};
  return this.find(query)
    .populate('user', 'username role')
    .populate('leadId', 'customerName email productType')
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Method to create audit log entry from request
auditLogSchema.statics.createAuditEntry = function(data, req = null) {
  const auditData = {
    leadId: data.leadId,
    customerName: data.customerName,
    action: data.action,
    user: data.user,
    details: data.details,
    oldValue: data.oldValue || null,
    newValue: data.newValue || null,
    timestamp: data.timestamp || new Date()
  };

  // Extract request metadata if available
  if (req) {
    auditData.ipAddress = req.ip || req.connection.remoteAddress || null;
    auditData.userAgent = req.get('User-Agent') || null;
  }

  return this.create(auditData);
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
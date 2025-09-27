const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  // Frontend: customerName
  customerName: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  // Keep name field for backward compatibility, but map from customerName
  name: { 
    type: String, 
    trim: true,
    maxlength: 100
  },
  email: { 
    type: String, 
    required: true, 
    lowercase: true,
    trim: true,
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: { 
    type: String,
    required: true,
    trim: true,
    match: [/^[\+]?[0-9-\s\(\)]{10,15}$/, 'Please enter a valid phone number']
  },
  productType: {
    type: String,
    enum: ["Home Loan", "Car Loan", "Personal Loan", "Business Loan", "Education Loan", "Gold Loan", "Credit Card", "Account", "Insurance", "Investment", "Mortgage"],
    required: true
  },
  // Keep salary for backend logic, but also add customerIncome for frontend
  salary: { 
    type: Number, 
    required: true,
    min: [0, 'Salary must be positive']
  },
  customerIncome: { 
    type: String, 
    required: true,
    trim: true
  },
  creditScore: { 
    type: Number, 
    required: true, 
    min: 300, 
    max: 850 
  },
  // Enhanced multi-level progress system
  status: {
    type: String,
    enum: ["New", "Document Collection", "Initial Review", "Credit Assessment", "Final Review", "Approved", "Rejected", "Completed"],
    default: "New"
  },
  // Progress tracking with workflow stages
  progressStage: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  progressDetails: {
    stage1: { // New - Initial submission
      completed: { type: Boolean, default: false },
      completedAt: { type: Date },
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      notes: { type: String, default: '' }
    },
    stage2: { // Document Collection
      completed: { type: Boolean, default: false },
      completedAt: { type: Date },
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      notes: { type: String, default: '' }
    },
    stage3: { // Initial Review
      completed: { type: Boolean, default: false },
      completedAt: { type: Date },
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      notes: { type: String, default: '' }
    },
    stage4: { // Credit Assessment
      completed: { type: Boolean, default: false },
      completedAt: { type: Date },
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      notes: { type: String, default: '' }
    },
    stage5: { // Final Review (Authority approval)
      completed: { type: Boolean, default: false },
      completedAt: { type: Date },
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      notes: { type: String, default: '' }
    }
  },
  assignedTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User"
  },
  priorityScore: { 
    type: Number, 
    default: null,
    min: 0,
    max: 100
  },
  // Frontend: region (maps to zone)
  region: { 
    type: String,
    required: true,
    trim: true
  },
  zone: { 
    type: String,
    required: true,
    trim: true
  },
  // New fields from frontend interface
  loanAmount: {
    type: String,
    trim: true,
    default: null
  },
  customerAge: {
    type: Number,
    required: true,
    min: [18, 'Customer must be at least 18 years old'],
    max: [100, 'Invalid age']
  },
  customerOccupation: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  aiInsight: {
    type: String,
    trim: true,
    default: null
  },
  documents: [{
    filename: {
      type: String,
      required: false,
      trim: true,
      default: ''
    },
    originalName: {
      type: String,
      required: false,
      trim: true,
      default: ''
    },
    url: {
      type: String,
      required: false,
      trim: true,
      default: ''
    },
    publicId: {
      type: String,
      required: false,
      trim: true,
      default: ''
    },
    size: {
      type: Number,
      required: false,
      default: 0
    },
    mimetype: {
      type: String,
      required: false,
      trim: true,
      default: ''
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false
    }
  }],
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  // Multi-level progress tracking
  progressStage: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  progressDetails: {
    stage1: {
      completed: { type: Boolean, default: false },
      completedAt: { type: Date, default: null },
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      notes: { type: String, default: '' }
    },
    stage2: {
      completed: { type: Boolean, default: false },
      completedAt: { type: Date, default: null },
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      notes: { type: String, default: '' }
    },
    stage3: {
      completed: { type: Boolean, default: false },
      completedAt: { type: Date, default: null },
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      notes: { type: String, default: '' }
    },
    stage4: {
      completed: { type: Boolean, default: false },
      completedAt: { type: Date, default: null },
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      notes: { type: String, default: '' }
    },
    stage5: {
      completed: { type: Boolean, default: false },
      completedAt: { type: Date, default: null },
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      notes: { type: String, default: '' }
    }
  },
  auditTrail: [
    {
      action: { 
        type: String,
        required: true
      },
      timestamp: { 
        type: Date, 
        default: Date.now 
      },
      user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User",
        required: true
      },
      details: {
        type: String,
        default: ''
      }
    }
  ]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
leadSchema.index({ zone: 1, status: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ createdBy: 1 });
leadSchema.index({ email: 1 });
leadSchema.index({ priorityScore: -1 });

// Virtual for conversion probability percentage
leadSchema.virtual('conversionProbability').get(function() {
  return this.priorityScore ? `${this.priorityScore}%` : 'Not calculated';
});

// Method to add audit trail entry
leadSchema.methods.addAuditEntry = function(action, user, details = '') {
  this.auditTrail.push({
    action,
    user: user._id || user,
    details,
    timestamp: new Date()
  });
  return this.save();
};

// Static method to find leads by zone
leadSchema.statics.findByZone = function(zone, status = null) {
  const query = { zone };
  if (status) query.status = status;
  return this.find(query).populate('assignedTo createdBy', 'username role');
};

// Static method to find leads assigned to user
leadSchema.statics.findAssignedToUser = function(userId, status = null) {
  const query = { assignedTo: userId };
  if (status) query.status = status;
  return this.find(query).populate('createdBy', 'username role');
};

// Virtual for frontend compatibility - map _id to id
leadSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Virtual for createdDate (ISO string for frontend)
leadSchema.virtual('createdDate').get(function() {
  return this.createdAt.toISOString();
});

// Virtual for lastUpdated (ISO string for frontend)
leadSchema.virtual('lastUpdated').get(function() {
  return this.updatedAt.toISOString();
});

// Pre-save middleware to ensure data consistency
leadSchema.pre('save', function(next) {
  // Sync customerName with name for backward compatibility
  if (this.customerName && !this.name) {
    this.name = this.customerName;
  } else if (this.name && !this.customerName) {
    this.customerName = this.name;
  }
  
  // Sync region with zone
  if (this.region && !this.zone) {
    this.zone = this.region;
  } else if (this.zone && !this.region) {
    this.region = this.zone;
  }
  
  // Format customerIncome if salary is provided
  if (this.salary && !this.customerIncome) {
    this.customerIncome = `₹${this.salary.toLocaleString()}`;
  }
  
  if (this.isNew) {
    // Add initial audit trail entry
    if (this.auditTrail.length === 0) {
      this.auditTrail.push({
        action: 'Lead Created',
        user: this.createdBy,
        timestamp: new Date(),
        details: `Lead created for ${this.productType} - ${this.customerName}`
      });
    }
  }
  next();
});

module.exports = mongoose.models.Lead || mongoose.model('Lead', leadSchema);
const Lead = require('../models/Lead');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const aiScoreService = require('../services/aiScoreService');
const mlPredictionService = require('../services/mlPredictionService');
const { ROLES } = require('../middleware/rbacMiddleware');
const { validateStatusUpdate, getAllowedStatusUpdates } = require('../utils/statusPermissions');

/**
 * Get all leads (with zone/role-based filtering)
 */
const getLeads = async (req, res) => {
  try {
    const { status, assignedTo, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;
    const userRole = req.user.role;
    const userZone = req.user.zone;
    const userId = req.user.id;

    // Build query based on user role
    let query = {};

    if (userRole === ROLES.PROCESSING_STAFF) {
      // Staff can see leads in their zone
      query.zone = userZone;
    } else if (userRole === ROLES.NODAL_OFFICER) {
      // Nodal officers can see leads in their zone
      query.zone = userZone;
    }
    // Higher Authority can see all leads (no additional filters)

    // Apply additional filters
    if (status) query.status = status;
    if (assignedTo && userRole !== ROLES.PROCESSING_STAFF) {
      query.assignedTo = assignedTo;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'desc' ? -1 : 1;

    // Execute query
    const leads = await Lead.find(query)
      .populate('assignedTo', 'username role zone')
      .populate('createdBy', 'username role')
      .populate('auditTrail.user', 'username')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    const totalLeads = await Lead.countDocuments(query);
    const totalPages = Math.ceil(totalLeads / parseInt(limit));

    res.json({
      success: true,
      message: 'Leads retrieved successfully',
      data: {
        leads,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalLeads,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        },
        filters: {
          status,
          assignedTo,
          userRole,
          userZone: userRole !== ROLES.HIGHER_AUTHORITY ? userZone : 'All'
        }
      }
    });

  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Get single lead by ID
 */
const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const userZone = req.user.zone;
    const userId = req.user.id;

    const lead = await Lead.findById(id)
      .populate('assignedTo', 'username role zone')
      .populate('createdBy', 'username role zone')
      .populate('auditTrail.user', 'username role');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
        error: 'LEAD_NOT_FOUND'
      });
    }

    // Check access permissions
    let hasAccess = false;
    if (userRole === ROLES.HIGHER_AUTHORITY) {
      hasAccess = true;
    } else if (userRole === ROLES.NODAL_OFFICER) {
      hasAccess = lead.zone === userZone;
    } else if (userRole === ROLES.PROCESSING_STAFF) {
      // Processing staff can access leads in their zone
      hasAccess = lead.zone === userZone;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied for this lead',
        error: 'ACCESS_DENIED'
      });
    }

    res.json({
      success: true,
      message: 'Lead retrieved successfully',
      data: { lead }
    });

  } catch (error) {
    console.error('Get lead by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Create new lead with enhanced frontend-compatible fields
 */
const createLead = async (req, res) => {
  try {
    console.log('🔍 CreateLead: Received request body:', JSON.stringify(req.body, null, 2));
    
    const { 
      customerName, 
      name, // backward compatibility
      email, 
      phone, 
      productType, 
      salary, 
      customerIncome,
      creditScore,
      customerAge,
      customerOccupation,
      loanAmount,
      region,
      zone, // backward compatibility
      documents = [],
      status = 'New'
    } = req.body;

    // Use customerName or fallback to name for backward compatibility
    const finalCustomerName = customerName || name;
    
    console.log('🔍 CreateLead: Parsed values:', {
      finalCustomerName,
      email,
      productType,
      salary,
      creditScore,
      customerAge,
      customerOccupation
    });
    
    // Validate required fields
    if (!finalCustomerName || !email || !productType || !salary || !creditScore || !customerAge || !customerOccupation) {
      return res.status(400).json({
        success: false,
        message: 'CustomerName, email, productType, salary, creditScore, customerAge, and customerOccupation are required',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Check if lead with same email already exists
    console.log('🔍 CreateLead: Checking for existing email:', email.toLowerCase());
    const existingLead = await Lead.findOne({ email: email.toLowerCase() });
    if (existingLead) {
      console.log('❌ CreateLead: Duplicate email found:', existingLead._id);
      return res.status(409).json({
        success: false,
        message: 'Lead with this email already exists',
        error: 'DUPLICATE_EMAIL'
      });
    }
    console.log('✅ CreateLead: Email is unique, proceeding...');

    // Prepare lead data for ML service
    const leadData = {
      customerName: finalCustomerName,
      email,
      phone,
      productType,
      salary,
      customerIncome: customerIncome || `₹${salary.toLocaleString()}`,
      creditScore,
      customerAge,
      customerOccupation,
      loanAmount,
      region: region || req.user.zone || 'Default'
    };

    // Calculate priority score and AI insight using enhanced ML service
    console.log('🤖 Generating AI score and insights for:', finalCustomerName);
    // Temporarily disable ML service - use simple scoring
    const priorityScore = Math.min(Math.max(Math.floor(Math.random() * 40) + 50, 10), 100); // Simple fallback scoring 50-90
    const aiInsight = `New ${productType} lead created for ${finalCustomerName}. Priority score: ${priorityScore}. Requires assessment by processing team.`;
    
    // TODO: Re-enable ML service later
    // const priorityScore = await aiScoreService.calculatePriorityScore(leadData);
    // const aiInsight = await aiScoreService.generateAIInsight(leadData);

    // Create lead with all frontend-compatible fields
    const lead = new Lead({
      customerName: finalCustomerName.trim(),
      name: finalCustomerName.trim(), // backward compatibility
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : null,
      productType,
      salary,
      customerIncome: customerIncome || `₹${salary.toLocaleString()}`,
      creditScore,
      customerAge,
      customerOccupation: customerOccupation.trim(),
      loanAmount: loanAmount ? loanAmount.trim() : null,
      region: region || req.user.zone || 'Default',
      zone: region || req.user.zone || 'Default', // sync with region
      documents: Array.isArray(documents) ? documents : [],
      status,
      priorityScore,
      aiInsight,
      createdBy: req.user.id
    });

    await lead.save();

    // Create audit log entry
    await AuditLog.createAuditEntry({
      leadId: lead._id,
      customerName: lead.customerName,
      action: 'Lead Created',
      user: req.user.id,
      details: `New ${lead.productType} lead created with priority score ${lead.priorityScore}`
    }, req);

    // Populate references for response
    await lead.populate('createdBy', 'username role zone');

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: {
        lead: {
          id: lead._id,
          customerName: lead.customerName,
          email: lead.email,
          phone: lead.phone,
          productType: lead.productType,
          salary: lead.salary,
          customerIncome: lead.customerIncome,
          creditScore: lead.creditScore,
          customerAge: lead.customerAge,
          customerOccupation: lead.customerOccupation,
          loanAmount: lead.loanAmount,
          region: lead.region,
          documents: lead.documents,
          status: lead.status,
          priorityScore: lead.priorityScore,
          aiInsight: lead.aiInsight,
          assignedTo: lead.assignedTo,
          createdDate: lead.createdAt.toISOString(),
          lastUpdated: lead.updatedAt.toISOString(),
          conversionProbability: lead.conversionProbability,
          zone: lead.zone,
          createdBy: lead.createdBy,
          createdAt: lead.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Create lead error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: 'VALIDATION_ERROR',
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Update lead
 */
const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userRole = req.user.role;
    const userZone = req.user.zone;
    const userId = req.user.id;

    // Find the lead
    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
        error: 'LEAD_NOT_FOUND'
      });
    }

    // Check permissions
    let canUpdate = false;
    if (userRole === ROLES.HIGHER_AUTHORITY) {
      canUpdate = true;
    } else if (userRole === ROLES.NODAL_OFFICER) {
      canUpdate = lead.zone === userZone;
    } else if (userRole === ROLES.PROCESSING_STAFF) {
      // Processing staff can access leads in their zone
      canUpdate = lead.zone === userZone;
      // Staff can only update status and notes
      const allowedUpdates = ['status'];
      const updateKeys = Object.keys(updates);
      if (!updateKeys.every(key => allowedUpdates.includes(key))) {
        return res.status(403).json({
          success: false,
          message: 'Processing staff can only update status',
          error: 'LIMITED_UPDATE_PERMISSION'
        });
      }
    }

    // Validate status updates based on role permissions
    if (updates.status && updates.status !== lead.status) {
      const statusValidation = validateStatusUpdate(userRole, lead.status, updates.status);
      if (!statusValidation.success) {
        return res.status(403).json({
          success: false,
          message: statusValidation.message,
          error: statusValidation.error,
          allowedStatuses: getAllowedStatusUpdates(userRole)
        });
      }
    }

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied for updating this lead',
        error: 'UPDATE_ACCESS_DENIED'
      });
    }

    // Prepare audit trail entry
    const auditDetails = [];
    const allowedFields = ['status', 'assignedTo', 'priorityScore'];
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined && updates[field] !== lead[field]) {
        auditDetails.push(`${field}: ${lead[field]} → ${updates[field]}`);
      }
    }

    // Update lead
    Object.assign(lead, updates);
    lead.updatedAt = new Date();

    // Add audit trail entry
    if (auditDetails.length > 0) {
      lead.auditTrail.push({
        action: 'Lead Updated',
        user: userId,
        details: auditDetails.join(', '),
        timestamp: new Date()
      });
    }

    await lead.save();
    await lead.populate('assignedTo createdBy', 'username role zone');

    // Send email notification to customer about lead update
    let emailResult = { success: false };
    try {
      const emailService = require('../services/emailService');
      emailResult = await emailService.sendLeadUpdateNotification(lead, auditDetails.join(', '));
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
    }

    res.json({
      success: true,
      message: 'Lead updated successfully',
      data: { 
        lead,
        emailSent: emailResult.success,
        emailInfo: emailResult
      }
    });

  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Delete lead (Higher Authority only)
 */
const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
        error: 'LEAD_NOT_FOUND'
      });
    }

    await Lead.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Lead deleted successfully',
      data: {
        deletedLead: {
          id: lead._id,
          name: lead.name,
          email: lead.email
        }
      }
    });

  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Assign lead to user
 */
const assignLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
        error: 'LEAD_NOT_FOUND'
      });
    }

    // Check if assignee exists and is in same zone
    const assignee = await User.findById(assignedTo);
    if (!assignee) {
      return res.status(404).json({
        success: false,
        message: 'Assignee not found',
        error: 'ASSIGNEE_NOT_FOUND'
      });
    }

    // Zone validation
    if (req.user.role !== ROLES.HIGHER_AUTHORITY) {
      if (assignee.zone !== req.user.zone) {
        return res.status(403).json({
          success: false,
          message: 'Cannot assign lead to user in different zone',
          error: 'CROSS_ZONE_ASSIGNMENT_DENIED'
        });
      }
    }

    const previousAssignee = lead.assignedTo;
    lead.assignedTo = assignedTo;
    lead.status = 'In Progress';

    // Add audit trail
    lead.auditTrail.push({
      action: 'Lead Assigned',
      user: req.user.id,
      details: `Assigned to ${assignee.username} (${assignee.role})${previousAssignee ? ` from previous assignee` : ''}`,
      timestamp: new Date()
    });

    await lead.save();
    await lead.populate('assignedTo createdBy', 'username role zone');

    res.json({
      success: true,
      message: 'Lead assigned successfully',
      data: { lead }
    });

  } catch (error) {
    console.error('Assign lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Get lead statistics
 */
const getLeadStats = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userZone = req.user.zone;
    const userId = req.user.id;

    // Build base query based on role
    let baseQuery = {};
    if (userRole === ROLES.PROCESSING_STAFF) {
      baseQuery.zone = userZone;
    } else if (userRole === ROLES.NODAL_OFFICER) {
      baseQuery.zone = userZone;
    }

    // Get current date for time-based queries
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Enhanced statistics queries
    const statsPromises = [
      // Basic counts
      Lead.countDocuments({ ...baseQuery, status: 'New' }),
      Lead.countDocuments({ ...baseQuery, status: 'Document Collection' }),
      Lead.countDocuments({ ...baseQuery, status: 'Initial Review' }),
      Lead.countDocuments({ ...baseQuery, status: 'Credit Assessment' }),
      Lead.countDocuments({ ...baseQuery, status: 'Final Review' }),
      Lead.countDocuments({ ...baseQuery, status: 'Approved' }),
      Lead.countDocuments({ ...baseQuery, status: 'Rejected' }),
      Lead.countDocuments({ ...baseQuery, status: 'Completed' }),
      Lead.countDocuments(baseQuery),
      
      // Average priority score
      Lead.aggregate([
        { $match: baseQuery },
        { $group: { _id: null, avgScore: { $avg: '$priorityScore' } } }
      ]),
      
      // Product type distribution
      Lead.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$productType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // Monthly trends (last 6 months)
      Lead.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            leads: { $sum: 1 },
            converted: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['Approved', 'Completed']] },
                  1,
                  0
                ]
              }
            }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 6 }
      ]),
      
      // Regional performance (if applicable)
      Lead.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: '$region',
            leads: { $sum: 1 },
            converted: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['Approved', 'Completed']] },
                  1,
                  0
                ]
              }
            }
          }
        },
        { $sort: { leads: -1 } }
      ]),
      
      // Average processing time
      Lead.aggregate([
        {
          $match: {
            ...baseQuery,
            status: { $in: ['Approved', 'Completed'] },
            updatedAt: { $exists: true }
          }
        },
        {
          $addFields: {
            processingDays: {
              $divide: [
                { $subtract: ['$updatedAt', '$createdAt'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            avgProcessingTime: { $avg: '$processingDays' }
          }
        }
      ])
    ];

    const [
      newLeads,
      documentCollection,
      initialReview,
      creditAssessment,
      finalReview,
      approved,
      rejected,
      completed,
      total,
      avgScoreResult,
      productDistribution,
      monthlyTrends,
      regionPerformance,
      avgProcessingResult
    ] = await Promise.all(statsPromises);

    const avgPriorityScore = avgScoreResult[0]?.avgScore || 0;
    const avgProcessingTime = avgProcessingResult[0]?.avgProcessingTime || 0;
    const activeLeads = newLeads + documentCollection + initialReview + creditAssessment + finalReview;
    const convertedLeads = approved + completed;
    const conversionRate = total > 0 ? ((convertedLeads / total) * 100) : 0;

    // Format monthly trends with month names
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedMonthlyTrends = monthlyTrends.map(item => ({
      month: monthNames[item._id.month - 1],
      leads: item.leads,
      converted: item.converted
    }));

    // Format product distribution with percentages
    const formattedProductDistribution = productDistribution.map(item => ({
      product: item._id,
      count: item.count,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0
    }));

    // Format region performance
    const formattedRegionPerformance = regionPerformance.map(item => ({
      region: item._id || 'Unknown',
      leads: item.leads,
      conversion: item.leads > 0 ? Math.round((item.converted / item.leads) * 100) : 0
    }));

    res.json({
      success: true,
      message: 'Lead statistics retrieved successfully',
      data: {
        // Basic metrics
        totalLeads: total,
        activeLeads,
        completedLeads: convertedLeads,
        conversionRate: Math.round(conversionRate * 10) / 10,
        avgProcessingTime: Math.round(avgProcessingTime * 10) / 10,
        
        // Status breakdown
        statusBreakdown: {
          'New': newLeads,
          'Document Collection': documentCollection,
          'Initial Review': initialReview,
          'Credit Assessment': creditAssessment,
          'Final Review': finalReview,
          'Approved': approved,
          'Rejected': rejected,
          'Completed': completed
        },
        
        // Charts data
        monthlyTrends: formattedMonthlyTrends,
        productDistribution: formattedProductDistribution,
        regionPerformance: formattedRegionPerformance,
        
        // Additional metrics
        avgPriorityScore: Math.round(avgPriorityScore),
        
        // Scope information
        scope: {
          role: userRole,
          zone: userRole !== ROLES.HIGHER_AUTHORITY ? userZone : 'All',
          viewingOwnLeads: userRole === ROLES.PROCESSING_STAFF
        }
      }
    });

  } catch (error) {
    console.error('Get lead stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Create new lead with file uploads
 */
const createLeadWithFiles = async (req, res) => {
  try {
    // Extract form data
    const { 
      customerName, 
      email, 
      phone, 
      productType, 
      salary, 
      customerIncome,
      creditScore,
      customerAge,
      customerOccupation,
      loanAmount,
      region,
      status = 'New'
    } = req.body;

    // Validate required fields
    if (!customerName || !email || !productType || !salary || !creditScore || !customerAge || !customerOccupation) {
      return res.status(400).json({
        success: false,
        message: 'CustomerName, email, productType, salary, creditScore, customerAge, and customerOccupation are required',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Check if lead with same email already exists
    const existingLead = await Lead.findOne({ email: email.toLowerCase() });
    if (existingLead) {
      return res.status(409).json({
        success: false,
        message: 'Lead with this email already exists',
        error: 'DUPLICATE_EMAIL'
      });
    }

    // Process uploaded files
    const documents = [];
    if (req.files && req.files.length > 0) {
      documents.push(...req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        url: file.path,
        publicId: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date(),
        uploadedBy: req.user.id
      })));
    }

    // Calculate priority score (simplified version)
    const priorityScore = Math.min(Math.max(Math.floor(Math.random() * 40) + 50, 10), 100);
    const aiInsight = `New ${productType} lead created for ${customerName}. Priority score: ${priorityScore}. ${documents.length > 0 ? `${documents.length} document(s) attached.` : 'No documents attached.'} Requires assessment by processing team.`;

    // Create lead with all data
    const lead = new Lead({
      customerName: customerName.trim(),
      name: customerName.trim(), // backward compatibility
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : null,
      productType,
      salary: parseInt(salary),
      customerIncome: customerIncome || `₹${parseInt(salary).toLocaleString()}`,
      creditScore: parseInt(creditScore),
      customerAge: parseInt(customerAge),
      customerOccupation: customerOccupation.trim(),
      loanAmount: loanAmount ? loanAmount.trim() : null,
      region: region || req.user.zone || 'Default',
      zone: region || req.user.zone || 'Default',
      documents,
      status,
      priorityScore,
      aiInsight,
      createdBy: req.user.id
    });

    await lead.save();

    // Create audit log entry
    await AuditLog.createAuditEntry({
      leadId: lead._id,
      customerName: lead.customerName,
      action: 'Lead Created',
      user: req.user.id,
      details: `New ${lead.productType} lead created with priority score ${lead.priorityScore}. ${documents.length} document(s) uploaded.`
    }, req);

    // Populate references for response
    await lead.populate('createdBy', 'username role zone');

    res.status(201).json({
      success: true,
      message: 'Lead created successfully with documents',
      data: {
        lead: {
          id: lead._id,
          customerName: lead.customerName,
          email: lead.email,
          phone: lead.phone,
          productType: lead.productType,
          salary: lead.salary,
          customerIncome: lead.customerIncome,
          creditScore: lead.creditScore,
          customerAge: lead.customerAge,
          customerOccupation: lead.customerOccupation,
          loanAmount: lead.loanAmount,
          region: lead.region,
          zone: lead.zone,
          status: lead.status,
          priorityScore: lead.priorityScore,
          aiInsight: lead.aiInsight,
          documents: lead.documents,
          createdBy: lead.createdBy,
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Create lead with files error:', error);
    
    // If error occurs, try to clean up uploaded files
    if (req.files && req.files.length > 0) {
      const { deleteFile } = require('../config/cloudinary');
      for (const file of req.files) {
        try {
          await deleteFile(file.filename);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      }
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Revert lead to customer with email notification
 */
const revertLeadToCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = '' } = req.body;

    // Find the lead
    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
        error: 'LEAD_NOT_FOUND'
      });
    }

    const oldStatus = lead.status;

    // Update lead status and add revert reason
    lead.status = 'Under Review';
    lead.aiInsight = lead.aiInsight + `\n\n[${new Date().toLocaleString()}] Lead reverted to customer. Reason: ${reason || 'Additional information required'}`;
    
    await lead.save();

    // Send email notification to customer
    const emailService = require('../services/emailService');
    const emailResult = await emailService.sendLeadRevertNotification(lead, reason);

    // Create audit log entry
    await AuditLog.createAuditEntry({
      leadId: lead._id,
      customerName: lead.customerName,
      action: 'Lead Reverted to Customer',
      user: req.user.id,
      details: `Lead reverted from ${oldStatus} to ${lead.status}. Email sent: ${emailResult.success ? 'Yes' : 'Failed'}. Reason: ${reason || 'Additional information required'}`
    }, req);

    res.status(200).json({
      success: true,
      message: 'Lead reverted to customer successfully',
      data: {
        lead,
        emailSent: emailResult.success,
        emailInfo: emailResult
      }
    });

  } catch (error) {
    console.error('Revert lead to customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Send remarks to customer with email notification
 */
const sendRemarksToCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    if (!remarks || !remarks.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Remarks are required',
        error: 'MISSING_REMARKS'
      });
    }

    // Find the lead
    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
        error: 'LEAD_NOT_FOUND'
      });
    }

    // Send email notification to customer with remarks
    const emailService = require('../services/emailService');
    const emailResult = await emailService.sendRemarksToCustomer(lead, remarks.trim());

    // Create audit log entry
    await AuditLog.createAuditEntry({
      leadId: lead._id,
      customerName: lead.customerName,
      action: 'Remarks Sent to Customer',
      user: req.user.id,
      details: `Remarks sent to customer. Email sent: ${emailResult.success ? 'Yes' : 'Failed'}. Remarks: ${remarks.trim()}`
    }, req);

    res.status(200).json({
      success: true,
      message: 'Remarks sent to customer successfully',
      data: {
        emailSent: emailResult.success,
        emailInfo: emailResult
      }
    });

  } catch (error) {
    console.error('Send remarks to customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Export lead-related datasets with role-aware filtering
 */
const exportLeads = async (req, res) => {
  try {
    const {
      format = 'csv',
      status,
      productType,
      assignedTo,
      startDate,
      endDate,
      dataset = 'leads'
    } = req.query;

    const userRole = req.user.role;
    const userZone = req.user.zone;
    const userId = req.user.id;

    const normalizedFormat = String(format).toLowerCase();
    const normalizedDataset = String(dataset).toLowerCase();

    const allowedFormats = ['csv', 'json'];
    const allowedDatasets = ['leads', 'audit'];

    if (!allowedFormats.includes(normalizedFormat)) {
      return res.status(400).json({
        success: false,
        message: `Export format ${format} is not supported.`,
        error: 'UNSUPPORTED_FORMAT'
      });
    }

    if (!allowedDatasets.includes(normalizedDataset)) {
      return res.status(400).json({
        success: false,
        message: `Export dataset ${dataset} is not supported.`,
        error: 'UNSUPPORTED_DATASET'
      });
    }

    const baseLeadQuery = {};

    if (userRole === ROLES.PROCESSING_STAFF) {
      baseLeadQuery.zone = userZone;
    } else if (userRole === ROLES.NODAL_OFFICER) {
      baseLeadQuery.zone = userZone;
    } else if (assignedTo) {
      baseLeadQuery.assignedTo = assignedTo;
    }

    if (status && status !== 'all') {
      baseLeadQuery.status = status;
    }

    if (productType && productType !== 'all') {
      baseLeadQuery.productType = productType;
    }

    const leadDateFilter = {};
    if (startDate) {
      leadDateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      leadDateFilter.$lte = end;
    }
    const hasLeadDateFilter = Object.keys(leadDateFilter).length > 0;

    const formatValue = (value) => {
      if (value === null || value === undefined) {
        return '';
      }

      const stringValue = value.toString().replace(/"/g, '""');
      if (/[",\n]/.test(stringValue)) {
        return `"${stringValue}"`;
      }
      return stringValue;
    };

    if (normalizedDataset === 'audit') {
      const leads = await Lead.find(baseLeadQuery)
        .select('customerName status productType zone region assignedTo createdAt updatedAt')
        .lean();

      if (!leads.length) {
        if (normalizedFormat === 'json') {
          return res.status(200).json({
            success: true,
            message: 'No audit logs available for the selected filters.',
            data: []
          });
        }

        const headerRow = [
          'Log ID',
          'Lead ID',
          'Customer Name',
          'Action',
          'Details',
          'Old Value',
          'New Value',
          'Performed By',
          'User Role',
          'Lead Status',
          'Product Type',
          'Zone',
          'Timestamp'
        ].join(',');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="audit-export-${new Date().toISOString().split('T')[0]}.csv"`
        );
        return res.status(200).send(headerRow);
      }

      const leadMap = new Map(leads.map((lead) => [lead._id.toString(), lead]));
      const leadIds = leads.map((lead) => lead._id);

      const auditQuery = {
        leadId: { $in: leadIds }
      };

      const auditDateFilter = {};
      if (startDate) {
        auditDateFilter.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        auditDateFilter.$lte = end;
      }
      if (Object.keys(auditDateFilter).length > 0) {
        auditQuery.timestamp = auditDateFilter;
      }

      const logs = await AuditLog.find(auditQuery)
        .populate('user', 'username role zone')
        .sort({ timestamp: -1 })
        .lean();

      const exportData = logs.map((log) => {
        const leadInfo = leadMap.get(log.leadId.toString());
        return {
          id: log._id.toString(),
          leadId: log.leadId.toString(),
          customerName: leadInfo?.customerName || log.customerName,
          action: log.action,
          details: log.details,
          oldValue: log.oldValue || '',
          newValue: log.newValue || '',
          performedBy: log.user ? log.user.username : 'System',
          userRole: log.user ? log.user.role : 'Unknown',
          leadStatus: leadInfo?.status || '',
          productType: leadInfo?.productType || '',
          zone: leadInfo?.zone || '',
          timestamp: log.timestamp ? new Date(log.timestamp).toISOString() : ''
        };
      });

      if (normalizedFormat === 'json') {
        return res.status(200).json({
          success: true,
          message: `Exported ${exportData.length} audit log(s)`,
          data: exportData
        });
      }

      const columns = [
        ['Log ID', 'id'],
        ['Lead ID', 'leadId'],
        ['Customer Name', 'customerName'],
        ['Action', 'action'],
        ['Details', 'details'],
        ['Old Value', 'oldValue'],
        ['New Value', 'newValue'],
        ['Performed By', 'performedBy'],
        ['User Role', 'userRole'],
        ['Lead Status', 'leadStatus'],
        ['Product Type', 'productType'],
        ['Zone', 'zone'],
        ['Timestamp', 'timestamp']
      ];

      const headerRow = columns.map(([header]) => header).join(',');
      const dataRows = exportData.map((row) =>
        columns.map(([_, key]) => formatValue(row[key])).join(',')
      );

      const csvContent = [headerRow, ...dataRows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="audit-export-${new Date().toISOString().split('T')[0]}.csv"`
      );
      return res.status(200).send(csvContent);
    }

    const leadQuery = {
      ...baseLeadQuery,
      ...(hasLeadDateFilter ? { createdAt: leadDateFilter } : {})
    };

    const leads = await Lead.find(leadQuery)
      .populate('assignedTo', 'username email zone')
      .populate('createdBy', 'username email zone')
      .sort({ createdAt: -1 })
      .lean();

    const exportData = leads.map((lead) => ({
      id: lead._id.toString(),
      customerName: lead.customerName,
      email: lead.email,
      phone: lead.phone,
      productType: lead.productType,
      loanAmount: lead.loanAmount || '',
      status: lead.status,
      priorityScore: lead.priorityScore,
      assignedTo: lead.assignedTo ? lead.assignedTo.username : 'Unassigned',
      zone: lead.zone,
      region: lead.region,
      creditScore: lead.creditScore,
      createdAt: lead.createdAt ? lead.createdAt.toISOString() : '',
      updatedAt: lead.updatedAt ? lead.updatedAt.toISOString() : '',
      createdBy: lead.createdBy ? lead.createdBy.username : 'System'
    }));

    if (normalizedFormat === 'json') {
      return res.status(200).json({
        success: true,
        message: `Exported ${exportData.length} lead(s)`,
        data: exportData
      });
    }

    const columns = [
      ['Lead ID', 'id'],
      ['Customer Name', 'customerName'],
      ['Email', 'email'],
      ['Phone', 'phone'],
      ['Product Type', 'productType'],
      ['Loan Amount', 'loanAmount'],
      ['Status', 'status'],
      ['Priority Score', 'priorityScore'],
      ['Assigned To', 'assignedTo'],
      ['Zone', 'zone'],
      ['Region', 'region'],
      ['Credit Score', 'creditScore'],
      ['Created By', 'createdBy'],
      ['Created At', 'createdAt'],
      ['Updated At', 'updatedAt']
    ];

    const headerRow = columns.map(([header]) => header).join(',');
    const dataRows = exportData.map((row) =>
      columns.map(([_, key]) => formatValue(row[key])).join(',')
    );

    const csvContent = [headerRow, ...dataRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="leads-export-${new Date().toISOString().split('T')[0]}.csv"`
    );

    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('Export leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export data',
      error: 'EXPORT_FAILED'
    });
  }
};

const predictLeadOutcomes = async (req, res) => {
  try {
    const prediction = await mlPredictionService.predictLeadOutcomes(req.body || {});

    res.status(200).json({
      success: true,
      message: 'Prediction generated successfully',
      data: prediction
    });
  } catch (error) {
    console.error('Lead prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate prediction',
      error: 'PREDICTION_FAILED'
    });
  }
};

/**
 * Get allowed status updates for current user's role
 */
const getAllowedStatusForUser = async (req, res) => {
  try {
    const userRole = req.user.role;
    const allowedStatuses = getAllowedStatusUpdates(userRole);
    
    res.json({
      success: true,
      message: 'Allowed status updates retrieved successfully',
      data: {
        role: userRole,
        allowedStatuses,
        statusHierarchy: require('../utils/statusPermissions').STATUS_HIERARCHY
      }
    });
  } catch (error) {
    console.error('Get allowed status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get allowed status',
      error: 'INTERNAL_ERROR'
    });
  }
};

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  createLeadWithFiles,
  revertLeadToCustomer,
  sendRemarksToCustomer,
  updateLead,
  deleteLead,
  assignLead,
  getLeadStats,
  exportLeads,
  getAllowedStatusForUser,
  predictLeadOutcomes
};
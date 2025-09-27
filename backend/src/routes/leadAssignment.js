const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/rbacMiddleware');

// GET /api/assignment/stats - Get assignment statistics
router.get('/stats', authenticateToken, requireRole(['Nodal Officer', 'Higher Authority']), async (req, res) => {
  try {
    const userZone = req.user.zone;

    // Get total unassigned leads in user's zone
    const unassignedLeads = await Lead.countDocuments({
      assignedTo: null,
      zone: userZone,
      status: { $nin: ['Completed', 'Rejected'] }
    });

    // Get nodal officers in the same zone with their lead counts
    const nodalOfficers = await User.find({
      role: 'Nodal Officer',
      zone: userZone,
      isActive: true
    }).select('username email zone');

    // Get assignment stats for each nodal officer
    const assignmentStats = await Promise.all(
      nodalOfficers.map(async (officer) => {
        const activeLeads = await Lead.countDocuments({
          assignedTo: officer._id,
          status: { $nin: ['Completed', 'Rejected'] }
        });

        const completedLeads = await Lead.countDocuments({
          assignedTo: officer._id,
          status: { $in: ['Completed', 'Approved'] }
        });

        return {
          officerId: officer._id,
          username: officer.username,
          email: officer.email,
          zone: officer.zone,
          activeLeads,
          completedLeads,
          totalLeads: activeLeads + completedLeads
        };
      })
    );

    // Calculate average processing time by officer
    const processingTimes = await Lead.aggregate([
      {
        $match: {
          assignedTo: { $in: nodalOfficers.map(o => o._id) },
          status: { $in: ['Completed', 'Approved'] },
          createdAt: { $exists: true },
          updatedAt: { $exists: true }
        }
      },
      {
        $project: {
          assignedTo: 1,
          processingTime: {
            $divide: [
              { $subtract: ['$updatedAt', '$createdAt'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: '$assignedTo',
          avgProcessingTime: { $avg: '$processingTime' }
        }
      }
    ]);

    // Merge processing times with assignment stats
    const enhancedStats = assignmentStats.map(officer => {
      const processingTimeData = processingTimes.find(
        pt => pt._id.toString() === officer.officerId.toString()
      );
      
      return {
        ...officer,
        avgProcessingDays: processingTimeData 
          ? Math.round(processingTimeData.avgProcessingTime)
          : 0
      };
    });

    res.json({
      success: true,
      data: {
        unassignedLeads,
        zone: userZone,
        officers: enhancedStats,
        totalOfficers: nodalOfficers.length
      },
      message: 'Assignment statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching assignment stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assignment statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/assignment/assign - Assign lead to nodal officer using balance+proximity strategy
router.post('/assign', authenticateToken, requireRole(['Nodal Officer', 'Higher Authority']), async (req, res) => {
  try {
    const { leadId, officerId, strategy = 'auto' } = req.body;
    const userZone = req.user.zone;

    // Validate lead exists and is unassigned
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    if (lead.assignedTo) {
      return res.status(400).json({
        success: false,
        error: 'Lead is already assigned'
      });
    }

    // Ensure lead is in user's zone
    if (lead.zone !== userZone) {
      return res.status(403).json({
        success: false,
        error: 'Lead not in your zone'
      });
    }

    let selectedOfficer;

    if (strategy === 'manual' && officerId) {
      // Manual assignment to specific officer
      selectedOfficer = await User.findOne({
        _id: officerId,
        role: 'Nodal Officer',
        zone: userZone,
        isActive: true
      });

      if (!selectedOfficer) {
        return res.status(400).json({
          success: false,
          error: 'Invalid officer selection'
        });
      }

    } else {
      // Auto assignment using balance+proximity strategy
      const nodalOfficers = await User.find({
        role: 'Nodal Officer',
        zone: userZone,
        isActive: true
      });

      if (nodalOfficers.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No available nodal officers in this zone'
        });
      }

      // Calculate workload for each officer
      const officerWorkloads = await Promise.all(
        nodalOfficers.map(async (officer) => {
          const activeLeads = await Lead.countDocuments({
            assignedTo: officer._id,
            status: { $nin: ['Completed', 'Rejected'] }
          });

          // Calculate priority score based on lead's priority
          const priorityWeight = lead.priorityScore || 50;
          
          // Balance score (lower is better)
          const balanceScore = activeLeads;
          
          // Proximity score (same zone = 0, different = penalty)
          const proximityScore = officer.zone === lead.zone ? 0 : 10;
          
          // Priority handling score (officers with fewer high-priority leads preferred)
          const highPriorityLeads = await Lead.countDocuments({
            assignedTo: officer._id,
            priorityScore: { $gte: 80 },
            status: { $nin: ['Completed', 'Rejected'] }
          });

          // Combined score (lower is better)
          const totalScore = balanceScore + proximityScore + (highPriorityLeads * 0.5);

          return {
            officer,
            activeLeads,
            highPriorityLeads,
            totalScore,
            details: {
              balance: balanceScore,
              proximity: proximityScore,
              priority: highPriorityLeads * 0.5
            }
          };
        })
      );

      // Sort by total score (ascending - lowest score wins)
      officerWorkloads.sort((a, b) => a.totalScore - b.totalScore);
      
      // Select the officer with the best score
      selectedOfficer = officerWorkloads[0].officer;
    }

    // Assign the lead
    lead.assignedTo = selectedOfficer._id;
    lead.status = 'In Progress';
    
    // Add audit trail entry
    await lead.addAuditEntry(
      'Lead Assigned',
      req.user._id,
      `Assigned to ${selectedOfficer.username} using ${strategy} strategy`
    );

    await lead.save();

    // Return updated lead with assignment details
    const updatedLead = await Lead.findById(leadId)
      .populate('assignedTo', 'username email zone')
      .populate('createdBy', 'username email');

    res.json({
      success: true,
      data: {
        lead: updatedLead,
        assignedOfficer: {
          id: selectedOfficer._id,
          username: selectedOfficer.username,
          email: selectedOfficer.email,
          zone: selectedOfficer.zone
        },
        strategy: strategy,
        assignedBy: req.user.username
      },
      message: `Lead successfully assigned to ${selectedOfficer.username}`
    });

  } catch (error) {
    console.error('Error assigning lead:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign lead',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/assignment/unassigned - Get unassigned leads for assignment
router.get('/unassigned', authenticateToken, requireRole(['Nodal Officer', 'Higher Authority']), async (req, res) => {
  try {
    const { page = 1, limit = 10, priority, loanType } = req.query;
    const userZone = req.user.zone;
    
    // Build query
    const query = {
      assignedTo: null,
      zone: userZone,
      status: { $nin: ['Completed', 'Rejected'] }
    };

    if (priority) {
      if (priority === 'high') query.priorityScore = { $gte: 80 };
      else if (priority === 'medium') query.priorityScore = { $gte: 60, $lt: 80 };
      else if (priority === 'low') query.priorityScore = { $lt: 60 };
    }

    if (loanType) {
      query.productType = loanType;
    }

    // Get unassigned leads with pagination
    const leads = await Lead.find(query)
      .populate('createdBy', 'username email')
      .sort({ priorityScore: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Lead.countDocuments(query);

    res.json({
      success: true,
      data: {
        leads,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalLeads: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      },
      message: 'Unassigned leads retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching unassigned leads:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unassigned leads',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
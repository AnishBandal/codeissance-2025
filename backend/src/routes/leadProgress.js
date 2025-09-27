const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/rbacMiddleware');

// PUT /api/leads/:id/progress - Update lead progress stage
router.put('/:id/progress', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, notes } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validate stage number
    if (!stage || stage < 1 || stage > 5) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stage number. Must be between 1 and 5.',
        error: 'INVALID_STAGE'
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

    // Role-based permission checks
    if (userRole === ROLES.PROCESSING_STAFF) {
      // Processing Staff can only update stages 1-2
      if (stage > 2) {
        return res.status(403).json({
          success: false,
          message: 'Processing Staff can only update stages 1-2',
          error: 'INSUFFICIENT_PERMISSIONS'
        });
      }
      
      // Can only update leads assigned to them or in their zone
      if (lead.assignedTo && lead.assignedTo.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only update leads assigned to you',
          error: 'ACCESS_DENIED'
        });
      }
    } else if (userRole === ROLES.NODAL_OFFICER) {
      // Nodal Officers can update stages 1-4
      if (stage > 4) {
        return res.status(403).json({
          success: false,
          message: 'Nodal Officers can only update stages 1-4. Stage 5 requires Higher Authority approval.',
          error: 'INSUFFICIENT_PERMISSIONS'
        });
      }
      
      // Must be in same zone
      if (lead.zone !== req.user.zone) {
        return res.status(403).json({
          success: false,
          message: 'You can only update leads in your zone',
          error: 'ZONE_ACCESS_DENIED'
        });
      }
    } else if (userRole === ROLES.HIGHER_AUTHORITY) {
      // Higher Authority can update all stages (1-5)
      // No additional restrictions
    } else {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to update lead progress',
        error: 'ACCESS_DENIED'
      });
    }

    // Validate progression (can't skip stages)
    if (stage > lead.progressStage + 1) {
      return res.status(400).json({
        success: false,
        message: `Cannot skip stages. Current stage is ${lead.progressStage}. Next allowed stage is ${lead.progressStage + 1}.`,
        error: 'INVALID_PROGRESSION'
      });
    }

    // Update progress stage and details
    const updateData = {
      progressStage: stage,
      [`progressDetails.stage${stage}.completed`]: true,
      [`progressDetails.stage${stage}.completedAt`]: new Date(),
      [`progressDetails.stage${stage}.completedBy`]: userId,
      [`progressDetails.stage${stage}.notes`]: notes || ''
    };

    // Update lead status based on progress stage
    if (stage === 5) {
      updateData.status = 'Completed';
    } else if (stage > 1) {
      updateData.status = 'In Progress';
    }

    // Add audit trail entry
    const auditEntry = {
      action: 'PROGRESS_UPDATED',
      performedBy: userId,
      timestamp: new Date(),
      details: {
        previousStage: lead.progressStage,
        newStage: stage,
        notes: notes || ''
      },
      ipAddress: req.ip
    };

    updateData.$push = { auditTrail: auditEntry };

    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email role')
     .populate('createdBy', 'name email role')
     .populate('progressDetails.stage1.completedBy', 'name email role')
     .populate('progressDetails.stage2.completedBy', 'name email role')
     .populate('progressDetails.stage3.completedBy', 'name email role')
     .populate('progressDetails.stage4.completedBy', 'name email role')
     .populate('progressDetails.stage5.completedBy', 'name email role');

    console.log(`✅ Lead progress updated - ID: ${id}, Stage: ${stage}, User: ${req.user.name}`);

    res.status(200).json({
      success: true,
      message: `Lead progress updated to stage ${stage}`,
      data: {
        lead: updatedLead,
        updatedFields: {
          progressStage: stage,
          status: updateData.status || lead.status
        }
      }
    });

  } catch (error) {
    console.error('❌ Error updating lead progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lead progress',
      error: 'INTERNAL_SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/leads/:id/progress - Get lead progress details
router.get('/:id/progress', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const lead = await Lead.findById(id)
      .select('progressStage progressDetails status createdAt updatedAt')
      .populate('progressDetails.stage1.completedBy', 'name email role')
      .populate('progressDetails.stage2.completedBy', 'name email role')
      .populate('progressDetails.stage3.completedBy', 'name email role')
      .populate('progressDetails.stage4.completedBy', 'name email role')
      .populate('progressDetails.stage5.completedBy', 'name email role');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
        error: 'LEAD_NOT_FOUND'
      });
    }

    // Role-based access control
    const userRole = req.user.role;
    const userId = req.user.id;

    if (userRole === ROLES.PROCESSING_STAFF) {
      // Processing Staff can only view leads assigned to them or in their zone
      if (lead.assignedTo && lead.assignedTo.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only view progress for leads assigned to you',
          error: 'ACCESS_DENIED'
        });
      }
    } else if (userRole === ROLES.NODAL_OFFICER) {
      // Nodal Officers can view leads in their zone
      if (lead.zone !== req.user.zone) {
        return res.status(403).json({
          success: false,
          message: 'You can only view progress for leads in your zone',
          error: 'ZONE_ACCESS_DENIED'
        });
      }
    }
    // Higher Authority can view all lead progress

    // Calculate progress percentage
    const completedStages = Object.keys(lead.progressDetails).filter(
      stageKey => lead.progressDetails[stageKey].completed
    ).length;
    const progressPercentage = (completedStages / 5) * 100;

    // Define stage descriptions
    const stageDescriptions = {
      1: 'Initial Review & Documentation',
      2: 'Verification & Validation',
      3: 'Processing & Analysis',
      4: 'Review & Approval Preparation',
      5: 'Final Approval & Completion'
    };

    res.status(200).json({
      success: true,
      message: 'Lead progress retrieved successfully',
      data: {
        leadId: lead._id,
        currentStage: lead.progressStage,
        progressPercentage,
        status: lead.status,
        stageDescriptions,
        progressDetails: lead.progressDetails,
        timeline: {
          created: lead.createdAt,
          lastUpdated: lead.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('❌ Error retrieving lead progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve lead progress',
      error: 'INTERNAL_SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
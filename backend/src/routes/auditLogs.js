const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');

/**
 * GET /api/audit-logs - Get audit logs with filtering
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { 
      leadId, 
      action, 
      user,
      page = 1, 
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc' 
    } = req.query;

    // Build query
    let query = {};
    
    if (leadId) query.leadId = leadId;
    if (action) query.action = action;
    if (user) query.user = user;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const auditLogs = await AuditLog.find(query)
      .populate('user', 'username role zone')
      .populate('leadId', 'customerName email productType')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalLogs = await AuditLog.countDocuments(query);
    const totalPages = Math.ceil(totalLogs / parseInt(limit));

    res.json({
      success: true,
      message: 'Audit logs retrieved successfully',
      data: {
        auditLogs: auditLogs.map(log => ({
          id: log._id,
          leadId: log.leadId?._id,
          customerName: log.customerName,
          action: log.action,
          user: log.user?.username || 'Unknown',
          userRole: log.user?.role,
          timestamp: log.timestamp.toISOString(),
          details: log.details,
          oldValue: log.oldValue,
          newValue: log.newValue,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalLogs,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/audit-logs/lead/:leadId - Get audit logs for specific lead
 */
router.get('/lead/:leadId', authMiddleware, async (req, res) => {
  try {
    const { leadId } = req.params;
    const { limit = 100 } = req.query;

    const auditLogs = await AuditLog.getLeadAuditLogs(leadId, parseInt(limit));

    res.json({
      success: true,
      message: 'Lead audit logs retrieved successfully',
      data: {
        leadId,
        auditLogs: auditLogs.map(log => ({
          id: log._id,
          action: log.action,
          user: log.user?.username || 'Unknown',
          userRole: log.user?.role,
          timestamp: log.timestamp.toISOString(),
          details: log.details,
          oldValue: log.oldValue,
          newValue: log.newValue
        }))
      }
    });

  } catch (error) {
    console.error('Get lead audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/audit-logs/recent - Get recent audit logs across system
 */
router.get('/recent', authMiddleware, rbacMiddleware.requireRole(['Higher Authority', 'Nodal Officer']), async (req, res) => {
  try {
    const { limit = 50, actions } = req.query;
    
    const actionFilter = actions ? actions.split(',') : null;
    const auditLogs = await AuditLog.getRecentAuditLogs(parseInt(limit), actionFilter);

    res.json({
      success: true,
      message: 'Recent audit logs retrieved successfully',
      data: {
        auditLogs: auditLogs.map(log => ({
          id: log._id,
          leadId: log.leadId?._id,
          customerName: log.customerName,
          productType: log.leadId?.productType,
          action: log.action,
          user: log.user?.username || 'Unknown',
          userRole: log.user?.role,
          timestamp: log.timestamp.toISOString(),
          details: log.details,
          oldValue: log.oldValue,
          newValue: log.newValue
        }))
      }
    });

  } catch (error) {
    console.error('Get recent audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/audit-logs/user/:userId - Get audit logs for specific user
 */
router.get('/user/:userId', authMiddleware, rbacMiddleware.requireRole(['Higher Authority', 'Nodal Officer']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 100 } = req.query;

    const auditLogs = await AuditLog.getUserAuditLogs(userId, parseInt(limit));

    res.json({
      success: true,
      message: 'User audit logs retrieved successfully',
      data: {
        userId,
        auditLogs: auditLogs.map(log => ({
          id: log._id,
          leadId: log.leadId?._id,
          customerName: log.customerName,
          productType: log.leadId?.productType,
          action: log.action,
          timestamp: log.timestamp.toISOString(),
          details: log.details,
          oldValue: log.oldValue,
          newValue: log.newValue
        }))
      }
    });

  } catch (error) {
    console.error('Get user audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/audit-logs/stats - Get audit log statistics
 */
router.get('/stats', authMiddleware, rbacMiddleware.requireRole(['Higher Authority', 'Nodal Officer']), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const stats = await AuditLog.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          lastActivity: { $max: '$timestamp' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalActivities = await AuditLog.countDocuments({ timestamp: { $gte: startDate } });
    const uniqueUsers = await AuditLog.distinct('user', { timestamp: { $gte: startDate } });
    const uniqueLeads = await AuditLog.distinct('leadId', { timestamp: { $gte: startDate } });

    res.json({
      success: true,
      message: 'Audit log statistics retrieved successfully',
      data: {
        period: `Last ${days} days`,
        totalActivities,
        uniqueUsers: uniqueUsers.length,
        uniqueLeads: uniqueLeads.length,
        actionBreakdown: stats.map(stat => ({
          action: stat._id,
          count: stat.count,
          lastActivity: stat.lastActivity.toISOString()
        }))
      }
    });

  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;
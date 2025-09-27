const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');

// GET /api/admin/dashboard - Get aggregated dashboard statistics
router.get('/dashboard', authenticateToken, requireRole(['Higher Authority']), async (req, res) => {
  try {
    // Get current date for calculations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Aggregate total leads
    const totalLeads = await Lead.countDocuments();

    // Get leads by status
    const leadsByStatus = await Lead.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert to object for easier access
    const statusCounts = {};
    leadsByStatus.forEach(item => {
      statusCounts[item._id] = item.count;
    });

    // Get leads created this month
    const leadsThisMonth = await Lead.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // Get leads created last month for comparison
    const leadsLastMonth = await Lead.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lt: startOfMonth }
    });

    // Calculate month-over-month growth
    const monthlyGrowth = leadsLastMonth > 0 
      ? ((leadsThisMonth - leadsLastMonth) / leadsLastMonth * 100).toFixed(1)
      : leadsThisMonth > 0 ? 100 : 0;

    // Get leads by loan type
    const leadsByType = await Lead.aggregate([
      {
        $group: {
          _id: '$loanType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get leads by priority (based on priority score)
    const leadsByPriority = await Lead.aggregate([
      {
        $bucket: {
          groupBy: '$priorityScore',
          boundaries: [0, 60, 80, 100],
          default: 'Unknown',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    // Convert priority buckets to readable format
    const priorityCounts = {
      low: 0,
      medium: 0,
      high: 0
    };

    leadsByPriority.forEach(bucket => {
      if (bucket._id === 0) priorityCounts.low = bucket.count;
      else if (bucket._id === 60) priorityCounts.medium = bucket.count;
      else if (bucket._id === 80) priorityCounts.high = bucket.count;
    });

    // Get recent activity (leads created in last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentActivity = await Lead.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Get average processing time (days from creation to completion)
    const completedLeads = await Lead.aggregate([
      {
        $match: {
          status: { $in: ['Approved', 'Rejected', 'Completed'] },
          createdAt: { $exists: true },
          updatedAt: { $exists: true }
        }
      },
      {
        $project: {
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
          _id: null,
          avgProcessingTime: { $avg: '$processingTime' }
        }
      }
    ]);

    const averageProcessingDays = completedLeads.length > 0 
      ? Math.round(completedLeads[0].avgProcessingTime) 
      : 0;

    // Get conversion rate (approved leads / total leads)
    const approvedLeads = statusCounts['Approved'] || 0;
    const conversionRate = totalLeads > 0 
      ? ((approvedLeads / totalLeads) * 100).toFixed(1)
      : 0;

    // Prepare response data
    const dashboardData = {
      overview: {
        totalLeads,
        leadsThisMonth,
        monthlyGrowth: parseFloat(monthlyGrowth),
        recentActivity,
        averageProcessingDays,
        conversionRate: parseFloat(conversionRate)
      },
      leadsByStatus: {
        new: statusCounts['New'] || 0,
        inProgress: statusCounts['In Progress'] || 0,
        underReview: statusCounts['Under Review'] || 0,
        approved: statusCounts['Approved'] || 0,
        rejected: statusCounts['Rejected'] || 0,
        completed: statusCounts['Completed'] || 0
      },
      leadsByType: leadsByType.map(item => ({
        type: item._id,
        count: item.count
      })),
      leadsByPriority: priorityCounts,
      trends: {
        thisMonth: leadsThisMonth,
        lastMonth: leadsLastMonth,
        growth: parseFloat(monthlyGrowth)
      }
    };

    res.json({
      success: true,
      data: dashboardData,
      message: 'Dashboard statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole, requireZoneAccess, ROLES } = require('../middleware/rbacMiddleware');

/**
 * @route   GET /api/leads
 * @desc    Get all leads (zone-filtered)
 * @access  Private
 */
router.get('/', 
  authenticateToken,
  requireZoneAccess((req) => req.query.zone),
  (req, res) => {
    res.json({
      success: true,
      message: 'Leads endpoint - Coming soon',
      user: req.user
    });
  }
);

/**
 * @route   POST /api/leads
 * @desc    Create new lead
 * @access  Private (Processing Staff and above)
 */
router.post('/',
  authenticateToken,
  requireRole([ROLES.PROCESSING_STAFF, ROLES.NODAL_OFFICER, ROLES.HIGHER_AUTHORITY]),
  (req, res) => {
    res.json({
      success: true,
      message: 'Create lead endpoint - Coming soon',
      user: req.user
    });
  }
);

module.exports = router;
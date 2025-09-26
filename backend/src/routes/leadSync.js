const express = require('express');
const router = express.Router();
const leadSyncController = require('../controllers/leadSyncController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/rbacMiddleware');

/**
 * @route   POST /api/leads/sync
 * @desc    Sync leads saved offline
 * @access  Private (Processing Staff only)
 */
router.post('/sync',
  authenticateToken,
  requireRole([ROLES.PROCESSING_STAFF]),
  leadSyncController.syncOfflineLead
);

module.exports = router;
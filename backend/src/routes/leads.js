const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/rbacMiddleware');

/**
 * @route   GET /api/leads
 * @desc    Get all leads (with role-based filtering)
 * @access  Private
 */
router.get('/', 
  authenticateToken,
  leadController.getLeads
);

/**
 * @route   GET /api/leads/stats
 * @desc    Get lead statistics
 * @access  Private
 */
router.get('/stats',
  authenticateToken,
  leadController.getLeadStats
);

/**
 * @route   GET /api/leads/:id
 * @desc    Get single lead by ID
 * @access  Private
 */
router.get('/:id',
  authenticateToken,
  leadController.getLeadById
);

/**
 * @route   POST /api/leads
 * @desc    Create new lead
 * @access  Private (All roles can create leads)
 */
router.post('/',
  authenticateToken,
  requireRole([ROLES.PROCESSING_STAFF, ROLES.NODAL_OFFICER, ROLES.HIGHER_AUTHORITY]),
  leadController.createLead
);

/**
 * @route   PATCH /api/leads/:id
 * @desc    Update lead
 * @access  Private (Role-based permissions)
 */
router.patch('/:id',
  authenticateToken,
  leadController.updateLead
);

/**
 * @route   POST /api/leads/:id/assign
 * @desc    Assign lead to user
 * @access  Private (Nodal Officer and Higher Authority)
 */
router.post('/:id/assign',
  authenticateToken,
  requireRole([ROLES.NODAL_OFFICER, ROLES.HIGHER_AUTHORITY]),
  leadController.assignLead
);

/**
 * @route   DELETE /api/leads/:id
 * @desc    Delete lead
 * @access  Private (Higher Authority only)
 */
router.delete('/:id',
  authenticateToken,
  requireRole(ROLES.HIGHER_AUTHORITY),
  leadController.deleteLead
);

module.exports = router;
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
 * @route   GET /api/leads/allowed-status
 * @desc    Get allowed status updates for current user's role
 * @access  Private
 */
router.get('/allowed-status',
  authenticateToken,
  leadController.getAllowedStatusForUser
);

/**
 * @route   GET /api/leads/export
 * @desc    Export leads in CSV/JSON format
 * @access  Private (Nodal Officer & Higher Authority)
 */
router.get('/export',
  authenticateToken,
  requireRole([ROLES.NODAL_OFFICER, ROLES.HIGHER_AUTHORITY]),
  leadController.exportLeads
);

/**
 * @route   POST /api/leads/predict
 * @desc    Get ML predictions for lead scoring
 * @access  Private (Processing, Nodal Officer, Higher Authority)
 */
router.post('/predict',
  authenticateToken,
  requireRole([ROLES.PROCESSING_STAFF, ROLES.NODAL_OFFICER, ROLES.HIGHER_AUTHORITY]),
  leadController.predictLeadOutcomes
);

// Specific routes should come before generic /:id route
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
 * @route   PUT /api/leads/:id/revert
 * @desc    Revert lead to customer
 * @access  Private (Nodal Officer and Higher Authority)
 */
router.put('/:id/revert',
  authenticateToken,
  requireRole([ROLES.NODAL_OFFICER, ROLES.HIGHER_AUTHORITY]),
  leadController.revertLeadToCustomer
);

/**
 * @route   POST /api/leads/:id/send-remarks
 * @desc    Send remarks to customer with email notification
 * @access  Private (All roles can send remarks)
 */
router.post('/:id/send-remarks',
  (req, res, next) => {
    console.log('🎯 Send remarks route hit:', req.params.id, req.body);
    next();
  },
  authenticateToken,
  requireRole([ROLES.PROCESSING_STAFF, ROLES.NODAL_OFFICER, ROLES.HIGHER_AUTHORITY]),
  leadController.sendRemarksToCustomer
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
 * @route   POST /api/leads/with-files
 * @desc    Create new lead with file uploads
 * @access  Private (All roles can create leads)
 */
router.post('/with-files',
  authenticateToken,
  requireRole([ROLES.PROCESSING_STAFF, ROLES.NODAL_OFFICER, ROLES.HIGHER_AUTHORITY]),
  (req, res, next) => {
    // Import multer upload here to avoid circular dependency
    const { uploadMultiple } = require('../config/cloudinary');
    uploadMultiple(req, res, (err) => {
      if (err) {
        console.error('File upload middleware error:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload failed',
          error: 'UPLOAD_ERROR'
        });
      }
      next();
    });
  },
  leadController.createLeadWithFiles
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

// Duplicate routes moved above - removing these duplicates

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
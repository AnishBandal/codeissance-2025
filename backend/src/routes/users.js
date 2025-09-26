const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/rbacMiddleware');

// Test route to verify router is working
router.get('/test', (req, res) => {
  console.log('🧪 Test route accessed');
  res.json({ success: true, message: 'Users router is working!' });
});

/**
 * @route   GET /api/users
 * @desc    Get all users (admin only)
 * @access  Private (Higher Authority only)
 */
router.get('/',
  (req, res, next) => {
    console.log('🔍 GET /api/users route hit');
    next();
  },
  authenticateToken,
  requireRole(ROLES.HIGHER_AUTHORITY),
  async (req, res) => {
    try {
      console.log('✅ GET /api/users - User authenticated and authorized');
      const User = require('../models/User');
      const users = await User.find({}).select('-password').sort({ createdAt: -1 });
      
      res.json({
        success: true,
        message: 'All users retrieved successfully',
        data: {
          users,
          count: users.length
        }
      });
    } catch (error) {
      console.error('❌ GET /api/users error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route   GET /api/users/my-team
 * @desc    Get users created by current user
 * @access  Private (Nodal Officer and above)
 */
router.get('/my-team',
  authenticateToken,
  requireRole([ROLES.NODAL_OFFICER, ROLES.HIGHER_AUTHORITY]),
  userController.getMyCreatedUsers
);

/**
 * @route   POST /api/users/create-nodal-officer
 * @desc    Create Nodal Officer
 * @access  Private (Higher Authority only)
 */
router.post('/create-nodal-officer',
  (req, res, next) => {
    console.log('🔍 POST /create-nodal-officer route hit with body:', req.body);
    next();
  },
  authenticateToken,
  requireRole(ROLES.HIGHER_AUTHORITY),
  userController.createNodalOfficer
);

/**
 * @route   POST /api/users/create-processing-staff
 * @desc    Create Processing Staff
 * @access  Private (Nodal Officer only)
 */
router.post('/create-processing-staff',
  (req, res, next) => {
    console.log('🔍 POST /create-processing-staff route hit with body:', req.body);
    next();
  },
  authenticateToken,
  requireRole(ROLES.NODAL_OFFICER),
  userController.createProcessingStaff
);

module.exports = router;
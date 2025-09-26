const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/rbacMiddleware');

/**
 * @route   GET /api/users
 * @desc    Get all users (admin only)
 * @access  Private (Higher Authority only)
 */
router.get('/',
  authenticateToken,
  requireRole(ROLES.HIGHER_AUTHORITY),
  async (req, res) => {
    try {
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

module.exports = router;
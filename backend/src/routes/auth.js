const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/rbacMiddleware');

/**
 * @route   POST /api/auth/login
 * @desc    Login user (may require 2FA)
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/auth/login-2fa
 * @desc    Complete login with 2FA verification
 * @access  Public
 */
router.post('/login-2fa', authController.loginWith2FA);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, authController.getProfile);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh', authenticateToken, authController.refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticateToken, authController.logout);

/**
 * @route   POST /api/auth/create-nodal-officer
 * @desc    Create Nodal Officer (Higher Authority only)
 * @access  Private (Higher Authority only)
 */
router.post('/create-nodal-officer',
  authenticateToken,
  requireRole(ROLES.HIGHER_AUTHORITY),
  userController.createNodalOfficer
);

/**
 * @route   POST /api/auth/create-processing-staff
 * @desc    Create Processing Staff (Nodal Officer only)
 * @access  Private (Nodal Officer only)
 */
router.post('/create-processing-staff',
  authenticateToken,
  requireRole(ROLES.NODAL_OFFICER),
  userController.createProcessingStaff
);

/**
 * @route   GET /api/auth/my-created-users
 * @desc    Get users created by current user (audit trail)
 * @access  Private (Nodal Officer and Higher Authority)
 */
router.get('/my-created-users',
  authenticateToken,
  requireRole([ROLES.HIGHER_AUTHORITY, ROLES.NODAL_OFFICER]),
  userController.getMyCreatedUsers
);

module.exports = router;
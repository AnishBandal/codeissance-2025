const express = require('express');
const { body } = require('express-validator');
const TwoFactorController = require('../controllers/twoFactorController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation middleware for 2FA token
const validateToken = [
  body('token')
    .isLength({ min: 6, max: 8 })
    .withMessage('Token must be 6-8 characters')
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage('Token must be alphanumeric')
];

// Validation for user ID (used in verification endpoint)
const validateUserId = [
  body('userId')
    .isMongoId()
    .withMessage('Invalid user ID format')
];

/**
 * @route   GET /api/2fa/status
 * @desc    Get 2FA status for current user
 * @access  Private
 */
router.get('/status', authenticateToken, TwoFactorController.get2FAStatus);

/**
 * @route   POST /api/2fa/setup
 * @desc    Generate QR code and secret for 2FA setup
 * @access  Private
 */
router.post('/setup', authenticateToken, TwoFactorController.setup2FA);

/**
 * @route   POST /api/2fa/enable
 * @desc    Verify token and enable 2FA
 * @access  Private
 */
router.post('/enable', 
  authenticateToken,
  validateToken,
  TwoFactorController.enable2FA
);

/**
 * @route   POST /api/2fa/disable
 * @desc    Disable 2FA
 * @access  Private
 */
router.post('/disable',
  authenticateToken,
  validateToken,
  TwoFactorController.disable2FA
);

/**
 * @route   POST /api/2fa/verify
 * @desc    Verify 2FA token during login
 * @access  Public (used during login process)
 */
router.post('/verify',
  validateUserId,
  validateToken,
  TwoFactorController.verify2FA
);

/**
 * @route   POST /api/2fa/regenerate-backup-codes
 * @desc    Regenerate backup codes
 * @access  Private
 */
router.post('/regenerate-backup-codes',
  authenticateToken,
  validateToken,
  TwoFactorController.regenerateBackupCodes
);

/**
 * @route   POST /api/2fa/test
 * @desc    Test 2FA token (for development/testing)
 * @access  Private
 */
router.post('/test',
  authenticateToken,
  validateToken,
  TwoFactorController.testToken
);

module.exports = router;

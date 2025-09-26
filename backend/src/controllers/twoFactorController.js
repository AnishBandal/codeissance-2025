const TwoFactorService = require('../services/twoFactorService');
const { validationResult } = require('express-validator');

class TwoFactorController {

  /**
   * Setup 2FA - Generate QR code and secret
   */
  static async setup2FA(req, res) {
    try {
      const userId = req.user.userId;
      const username = req.user.username;

      // Generate 2FA secret and QR code
      const setupData = await TwoFactorService.generateSecret(userId, username);

      res.status(200).json({
        success: true,
        message: 'Scan the QR code with your authenticator app',
        data: {
          qrCode: setupData.qrCode,
          manualEntryKey: setupData.manualEntryKey,
          issuer: setupData.issuer,
          accountName: setupData.accountName,
          instructions: [
            '1. Open your authenticator app (Google Authenticator, Microsoft Authenticator, Authy, etc.)',
            '2. Scan the QR code or manually enter the key below',
            '3. Enter the 6-digit code from your app to verify setup',
            '4. Save your backup codes in a secure location'
          ]
        }
      });

    } catch (error) {
      console.error('❌ 2FA Setup Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to setup 2FA',
        error: error.message
      });
    }
  }

  /**
   * Verify and enable 2FA
   */
  static async enable2FA(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.userId;
      const { token } = req.body;

      // Verify token and enable 2FA
      const result = await TwoFactorService.enable2FA(userId, token);

      res.status(200).json({
        success: true,
        message: '2FA enabled successfully! Please save your backup codes.',
        data: {
          backupCodes: result.backupCodes,
          warning: 'Store these backup codes in a secure location. They can be used to access your account if you lose your authenticator device.',
          instructions: [
            'Each backup code can only be used once',
            'Store them in a password manager or secure location',
            'You can regenerate new backup codes anytime from settings'
          ]
        }
      });

    } catch (error) {
      console.error('❌ 2FA Enable Error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to enable 2FA'
      });
    }
  }

  /**
   * Disable 2FA
   */
  static async disable2FA(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.userId;
      const { token } = req.body;

      // Disable 2FA
      const result = await TwoFactorService.disable2FA(userId, token);

      res.status(200).json({
        success: true,
        message: '2FA disabled successfully',
        warning: 'Your account is now less secure without 2FA protection'
      });

    } catch (error) {
      console.error('❌ 2FA Disable Error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to disable 2FA'
      });
    }
  }

  /**
   * Verify 2FA token during login
   */
  static async verify2FA(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { userId, token } = req.body;

      // This would typically be called from the login process
      // For now, we'll get the user from the database
      const User = require('../models/User');
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify 2FA token
      const result = await TwoFactorService.verifyLogin2FA(user, token);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: '2FA verification successful',
          method: result.method,
          warning: result.warning || null
        });
      } else {
        res.status(401).json({
          success: false,
          message: result.error || 'Invalid 2FA code'
        });
      }

    } catch (error) {
      console.error('❌ 2FA Verify Error:', error);
      res.status(500).json({
        success: false,
        message: 'Verification failed'
      });
    }
  }

  /**
   * Get 2FA status
   */
  static async get2FAStatus(req, res) {
    try {
      const userId = req.user.userId;
      const status = await TwoFactorService.get2FAStatus(userId);

      res.status(200).json({
        success: true,
        data: status
      });

    } catch (error) {
      console.error('❌ 2FA Status Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get 2FA status'
      });
    }
  }

  /**
   * Regenerate backup codes
   */
  static async regenerateBackupCodes(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.userId;
      const { token } = req.body;

      // Regenerate backup codes
      const result = await TwoFactorService.regenerateBackupCodes(userId, token);

      res.status(200).json({
        success: true,
        message: 'Backup codes regenerated successfully',
        data: {
          backupCodes: result.backupCodes,
          warning: 'Your old backup codes are no longer valid. Save these new codes securely.'
        }
      });

    } catch (error) {
      console.error('❌ Backup Codes Regenerate Error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to regenerate backup codes'
      });
    }
  }

  /**
   * Test 2FA token (for testing purposes)
   */
  static async testToken(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.userId;
      const { token } = req.body;

      const User = require('../models/User');
      const user = await User.findById(userId);

      if (!user || !user.twoFactorSecret) {
        return res.status(400).json({
          success: false,
          message: '2FA not set up for this user'
        });
      }

      const isValid = TwoFactorService.verifyToken(user.twoFactorSecret, token);

      res.status(200).json({
        success: true,
        valid: isValid,
        message: isValid ? 'Token is valid' : 'Token is invalid'
      });

    } catch (error) {
      console.error('❌ 2FA Test Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test token'
      });
    }
  }
}

module.exports = TwoFactorController;

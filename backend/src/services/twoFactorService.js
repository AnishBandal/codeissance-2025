const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const User = require('../models/User');

class TwoFactorService {
  
  /**
   * Generate 2FA secret for a user
   * @param {string} userId - User ID
   * @param {string} username - Username for QR code label
   * @returns {Object} - Secret and QR code data
   */
  static async generateSecret(userId, username) {
    try {
      const secret = speakeasy.generateSecret({
        name: `LeadVault (${username})`,
        issuer: 'BOI LeadVault System',
        length: 32
      });

      // Store the secret in the user document (but don't enable 2FA yet)
      await User.findByIdAndUpdate(userId, {
        twoFactorSecret: secret.base32,
        twoFactorEnabled: false
      });

      // Generate QR code for easy setup
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

      return {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        manualEntryKey: secret.base32,
        issuer: 'BOI LeadVault System',
        accountName: `LeadVault (${username})`
      };

    } catch (error) {
      console.error('❌ Error generating 2FA secret:', error);
      throw new Error('Failed to generate 2FA secret');
    }
  }

  /**
   * Verify TOTP token
   * @param {string} secret - Base32 encoded secret
   * @param {string} token - 6-digit TOTP token
   * @param {number} window - Time window for verification (default: 2)
   * @returns {boolean} - Verification result
   */
  static verifyToken(secret, token, window = 2) {
    try {
      return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window // Allow 2 time steps for clock drift (±60 seconds)
      });
    } catch (error) {
      console.error('❌ Error verifying 2FA token:', error);
      return false;
    }
  }

  /**
   * Enable 2FA for a user after verifying the initial token
   * @param {string} userId - User ID
   * @param {string} token - Verification token
   * @returns {Object} - Result with backup codes
   */
  static async enable2FA(userId, token) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.twoFactorSecret) {
        throw new Error('User not found or 2FA not set up');
      }

      // Verify the token before enabling
      const isValid = this.verifyToken(user.twoFactorSecret, token);
      if (!isValid) {
        throw new Error('Invalid verification token');
      }

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Enable 2FA and save backup codes
      await User.findByIdAndUpdate(userId, {
        twoFactorEnabled: true,
        backupCodes: backupCodes.map(code => ({ code, used: false }))
      });

      return {
        success: true,
        backupCodes,
        message: '2FA enabled successfully'
      };

    } catch (error) {
      console.error('❌ Error enabling 2FA:', error);
      throw error;
    }
  }

  /**
   * Disable 2FA for a user
   * @param {string} userId - User ID
   * @param {string} token - Current TOTP token or backup code
   * @returns {Object} - Result
   */
  static async disable2FA(userId, token) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.twoFactorEnabled) {
        throw new Error('2FA is not enabled for this user');
      }

      // Verify current token or backup code
      const isValidToken = this.verifyToken(user.twoFactorSecret, token);
      const isValidBackup = this.verifyBackupCode(user, token);

      if (!isValidToken && !isValidBackup) {
        throw new Error('Invalid verification code');
      }

      // Disable 2FA and clear secrets
      await User.findByIdAndUpdate(userId, {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: []
      });

      return {
        success: true,
        message: '2FA disabled successfully'
      };

    } catch (error) {
      console.error('❌ Error disabling 2FA:', error);
      throw error;
    }
  }

  /**
   * Verify 2FA during login
   * @param {Object} user - User document
   * @param {string} token - TOTP token or backup code
   * @returns {Object} - Verification result
   */
  static async verifyLogin2FA(user, token) {
    try {
      if (!user.twoFactorEnabled || !user.twoFactorSecret) {
        return { success: false, error: '2FA not enabled for this user' };
      }

      // First try TOTP token
      const isValidToken = this.verifyToken(user.twoFactorSecret, token);
      if (isValidToken) {
        return { success: true, method: 'totp' };
      }

      // If TOTP fails, try backup code
      const backupResult = this.verifyBackupCode(user, token);
      if (backupResult) {
        // Mark backup code as used
        await this.markBackupCodeUsed(user._id, token);
        return { success: true, method: 'backup', warning: 'Backup code used' };
      }

      return { success: false, error: 'Invalid 2FA code' };

    } catch (error) {
      console.error('❌ Error verifying login 2FA:', error);
      return { success: false, error: 'Verification failed' };
    }
  }

  /**
   * Generate backup codes
   * @returns {Array} - Array of backup codes
   */
  static generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      // Generate 8-character alphanumeric backup codes
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  /**
   * Verify backup code
   * @param {Object} user - User document
   * @param {string} code - Backup code to verify
   * @returns {boolean} - Verification result
   */
  static verifyBackupCode(user, code) {
    if (!user.backupCodes || user.backupCodes.length === 0) {
      return false;
    }

    const backupCode = user.backupCodes.find(
      bc => bc.code.toLowerCase() === code.toLowerCase() && !bc.used
    );

    return !!backupCode;
  }

  /**
   * Mark backup code as used
   * @param {string} userId - User ID
   * @param {string} code - Backup code to mark as used
   */
  static async markBackupCodeUsed(userId, code) {
    try {
      await User.findOneAndUpdate(
        { 
          _id: userId, 
          'backupCodes.code': code.toUpperCase(),
          'backupCodes.used': false 
        },
        { 
          $set: { 'backupCodes.$.used': true } 
        }
      );
    } catch (error) {
      console.error('❌ Error marking backup code as used:', error);
    }
  }

  /**
   * Generate new backup codes (regenerate)
   * @param {string} userId - User ID
   * @param {string} token - Current TOTP token for verification
   * @returns {Object} - New backup codes
   */
  static async regenerateBackupCodes(userId, token) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.twoFactorEnabled) {
        throw new Error('2FA not enabled for this user');
      }

      // Verify current token
      const isValid = this.verifyToken(user.twoFactorSecret, token);
      if (!isValid) {
        throw new Error('Invalid verification token');
      }

      // Generate new backup codes
      const newBackupCodes = this.generateBackupCodes();

      // Update user with new backup codes
      await User.findByIdAndUpdate(userId, {
        backupCodes: newBackupCodes.map(code => ({ code, used: false }))
      });

      return {
        success: true,
        backupCodes: newBackupCodes,
        message: 'Backup codes regenerated successfully'
      };

    } catch (error) {
      console.error('❌ Error regenerating backup codes:', error);
      throw error;
    }
  }

  /**
   * Get 2FA status for a user
   * @param {string} userId - User ID
   * @returns {Object} - 2FA status information
   */
  static async get2FAStatus(userId) {
    try {
      const user = await User.findById(userId).select('twoFactorEnabled backupCodes');
      if (!user) {
        throw new Error('User not found');
      }

      const unusedBackupCodes = user.backupCodes ? 
        user.backupCodes.filter(bc => !bc.used).length : 0;

      return {
        enabled: user.twoFactorEnabled || false,
        backupCodesRemaining: unusedBackupCodes,
        hasSecret: !!user.twoFactorSecret
      };

    } catch (error) {
      console.error('❌ Error getting 2FA status:', error);
      throw error;
    }
  }
}

module.exports = TwoFactorService;

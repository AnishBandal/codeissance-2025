const bcrypt = require('bcryptjs');

/**
 * Hash password utility
 */
class PasswordUtils {
  constructor() {
    this.saltRounds = process.env.BCRYPT_ROUNDS || 12;
  }

  /**
   * Hash a password
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password) {
    try {
      const salt = await bcrypt.genSalt(this.saltRounds);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Compare password with hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} Match result
   */
  async comparePassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      throw new Error('Password comparison failed');
    }
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} Validation result
   */
  validatePassword(password) {
    const result = {
      isValid: true,
      errors: []
    };

    if (!password) {
      result.isValid = false;
      result.errors.push('Password is required');
      return result;
    }

    if (password.length < 6) {
      result.isValid = false;
      result.errors.push('Password must be at least 6 characters long');
    }

    if (password.length > 128) {
      result.isValid = false;
      result.errors.push('Password must be less than 128 characters');
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      result.errors.push('Password should contain at least one number');
    }

    // Check for at least one letter
    if (!/[a-zA-Z]/.test(password)) {
      result.errors.push('Password should contain at least one letter');
    }

    // Check for common weak passwords
    const weakPasswords = ['password', '123456', 'admin', 'user'];
    if (weakPasswords.includes(password.toLowerCase())) {
      result.isValid = false;
      result.errors.push('Password is too common and weak');
    }

    return result;
  }

  /**
   * Generate random password
   * @param {number} length - Password length
   * @returns {string} Generated password
   */
  generateRandomPassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }
}

module.exports = new PasswordUtils();
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

class JWTService {
  constructor() {
    this.secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
    this.expiresIn = process.env.JWT_EXPIRES_IN || '1h';
  }

  /**
   * Generate JWT token
   * @param {Object} payload - User data to encode
   * @returns {string} JWT token
   */
  generateToken(payload) {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
      issuer: 'leadvault',
      audience: 'leadvault-users'
    });
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token to verify
   * @returns {Object} Decoded payload
   */
  async verifyToken(token) {
    try {
      const verify = promisify(jwt.verify);
      return await verify(token, this.secret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Generate access token for user
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  generateAccessToken(user) {
    const payload = {
      user_id: user._id,
      username: user.username,
      role: user.role,
      zone: user.zone || null,
      iat: Math.floor(Date.now() / 1000)
    };

    return this.generateToken(payload);
  }

  /**
   * Extract token from Authorization header
   * @param {string} authHeader - Authorization header value
   * @returns {string|null} Token or null
   */
  extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Decode token without verification (for debugging)
   * @param {string} token - JWT token
   * @returns {Object} Decoded payload
   */
  decodeToken(token) {
    return jwt.decode(token);
  }
}

module.exports = new JWTService();
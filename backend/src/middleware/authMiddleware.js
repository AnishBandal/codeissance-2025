const jwtService = require('../services/jwtService');
const User = require('../models/User');

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = async (req, res, next) => {
  try {
    const token = jwtService.extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        error: 'MISSING_TOKEN'
      });
    }

    // Verify token
    const decoded = await jwtService.verifyToken(token);
    
    // Fetch fresh user data
    const user = await User.findById(decoded.user_id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
        error: 'INVALID_USER'
      });
    }

    // Attach user info to request
    req.user = {
      id: user._id,
      username: user.username,
      role: user.role,
      zone: user.zone,
      createdBy: user.createdBy
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: 'TOKEN_INVALID'
    });
  }
};

/**
 * Middleware to check if user is authenticated (optional auth)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = jwtService.extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const decoded = await jwtService.verifyToken(token);
      const user = await User.findById(decoded.user_id);
      
      if (user && user.isActive) {
        req.user = {
          id: user._id,
          username: user.username,
          role: user.role,
          zone: user.zone,
          createdBy: user.createdBy
        };
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};
const User = require('../models/User');
const jwtService = require('../services/jwtService');
const TwoFactorService = require('../services/twoFactorService');
const { ROLES } = require('../middleware/rbacMiddleware');

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
        error: 'MISSING_CREDENTIALS'
      });
    }

    // Find user
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      return res.status(200).json({
        success: true,
        message: '2FA verification required',
        requires2FA: true,
        data: {
          userId: user._id,
          username: user.username
        }
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = jwtService.generateAccessToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          zone: user.zone,
          lastLogin: user.lastLogin,
          twoFactorEnabled: user.twoFactorEnabled || false
        },
        token,
        expiresIn: '1h'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
};

// Public registration removed - all user creation is now role-protected

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('createdBy', 'username role')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Refresh JWT token
 */
const refreshToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
        error: 'INVALID_USER'
      });
    }

    const token = jwtService.generateAccessToken(user);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token,
        expiresIn: '1h'
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Complete login with 2FA verification
 */
const loginWith2FA = async (req, res) => {
  try {
    const { userId, token } = req.body;

    // Validate input
    if (!userId || !token) {
      return res.status(400).json({
        success: false,
        message: 'User ID and 2FA token are required',
        error: 'MISSING_2FA_CREDENTIALS'
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user or user inactive',
        error: 'INVALID_USER'
      });
    }

    // Verify 2FA token
    const verification = await TwoFactorService.verifyLogin2FA(user, token);
    if (!verification.success) {
      return res.status(401).json({
        success: false,
        message: verification.error || 'Invalid 2FA code',
        error: 'INVALID_2FA_TOKEN'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const authToken = jwtService.generateAccessToken(user);

    res.json({
      success: true,
      message: '2FA verification successful - Login complete',
      data: {
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          zone: user.zone,
          lastLogin: user.lastLogin,
          twoFactorEnabled: user.twoFactorEnabled
        },
        token: authToken,
        expiresIn: '1h',
        method: verification.method,
        warning: verification.warning || null
      }
    });

  } catch (error) {
    console.error('2FA Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Logout user (client-side token removal)
 */
const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
};

module.exports = {
  login,
  loginWith2FA,
  getProfile,
  refreshToken,
  logout
};
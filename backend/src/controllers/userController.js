const User = require('../models/User');
const { ROLES } = require('../middleware/rbacMiddleware');

/**
 * Create Nodal Officer (Higher Authority only)
 */
const createNodalOfficer = async (req, res) => {
  try {
    const { username, password, zone } = req.body;

    // Validate input
    if (!username || !password || !zone) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, and zone are required',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Check if username already exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Username already exists',
        error: 'USERNAME_EXISTS'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
        error: 'WEAK_PASSWORD'
      });
    }

    // Create Nodal Officer
    const nodalOfficer = new User({
      username,
      password,
      role: ROLES.NODAL_OFFICER,
      zone,
      createdBy: req.user.id
    });

    await nodalOfficer.save();

    res.status(201).json({
      success: true,
      message: 'Nodal Officer created successfully',
      data: {
        user: {
          id: nodalOfficer._id,
          username: nodalOfficer.username,
          role: nodalOfficer.role,
          zone: nodalOfficer.zone,
          createdBy: nodalOfficer.createdBy,
          createdAt: nodalOfficer.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Create Nodal Officer error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: 'VALIDATION_ERROR',
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Create Processing Staff (Nodal Officer only)
 */
const createProcessingStaff = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Check if username already exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Username already exists',
        error: 'USERNAME_EXISTS'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
        error: 'WEAK_PASSWORD'
      });
    }

    // Create Processing Staff (inherit zone from creating Nodal Officer)
    const processingStaff = new User({
      username,
      password,
      role: ROLES.PROCESSING_STAFF,
      zone: req.user.zone, // Inherit zone from Nodal Officer
      createdBy: req.user.id
    });

    await processingStaff.save();

    res.status(201).json({
      success: true,
      message: 'Processing Staff created successfully',
      data: {
        user: {
          id: processingStaff._id,
          username: processingStaff.username,
          role: processingStaff.role,
          zone: processingStaff.zone,
          createdBy: processingStaff.createdBy,
          createdAt: processingStaff.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Create Processing Staff error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: 'VALIDATION_ERROR',
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Get users created by current user (audit trail)
 */
const getMyCreatedUsers = async (req, res) => {
  try {
    const users = await User.find({ createdBy: req.user.id })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users,
        count: users.length
      }
    });

  } catch (error) {
    console.error('Get created users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
};

module.exports = {
  createNodalOfficer,
  createProcessingStaff,
  getMyCreatedUsers
};
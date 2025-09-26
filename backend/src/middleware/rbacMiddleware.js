/**
 * Role-Based Access Control (RBAC) Middleware
 */

const ROLES = {
  HIGHER_AUTHORITY: 'Higher Authority',
  NODAL_OFFICER: 'Nodal Officer',
  PROCESSING_STAFF: 'Processing Staff'
};

const ROLE_HIERARCHY = {
  [ROLES.HIGHER_AUTHORITY]: 3,
  [ROLES.NODAL_OFFICER]: 2,
  [ROLES.PROCESSING_STAFF]: 1
};

/**
 * Check if user has required role
 * @param {Array|string} allowedRoles - Allowed roles
 * @returns {Function} Middleware function
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
    }

    const userRole = req.user.role;
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!rolesArray.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: 'FORBIDDEN',
        required: rolesArray,
        current: userRole
      });
    }

    next();
  };
};

/**
 * Check if user has minimum role level
 * @param {string} minimumRole - Minimum required role
 * @returns {Function} Middleware function
 */
const requireMinimumRole = (minimumRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
    }

    const userRoleLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredRoleLevel = ROLE_HIERARCHY[minimumRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient role level',
        error: 'INSUFFICIENT_ROLE',
        required: minimumRole,
        current: req.user.role
      });
    }

    next();
  };
};

/**
 * Check if user can create another user with specified role
 * @param {Function} getRoleFromRequest - Function to extract role from request
 * @returns {Function} Middleware function
 */
const canCreateUserWithRole = (getRoleFromRequest) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
    }

    const targetRole = getRoleFromRequest(req);
    const currentUserRole = req.user.role;

    // Higher Authority can create Nodal Officers
    if (currentUserRole === ROLES.HIGHER_AUTHORITY && targetRole === ROLES.NODAL_OFFICER) {
      return next();
    }

    // Nodal Officer can create Processing Staff
    if (currentUserRole === ROLES.NODAL_OFFICER && targetRole === ROLES.PROCESSING_STAFF) {
      return next();
    }

    // No one can create Higher Authority (must be done manually)
    if (targetRole === ROLES.HIGHER_AUTHORITY) {
      return res.status(403).json({
        success: false,
        message: 'Cannot create Higher Authority users',
        error: 'FORBIDDEN_ROLE_CREATION'
      });
    }

    return res.status(403).json({
      success: false,
      message: `${currentUserRole} cannot create ${targetRole}`,
      error: 'FORBIDDEN_ROLE_CREATION',
      allowed: currentUserRole === ROLES.HIGHER_AUTHORITY ? [ROLES.NODAL_OFFICER] : 
               currentUserRole === ROLES.NODAL_OFFICER ? [ROLES.PROCESSING_STAFF] : []
    });
  };
};

/**
 * Check if user can access data from specific zone
 * @param {Function} getZoneFromRequest - Function to extract zone from request
 * @returns {Function} Middleware function
 */
const requireZoneAccess = (getZoneFromRequest) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
    }

    // Higher Authority can access all zones
    if (req.user.role === ROLES.HIGHER_AUTHORITY) {
      return next();
    }

    const requestedZone = getZoneFromRequest(req);
    const userZone = req.user.zone;

    if (requestedZone && userZone !== requestedZone) {
      return res.status(403).json({
        success: false,
        message: 'Access denied for this zone',
        error: 'ZONE_ACCESS_DENIED',
        userZone,
        requestedZone
      });
    }

    next();
  };
};

/**
 * Check if user is accessing their own data or has permission
 * @param {Function} getUserIdFromRequest - Function to extract user ID from request
 * @returns {Function} Middleware function
 */
const requireOwnershipOrRole = (getUserIdFromRequest, allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
    }

    const targetUserId = getUserIdFromRequest(req);
    const currentUserId = req.user.id.toString();
    const currentUserRole = req.user.role;

    // User accessing their own data
    if (targetUserId === currentUserId) {
      return next();
    }

    // User has allowed role
    if (allowedRoles.includes(currentUserRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied',
      error: 'OWNERSHIP_OR_ROLE_REQUIRED'
    });
  };
};

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
  requireRole,
  requireMinimumRole,
  canCreateUserWithRole,
  requireZoneAccess,
  requireOwnershipOrRole
};
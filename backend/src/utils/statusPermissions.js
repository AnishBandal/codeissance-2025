/**
 * Role-Based Status Update Permissions
 * Defines which statuses each role can update to based on hierarchy
 */

const ROLES = {
  HIGHER_AUTHORITY: 'Higher Authority',
  NODAL_OFFICER: 'Nodal Officer',
  PROCESSING_STAFF: 'Processing Staff'
};

// Status hierarchy - lower index = earlier in workflow
const STATUS_HIERARCHY = [
  'New',
  'Document Collection', 
  'Initial Review',
  'Credit Assessment',
  'Final Review',
  'Approved',
  'Rejected',
  'Completed'
];

// Role-based status update permissions
const ROLE_STATUS_PERMISSIONS = {
  [ROLES.PROCESSING_STAFF]: [
    'New',
    'Document Collection', 
    'Initial Review',
    'Credit Assessment'
  ],
  [ROLES.NODAL_OFFICER]: [
    'New',
    'Document Collection', 
    'Initial Review',
    'Credit Assessment',
    'Final Review',
    'Completed'
  ],
  [ROLES.HIGHER_AUTHORITY]: STATUS_HIERARCHY // Can update to any status
};

/**
 * Get allowed status updates for a specific role
 * @param {string} userRole - User's role
 * @returns {Array} Array of allowed status values
 */
const getAllowedStatusUpdates = (userRole) => {
  return ROLE_STATUS_PERMISSIONS[userRole] || [];
};

/**
 * Check if a user can update to a specific status
 * @param {string} userRole - User's role
 * @param {string} targetStatus - Status to update to
 * @returns {boolean} Whether the update is allowed
 */
const canUpdateToStatus = (userRole, targetStatus) => {
  const allowedStatuses = getAllowedStatusUpdates(userRole);
  return allowedStatuses.includes(targetStatus);
};

/**
 * Get status hierarchy index (for validation logic)
 * @param {string} status - Status value
 * @returns {number} Index in hierarchy (-1 if not found)
 */
const getStatusHierarchyIndex = (status) => {
  return STATUS_HIERARCHY.indexOf(status);
};

/**
 * Validate if status transition is valid (can't go backwards)
 * @param {string} currentStatus - Current lead status
 * @param {string} newStatus - New status to update to
 * @returns {boolean} Whether transition is valid
 */
const isValidStatusTransition = (currentStatus, newStatus) => {
  // Special cases - can always move to Rejected or back to earlier stages with proper permissions
  if (newStatus === 'Rejected') return true;
  
  const currentIndex = getStatusHierarchyIndex(currentStatus);
  const newIndex = getStatusHierarchyIndex(newStatus);
  
  // Can't find status in hierarchy
  if (currentIndex === -1 || newIndex === -1) return false;
  
  // Generally allow forward movement or same status
  return newIndex >= currentIndex;
};

/**
 * Get next possible statuses for a role from current status
 * @param {string} userRole - User's role
 * @param {string} currentStatus - Current lead status
 * @returns {Array} Array of next possible status values
 */
const getNextPossibleStatuses = (userRole, currentStatus) => {
  const allowedStatuses = getAllowedStatusUpdates(userRole);
  const currentIndex = getStatusHierarchyIndex(currentStatus);
  
  return allowedStatuses.filter(status => {
    // Must be allowed for this role
    if (!allowedStatuses.includes(status)) return false;
    
    // Must be valid transition
    return isValidStatusTransition(currentStatus, status);
  });
};

/**
 * Comprehensive validation for status updates
 * @param {string} userRole - User's role
 * @param {string} currentStatus - Current lead status
 * @param {string} newStatus - New status to update to
 * @returns {Object} Validation result with success flag and message
 */
const validateStatusUpdate = (userRole, currentStatus, newStatus) => {
  // Check if user has permission for this status
  if (!canUpdateToStatus(userRole, newStatus)) {
    return {
      success: false,
      error: 'INSUFFICIENT_STATUS_PERMISSION',
      message: `${userRole} cannot update status to '${newStatus}'. Maximum allowed: ${getAllowedStatusUpdates(userRole).slice(-1)[0]}`
    };
  }

  // Check if transition is valid
  if (!isValidStatusTransition(currentStatus, newStatus)) {
    return {
      success: false,
      error: 'INVALID_STATUS_TRANSITION', 
      message: `Cannot update status from '${currentStatus}' to '${newStatus}'. Invalid workflow transition.`
    };
  }

  return {
    success: true,
    message: 'Status update is valid'
  };
};

module.exports = {
  ROLES,
  STATUS_HIERARCHY,
  ROLE_STATUS_PERMISSIONS,
  getAllowedStatusUpdates,
  canUpdateToStatus,
  getStatusHierarchyIndex,
  isValidStatusTransition,
  getNextPossibleStatuses,
  validateStatusUpdate
};
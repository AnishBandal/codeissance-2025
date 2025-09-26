const Lead = require('../models/Lead');
const { ROLES } = require('../middleware/rbacMiddleware');

/**
 * Special endpoint for offline sync
 * Works like normal createLead but with special handling for offline data
 */
const syncOfflineLead = async (req, res) => {
  try {
    // Extract user information from auth token
    const { id: userId, role: userRole, zone: userZone } = req.user;
    
    // Verify user role is authorized for this operation
    if (userRole !== ROLES.PROCESSING_STAFF) {
      return res.status(403).json({
        success: false,
        message: 'Only processing staff can submit offline leads',
        error: 'FORBIDDEN'
      });
    }
    
    const leadData = req.body;
    
    // Add metadata about when it was created offline
    const savedOfflineAt = leadData.savedOfflineAt || new Date().toISOString();
    delete leadData.savedOfflineAt; // Remove from main data
    
    // Add system-generated fields
    const newLead = new Lead({
      ...leadData,
      status: 'New',
      createdBy: userId,
      assignedTo: userId,
      zone: userZone,
      metadata: {
        ...leadData.metadata,
        savedOfflineAt,
        syncedAt: new Date().toISOString()
      },
      auditTrail: [{
        action: 'CREATED_FROM_OFFLINE',
        user: userId,
        timestamp: new Date(),
        notes: `Lead created from offline data (saved at ${new Date(savedOfflineAt).toLocaleString()})`
      }]
    });

    await newLead.save();
    
    // Return success with created lead info
    res.status(201).json({
      success: true,
      message: 'Offline lead synced successfully',
      lead: {
        _id: newLead._id,
        customerName: newLead.customerName,
        status: newLead.status,
        syncedAt: newLead.metadata?.syncedAt
      }
    });
  } catch (error) {
    console.error('Sync offline lead error:', error);
    
    // Check for validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false, 
        message: 'Invalid lead data',
        error: 'VALIDATION_ERROR',
        details: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to sync offline lead',
      error: 'INTERNAL_ERROR'
    });
  }
};

module.exports = {
  syncOfflineLead
};
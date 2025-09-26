const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/rbacMiddleware');

/**
 * @route   POST /api/upload/document
 * @desc    Upload single document
 * @access  Private
 */
router.post('/document',
  authenticateToken,
  uploadController.uploadDocument
);

/**
 * @route   POST /api/upload/documents
 * @desc    Upload multiple documents
 * @access  Private
 */
router.post('/documents',
  authenticateToken,
  uploadController.uploadMultipleDocuments
);

/**
 * @route   DELETE /api/upload/leads/:leadId/documents/:documentId
 * @desc    Delete document from lead
 * @access  Private
 */
router.delete('/leads/:leadId/documents/:documentId',
  authenticateToken,
  uploadController.deleteDocument
);

/**
 * @route   GET /api/upload/leads/:leadId/documents/:documentId
 * @desc    Get document URL
 * @access  Private
 */
router.get('/leads/:leadId/documents/:documentId',
  authenticateToken,
  uploadController.getDocumentUrl
);

module.exports = router;
const { uploadSingle, uploadMultiple, deleteFile, getFileUrl } = require('../config/cloudinary');
const Lead = require('../models/Lead');

/**
 * Upload single document
 */
const uploadDocument = async (req, res) => {
  try {
    uploadSingle(req, res, async (err) => {
      if (err) {
        console.error('File upload error:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload failed',
          error: 'UPLOAD_ERROR'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided',
          error: 'NO_FILE'
        });
      }

      const fileData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        url: req.file.path,
        publicId: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadedAt: new Date(),
        uploadedBy: req.user.id
      };

      res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          file: fileData
        }
      });
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Upload multiple documents
 */
const uploadMultipleDocuments = async (req, res) => {
  try {
    uploadMultiple(req, res, async (err) => {
      if (err) {
        console.error('Multiple file upload error:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload failed',
          error: 'UPLOAD_ERROR'
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files provided',
          error: 'NO_FILES'
        });
      }

      const filesData = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        url: file.path,
        publicId: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date(),
        uploadedBy: req.user.id
      }));

      res.status(200).json({
        success: true,
        message: `${req.files.length} file(s) uploaded successfully`,
        data: {
          files: filesData
        }
      });
    });
  } catch (error) {
    console.error('Upload multiple documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Delete document from Cloudinary and update lead
 */
const deleteDocument = async (req, res) => {
  try {
    const { leadId, documentId } = req.params;

    // Find the lead
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
        error: 'LEAD_NOT_FOUND'
      });
    }

    // Find the document
    const documentIndex = lead.documents.findIndex(doc => doc._id.toString() === documentId);
    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
        error: 'DOCUMENT_NOT_FOUND'
      });
    }

    const document = lead.documents[documentIndex];

    // Delete from Cloudinary
    await deleteFile(document.publicId);

    // Remove from lead documents array
    lead.documents.splice(documentIndex, 1);
    await lead.save();

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
      data: {
        deletedDocument: document
      }
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Get document URL (for secured access)
 */
const getDocumentUrl = async (req, res) => {
  try {
    const { leadId, documentId } = req.params;

    // Find the lead
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
        error: 'LEAD_NOT_FOUND'
      });
    }

    // Find the document
    const document = lead.documents.find(doc => doc._id.toString() === documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
        error: 'DOCUMENT_NOT_FOUND'
      });
    }

    // Generate secured URL (optional: with expiration)
    const url = getFileUrl(document.publicId, {
      secure: true,
      sign_url: true,
      type: 'authenticated'
    });

    res.status(200).json({
      success: true,
      message: 'Document URL retrieved successfully',
      data: {
        document: {
          ...document.toObject(),
          securedUrl: url
        }
      }
    });

  } catch (error) {
    console.error('Get document URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
};

module.exports = {
  uploadDocument,
  uploadMultipleDocuments,
  deleteDocument,
  getDocumentUrl
};
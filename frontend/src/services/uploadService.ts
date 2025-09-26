import { apiCall, ApiResponse } from './api';

export interface UploadedDocument {
  filename: string;
  originalName: string;
  url: string;
  publicId: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface CreateLeadWithFilesRequest {
  customerName: string;
  email: string;
  phone: string;
  productType: string;
  salary: number;
  customerIncome: string;
  creditScore: number;
  customerAge: number;
  customerOccupation: string;
  loanAmount?: string;
  region?: string;
  status?: string;
  documents?: File[];
}

class UploadService {
  /**
   * Upload single document
   */
  async uploadSingleDocument(file: File): Promise<ApiResponse<{ file: UploadedDocument }>> {
    const formData = new FormData();
    formData.append('document', file);

    return await apiCall<{ file: UploadedDocument }>({
      method: 'POST',
      url: '/upload/document',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Upload multiple documents
   */
  async uploadMultipleDocuments(files: File[]): Promise<ApiResponse<{ files: UploadedDocument[] }>> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('documents', file);
    });

    return await apiCall<{ files: UploadedDocument[] }>({
      method: 'POST',
      url: '/upload/documents',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Create lead with file uploads
   */
  async createLeadWithFiles(leadData: CreateLeadWithFilesRequest): Promise<ApiResponse<any>> {
    const formData = new FormData();
    
    // Append lead data
    Object.entries(leadData).forEach(([key, value]) => {
      if (key !== 'documents' && value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    // Append files
    if (leadData.documents && leadData.documents.length > 0) {
      leadData.documents.forEach((file) => {
        formData.append('documents', file);
      });
    }

    return await apiCall<any>({
      method: 'POST',
      url: '/leads/with-files',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Delete document from lead
   */
  async deleteDocument(leadId: string, documentId: string): Promise<ApiResponse<{ deletedDocument: UploadedDocument }>> {
    return await apiCall<{ deletedDocument: UploadedDocument }>({
      method: 'DELETE',
      url: `/upload/leads/${leadId}/documents/${documentId}`
    });
  }

  /**
   * Get document URL
   */
  async getDocumentUrl(leadId: string, documentId: string): Promise<ApiResponse<{ document: UploadedDocument & { securedUrl: string } }>> {
    return await apiCall<{ document: UploadedDocument & { securedUrl: string } }>({
      method: 'GET',
      url: `/upload/leads/${leadId}/documents/${documentId}`
    });
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File, options: {
    maxSize?: number; // in MB
    allowedTypes?: string[];
  } = {}): { isValid: boolean; error?: string } {
    const {
      maxSize = 10,
      allowedTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ]
    } = options;

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
      };
    }

    // Check file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSize) {
      return {
        isValid: false,
        error: `File size (${fileSizeInMB.toFixed(2)}MB) exceeds maximum allowed size of ${maxSize}MB`
      };
    }

    return { isValid: true };
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file type display name
   */
  getFileTypeDisplayName(mimetype: string): string {
    const typeMap: Record<string, string> = {
      'image/jpeg': 'JPEG Image',
      'image/jpg': 'JPG Image',
      'image/png': 'PNG Image',
      'application/pdf': 'PDF Document',
      'application/msword': 'Word Document',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
      'text/plain': 'Text File'
    };
    
    return typeMap[mimetype] || 'Unknown File Type';
  }
}

export const uploadService = new UploadService();
export default uploadService;
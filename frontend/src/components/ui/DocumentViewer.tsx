import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  File, 
  Image, 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  Upload,
  AlertCircle,
  Calendar,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadService, type UploadedDocument } from '@/services/uploadService';

interface DocumentViewerProps {
  leadId: string;
  documents: UploadedDocument[];
  onDocumentDeleted?: (documentId: string) => void;
  canDelete?: boolean;
  className?: string;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  leadId,
  documents,
  onDocumentDeleted,
  canDelete = false,
  className = ''
}) => {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isViewing, setIsViewing] = useState<string | null>(null);
  const { toast } = useToast();

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
    if (mimeType === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />;
    if (mimeType.includes('document') || mimeType.includes('word')) return <FileText className="h-5 w-5 text-blue-600" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleView = async (document: UploadedDocument) => {
    setIsViewing(document.filename);
    try {
      // For images, we can display them directly
      if (document.mimetype.startsWith('image/')) {
        window.open(document.url, '_blank');
      } else {
        // For other files, get the secured URL and open
        const response = await uploadService.getDocumentUrl(leadId, document.filename);
        if (response.success) {
          window.open(response.data.document.securedUrl || document.url, '_blank');
        } else {
          // Fallback to direct URL
          window.open(document.url, '_blank');
        }
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      toast({
        title: "Error",
        description: "Could not open document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsViewing(null);
    }
  };

  const handleDownload = async (doc: UploadedDocument) => {
    try {
      // Create a temporary link to download the file
      const link = window.document.createElement('a');
      link.href = doc.url;
      link.download = doc.originalName;
      link.target = '_blank';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: `Downloading ${doc.originalName}`,
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Download Error",
        description: "Could not download document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (document: UploadedDocument) => {
    if (!canDelete) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete "${document.originalName}"? This action cannot be undone.`);
    if (!confirmed) return;

    setIsDeleting(document.filename);
    try {
      const response = await uploadService.deleteDocument(leadId, document.filename);
      if (response.success) {
        toast({
          title: "Document Deleted",
          description: `${document.originalName} has been deleted successfully.`,
        });
        onDocumentDeleted?.(document.filename);
      } else {
        throw new Error(response.message || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Delete Error",
        description: error instanceof Error ? error.message : "Could not delete document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const getFileTypeDisplayName = (mimetype: string): string => {
    return uploadService.getFileTypeDisplayName(mimetype);
  };

  if (!documents || documents.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Documents</span>
          </CardTitle>
          <CardDescription>No documents uploaded for this lead</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No supporting documents have been uploaded for this lead yet.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="h-5 w-5" />
          <span>Documents</span>
          <Badge variant="secondary">{documents.length}</Badge>
        </CardTitle>
        <CardDescription>
          Supporting documents for this lead
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {documents.map((document) => (
            <div
              key={document.filename}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {getFileIcon(document.mimetype)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {document.originalName}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                    <span className="flex items-center space-x-1">
                      <File className="h-3 w-3" />
                      <span>{formatFileSize(document.size)}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(document.uploadedAt)}</span>
                    </span>
                    {document.uploadedBy && (
                      <span className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>Uploaded by user</span>
                      </span>
                    )}
                  </div>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {getFileTypeDisplayName(document.mimetype)}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleView(document)}
                  disabled={isViewing === document.filename}
                  className="p-2"
                  title="View document"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(document)}
                  className="p-2"
                  title="Download document"
                >
                  <Download className="h-4 w-4" />
                </Button>

                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(document)}
                    disabled={isDeleting === document.filename}
                    className="p-2 hover:bg-red-50 hover:text-red-600"
                    title="Delete document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentViewer;
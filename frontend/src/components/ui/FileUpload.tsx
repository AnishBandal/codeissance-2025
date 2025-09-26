import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { X, Upload, File, Image, FileText, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizePerFile?: number; // in MB
  allowedTypes?: string[];
  className?: string;
}

interface UploadedFile {
  file: File;
  id: string;
  preview?: string;
  uploading?: boolean;
  progress?: number;
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesChange,
  maxFiles = 10,
  maxSizePerFile = 10,
  allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ],
  className = ''
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-6 w-6" />;
    if (mimeType === 'application/pdf') return <FileText className="h-6 w-6 text-red-500" />;
    if (mimeType.includes('document') || mimeType.includes('word')) return <FileText className="h-6 w-6 text-blue-500" />;
    return <File className="h-6 w-6" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not allowed`;
    }

    // Check file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSizePerFile) {
      return `File size must be less than ${maxSizePerFile}MB`;
    }

    return null;
  };

  const handleFiles = (files: FileList) => {
    const newFiles: UploadedFile[] = [];
    const validFiles: File[] = [];

    Array.from(files).forEach((file) => {
      // Check if we've reached max files limit
      if (uploadedFiles.length + newFiles.length >= maxFiles) {
        toast({
          title: "Too many files",
          description: `Maximum ${maxFiles} files allowed`,
          variant: "destructive",
        });
        return;
      }

      // Validate file
      const error = validateFile(file);
      if (error) {
        toast({
          title: "Invalid file",
          description: `${file.name}: ${error}`,
          variant: "destructive",
        });
        return;
      }

      // Check for duplicates
      if (uploadedFiles.some(uf => uf.file.name === file.name && uf.file.size === file.size)) {
        toast({
          title: "Duplicate file",
          description: `${file.name} is already added`,
          variant: "destructive",
        });
        return;
      }

      const uploadedFile: UploadedFile = {
        file,
        id: `${file.name}-${Date.now()}-${Math.random()}`,
      };

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadedFiles(prev => 
            prev.map(uf => 
              uf.id === uploadedFile.id 
                ? { ...uf, preview: e.target?.result as string }
                : uf
            )
          );
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(uploadedFile);
      validFiles.push(file);
    });

    if (newFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newFiles]);
      onFilesChange([...uploadedFiles.map(uf => uf.file), ...validFiles]);
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => {
      const updated = prev.filter(uf => uf.id !== fileId);
      onFilesChange(updated.map(uf => uf.file));
      return updated;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    // Reset input value to allow selecting same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Document Upload</span>
          </CardTitle>
          <CardDescription>
            Upload supporting documents for this lead (max {maxFiles} files, {maxSizePerFile}MB each)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Upload Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              isDragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium">Click to upload</span> or drag and drop files here
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supported: Images, PDF, Word documents, Text files
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={allowedTypes.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* File Type Info */}
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Allowed file types:</strong> JPEG, PNG, PDF, Word documents, Text files<br />
              <strong>Maximum file size:</strong> {maxSizePerFile}MB per file<br />
              <strong>Maximum files:</strong> {maxFiles} files total
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files ({uploadedFiles.length}/{maxFiles})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedFiles.map((uploadedFile) => (
                <div
                  key={uploadedFile.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {uploadedFile.preview ? (
                      <img
                        src={uploadedFile.preview}
                        alt={uploadedFile.file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      getFileIcon(uploadedFile.file.type)
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {uploadedFile.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(uploadedFile.file.size)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {uploadedFile.uploading && (
                      <Progress value={uploadedFile.progress || 0} className="w-20" />
                    )}
                    {uploadedFile.error && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(uploadedFile.id)}
                      className="p-1 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FileUpload;